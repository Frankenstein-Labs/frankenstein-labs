import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const intervalSeconds = Number(process.env.WORKER_INTERVAL_SECONDS || 3600);
const runOnce = process.env.WORKER_RUN_ONCE === '1' || !Number.isFinite(intervalSeconds) || intervalSeconds <= 0;
const skipSourceClone = process.env.SKIP_SOURCE_CLONE === '1';

const log = (level, message, extra = {}) => {
  const line = JSON.stringify({ level, message, ...extra });
  if (level === 'error') console.error(line); else console.log(line);
};

let activeChild = null;

const spawnProcess = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { cwd: root, stdio: 'inherit' });
  activeChild = child;
  child.on('error', (error) => { activeChild = null; reject(error); });
  child.on('exit', (code, signal) => {
    activeChild = null;
    if (code === 0) resolve();
    else reject(new Error(`${command} ${args.join(' ')} exited with ${code ?? `signal ${signal}`}`));
  });
});

const runScript = (script) => spawnProcess('bash', [join(root, 'scripts', script)]);
const git = (args) => spawnProcess('git', args);

const ensureSources = async () => {
  if (skipSourceClone) return;
  const sources = [
    ['vendor/coder', 'https://github.com/coder/coder.git'],
    ['vendor/registry', 'https://github.com/coder/registry.git'],
  ];
  for (const [path, url] of sources) {
    if (existsSync(join(root, path, '.git'))) continue;
    log('info', 'cloning upstream source', { path, url });
    await git(['clone', '--depth', '1', url, path]);
  }
};

const synchronize = async () => {
  await ensureSources();
  await runScript('sync-coder.sh');
  await runScript('sync-registry.sh');
  await runScript('import-catalog.sh');
  log('info', 'catalog synchronization completed; no workspace provisioning was requested');
};

const sleep = (ms) => new Promise((resolve) => {
  const timer = setTimeout(resolve, ms);
  // Resolve early on shutdown so SIGTERM is handled promptly instead of
  // waiting out the full interval.
  stopWaiters.add(() => { clearTimeout(timer); resolve(); });
});

let stopping = false;
const stopWaiters = new Set();
const stop = (signal) => {
  if (stopping) return;
  stopping = true;
  log('info', 'shutdown requested', { signal });
  for (const wake of stopWaiters) wake();
  stopWaiters.clear();
  // Forward the signal to an in-flight child so a long-running sync (git clone
  // or import) does not delay shutdown until it finishes on its own.
  if (activeChild) activeChild.kill(signal);
};

const main = async () => {
  process.on('SIGTERM', () => stop('SIGTERM'));
  process.on('SIGINT', () => stop('SIGINT'));

  do {
    try {
      await synchronize();
    } catch (error) {
      log('error', 'synchronization failed', { reason: error instanceof Error ? error.message : 'unknown' });
      if (runOnce) process.exit(1);
    }
    if (runOnce) break;
    log('info', 'sleeping before next synchronization', { intervalSeconds });
    await sleep(intervalSeconds * 1000);
  } while (!stopping);
};

main().catch((error) => {
  log('error', 'worker failed', { reason: error instanceof Error ? error.message : 'unknown' });
  process.exit(1);
});
