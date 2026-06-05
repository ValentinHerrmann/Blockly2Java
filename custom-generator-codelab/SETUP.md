# Blockly2Java Setup Guide

This guide explains how to set up and run the Blockly2Java application with the Online-IDE widget.

## Quick Start for Developers

The repository uses a git submodule for the Online-IDE_B2J component. Here's how to get started:

1. **Clone the repository with submodules:**
   ```bash
   git clone --recursive https://github.com/ValentinHerrmann/Blockly2Java.git
   cd Blockly2Java/custom-generator-codelab
   ```
   
   Or if you've already cloned:
   ```bash
   git submodule update --init --recursive
   ```

2. **Install dependencies and build:**
   ```bash
   npm install
   npm start
   ```

The `npm install` command will automatically initialize the submodules, and `npm start` will build everything and open the application in your browser at `http://localhost:8080`.

## Architecture

This project consists of two components:
- **Blockly2Java**: The main application that provides the Blockly interface for Java code generation
- **Online-IDE_B2J**: A git submodule at `online-ide-source/` that provides the embedded IDE widget

### Why Submodules?

Git submodules allow us to:
- Keep the Online-IDE_B2J repository separate and independently versioned
- Avoid duplication of code
- Ensure all developers work with the same version of dependencies
- Keep build artifacts out of version control

## Build Process

The build process is automated through npm scripts:

1. **`npm install`**: Installs dependencies and initializes git submodules (via postinstall hook)
2. **`npm start`**: 
   - Checks if `public/lib` exists
   - If not, runs the setup script to build Online-IDE from the submodule
   - Starts the webpack dev server with hot reloading
3. **`npm run build`**: Creates a production build in the `dist/` folder

### Setup Script Details

The `setup.js` and `setup.sh` scripts:
1. Build the Online-IDE_B2J embedded version from the submodule
2. Copy the built files (`online-ide-embedded.js`, `online-ide-embedded.css`) to `public/`
3. Copy static assets (`lib/`, `assets/`) to `public/`

## Available Scripts

- **`npm start`** - Start development server with auto-setup (recommended)
- **`npm run dev`** - Force rebuild and start dev server  
- **`npm run build`** - Create production build
- **`npm run build:all`** - Force rebuild Online-IDE and create production build
- **`npm run setup`** - Build from submodule (runs automatically when needed)
- **`npm run setup:submodule`** - Explicitly build from submodule
- **`npm run setup:external`** - Build from external Online-IDE_B2J folder (for special cases)
- **`npm run setup:dummy`** - Copy from dummy_test (legacy, for reference only)

## Project Structure

```
Blockly2Java/
├── .github/
│   └── workflows/
│       └── deploy_to_pages.yml    # GitHub Actions for deployment
├── custom-generator-codelab/
│   ├── online-ide-source/         # Git submodule (Online-IDE_B2J)
│   ├── public/                    # Built files (not in git)
│   │   ├── lib/                   # Third-party libraries
│   │   ├── assets/                # Fonts, graphics, etc.
│   │   ├── online-ide-embedded.js
│   │   └── online-ide-embedded.css
│   ├── src/
│   │   ├── index.html
│   │   ├── index.js
│   │   └── ...
│   ├── dist/                      # Production build output (not in git)
│   ├── build/                     # Development build output (not in git)
│   ├── webpack.config.js
│   ├── package.json
│   ├── setup.js                   # Cross-platform setup script
│   └── setup.sh                   # Bash setup script
├── CNAME                          # Legacy custom domain configuration
└── README.MD
```

## Deployment

Hosting and deployment processes (including Cloudflare Pages for the frontend and self-hosted Docker for the backend) are documented in [DEPLOYMENT.md](file:///home/vale/_GITHUB/ValentinHerrmann/Blockly2Java/DEPLOYMENT.md).

## Development Workflow

### Working on Blockly2Java Only

```bash
# Make changes to files in src/
# Webpack dev server will auto-reload
```

### Updating Online-IDE_B2J

If you need to update the submodule to a newer version:

```bash
cd online-ide-source
git pull origin main
cd ..
git add online-ide-source
git commit -m "Update Online-IDE_B2J submodule"
npm run dev  # Rebuild and restart
```

### Working on Both Projects Simultaneously

If you're actively developing Online-IDE_B2J:

1. Make changes in the `online-ide-source/` directory
2. Run `npm run dev` to rebuild and test
3. Commit changes in the submodule separately
4. Commit submodule reference update in main project

## Troubleshooting

### "Submodule not initialized" Error

```bash
git submodule update --init --recursive
```

### OnlineIDE Panel Not Displaying

**Symptoms:**
- Blockly editor loads but OnlineIDE panel is empty.
- Browser console shows 404 errors for `assets/*.js` files.

**Solution:**
```bash
cd custom-generator-codelab
node setup.js --build-from-submodule
npm start
```

### Code Not Updating in OnlineIDE

**Symptoms:**
- Blockly blocks change but Java code doesn't update.
- `window.online_ide_access` is undefined.

**Solutions:**
1. Check browser console for errors.
2. Verify OnlineIDE loaded: `console.log(window.online_ide_access)`
3. Restart development server: `Ctrl+C` then `npm start`
4. Clear browser cache and cookies.

### "Cannot find module 'copy-webpack-plugin'"

Run `npm install` to install all dependencies.

### Public directory is empty

Run `npm run setup` to build the Online-IDE files.

### Port 8080 already in use

Kill the process using port 8080:
```bash
lsof -ti:8080 | xargs kill -9
```

Or change the port in [webpack.config.js](webpack.config.js#L13).

### Build Failures

**Problem:** `npm run build` fails.

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
3. Check Node.js version (should be 18.x or higher).

### Cookie/Persistence Issues

**Problem:** Workspace doesn't save between sessions.

**Solution:**
Clear browser cookies for the domain:
1. Open browser DevTools → Application → Cookies.
2. Delete all cookies for the domain (e.g. `blockly2java.de` or `localhost`).
3. Reload the page.

### Changes to Online-IDE not reflected

Clear the build output and rebuild:
```bash
rm -rf public/ build/ dist/
npm run dev
```

### Files not loading in browser

1. Check if `public/` directory exists and contains `lib/`, `assets/`, and the embedded files.
2. Open browser DevTools and check Network tab for 404 errors.
3. Clear browser cache.
4. Restart the dev server.

## Build Artifacts

The following directories are generated during build and **should not be committed to git**:
- `public/` - Built Online-IDE files and assets
- `build/` - Development build output
- `dist/` - Production build output
- `online-ide-source/node_modules/` - Submodule dependencies
- `online-ide-source/dist/` - Submodule build output

These are all excluded via `.gitignore`.

## Contributing

When contributing to this project:

1. Never commit build artifacts (`public/`, `dist/`, `build/`)
2. Update the submodule reference when Online-IDE_B2J changes
3. Test the build process locally before pushing
4. Update this documentation if you change the build process

## Additional Resources

- [Blockly Documentation](https://developers.google.com/blockly)
- [Webpack Documentation](https://webpack.js.org/)
- [Git Submodules](https://git-scm.com/book/en/v2/Git-Tools-Submodules)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
