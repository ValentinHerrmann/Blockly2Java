[![Build and Deploy to Pages](https://github.com/ValentinHerrmann/Blockly2Java/actions/workflows/deploy_to_pages.yml/badge.svg)](https://github.com/ValentinHerrmann/Blockly2Java/actions/workflows/deploy_to_pages.yml)
[![Build and Push to B2J_dist](https://github.com/ValentinHerrmann/Blockly2Java/actions/workflows/build_and_store.yml/badge.svg)](https://github.com/ValentinHerrmann/Blockly2Java/actions/workflows/build_and_store.yml)
[![Create Release on Tag Pushed](https://github.com/ValentinHerrmann/Blockly2Java/actions/workflows/createRelease_onTagPushed.yml/badge.svg)](https://github.com/ValentinHerrmann/Blockly2Java/actions/workflows/createRelease_onTagPushed.yml)


# Blockly2Java

This project is meant to be used by the [BlueJBlocklyExtension](https://github.com/ValentinHerrmann/BlueJBlocklyExtension) and has a standalone version available at https://b2j.valentin-herrmann.com.

The standalone loads the last program based on cookies. If a translation bug occurred (no java code displayed) the cookies have to be deleted.

## Quick Start

To get started with development:

```bash
# Clone the repository with submodules
git clone --recursive https://github.com/ValentinHerrmann/Blockly2Java.git
cd Blockly2Java

# Install dependencies
npm install

# Start development server
npm start
```

The application will open in your browser at `http://localhost:8080`.

### Available Scripts

- `npm start` - Start the development server
- `npm run dev` - Force rebuild and start development server with hot reloading
- `npm run build` - Create a production build
- `npm run build:all` - Force rebuild all dependencies and create production build
- `npm run setup` - Build from submodule (runs automatically when needed)

For more detailed setup instructions, see [SETUP.md](custom-generator-codelab/SETUP.md).
