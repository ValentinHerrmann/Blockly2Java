const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// Determine the publicPath for GitHub Pages
// If GITHUB_PAGES env var is set and no custom domain (CNAME), use /Blockly2Java/
const getPublicPath = () => {
  if (process.env.GITHUB_PAGES === 'true' && !process.env.CUSTOM_DOMAIN) {
    return '/Blockly2Java/';
  }
  return '/';
};

// Base config that applies to either development or production mode.
const config = {
  entry: './src/index.js',
  output: {
    // Compile the source files into a bundle.
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    publicPath: getPublicPath(),
  },
  // Enable webpack-dev-server to get hot refresh of the app.
  devServer: {
    static: [
      {
        directory: path.join(__dirname, 'build'),
      },
      {
        directory: path.join(__dirname, 'public'),
        publicPath: '/',
      },
      {
        // Serve src/assets at /assets/ so logo_only.svg etc. are found
        // in dev mode without needing a full build first.
        directory: path.join(__dirname, 'src', 'assets'),
        publicPath: '/assets',
      }
    ],
    compress: true,
    port: 8080,
  },
  module: {
    rules: [
      {
        // Load CSS files. They can be imported into JS files.
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    // Generate the HTML index page based on our template.
    // This will output the same index page with the bundle we
    // created above added in a script tag.
    new HtmlWebpackPlugin({
      template: 'src/index.html',
    }),
    // Copy static files (lib, assets, and Online-IDE embedded files) to output directory
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'public',
          to: '.',
          noErrorOnMissing: true,
          globOptions: {
            ignore: ['**/.gitkeep']
          }
        },
        {
          // Copy project-specific assets from src/assets into the output assets/ folder.
          // This ensures files like logo_only.svg are included in the build without
          // duplicating them in public/ and without requiring a git-untracked manual copy.
          from: 'src/assets',
          to: 'assets',
          noErrorOnMissing: true,
        },
        {
          from: '../CNAME',
          to: 'CNAME',
          noErrorOnMissing: true,
        }
      ]
    })
  ],
};

module.exports = (env, argv) => {
  if (argv.mode === 'development') {
    // Set the output path to the `build` directory
    // so we don't clobber production builds.
    config.output.path = path.resolve(__dirname, 'build');

    // Generate source maps for our code for easier debugging.
    // Not suitable for production builds. If you want source maps in
    // production, choose a different one from https://webpack.js.org/configuration/devtool
    // Note: eval-* devtools break VS Code breakpoints; use cheap-module-source-map instead.
    config.devtool = 'cheap-module-source-map';

    // Include the source maps for Blockly for easier debugging Blockly code.
    config.module.rules.push({
      test: /(blockly\/.*\.js)$/,
      use: [require.resolve('source-map-loader')],
      enforce: 'pre',
    });

    // Ignore spurious warnings from source-map-loader
    // It can't find source maps for some Closure modules and that is expected
    config.ignoreWarnings = [/Failed to parse source map/];
  }
  return config;
};