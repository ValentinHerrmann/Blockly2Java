/**
 * Cloudflare Worker – CORS proxy for Blockly2Java git operations.
 *
 * isomorphic-git sends requests in the form:
 *   https://<worker-host>/<git-host>/<path>?<query>
 *
 * The worker reconstructs the target URL, forwards the request with all
 * headers (including Authorization), and adds the necessary CORS response
 * headers so the browser accepts the response.
 *
 * Deploy with:
 *   npx wrangler deploy
 *
 * Then set CORS_PROXY_URL=https://<worker-name>.<account>.workers.dev
 * in your build environment before running `npm run build`.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Expose-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request) {
    // ── CORS preflight ────────────────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // ── Build target URL ──────────────────────────────────────────────────
    const url = new URL(request.url);

    // pathname starts with '/', the rest is the target host + path.
    // isomorphic-git strips the scheme, so we always prepend https://.
    const targetPath = url.pathname.slice(1) + url.search;
    if (!targetPath) {
      return new Response('Missing target URL', { status: 400 });
    }

    const targetUrl = /^https?:\/\//i.test(targetPath)
      ? targetPath
      : 'https://' + targetPath;

    // ── Forward headers, stripping browser-only ones ──────────────────────
    const fwdHeaders = new Headers(request.headers);
    fwdHeaders.delete('origin');
    fwdHeaders.delete('referer');

    // ── Proxy the request ─────────────────────────────────────────────────
    let proxyResponse;
    try {
      proxyResponse = await fetch(targetUrl, {
        method:  request.method,
        headers: fwdHeaders,
        body:    ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
        redirect: 'follow',
      });
    } catch (err) {
      return new Response('Proxy error: ' + err.message, { status: 502 });
    }

    // ── Return response with CORS headers ─────────────────────────────────
    const resHeaders = new Headers(proxyResponse.headers);
    for (const [k, v] of Object.entries(CORS_HEADERS)) {
      resHeaders.set(k, v);
    }

    return new Response(proxyResponse.body, {
      status:     proxyResponse.status,
      statusText: proxyResponse.statusText,
      headers:    resHeaders,
    });
  },
};
