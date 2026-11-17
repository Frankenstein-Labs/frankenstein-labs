import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const port = Number(process.env.PORT || 3000);
const coderUrl = (process.env.CODER_INTERNAL_URL || process.env.CODER_ACCESS_URL || '').replace(/\/$/, '');
const coderToken = process.env.CODER_SESSION_TOKEN || '';
const apiSecret = process.env.FRANKENSTEIN_API_SECRET || '';
const root = new URL('../..', import.meta.url).pathname;

const json = (response, payload, status = 200) => { response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); response.end(JSON.stringify(payload)); };
const authorized = (request) => !apiSecret || request.headers['x-frankenstein-api-secret'] === apiSecret;
const loadCatalog = async () => JSON.parse(await readFile(join(root, 'catalog/index.json'), 'utf8'));
const coder = async (path, request) => {
  if (!coderUrl || !coderToken) throw new Error('CODER_ACCESS_URL and CODER_SESSION_TOKEN are required');
  const headers = { accept: 'application/json', 'Coder-Session-Token': coderToken };
  if (request.headers['content-type']) headers['content-type'] = request.headers['content-type'];
  const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await new Promise((resolve) => { let data = ''; request.on('data', (chunk) => data += chunk); request.on('end', () => resolve(data)); });
  const result = await fetch(`${coderUrl}${path}`, { method: request.method, headers, body });
  const text = await result.text();
  return { status: result.status, payload: text ? JSON.parse(text) : {} };
};

createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    if (url.pathname === '/healthz') return json(response, { ok: true, coderConfigured: Boolean(coderUrl && coderToken), publicCoderUrl: process.env.CODER_ACCESS_URL || null });
    if (!authorized(request)) return json(response, { error: 'unauthorized' }, 401);
    if (url.pathname === '/api/catalog') return json(response, await loadCatalog());
    if (url.pathname.startsWith('/api/coder/')) {
      const upstream = await coder(url.pathname.replace('/api/coder', '') + url.search, request);
      return json(response, upstream.payload, upstream.status);
    }
    return json(response, { error: 'not_found' }, 404);
  } catch (error) {
    return json(response, { error: error instanceof Error ? error.message : 'internal_error' }, 502);
  }
}).listen(port, '0.0.0.0', () => console.log(`Frankenstein-Labs API listening on ${port}`));
