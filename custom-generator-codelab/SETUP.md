# Blockly2Java Setup Guide

This guide explains how to set up and run the Blockly2Java application.

## Quick Start for Developers

To run the application locally for development:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ValentinHerrmann/Blockly2Java.git
   cd Blockly2Java
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

The `npm run dev` command starts the Webpack dev server with hot reloading and live preview. The app will open in your browser at `http://localhost:8080`.

## Architecture

This project is structured as follows:
- **Blockly2Java**: The main application that provides the Blockly interface, custom blocks, and Java code generation.
- **Online-IDE Integration**: The embedded Online-IDE widget (on the right-hand side of the page) is loaded dynamically at runtime from `https://onlineide.blockly2java.de`. The script and stylesheet are injected by the template in [index.html](src/index.html). No local compilation of the IDE is needed.

### Historical Submodules & Setup Scripts
Previously, the project included the Online-IDE repository as a git submodule (`online-ide-source/`) and built it locally using setup scripts (`setup.sh` and `setup.js`). This local embedding has been removed. The setup scripts are kept as legacy placeholders (no-ops) for backward compatibility with workflows and will not run any build steps.

## Build Process

The build process is automated through npm scripts:

1. **`npm install`**: Installs dependencies.
2. **`npm run dev`**: Starts the Webpack dev server with hot reloading and live preview.
3. **`npm run build`**: Creates a production build in the `dist/` folder.

## Available Scripts

Run these scripts from the repository root or within the `custom-generator-codelab` directory:

- **`npm run dev`** - Start Webpack dev server at `http://localhost:8080` with hot reloading (recommended for development).
- **`npm start`** - Start a static file server to serve the `build/` directory on port 8080 (primarily used by Docker or local testing of pre-compiled builds).
- **`npm run build`** - Create production build in `dist/`.
- **`npm run build:all`** - Runs setup (legacy placeholder) and creates a production build in `dist/`.

## Project Structure

```
Blockly2Java/
├── .github/
│   └── workflows/
│       ├── deploy_docker.yml      # CI/CD workflow to build/push Docker and deploy to IONOS
│       ├── push_preview.yml       # Pushes PR commits to preview branch
│       ├── release.yml            # Manages release branch and deploys to GitHub Pages
│       └── unit_tests.yml         # Runs unit tests on pushes/PRs
├── custom-generator-codelab/
│   ├── src/                       # Main source code
│   │   ├── index.html             # Main HTML template
│   │   ├── index.js               # Webpack entry point
│   │   ├── generators/            # Java code generators
│   │   └── blocks/                # Custom block definitions
│   ├── dist/                      # Production build output (not in git)
│   ├── build/                     # Development build output (not in git)
│   ├── webpack.config.js          # Webpack config
│   └── package.json
├── VERSION                        # App version file
├── DEPLOYMENT.md                  # Deployment documentation
└── README.MD                      # Main readme
```

## Deployment

Hosting and deployment processes (including Cloudflare Pages for the frontend and self-hosted Docker for the backend) are documented in [DEPLOYMENT.md](../DEPLOYMENT.md).

## Development Workflow

### Working on Blockly2Java

1. Make changes to files in `custom-generator-codelab/src/`.
2. Run `npm run dev` to start the development server.
3. Webpack dev server will auto-reload the application on code changes.

To test the application in a production-like environment locally:
```bash
npm run build:all
# Copy the built assets to build/ for the static server to find them
cp -r custom-generator-codelab/dist/* custom-generator-codelab/build/
npm start
```

## Troubleshooting

### OnlineIDE Panel Not Displaying

**Symptoms:**
- Blockly editor loads but OnlineIDE panel is empty.
- Browser console shows network/resource loading errors.

**Solution:**
- The OnlineIDE widget loads from `https://onlineide.blockly2java.de`. Verify you have a working internet connection and that this domain is accessible from your network.
- Check the browser console (F12) for detailed error logs or security/CORS blocks.

### Code Not Updating in OnlineIDE

**Symptoms:**
- Blockly blocks change but Java code doesn't update.
- `window.online_ide_access` is undefined.

**Solutions:**
1. Check browser console for errors.
2. Verify OnlineIDE loaded: `console.log(window.online_ide_access)`
3. Restart development server: `Ctrl+C` then `npm run dev`
4. Clear browser cache and cookies.

### "Cannot find module 'copy-webpack-plugin'"

Run `npm install` in the workspace root or the `custom-generator-codelab` directory to install all dependencies.

### Port 8080 already in use

Kill the process using port 8080:
```bash
lsof -ti:8080 | xargs kill -9
```

Or change the port in [webpack.config.js](webpack.config.js#L77).

### Cookie/Persistence Issues

**Problem:** Workspace doesn't save between sessions.

**Solution:**
Clear browser cookies for the domain:
1. Open browser DevTools → Application → Cookies.
2. Delete all cookies for the domain (e.g. `blockly2java.de` or `localhost`).
3. Reload the page.

## Build Artifacts

The following directories are generated during build and **should not be committed to git**:
- `custom-generator-codelab/build/` - Development build output
- `custom-generator-codelab/dist/` - Production build output

These are excluded via `.gitignore`.

## Contributing

When contributing to this project:

1. Never commit build artifacts (`build/`, `dist/`)
2. Test the build process locally before pushing
3. Update this documentation if you change the build process

## Additional Resources

- [Blockly Documentation](https://developers.google.com/blockly)
- [Webpack Documentation](https://webpack.js.org/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
