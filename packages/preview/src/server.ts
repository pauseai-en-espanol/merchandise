import { parseShareLink } from '@pauseai-es/merch-core';
import { readFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { join } from 'node:path';

import { sharePage } from './page';
import { previewJpeg, resolveLink, stateKey } from './preview';
import { type Lang, loadRepo } from './repo';

/**
 * The preview server: share links' pages and their link-preview images, drawn
 * on request with the site's render engine. nginx serves everything else and
 * sends it these paths (charts/static/templates/nginx-config.yaml):
 *
 *   /d/…, /en/d/…              a share link's page (title, description, image)
 *   /preview/<slug>/<key>.jpg  its link preview, 1200 × 630
 *   /healthz                   for the probes
 *
 * Environment: PORT (8080), REPO_ROOT (the repo files it draws from, see
 * repo.ts), STATIC_ROOT (the built site, for its pages).
 */

const PORT = Number(process.env.PORT ?? 8080);
const REPO_ROOT = process.env.REPO_ROOT ?? join(import.meta.dirname, '..', '..', '..');
const STATIC_ROOT = process.env.STATIC_ROOT ?? join(import.meta.dirname, '..', '..', 'web', 'dist');

const repo = loadRepo(REPO_ROOT);
const pages: Record<Lang, string> = {
  en: readFileSync(join(STATIC_ROOT, 'en', 'index.html'), 'utf8'),
  es: readFileSync(join(STATIC_ROOT, 'index.html'), 'utf8'),
};
const HOME: Record<Lang, string> = { en: '/en/', es: '/' };

const PREVIEW_PATH =
  /^\/preview\/([a-z0-9-]+)\/((?:es|en)-(?:orange|white|black)(?:-short)?)\.jpg$/;
const SHARE_NO_SLASH = /^(?:\/en)?\/d\/[a-z0-9-]+(?:\/(?:short|(?:es|en)-[a-z]+(?:-short)?))?$/;

// Drawn previews, most recently used last. A share link's preview is fetched a
// few times (each app that shows the link), then rarely again.
const CACHE_SIZE = 200;
const cache = new Map<string, Buffer>();

// New drawings are limited (about half a second of CPU each): a burst, then a
// steady rate. Cached ones are always served.
const BURST = 20;
const PER_SECOND = 2;
let tokens = BURST;
let refilled = Date.now();
const takeToken = () => {
  const now = Date.now();
  tokens = Math.min(BURST, tokens + ((now - refilled) / 1000) * PER_SECOND);
  refilled = now;
  if (tokens < 1) return false;
  tokens -= 1;
  return true;
};

const send = (
  req: IncomingMessage,
  res: ServerResponse,
  status: number,
  headers: Record<string, string>,
  body: Buffer | string = '',
) => {
  res.writeHead(status, { 'Content-Length': String(Buffer.byteLength(body)), ...headers });
  res.end(req.method === 'HEAD' ? undefined : body);
};

const handle = (req: IncomingMessage, res: ServerResponse) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(req, res, 405, { Allow: 'GET, HEAD' });
    return;
  }
  const { pathname, search } = new URL(req.url ?? '/', 'http://preview');

  if (pathname === '/healthz') {
    send(req, res, 200, { 'Content-Type': 'text/plain' }, 'ok');
    return;
  }

  const image = PREVIEW_PATH.exec(pathname);
  if (image) {
    const link = parseShareLink(`/d/${image[1]}/${image[2]}/`, search);
    const state = link && resolveLink(repo, link);
    if (!state) {
      send(req, res, 404, { 'Content-Type': 'text/plain' }, 'Not found');
      return;
    }
    const key = stateKey(state);
    let jpeg = cache.get(key);
    if (jpeg) {
      cache.delete(key);
    } else {
      if (!takeToken()) {
        send(req, res, 503, { 'Content-Type': 'text/plain', 'Retry-After': '5' }, 'Busy');
        return;
      }
      const started = performance.now();
      jpeg = previewJpeg(repo, state);
      console.log(`drew ${pathname}${search} in ${Math.round(performance.now() - started)} ms`);
      if (cache.size >= CACHE_SIZE) cache.delete(cache.keys().next().value ?? key);
    }
    cache.set(key, jpeg);
    send(
      req,
      res,
      200,
      { 'Cache-Control': 'public, max-age=604800', 'Content-Type': 'image/jpeg' },
      jpeg,
    );
    return;
  }

  const link = parseShareLink(pathname, search);
  if (!link) {
    if (SHARE_NO_SLASH.test(pathname)) {
      send(req, res, 301, { Location: `${pathname}/${search}` });
    } else {
      send(req, res, 404, { 'Content-Type': 'text/plain' }, 'Not found');
    }
    return;
  }
  const state = resolveLink(repo, link);
  if (!state) {
    // A design that's gone (renamed?): the generator itself.
    send(req, res, 302, { Location: HOME[link.ui] });
    return;
  }
  send(
    req,
    res,
    200,
    { 'Cache-Control': 'no-cache', 'Content-Type': 'text/html; charset=utf-8' },
    sharePage(pages[link.ui], repo, state, link, pathname, search),
  );
};

const server = createServer((req, res) => {
  try {
    handle(req, res);
  } catch (error) {
    console.error(req.url, error);
    if (!res.headersSent) send(req, res, 500, { 'Content-Type': 'text/plain' }, 'Error');
  }
});

server.listen(PORT, () => {
  console.log(`preview server on :${PORT}, ${repo.designs.size} designs from ${REPO_ROOT}`);
});

const stop = () => server.close(() => process.exit(0));
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
