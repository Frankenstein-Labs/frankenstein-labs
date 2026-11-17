import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
const root = new URL('../..', import.meta.url).pathname;
const run = (script) => new Promise((resolve, reject) => { const child = spawn('bash', [join(root, 'scripts', script)], { cwd: root, stdio: 'inherit' }); child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${script} exited ${code}`))); });
const command = (args) => new Promise((resolve, reject) => { const child = spawn('git', args, { cwd: root, stdio: 'inherit' }); child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`git ${args.join(' ')} exited ${code}`))); });
const ensureSources = async () => { if (!existsSync(join(root, 'vendor/coder/.git'))) await command(['clone', 'https://github.com/coder/coder.git', 'vendor/coder']); if (!existsSync(join(root, 'vendor/registry/.git'))) await command(['clone', 'https://github.com/coder/registry.git', 'vendor/registry']); };
const main = async () => { await ensureSources(); await run('sync-coder.sh'); await run('sync-registry.sh'); await run('import-catalog.sh'); console.log('Catalog synchronization completed; no workspace provisioning was requested.'); };
main().catch((error) => { console.error(error); process.exit(1); });
