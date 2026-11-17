import { createServer } from 'node:http';
import { createHash, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.PORT || 3000);
// Render's fromService `hostport` property yields "host:port" without a scheme;
// default to http for that case so the proxy target is always a valid URL.
const normalizeUrl = (value) => {
  const trimmed = (value || '').replace(/\/+$/, '');
  if (!trimmed) return '';
  return /^https?:\/\//.test(trimmed) ? trimmed : `http://${trimmed}`;
};
const coderUrl = normalizeUrl(process.env.CODER_INTERNAL_URL || process.env.CODER_ACCESS_URL);
const coderToken = process.env.CODER_SESSION_TOKEN || '';
const apiSecret = process.env.FRANKENSTEIN_API_SECRET || '';
const allowInsecure = process.env.ALLOW_INSECURE_NO_AUTH === '1';
const upstreamTimeoutMs = Number(process.env.CODER_TIMEOUT_MS || 30000);
const maxProxyBodyBytes = Number(process.env.MAX_PROXY_BODY_BYTES || 1048576);

const moduleDir = dirname(fileURLToPath(import.meta.url));
const catalogCandidates = [
  process.env.CATALOG_INDEX,
  join(moduleDir, 'catalog', 'index.json'),
  join(moduleDir, '..', '..', 'catalog', 'index.json'),
  join(process.cwd(), 'catalog', 'index.json'),
].filter(Boolean);

const resolveCatalogPath = () => {
  for (const candidate of catalogCandidates) if (existsSync(candidate)) return candidate;
  throw new Error(`catalog/index.json not found; tried:\n  ${catalogCandidates.join('\n  ')}`);
};

const log = (level, message, extra = {}) => {
  const entry = { level, message, ...extra };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line); else console.log(line);
};

const json = (response, payload, status = 200, extraHeaders = {}) => {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    ...extraHeaders,
  });
  response.end(JSON.stringify(payload));
};

// Constant-time comparison to avoid leaking the secret through timing.
const secretMatches = (provided) => {
  if (typeof provided !== 'string') return false;
  const a = createHash('sha256').update(provided).digest();
  const b = createHash('sha256').update(apiSecret).digest();
  return timingSafeEqual(a, b);
};

const authorized = (request) => {
  if (allowInsecure) return true;
  return secretMatches(request.headers['x-frankenstein-api-secret']);
};

let catalogCache = null;
const loadCatalog = async (path) => {
  if (!catalogCache) catalogCache = JSON.parse(await readFile(path, 'utf8'));
  return catalogCache;
};

const readBody = (request) => new Promise((resolve, reject) => {
  let size = 0;
  const chunks = [];
  request.on('data', (chunk) => {
    size += chunk.length;
    if (size > maxProxyBodyBytes) {
      reject(Object.assign(new Error('request body too large'), { statusCode: 413 }));
      request.destroy();
      return;
    }
    chunks.push(chunk);
  });
  request.on('end', () => resolve(Buffer.concat(chunks)));
  request.on('error', reject);
});

const coder = async (path, request) => {
  if (!coderUrl || !coderToken) {
    throw Object.assign(new Error('Coder upstream is not configured'), { statusCode: 503 });
  }
  const headers = { accept: 'application/json', 'Coder-Session-Token': coderToken };
  if (request.headers['content-type']) headers['content-type'] = request.headers['content-type'];
  const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await readBody(request);
  let result;
  try {
    result = await fetch(`${coderUrl}${path}`, {
      method: request.method,
      headers,
      body,
      signal: AbortSignal.timeout(upstreamTimeoutMs),
    });
  } catch (error) {
    const reason = error instanceof Error ? error.name : 'unknown';
    throw Object.assign(new Error(`Coder upstream request failed (${reason})`), { statusCode: 502 });
  }
  const text = await result.text();
  if (!text) return { status: result.status, payload: {} };
  try {
    return { status: result.status, payload: JSON.parse(text) };
  } catch {
    // The upstream did not return JSON (e.g. an HTML error page): do not leak it.
    throw Object.assign(new Error('Coder upstream returned a non-JSON response'), { statusCode: 502 });
  }
};

const start = async () => {
  if (!apiSecret && !allowInsecure) {
    throw new Error('FRANKENSTEIN_API_SECRET is required (set ALLOW_INSECURE_NO_AUTH=1 only for local development)');
  }
  const catalogPath = resolveCatalogPath();
  log('info', 'catalog resolved', { path: catalogPath });
  await loadCatalog(catalogPath);
  log('info', 'catalog loaded', { coderConfigured: Boolean(coderUrl && coderToken) });

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
      if (url.pathname === '/healthz') {
        if (!['GET', 'HEAD'].includes(request.method || '')) {
          return json(response, { error: 'method_not_allowed' }, 405, { allow: 'GET, HEAD' });
        }
        return json(response, { ok: true, coderConfigured: Boolean(coderUrl && coderToken) });
      }
      if (!['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method || '')) {
        return json(response, { error: 'method_not_allowed' }, 405, { allow: 'GET, HEAD, POST, PUT, PATCH, DELETE' });
      }
      if (!authorized(request)) return json(response, { error: 'unauthorized' }, 401);
      if (url.pathname === '/api/catalog') return json(response, await loadCatalog(catalogPath));
      if (url.pathname.startsWith('/api/coder/')) {
        const upstream = await coder(url.pathname.replace('/api/coder', '') + url.search, request);
        return json(response, upstream.payload, upstream.status);
      }
      return json(response, { error: 'not_found' }, 404);
    } catch (error) {
      const status = error && Number.isInteger(error.statusCode) ? error.statusCode : 500;
      log('error', 'request failed', { path: request.url, status, reason: error instanceof Error ? error.message : 'unknown' });
      // Only the explicit, already-sanitized status codes carry a message; any
      // unexpected failure returns a generic body so internals never leak.
      const message = status === 500 ? 'internal_error' : (error instanceof Error ? error.message : 'internal_error');
      return json(response, { error: message }, status);
    }
  });

  server.listen(port, '0.0.0.0', () => log('info', `Frankenstein-Labs API listening on ${port}`));
};

start().catch((error) => {
  log('error', 'startup failed', { reason: error instanceof Error ? error.message : 'unknown' });
  process.exit(1);
});
