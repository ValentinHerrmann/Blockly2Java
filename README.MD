[![Build and Deploy to Pages](https://github.com/ValentinHerrmann/Blockly2Java/actions/workflows/deploy_to_pages.yml/badge.svg)](https://github.com/ValentinHerrmann/Blockly2Java/actions/workflows/deploy_to_pages.yml)
[![Build and Push to B2J_dist](https://github.com/ValentinHerrmann/Blockly2Java/actions/workflows/build_and_store.yml/badge.svg)](https://github.com/ValentinHerrmann/Blockly2Java/actions/workflows/build_and_store.yml)
[![Create Release on Tag Pushed](https://github.com/ValentinHerrmann/Blockly2Java/actions/workflows/createRelease_onTagPushed.yml/badge.svg)](https://github.com/ValentinHerrmann/Blockly2Java/actions/workflows/createRelease_onTagPushed.yml)

# Blockly2Java

A visual programming environment that converts Blockly blocks into Java code. Blockly2Java integrates with the [Java Online IDE](https://github.com/ValentinHerrmann/NewOnlineIDE_B2J) to provide real-time code generation and execution.

**Live Demo:** https://b2j.valentin-herrmann.com

**BlueJ Extension:** [BlueJBlocklyExtension](https://github.com/ValentinHerrmann/BlueJBlocklyExtension)

## Features

- Visual block-based programming interface powered by Blockly
- Real-time Java code generation
- Integrated Java Online IDE for code execution and testing
- Support for classes, methods, constructors, and control structures
- Works standalone or as a BlueJ extension
- Automatic workspace persistence via cookies

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
    - [Development Workflow](#development-workflow)
      - [1. Basic Development (Blockly Logic Only)](#1-basic-development-blockly-logic-only)
      - [2. Developing with OnlineIDE Changes](#2-developing-with-onlineide-changes)
      - [3. Adding New Blocks](#3-adding-new-blocks)
    - [Working with the OnlineIDE Submodule](#working-with-the-onlineide-submodule)
  - [Building for Production](#building-for-production)
    - [Local Production Build](#local-production-build)
    - [Testing Production Build Locally](#testing-production-build-locally)
  - [Deployment](#deployment)
    - [Manual Deployment](#manual-deployment)
    - [Automated Deployment](#automated-deployment)
      - [CI/CD Workflows](#cicd-workflows)
      - [Deployment Checklist](#deployment-checklist)
  - [Troubleshooting](#troubleshooting)
    - [OnlineIDE Panel Not Displaying](#onlineide-panel-not-displaying)
    - [Code Not Updating in OnlineIDE](#code-not-updating-in-onlineide)
    - [Submodule Issues](#submodule-issues)
    - [Build Failures](#build-failures)
    - [Cookie/Persistence Issues](#cookiepersistence-issues)
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

# Install dependencies (this also initializes the OnlineIDE submodule)
npm install

# Start development server
npm start
```

The application will open automatically at `http://localhost:8080`.

**Note:** If you cloned without `--recursive`, initialize submodules manually:
```bash
git submodule update --init --recursive
```

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
│   │   ├── online-ide-embedded.js  # Built OnlineIDE
│   │   ├── online-ide-embedded.css
│   │   ├── lib/                  # Third-party libraries
│   │   └── assets/               # Fonts, graphics, JS modules
│   ├── online-ide-source/        # OnlineIDE submodule (NewOnlineIDE_B2J)
│   ├── setup.js                  # Setup script (builds OnlineIDE)
│   ├── webpack.config.js         # Webpack configuration
│   └── package.json
├── .github/workflows/            # CI/CD workflows
├── package.json                  # Root package.json
└── README.MD                     # This file
```

### Available Scripts

**Root-level scripts** (run from `/Blockly2Java`):

| Script | Description |
|--------|-------------|
| `npm start` | Start development server at http://localhost:8080 |
| `npm run dev` | Force rebuild OnlineIDE and start with hot reloading |
| `npm run build` | Create production build in `custom-generator-codelab/dist/` |
| `npm run build:all` | Rebuild OnlineIDE + create production build |
| `npm run setup` | Build OnlineIDE from submodule (runs automatically) |
| `npm run ide:dev` | Start OnlineIDE in development mode (for testing IDE changes) |
| `npm run ide:build` | Build OnlineIDE embedded version |

**Codelab-level scripts** (run from `/Blockly2Java/custom-generator-codelab`):

| Script | Description |
|--------|-------------|
| `npm run setup:submodule` | Build from OnlineIDE submodule (default, recommended) |
| `npm run setup:external` | Build from external `Online-IDE_B2J` folder |
| `npm run setup:dummy` | Copy pre-built files (legacy) |

### Development Workflow

#### 1. Basic Development (Blockly Logic Only)

If you're only modifying Blockly blocks, generators, or UI:

```bash
npm start
```

Changes to files in `custom-generator-codelab/src/` will hot-reload automatically.

#### 2. Developing with OnlineIDE Changes

If you need to modify the integrated OnlineIDE:

**Option A: Edit submodule directly**
```bash
# Navigate to the NewOnlineIDE_B2J workspace
cd /path/to/NewOnlineIDE_B2J

# Make your changes and test
npm run dev  # Test OnlineIDE independently

# Commit and push changes
git add .
git commit -m "Your changes"
git push

# Update submodule reference in Blockly2Java
cd /path/to/Blockly2Java/custom-generator-codelab/online-ide-source
git pull origin main

# Rebuild and test integration
cd ../..
npm run build:all
npm start
```

**Option B: Test IDE changes without committing**
```bash
# Make changes in online-ide-source submodule
cd custom-generator-codelab/online-ide-source
# Edit files...

# Rebuild OnlineIDE
npm run build-embedded

# Run setup to copy built files
cd ..
npm run setup

# Test in Blockly2Java
npm start
```

#### 3. Adding New Blocks

1. Define block in `custom-generator-codelab/src/blocks/`
2. Add generator in `custom-generator-codelab/src/generators/java.js`
3. Add block to toolbox in `custom-generator-codelab/src/toolboxGrade9.js`
4. Test in development server

### Working with the OnlineIDE Submodule

The OnlineIDE is integrated as a Git submodule at `custom-generator-codelab/online-ide-source`.

**Current submodule:** [NewOnlineIDE_B2J](https://github.com/ValentinHerrmann/NewOnlineIDE_B2J)

**Key integration points:**
- `window.online_ide_access` - Access IDE programmatically
- `window.selected_file_name` - Track current Java file
- `file.setText(code)` - Inject generated Java code

**Updating the submodule:**

```bash
# Update to latest commit
cd custom-generator-codelab/online-ide-source
git pull origin main

# Commit the update in Blockly2Java
cd ../..
git add custom-generator-codelab/online-ide-source
git commit -m "Update OnlineIDE submodule to latest version"
git push
```

**Switching submodule branches:**

```bash
cd custom-generator-codelab/online-ide-source
git checkout feature-branch
cd ../..
npm run setup  # Rebuild from new branch
```

---

## Building for Production

### Local Production Build

```bash
# Full build (rebuilds OnlineIDE + Blockly2Java)
npm run build:all

# Output will be in custom-generator-codelab/dist/
# - dist/index.html
# - dist/bundle.js
# - dist/online-ide-embedded.js
# - dist/online-ide-embedded.css
# - dist/lib/
# - dist/assets/
```

### Testing Production Build Locally

```bash
# Option 1: Use a simple HTTP server
cd custom-generator-codelab/dist
npx http-server -p 8080

# Option 2: Use Python
python3 -m http.server 8080
```

Then open http://localhost:8080 in your browser.

---

## Deployment

### Manual Deployment

**Deploy to GitHub Pages:**

1. Ensure you're on the `main` branch
2. Build the project:
   ```bash
   npm run build:all
   ```
3. Go to GitHub repository → **Actions** tab
4. Select **"(manual) Build and Deploy to Pages"** workflow
5. Click **"Run workflow"** → **"Run workflow"**

The site will be deployed to: `https://<username>.github.io/Blockly2Java/`

**Custom domain setup:**
- Add `CNAME` file to repository root with your domain
- Configure DNS CNAME record pointing to `<username>.github.io`

### Automated Deployment

#### CI/CD Workflows

**1. Deploy to GitHub Pages** (`.github/workflows/deploy_to_pages.yml`)
- **Trigger:** Manual via Actions tab
- **Purpose:** Deploy production build to GitHub Pages
- **Output:** https://b2j.valentin-herrmann.com

**2. Build and Store** (`.github/workflows/build_and_store.yml`)
- **Trigger:** Automatic on push to main
- **Purpose:** Build and store artifacts in `B2J_dist` branch
- **Output:** Distribution files for releases

**3. Create Release** (`.github/workflows/createRelease_onTagPushed.yml`)
- **Trigger:** Automatic when tag is pushed
- **Purpose:** Create GitHub release with build artifacts
- **Usage:**
  ```bash
  git tag v1.2.3
  git push origin v1.2.3
  ```

#### Deployment Checklist

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

### OnlineIDE Panel Not Displaying

**Symptoms:**
- Blockly editor loads but OnlineIDE panel is empty
- Browser console shows 404 errors for `assets/*.js` files

**Solution:**
```bash
cd custom-generator-codelab
node setup.js --build-from-submodule
npm start
```

**Verification:**
```bash
# Should show ~31 JavaScript files
ls public/assets/*.js | wc -l
```

### Code Not Updating in OnlineIDE

**Symptoms:**
- Blockly blocks change but Java code doesn't update
- `window.online_ide_access` is undefined

**Solutions:**
1. Check browser console for errors
2. Verify OnlineIDE loaded: `console.log(window.online_ide_access)`
3. Restart development server: `Ctrl+C` then `npm start`
4. Clear browser cache and cookies

### Submodule Issues

**Problem:** Submodule is empty or out of sync

**Solution:**
```bash
git submodule update --init --recursive
cd custom-generator-codelab/online-ide-source
git pull origin main
cd ../..
npm run setup
```

### Build Failures

**Problem:** `npm run build` fails

**Solutions:**
1. Clean and reinstall:
   ```bash
   rm -rf node_modules custom-generator-codelab/node_modules
   rm -rf custom-generator-codelab/online-ide-source/node_modules
   npm install
   ```

2. Rebuild OnlineIDE:
   ```bash
   npm run setup:submodule
   ```

3. Check Node.js version:
   ```bash
   node --version  # Should be 18.x or higher
   ```

### Cookie/Persistence Issues

**Problem:** Workspace doesn't save between sessions

**Solution:**
The standalone version saves to cookies. If translation bugs occur (no Java code displayed), clear browser cookies for the domain:
1. Open browser DevTools → Application → Cookies
2. Delete all cookies for `b2j.valentin-herrmann.com`
3. Reload the page

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

**Questions?** Open an issue on GitHub or check the [troubleshooting section](#troubleshooting).
