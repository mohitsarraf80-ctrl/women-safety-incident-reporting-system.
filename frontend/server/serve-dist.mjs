// Minimal production-style server for the built React app.
//
//  * serves frontend/dist with long-lived caching for hashed assets
//  * proxies /api/* to the Spring Boot backend on 127.0.0.1:8080
//  * falls back to index.html so client-side routes work on refresh
//  * listens on all interfaces, so the same port can be used on the LAN and by a tunnel
//
// Start with:  npm run serve      (after npm run build)
import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(here, '..', 'dist');
const PORT = Number(process.env.PORT ?? 4173);
const API_TARGET = process.env.API_TARGET ?? 'http://127.0.0.1:8080';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

if (!existsSync(path.join(DIST, 'index.html'))) {
  console.error(`No build found at ${DIST}. Run "npm run build" first.`);
  process.exit(1);
}

function proxy(request, response) {
  const target = new URL(API_TARGET);
  const upstream = http.request(
    {
      hostname: target.hostname,
      port: target.port || 80,
      path: request.url,
      method: request.method,
      headers: {
        ...request.headers,
        host: `${target.hostname}:${target.port || 80}`,
        'x-forwarded-for': request.socket.remoteAddress ?? '',
        'x-forwarded-proto': 'https',
      },
    },
    (upstreamResponse) => {
      response.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.headers);
      upstreamResponse.pipe(response);
    },
  );

  upstream.on('error', (error) => {
    console.error('API proxy error:', error.message);
    if (!response.headersSent) {
      response.writeHead(502, { 'content-type': 'application/json; charset=utf-8' });
    }
    response.end(
      JSON.stringify({
        title: 'Backend unavailable',
        status: 502,
        detail: 'The Spring Boot API is not reachable. Start the backend on port 8080.',
      }),
    );
  });

  request.pipe(upstream);
}

function serveFile(request, response, filePath, status = 200) {
  const extension = path.extname(filePath).toLowerCase();
  const hashedAsset = /-[A-Za-z0-9_-]{8,}\.(js|css)$/.test(filePath);
  const headers = {
    'content-type': MIME[extension] ?? 'application/octet-stream',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'cache-control': hashedAsset ? 'public, max-age=31536000, immutable' : 'no-cache',
  };
  response.writeHead(status, headers);
  if (request.method === 'HEAD') {
    response.end();
    return;
  }
  createReadStream(filePath).pipe(response);
}

const server = http.createServer((request, response) => {
  try {
    if (request.url?.startsWith('/api/')) {
      proxy(request, response);
      return;
    }

    const urlPath = decodeURIComponent((request.url ?? '/').split('?')[0]);
    const candidate = path.resolve(DIST, `.${urlPath}`);

    if (candidate.startsWith(DIST) && existsSync(candidate) && statSync(candidate).isFile()) {
      serveFile(request, response, candidate);
      return;
    }

    // SPA fallback: /admin/incidents/3 must return index.html, not 404.
    serveFile(request, response, path.join(DIST, 'index.html'));
  } catch (error) {
    console.error('Request failed:', error.message);
    response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Internal server error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Production build served on http://0.0.0.0:${PORT}`);
  console.log(`API requests are proxied to ${API_TARGET}`);
});
