Deployment workflow and required secrets

This repo includes a GitHub Actions workflow at `.github/workflows/deploy.yml` that:
- builds a Docker image for the app
- saves the image to `image.tar`
- copies the tar to your server via SCP
- loads the image on the server and (re)starts a container

Required repository secrets (add under Settings → Secrets):
- `DEPLOY_HOST` — server hostname or IP (e.g. example.com)
- `DEPLOY_USER` — SSH username on the server
- `SSH_PRIVATE_KEY` — private key (PEM) matching an authorized key for `DEPLOY_USER`
- `DEPLOY_PORT` — SSH port (optional, default behavior if empty may vary)
- `DOCKER_IMAGE` — image name to tag locally (e.g. myorg/myapp)
- `DEPLOY_CONTAINER_NAME` — name of the container to run on the server
 - `DEPLOY_APP_PORT` — internal host port to bind the container to (default: `3000`)
 - `DEPLOY_SERVER_NAME` — nginx `server_name` to use for the site (e.g. `example.com`). If empty, nginx will use the default server.
Additional registry & HTTPS secrets
- `DOCKER_REGISTRY` — registry host (e.g. `ghcr.io` or `docker.io`)
- `REGISTRY_USERNAME` — username for the registry (or `OWNER` for GHCR)
- `REGISTRY_PASSWORD` — password/token for the registry
- `DEPLOY_ENABLE_HTTPS` — set to `true` to attempt obtaining TLS certs via `certbot`
- `CERTBOT_EMAIL` — email for certbot registration (required when `DEPLOY_ENABLE_HTTPS=true`)

Notes and customization
- The workflow triggers on pushes to branch `onlineide`. Change `on.push.branches` in the workflow if you prefer a different branch.
- The remote `docker run` command maps host port `80` to container port `80`. Edit `.github/workflows/deploy.yml` to change ports, environment variables, volumes, or other runtime flags.
 - The workflow now binds the container to `127.0.0.1:$DEPLOY_APP_PORT` and writes an nginx server block that reverse-proxies to that port. This avoids port conflicts with existing nginx instances and makes the app immediately available via the configured domain.

Registry-based deployment
- The workflow now builds and pushes the image to the registry (`DOCKER_REGISTRY/DOCKER_IMAGE:SHA`) and then SSHes to the server to `docker pull` that image and run it. This is more efficient and keeps build artifacts out of the CI runner.
- The workflow uses `appleboy/scp-action` and `appleboy/ssh-action` to transfer and run commands. If your server only allows image pulls from a registry, consider changing the workflow to `docker push` + remote `docker pull` instead.

Permissions note
- The deploy step writes to `/etc/nginx` and reloads nginx using `sudo`. Ensure `DEPLOY_USER` can run `sudo tee /etc/nginx/...`, `sudo ln -sf`, and `sudo systemctl reload nginx`. If you prefer not to allow full sudo access, create a limited sudoers entry for these exact commands.
If your server does not have `certbot` or the `certbot --nginx` plugin installed, install `certbot` first (distribution package or snap) before enabling `DEPLOY_ENABLE_HTTPS`.

If you prefer the earlier scp-based flow instead of registry push/pull, let me know and I can revert or provide both options behind a workflow input flag.
