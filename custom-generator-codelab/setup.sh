#!/bin/bash
# Setup script to prepare the Blockly2Java application
# This script copies necessary files from the Online-IDE submodule, external folder, or dummy_test

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PUBLIC_DIR="$SCRIPT_DIR/public"

echo "Setting up Blockly2Java..."

# Create public directory structure
mkdir -p "$PUBLIC_DIR/lib"
mkdir -p "$PUBLIC_DIR/assets"

# Check which source to use
if [ "$1" == "--build-from-submodule" ]; then
    echo "Building Online-IDE from submodule..."
    
    ONLINE_IDE_DIR="$SCRIPT_DIR/online-ide-source"
    
    if [ ! -d "$ONLINE_IDE_DIR" ]; then
        echo "Error: Online-IDE submodule not found at $ONLINE_IDE_DIR"
        echo "Please run: git submodule update --init --recursive"
        exit 1
    fi
    
    # Check if submodule is initialized
    if [ ! -f "$ONLINE_IDE_DIR/package.json" ]; then
        echo "Initializing submodule..."
        cd "$SCRIPT_DIR/.."
        git submodule update --init --recursive
        cd "$SCRIPT_DIR"
    fi
    
    # Build the embedded version
    cd "$ONLINE_IDE_DIR"
    echo "Running npm install in Online-IDE submodule..."
    npm install
    echo "Building embedded version..."
    npm run build-embedded
    
    # Copy the built files
    echo "Copying embedded files..."
    cp dist/online-ide-embedded.js "$PUBLIC_DIR/"
    cp dist/online-ide-embedded.css "$PUBLIC_DIR/"
    cp dist/online-ide-embedded.js.map "$PUBLIC_DIR/" 2>/dev/null || true
    
    # Copy necessary directories from dist
    echo "Copying lib and assets from dist..."
    if [ -d "dist/lib" ]; then
        cp -r dist/lib "$PUBLIC_DIR/"
    else
        echo "Warning: No lib directory found in dist"
    fi
    
    if [ -d "dist/assets" ]; then
        mkdir -p "$PUBLIC_DIR/assets"
        cp -r dist/assets/* "$PUBLIC_DIR/assets/" 2>/dev/null || true
    else
        echo "Warning: No assets directory found in dist"
    fi
    
    cd "$SCRIPT_DIR"
    
elif [ "$1" == "--build-from-source" ]; then
    echo "Building Online-IDE from external source..."
    
    ONLINE_IDE_DIR="$SCRIPT_DIR/../../Online-IDE_B2J"
    
    if [ ! -d "$ONLINE_IDE_DIR" ]; then
        echo "Error: Online-IDE_B2J directory not found at $ONLINE_IDE_DIR"
        echo "Please run this script with --build-from-submodule or --copy-from-dummy"
        exit 1
    fi
    
    # Build the embedded version
    cd "$ONLINE_IDE_DIR"
    echo "Running npm install in Online-IDE_B2J..."
    npm install
    echo "Building embedded version..."
    npm run build-embedded
    
    # Copy the built files
    echo "Copying embedded files..."
    cp dist/online-ide-embedded.js "$PUBLIC_DIR/"
    cp dist/online-ide-embedded.css "$PUBLIC_DIR/"
    cp dist/online-ide-embedded.js.map "$PUBLIC_DIR/" 2>/dev/null || true
    
    # Copy necessary directories from dist
    echo "Copying lib and assets from dist..."
    if [ -d "dist/lib" ]; then
        cp -r dist/lib "$PUBLIC_DIR/"
    else
        echo "Warning: No lib directory found in dist"
    fi
    
    if [ -d "dist/assets" ]; then
        mkdir -p "$PUBLIC_DIR/assets"
        cp -r dist/assets/* "$PUBLIC_DIR/assets/" 2>/dev/null || true
    else
        echo "Warning: No assets directory found in dist"
    fi
    
    cd "$SCRIPT_DIR"
    
elif [ "$1" == "--copy-from-dummy" ]; then
    echo "Copying files from dummy_test..."
    
    DUMMY_DIR="$SCRIPT_DIR/../../dummy_test"
    
    if [ ! -d "$DUMMY_DIR" ]; then
        echo "Error: dummy_test directory not found at $DUMMY_DIR"
        echo "Please run this script with --build-from-submodule instead"
        exit 1
    fi
    
    # Copy embedded files
    echo "Copying embedded files..."
    cp "$DUMMY_DIR/online-ide-embedded.js" "$PUBLIC_DIR/"
    cp "$DUMMY_DIR/online-ide-embedded.css" "$PUBLIC_DIR/"
    cp "$DUMMY_DIR/online-ide-embedded.js.map" "$PUBLIC_DIR/" 2>/dev/null || true
    
    # Copy lib and assets
    echo "Copying lib directory..."
    cp -r "$DUMMY_DIR/lib"/* "$PUBLIC_DIR/lib/"
    
    echo "Copying assets directory..."
    cp -r "$DUMMY_DIR/assets"/* "$PUBLIC_DIR/assets/"
    
else
    echo "Usage: ./setup.sh [--build-from-submodule|--build-from-source|--copy-from-dummy]"
    echo ""
    echo "Options:"
    echo "  --build-from-submodule Build Online-IDE from the git submodule (recommended)"
    echo "  --build-from-source    Build from external Online-IDE_B2J folder"
    echo "  --copy-from-dummy      Copy pre-built files from dummy_test"
    echo ""
    echo "Recommended: use --build-from-submodule for clean builds."
    exit 1
fi

echo ""
echo "✓ Setup complete!"
echo "You can now run 'npm start' to launch the application."
