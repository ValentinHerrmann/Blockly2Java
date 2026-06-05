# Deployment Documentation

Blockly2Java uses a hybrid deployment model consisting of a static web frontend hosted on Cloudflare Pages and a Dockerized backup/backend hosted on an IONOS server.

---

## 1. Frontend Web App (Cloudflare Pages & GitHub Pages Fallback)

The main frontend web application is hosted on **Cloudflare Pages**, which automatically builds and deploys branches of the repository. Additionally, a backup fallback is deployed to **GitHub Pages** during release builds.

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
2. The workflow checks out the repository at the release's git tag (or selected branch) and force-pushes the HEAD commit directly to the `release` branch.
3. Force-pushing to `release` triggers Cloudflare Pages to build and deploy to the production environment.
4. During the build, the Webpack compilation reads the application version from the root `VERSION` file (which is written to and committed by the GitHub Actions release workflow). If Webpack is compiling a development or preview build (non-`release` branch), it appends the short commit SHA to the version. The footer then displays this version info, linking to the GitHub release tag or the commit tree respectively.
5. In parallel to the Cloudflare trigger, the workflow builds the static frontend with Webpack (`GITHUB_PAGES=true`), packages it, and deploys it to GitHub Pages.

### GitHub Pages Fallback Deployment

To protect against downtime of Cloudflare Pages, a fallback deployment of the production application is automatically built and deployed to **GitHub Pages** during the release workflow:

1. When the release workflow publishes the release, it also compiles the production frontend assets using Webpack.
2. The compilation process sets `GITHUB_PAGES=true`, which configures the router/assets public path to `/Blockly2Java/` (standard for `https://<owner>.github.io/Blockly2Java/`).
3. The built assets (`custom-generator-codelab/dist`) are uploaded and deployed directly to GitHub Pages using the official `actions/deploy-pages` action.

#### Setup Requirements

For the GitHub Pages fallback deployment to succeed, configure the following settings in your GitHub Repository:

1. Go to **Settings → Pages**.
2. Under **Build and deployment**, set the **Source** to **GitHub Actions** (instead of "Deploy from a branch").
3. (Optional) If you use a custom domain for GitHub Pages, set the `CUSTOM_DOMAIN` repository variable under **Settings → Secrets and variables → Actions → Variables**. If defined, the build will use `/` as the base path and place your domain into the `CNAME` file.



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
