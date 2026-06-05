# Deployment Documentation

Blockly2Java uses a hybrid deployment model consisting of a static web frontend hosted on Cloudflare Pages and a Dockerized backup/backend hosted on an IONOS server.

---

## 1. Frontend Web App (Cloudflare Pages)

The main frontend web application is hosted on **Cloudflare Pages**, which automatically builds and deploys branches of the repository.

### Release Workflow & Branch Management

We maintain two primary deployment environments on Cloudflare Pages using Git branches:

- **Develop / Staging / Previews:**
  - Branch: `preview`
  - Instead of building all commits across all feature branches, preview deployments are managed via GitHub Actions.
  - Whenever a Pull Request is opened, synchronized, reopened, or marked ready for review (and is not a draft), the [Push PR to Preview Branch](.github/workflows/push_preview.yml) workflow automatically force-pushes the PR head commit to the `preview` branch.
  - Cloudflare Pages is configured to build only the `preview` branch for preview deployments, saving significant build minutes.
- **Production:**
  - Branch: `release`
  - Cloudflare Pages is configured to build and deploy any commit on `release` directly to the **Production environment**.

### Automated Releases

Releases are managed using GitHub Actions via the [Manage Release Branch](.github/workflows/release.yml) workflow:

1. When a new GitHub Release is **published** (or the workflow is manually dispatched via `workflow_dispatch`), the workflow triggers automatically.
2. The workflow checks out the code, checks out (or creates) the `release` branch, and merges `onlineide` with the `--no-ff` (no fast-forward) flag.
3. The merge commit on the `release` branch is named exactly after the **Release name / Tag name** (e.g. `v3.0.0`).
4. Pushing this commit to `release` triggers Cloudflare Pages to build and deploy to production.
5. During the build, the webpack build detects the `release` branch and pulls the commit message (the release name) to display it unobtrusively in the footer. For preview deployments, the short commit SHA is shown instead.

---

## 2. Docker Containers (Self-Hosted Staging/Production)

We continue to build and deploy Docker images to our self-hosted IONOS server via the [Build and Deploy Docker image](.github/workflows/deploy_docker.yml) workflow.

### Triggering Docker Deploys

The Docker workflow runs on:
- Any `pull_request` when marked **Ready for review**.
- When a new GitHub **Release** is created.
- Manual triggers via `workflow_dispatch`.

### Required Repository Secrets

To support Docker builds and server SSH deployments, add the following secrets under **Settings → Secrets and variables → Actions → Secrets**:

- `DEPLOY_HOST` — Server hostname or IP address (e.g. `example.com`).
- `DEPLOY_USER` — SSH username on the target server.
- `SSH_PRIVATE_KEY` — PEM private key matching the authorized keys on the server.
- `DEPLOY_PORT` — SSH port (optional).
- `DOCKER_REGISTRY` — Container registry host (e.g. `ghcr.io` or `docker.io`).
- `DOCKER_IMAGE` — Image repository/name (e.g. `valentinherrmann/blockly2java`).
- `DEPLOY_CONTAINER_NAME` — Name of the Docker container on the server (e.g. `blockly2java`).
- `DEPLOY_APP_PORT` — Port bound on localhost to proxy requests (default: `8080`).
- `CORS_PROXY_URL` — Absolute URL of the deployed CORS proxy worker.
