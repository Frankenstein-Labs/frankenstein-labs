import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
const root = process.cwd();
const commit = (dir) => execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const text = (path) => existsSync(path) ? readFileSync(path, 'utf8') : '';
const license = (value) => /agpl[- ]3/i.test(value) ? 'AGPL-3.0' : /apache[- ]2/i.test(value) ? 'Apache-2.0' : /mit license|\bMIT\b/i.test(value) ? 'MIT' : null;
const description = (value) => value.split(/\n/).map((line) => line.trim()).find((line) => line && !line.startsWith('#') && !line.startsWith('['))?.slice(0, 240) ?? null;
const collect = (rootPath, kind, sourceBase, sourceCommit) => {
  const output = [];
  const walk = (dir, namespace = 'coder') => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      const path = join(dir, entry.name);
      const files = readdirSync(path, { withFileTypes: true });
      const hasPayload = files.some((file) => file.isFile() && /\.(tf|tfvars|md|sh|yaml|yml|json|Dockerfile|ps1)$/i.test(file.name));
      if (hasPayload) {
        const readme = text(join(path, 'README.md'));
        output.push({ kind, namespace, name: entry.name, path: relative(root, path), source: `${sourceBase}/${namespace}/${kind === 'template' ? 'templates' : 'modules'}/${entry.name}`, commit: sourceCommit, license: license(readme), description: description(readme), files: files.filter((file) => file.isFile()).map((file) => file.name) });
      } else walk(path, entry.name);
    }
  };
  walk(rootPath);
  return output;
};
const coderCommit = commit(join(root, 'vendor/coder'));
const registryCommit = commit(join(root, 'vendor/registry'));
const templates = [
  ...collect(join(root, 'catalog/templates/coder'), 'template', 'https://github.com/coder/coder/tree/main/examples/templates', coderCommit),
  ...collect(join(root, 'catalog/templates/registry'), 'template', 'https://github.com/coder/registry/tree/main/registry', registryCommit)
];
const modules = collect(join(root, 'catalog/modules/registry'), 'module', 'https://github.com/coder/registry/tree/main/registry', registryCommit);
mkdirSync(join(root, 'catalog'), { recursive: true });
writeFileSync(join(root, 'catalog/index.json'), JSON.stringify({ generatedAt: new Date().toISOString(), sources: { coder: { repository: 'https://github.com/coder/coder', commit: coderCommit }, registry: { repository: 'https://github.com/coder/registry', commit: registryCommit } }, templates, modules }, null, 2) + '\n');
console.log(`Indexed ${templates.length} templates and ${modules.length} modules.`);
