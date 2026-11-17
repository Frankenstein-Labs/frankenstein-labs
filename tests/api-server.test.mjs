import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const serverPath = join(root, 'services', 'api', 'server.mjs');
const catalogIndex = join(root, 'catalog', 'index.json');
const SECRET = 'test-secret-do-not-use-in-production';

const freePort = () => new Promise((resolve, reject) => {
  const probe = createServer();
  probe.on('error', reject);
  probe.listen(0, '127.0.0.1', () => {
    const { port } = probe.address();
    probe.close(() => resolve(port));
  });
});

const startServer = (env) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [serverPath], {
    env: { ...process.env, CATALOG_INDEX: catalogIndex, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk; });
  child.stderr.on('data', (chunk) => { output += chunk; });
  child.on('error', reject);
  const deadline = Date.now() + 10000;
  const poll = async () => {
    if (child.exitCode !== null) return reject(new Error(`server exited early:\n${output}`));
    try {
      const response = await fetch(`http://127.0.0.1:${env.PORT}/healthz`);
      if (response.ok) return resolve({ child, output: () => output });
    } catch { /* not listening yet */ }
    if (Date.now() > deadline) return reject(new Error(`server did not become ready:\n${output}`));
    setTimeout(poll, 100);
  };
  poll();
});

const stopServer = (child) => new Promise((resolve) => {
  if (child.exitCode !== null) return resolve();
  child.once('exit', () => resolve());
  child.kill('SIGKILL');
});

describe('frankenstein-labs API', () => {
  let child;
  let port;

  before(async () => {
    port = await freePort();
    ({ child } = await startServer({ PORT: String(port), FRANKENSTEIN_API_SECRET: SECRET }));
  });

  after(async () => { await stopServer(child); });

  const url = (path) => `http://127.0.0.1:${port}${path}`;

  it('reports health without authentication', async () => {
    const response = await fetch(url('/healthz'));
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.coderConfigured, false);
  });

  it('rejects catalog requests without the API secret', async () => {
    const response = await fetch(url('/api/catalog'));
    assert.equal(response.status, 401);
  });

  it('rejects catalog requests with a wrong API secret', async () => {
    const response = await fetch(url('/api/catalog'), { headers: { 'x-frankenstein-api-secret': 'nope' } });
    assert.equal(response.status, 401);
  });

  it('serves the catalog with the correct API secret', async () => {
    const response = await fetch(url('/api/catalog'), { headers: { 'x-frankenstein-api-secret': SECRET } });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.ok(body.templates.length > 0, 'expected at least one template');
    assert.ok(body.modules.length > 0, 'expected at least one module');
  });

  it('returns 404 for unknown paths', async () => {
    const response = await fetch(url('/api/does-not-exist'), { headers: { 'x-frankenstein-api-secret': SECRET } });
    assert.equal(response.status, 404);
  });

  it('returns 405 for unsupported methods', async () => {
    const response = await fetch(url('/api/catalog'), { method: 'OPTIONS' });
    assert.equal(response.status, 405);
  });

  it('returns 503 when the Coder upstream is not configured', async () => {
    const response = await fetch(url('/api/coder/users/me'), { headers: { 'x-frankenstein-api-secret': SECRET } });
    assert.equal(response.status, 503);
  });

  it('refuses to start without an API secret', async () => {
    const isolatedPort = await freePort();
    const result = await new Promise((resolve) => {
      const proc = spawn(process.execPath, [serverPath], {
        env: { ...process.env, PORT: String(isolatedPort), CATALOG_INDEX: catalogIndex, FRANKENSTEIN_API_SECRET: '', ALLOW_INSECURE_NO_AUTH: '' },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let output = '';
      proc.stdout.on('data', (c) => { output += c; });
      proc.stderr.on('data', (c) => { output += c; });
      proc.on('exit', (code) => resolve({ code, output }));
    });
    assert.equal(result.code, 1);
    assert.match(result.output, /FRANKENSTEIN_API_SECRET is required/);
  });
});
