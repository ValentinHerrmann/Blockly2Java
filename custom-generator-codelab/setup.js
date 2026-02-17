// Cross-platform setup script for Blockly2Java
// This is an alternative to setup.sh for Windows users

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PUBLIC_DIR = path.join(__dirname, 'public');
const args = process.argv.slice(2);
const mode = args[0];

console.log('Setting up Blockly2Java...');

// Create public directory structure
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}
const libDir = path.join(PUBLIC_DIR, 'lib');
const assetsDir = path.join(PUBLIC_DIR, 'assets');
if (!fs.existsSync(libDir)) fs.mkdirSync(libDir, { recursive: true });
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

// Helper function to copy directory recursively
function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`Warning: Source directory not found: ${src}`);
    return;
  }
  
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (mode === '--build-from-submodule' || !mode) {
  console.log('Building Online-IDE from submodule...');
  
  const onlineIdeDir = path.join(__dirname, 'online-ide-source');
  
  if (!fs.existsSync(onlineIdeDir)) {
    console.error(`Error: Online-IDE submodule not found at ${onlineIdeDir}`);
    console.error('Please run: git submodule update --init --recursive');
    process.exit(1);
  }
  
  // Check if submodule is initialized
  if (!fs.existsSync(path.join(onlineIdeDir, 'package.json'))) {
    console.log('Initializing submodule...');
    try {
      execSync('git submodule update --init --recursive', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    } catch (error) {
      console.error('Failed to initialize submodule. Please run manually: git submodule update --init --recursive');
      process.exit(1);
    }
  }
  
  // Build the embedded version
  process.chdir(onlineIdeDir);
  console.log('Running npm install in Online-IDE submodule...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('Building embedded version...');
  execSync('npm run build-embedded', { stdio: 'inherit' });
  
  // Copy the built files
  console.log('Copying embedded files...');
  const distDir = path.join(onlineIdeDir, 'dist');
  fs.copyFileSync(
    path.join(distDir, 'online-ide-embedded.js'),
    path.join(PUBLIC_DIR, 'online-ide-embedded.js')
  );
  fs.copyFileSync(
    path.join(distDir, 'online-ide-embedded.css'),
    path.join(PUBLIC_DIR, 'online-ide-embedded.css')
  );
  
  // Copy source map if exists
  const sourceMapPath = path.join(distDir, 'online-ide-embedded.js.map');
  if (fs.existsSync(sourceMapPath)) {
    fs.copyFileSync(sourceMapPath, path.join(PUBLIC_DIR, 'online-ide-embedded.js.map'));
  }
  
  // Copy assets from dist (JavaScript module chunks)
  console.log('Copying built assets (JS modules)...');
  const distAssetsDir = path.join(distDir, 'assets');
  if (fs.existsSync(distAssetsDir)) {
    copyRecursive(distAssetsDir, assetsDir);
  } else {
    console.warn('Warning: No dist/assets directory found');
  }
  
  // Copy lib from dist
  console.log('Copying lib directory from dist...');
  const distLibDir = path.join(distDir, 'lib');
  if (fs.existsSync(distLibDir)) {
    copyRecursive(distLibDir, libDir);
  } else {
    console.warn('Warning: No dist/lib directory found');
  }
  
  // Copy additional assets from public if they exist (fonts, graphics, etc.)
  const publicAssetsDir = path.join(onlineIdeDir, 'public', 'assets');
  if (fs.existsSync(publicAssetsDir)) {
    console.log('Copying additional assets from public...');
    copyRecursive(publicAssetsDir, assetsDir);
  }
  
  process.chdir(__dirname);
  
} else if (mode === '--build-from-source') {
  console.log('Building Online-IDE from external source...');
  
  const onlineIdeDir = path.join(__dirname, '..', '..', 'Online-IDE_B2J');
  
  if (!fs.existsSync(onlineIdeDir)) {
    console.error(`Error: Online-IDE_B2J directory not found at ${onlineIdeDir}`);
    console.error('Please run this script from the correct location or use --copy-from-dummy');
    process.exit(1);
  }
  
  // Build the embedded version
  process.chdir(onlineIdeDir);
  console.log('Running npm install in Online-IDE_B2J...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('Building embedded version...');
  execSync('npm run build-embedded', { stdio: 'inherit' });
  
  // Copy the built files
  console.log('Copying embedded files...');
  const distDir = path.join(onlineIdeDir, 'dist');
  fs.copyFileSync(
    path.join(distDir, 'online-ide-embedded.js'),
    path.join(PUBLIC_DIR, 'online-ide-embedded.js')
  );
  fs.copyFileSync(
    path.join(distDir, 'online-ide-embedded.css'),
    path.join(PUBLIC_DIR, 'online-ide-embedded.css')
  );
  
  // Copy source map if exists
  const sourceMapPath = path.join(distDir, 'online-ide-embedded.js.map');
  if (fs.existsSync(sourceMapPath)) {
    fs.copyFileSync(sourceMapPath, path.join(PUBLIC_DIR, 'online-ide-embedded.js.map'));
  }
  
  // Copy assets from dist (JavaScript module chunks)
  console.log('Copying built assets (JS modules)...');
  const distAssetsDir = path.join(distDir, 'assets');
  if (fs.existsSync(distAssetsDir)) {
    copyRecursive(distAssetsDir, assetsDir);
  } else {
    console.warn('Warning: No dist/assets directory found');
  }
  
  // Copy lib from dist
  console.log('Copying lib directory from dist...');
  const distLibDir = path.join(distDir, 'lib');
  if (fs.existsSync(distLibDir)) {
    copyRecursive(distLibDir, libDir);
  } else {
    console.warn('Warning: No dist/lib directory found');
  }
  
  // Copy additional assets from public if they exist (fonts, graphics, etc.)
  const publicAssetsDir = path.join(onlineIdeDir, 'public', 'assets');
  if (fs.existsSync(publicAssetsDir)) {
    console.log('Copying additional assets from public...');
    copyRecursive(publicAssetsDir, assetsDir);
  }
  
  process.chdir(__dirname);
  
} else if (mode === '--copy-from-dummy') {
  console.log('Copying files from dummy_test...');
  
  const dummyDir = path.join(__dirname, '..', '..', 'dummy_test');
  
  if (!fs.existsSync(dummyDir)) {
    console.error(`Error: dummy_test directory not found at ${dummyDir}`);
    console.error('Please run this script from the correct location or use --build-from-source');
    process.exit(1);
  }
  
  // Copy embedded files
  console.log('Copying embedded files...');
  fs.copyFileSync(
    path.join(dummyDir, 'online-ide-embedded.js'),
    path.join(PUBLIC_DIR, 'online-ide-embedded.js')
  );
  fs.copyFileSync(
    path.join(dummyDir, 'online-ide-embedded.css'),
    path.join(PUBLIC_DIR, 'online-ide-embedded.css')
  );
  
  // Copy source map if exists
  const sourceMapPath = path.join(dummyDir, 'online-ide-embedded.js.map');
  if (fs.existsSync(sourceMapPath)) {
    fs.copyFileSync(sourceMapPath, path.join(PUBLIC_DIR, 'online-ide-embedded.js.map'));
  }
  
  // Copy lib and assets
  console.log('Copying lib directory...');
  copyRecursive(path.join(dummyDir, 'lib'), libDir);
  
  console.log('Copying assets directory...');
  copyRecursive(path.join(dummyDir, 'assets'), assetsDir);
  
} else if (mode && !['--build-from-submodule', '--build-from-source', '--copy-from-dummy'].includes(mode)) {
  console.log('Usage: node setup.js [--build-from-submodule|--build-from-source|--copy-from-dummy]');
  console.log('');
  console.log('Options:');
  console.log('  --build-from-submodule Build from Online-IDE submodule (default, recommended)');
  console.log('  --build-from-source    Build from external Online-IDE_B2J folder');
  console.log('  --copy-from-dummy      Copy pre-built files from dummy_test (legacy)');
  console.log('');
  console.log('If no option is specified, --build-from-submodule is used.');
  process.exit(1);
}

console.log('');
console.log('✓ Setup complete!');
console.log('You can now run "npm start" to launch the application.');
