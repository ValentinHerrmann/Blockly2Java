const path = require('node:path');
const webpack = require('webpack');
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

const getCorsProxyUrl = () => {
  if (process.env.CORS_PROXY_URL) {
    return process.env.CORS_PROXY_URL;
  }
  return process.env.WEBPACK_SERVE === 'true' ? '/cors-proxy' : '';
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
    // Local CORS proxy so browser-based git requests (isomorphic-git)
    // can reach servers that don't set Access-Control-Allow-Origin.
    // Requests to /cors-proxy/{host}/{path} are forwarded to https://{host}/{path}.
    setupMiddlewares: (middlewares, _devServer) => {
      const https = require('node:https');
      const nodeHttp = require('node:http');

      // Insert at the very front so it runs before any built-in middleware.
      middlewares.unshift({
        name: 'cors-proxy',
        middleware: (req, res, next) => {
          // Only handle requests that start with /cors-proxy/
          if (!req.url.startsWith('/cors-proxy/')) return next();

          // Strip the /cors-proxy/ prefix
          const remainder = req.url.slice('/cors-proxy/'.length);

          // Handle CORS preflight
          if (req.method === 'OPTIONS') {
            res.writeHead(204, {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': '*',
              'Access-Control-Max-Age': '86400',
            });
            return res.end();
          }

          // isomorphic-git strips the scheme when corsProxy is used,
          // so remainder is "host/path?query". Prepend https:// if needed.
          let targetUrl = remainder;
          if (!/^https?:\/\//i.test(targetUrl)) targetUrl = 'https://' + targetUrl;

          let parsed;
          try {
            parsed = new URL(targetUrl);
          } catch {
            console.error('[cors-proxy] Bad URL:', targetUrl);
            res.writeHead(400);
            return res.end('Bad proxy URL');
          }

          const hasAuth = !!(req.headers['authorization']);
          console.log(`[cors-proxy] ${req.method} ${parsed.href}  auth=${hasAuth}`);

          const transport = parsed.protocol === 'http:' ? nodeHttp : https;

          // Forward headers, replacing host and removing browser-specific ones
          const fwdHeaders = { ...req.headers, host: parsed.host };
          delete fwdHeaders['origin'];
          delete fwdHeaders['referer'];
          delete fwdHeaders['connection'];
          delete fwdHeaders['accept-encoding'];

          const proxyReq = transport.request(
            {
              hostname: parsed.hostname,
              port: parsed.port || (parsed.protocol === 'http:' ? 80 : 443),
              path: parsed.pathname + parsed.search,
              method: req.method,
              headers: fwdHeaders,
            },
            (proxyRes) => {
              console.log(`[cors-proxy]   ← ${proxyRes.statusCode} ${parsed.href}`);
              const resHeaders = { ...proxyRes.headers };
              resHeaders['access-control-allow-origin'] = '*';
              resHeaders['access-control-allow-headers'] = '*';
              resHeaders['access-control-expose-headers'] = '*';
              res.writeHead(proxyRes.statusCode, resHeaders);
              proxyRes.pipe(res);
            },
          );
          proxyReq.on('error', (err) => {
            console.error('[cors-proxy] Error:', err.message);
            res.writeHead(502);
            res.end('CORS proxy error: ' + err.message);
          });
          req.pipe(proxyReq);
        },
      });

      return middlewares;
    },
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
  resolve: {
    fallback: {
      buffer: require.resolve('buffer/'),
    },
  },
  plugins: [
    // Provide Buffer globally so isomorphic-git works in the browser.
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
    // Inject the CORS proxy URL so GitService can use the right proxy in
    // development (local webpack-dev-server) vs production (Cloudflare Worker).
    // Override at build time: CORS_PROXY_URL=https://... npm run build
    new webpack.DefinePlugin({
      __CORS_PROXY_URL__: JSON.stringify(
        getCorsProxyUrl()
      ),
    }),
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
          // Copy the versioned manifest from src so it's tracked by git
          from: 'src/manifest.json',
          to: '.',
          noErrorOnMissing: true,
        },
        {
          // Copy the legal/privacy page from src so it's tracked by git
          from: 'src/datenschutz.html',
          to: '.',
          noErrorOnMissing: true,
        },
        {
          // Copy project-specific assets from src/assets into the output assets/ folder.
          // This ensures files like logo_only.svg are included in the build without
          // duplicating them in public/ and without requiring a git-untracked manual copy.
          from: 'src/assets',
          to: 'assets',
          noErrorOnMissing: true,
        },
        // Only copy the CNAME file for production builds (custom domain).
        // Preview builds must NOT include CNAME – otherwise GitHub Pages
        // redirects the github.io URL to the custom domain.
        ...(process.env.CUSTOM_DOMAIN ? [{
          from: '../CNAME',
          to: 'CNAME',
          noErrorOnMissing: true,
        }] : []),
      ]
    })
  ],
};

module.exports = function createWebpackConfig(env, argv) {
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