# Blockly2Java Configuration Summary

This document summarizes the current configuration of the Blockly2Java project, which has been simplified to run efficiently without local submodule dependencies.

---

## Modern Configuration Architecture

The project has transitioned from a submodule-based local embedding approach to a dynamic external integration.

### 1. External Online-IDE Loading
- **Vite/Monaco Integration**: The Online-IDE component is loaded dynamically at runtime directly from `https://onlineide.blockly2java.de`.
- **Minimal Repository Size**: By removing local submodule compilation, the project footprint is significantly smaller, and developers do not need to compile or manage the Online-IDE source code locally.
- **index.html Template**: The script and stylesheet injections are managed in `custom-generator-codelab/src/index.html`.

### 2. Simplified App Versioning
- **VERSION File**: A root `VERSION` file acts as the single source of truth for the release version.
- **CI/CD Integration**: GitHub Actions workflows write the version (e.g. `v2.3.1` or development tag) into `VERSION` during builds.
- **Webpack Setup**: Webpack reads `VERSION` and appends the short commit SHA for development or preview builds. This information is displayed in the footer and links to the relevant release or commit.

### 3. Unified Assets Configuration
- **Webpack Asset Copying**: Webpack copies standard frontend files (`src/manifest.json`, `src/datenschutz.html`, project logos) into the build directories automatically.
- **Base Paths**: The application detects if it is deployed on GitHub Pages (using `GITHUB_PAGES=true` environment variable) and resolves public paths (e.g. `/Blockly2Java/` vs `/`) automatically.

---

## Command Workflows

- **Local Development**:
  ```bash
  npm run dev
  ```
  Runs the Webpack Dev Server with live-reloading and hot module replacement at `http://localhost:8080`.
  
- **Production Compilation**:
  ```bash
  npm run build
  ```
  Generates fully compiled static assets under `custom-generator-codelab/dist/`.

- **Production Static Serving**:
  ```bash
  npm start
  ```
  Serves the pre-compiled `build/` directory on port 8080 (primarily used by Docker environments).

---

## Directory Structure Summary

```
custom-generator-codelab/
├── dist/                      # Production build output
├── build/                     # Development build output (normally served from memory)
├── src/                       # Main source code
│   ├── index.html             # HTML template (injects Online-IDE scripts)
│   ├── index.js               # Webpack entry point
│   ├── generators/            # Java code generators
│   └── blocks/                # Custom block definitions
├── webpack.config.js          # Webpack configuration
└── package.json               # Node dependencies and scripts
```
