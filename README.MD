[![Deploy Release https://blockly2java.de](https://github.com/ValentinHerrmann/Blockly2Java/actions/workflows/deploy_docker.yml/badge.svg?event=release)](https://github.com/ValentinHerrmann/Blockly2Java/actions/workflows/deploy_docker.yml)

# Blockly2Java

A visual programming environment that converts Blockly blocks into Java code. Blockly2Java integrates with the [Java Online IDE](https://github.com/ValentinHerrmann/NewOnlineIDE_B2J) to provide real-time code generation and execution.

## Releases hosted at: https://blockly2java.de

## Features

- Visual block-based programming interface powered by Blockly
- Real-time Java code generation
- Integrated Java Online IDE for code execution and testing
- Support for classes, methods, constructors, and control structures
- Works standalone or as a BlueJ extension
- Automatic workspace persistence via cookies

---

## Github Activities

![Alt](https://repobeats.axiom.co/api/embed/4e7160ada4565a2f9254a11196dab7388eba30dc.svg "Repobeats analytics image")

---
## Table of Contents

- [Blockly2Java](#blockly2java)
  - [Features](#features)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Quick Start](#quick-start)
  - [Development](#development)
    - [Project Structure](#project-structure)
    - [Available Scripts](#available-scripts)
  - [Deployment](#deployment)
    - [Frontend Deployment (Cloudflare Pages)](#frontend-deployment-cloudflare-pages)
    - [Docker Deployment](#docker-deployment)
    - [Automated CI/CD Workflows](#automated-cicd-workflows)
    - [Deployment Checklist](#deployment-checklist)
  - [Troubleshooting](#troubleshooting)
  - [Related Documentation](#related-documentation)
  - [Author](#author)
  - [Contributing](#contributing)

---

## Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **Git** with submodule support

---

## Quick Start

```bash
# Clone the repository with submodules
git clone --recursive https://github.com/ValentinHerrmann/Blockly2Java.git
cd Blockly2Java

# Install dependencies
npm install

# Start development server (Blockly UI only)
npm start
```

The application will open automatically at `http://localhost:8080`.

Note: The Online-IDE is no longer bundled in this repository. It is provided
as a separate Docker container/service. Local development of the Blockly UI
works without the Online-IDE; for full integration tests run the external
Online-IDE container alongside this app.

---

## Development

### Project Structure

```
Blockly2Java/
├── custom-generator-codelab/      # Main application code
│   ├── src/                       # Blockly app source code
│   │   ├── index.js              # Main entry point
│   │   ├── index.html            # HTML template
│   │   ├── generators/           # Java code generators
│   │   └── blocks/               # Custom block definitions
│   ├── public/                    # Static assets (auto-generated)
│   │   ├── lib/                  # Third-party libraries
│   │   └── assets/               # Fonts, graphics, JS modules
│   ├── webpack.config.js         # Webpack configuration
│   └── package.json
├── .github/workflows/            # CI/CD workflows
├── package.json                  # Root package.json
└── README.MD                     # This file
```

### Available Scripts

Run these scripts from the repository root directory:

| Script | Description |
|--------|-------------|
| `npm start` | Start development server at http://localhost:8080 |
| `npm run dev` | Start development server with hot reloading |
| `npm run build` | Create production build in `custom-generator-codelab/dist/` |
| `npm run build:all` | Force rebuild OnlineIDE submodule and create production build |

For detailed documentation on Codelab-level scripts, development workflows, and managing the Git submodule for the OnlineIDE, refer to the [Setup Guide](file:///home/vale/_GITHUB/ValentinHerrmann/Blockly2Java/custom-generator-codelab/SETUP.md).

---

## Deployment

Detailed deployment information is available in [DEPLOYMENT.md](file:///home/vale/_GITHUB/ValentinHerrmann/Blockly2Java/DEPLOYMENT.md).

### Frontend Deployment (Cloudflare Pages)

The static web frontend is hosted on **Cloudflare Pages** and served at **https://blockly2java.de**.

- **Production Environment:**
  - Automatically deployed when changes are force-pushed to the `release` branch.
- **Preview / Staging Environment:**
  - Active Pull Requests trigger the [Push PR to Preview Branch](file:///home/vale/_GITHUB/ValentinHerrmann/Blockly2Java/.github/workflows/push_preview.yml) workflow, which force-pushes the PR branch to the `preview` branch on GitHub.
  - Cloudflare Pages is configured to build and deploy only the `preview` branch for preview environments.

### Docker Deployment

The application can also be built and run as a Docker container.

- Build locally (from repository root):
  ```bash
  docker build -t b2j:latest .
  ```
- Run the container exposing port `8080`:
  ```bash
  docker run --rm -p 8080:8080 -e PORT=8080 b2j:latest
  ```
- Build using prebuilt files without rebuilding the OnlineIDE submodule:
  ```bash
  docker build --build-arg SKIP_ONLINE_IDE_BUILD=1 -t b2j:latest .
  ```

### Automated CI/CD Workflows

The repository uses GitHub Actions for workflow automation:

1. **Manage Release Branch** ([release.yml](file:///home/vale/_GITHUB/ValentinHerrmann/Blockly2Java/.github/workflows/release.yml))
   - **Trigger:** Automatic when a new GitHub Release is published, or manual via `workflow_dispatch`.
   - **Action:** Force-pushes the target commit/HEAD to the production branch (`release`), triggering the Cloudflare Pages production deployment.
2. **Push PR to Preview Branch** ([push_preview.yml](file:///home/vale/_GITHUB/ValentinHerrmann/Blockly2Java/.github/workflows/push_preview.yml))
   - **Trigger:** On pull request events (non-drafts).
   - **Action:** Force-pushes the PR HEAD commit to the `preview` branch to trigger a Cloudflare Pages preview build.
3. **Build and Deploy Docker image** ([deploy_docker.yml](file:///home/vale/_GITHUB/ValentinHerrmann/Blockly2Java/.github/workflows/deploy_docker.yml))
   - **Trigger:** On pull request events, when a release is created, or manually.
   - **Action:** Builds and pushes the Docker image to the container registry, then deploys it to the self-hosted IONOS server via SSH.

### Deployment Checklist

Before deploying:
- [ ] Test locally with `npm start`
- [ ] Run production build: `npm run build:all`
- [ ] Test production build locally
- [ ] Verify OnlineIDE panel displays correctly
- [ ] Check browser console for errors
- [ ] Test block-to-code generation
- [ ] Test Java code execution in IDE
- [ ] Clear cookies and test fresh load
- [ ] Update `B2J_CHANGELOG.MD` if needed

---

## Troubleshooting

For solutions to common setup, submodule, build, caching, or integration issues, please refer to the troubleshooting section of the [Setup Guide](custom-generator-codelab/SETUP.md#troubleshooting).

---

## Related Documentation

- **Setup Guide:** [custom-generator-codelab/SETUP.md](custom-generator-codelab/SETUP.md)
- **Integration Status:** [INTEGRATION_STATUS.md](INTEGRATION_STATUS.md)
- **Changelog:** [B2J_CHANGELOG.MD](B2J_CHANGELOG.MD)
- **OnlineIDE Repository:** [NewOnlineIDE_B2J](https://github.com/ValentinHerrmann/NewOnlineIDE_B2J)
- **BlueJ Extension:** [BlueJBlocklyExtension](https://github.com/ValentinHerrmann/BlueJBlocklyExtension)

---

## Author

Valentin Herrmann

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

---

**Questions?** Open an issue on GitHub or check the [Setup Guide's troubleshooting section](custom-generator-codelab/SETUP.md#troubleshooting).
