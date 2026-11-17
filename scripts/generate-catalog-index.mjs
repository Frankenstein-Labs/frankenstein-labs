import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const SCHEMA_VERSION = 2;

const commit = (dir) => execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const text = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : '');

const licenseFromText = (value) => {
  if (/gnu affero general public license/i.test(value)) return 'AGPL-3.0';
  if (/apache license/i.test(value)) return 'Apache-2.0';
  if (/mit license/i.test(value)) return 'MIT';
  return null;
};

// Repository-level license: modules and templates inherit it unless they ship
// their own LICENSE file. Attribution is never stripped (see LICENSES.md).
const repoLicense = (dir) => licenseFromText(text(join(dir, 'LICENSE')));
const dirLicense = (dir) => {
  const own = readdirSync(dir).find((name) => /^LICENSE/i.test(name));
  return own ? licenseFromText(text(join(dir, own))) : null;
};

// Coder README files use YAML front matter with a `description:` key. Fall back
// to the first meaningful prose line, ignoring front matter and headings.
const parseFrontMatter = (value) => {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(value);
  if (!match) return {};
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z_]+):\s*(.*)$/.exec(line);
    if (kv) fields[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }
  return fields;
};

const descriptionFrom = (readme) => {
  const frontMatter = parseFrontMatter(readme);
  if (frontMatter.description) return frontMatter.description.slice(0, 240);
  const body = readme.replace(/^---[\s\S]*?---\r?\n/, '');
  const line = body
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .find((entry) => entry && !entry.startsWith('#') && !entry.startsWith('<!--') && !/^[-*=]{3,}$/.test(entry));
  return line ? line.slice(0, 240) : null;
};

const isUnitDir = (dir) => existsSync(join(dir, 'main.tf'));

const describeUnit = (dir, { kind, namespace, name, source, commit: sourceCommit, license }) => {
  const readme = text(join(dir, 'README.md'));
  return {
    kind,
    namespace,
    name,
    path: relative(root, dir),
    source,
    commit: sourceCommit,
    license: dirLicense(dir) ?? license,
    description: descriptionFrom(readme),
    files: readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .sort(),
  };
};

// Walks a materialized catalog tree and records every directory that contains a
// main.tf. Container directories (such as the experimental `x/` folder in
// coder/coder) are traversed; their child path becomes part of the unit name.
const collect = (rootPath, { kind, initialSegments = [], sourceFor, sourceCommit, license }) => {
  const output = [];
  const walk = (dir, segments) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      const path = join(dir, entry.name);
      const nextSegments = [...segments, entry.name];
      if (isUnitDir(path)) {
        const [namespace, ...rest] = nextSegments;
        const name = rest.join('/');
        output.push(describeUnit(path, {
          kind,
          namespace,
          name,
          source: sourceFor(namespace, name),
          commit: sourceCommit,
          license,
        }));
      } else {
        walk(path, nextSegments);
      }
    }
  };
  walk(rootPath, initialSegments);
  return output;
};

const coderCommit = commit(join(root, 'vendor/coder'));
const registryCommit = commit(join(root, 'vendor/registry'));

const templates = [
  ...collect(join(root, 'catalog/templates/coder'), {
    kind: 'template',
    initialSegments: ['coder'],
    sourceFor: (namespace, name) =>
      `https://github.com/coder/coder/tree/main/examples/templates/${name}`,
    sourceCommit: coderCommit,
    license: repoLicense(join(root, 'vendor/coder')),
  }),
  ...collect(join(root, 'catalog/templates/registry'), {
    kind: 'template',
    sourceFor: (namespace, name) =>
      `https://github.com/coder/registry/tree/main/registry/${namespace}/templates/${name}`,
    sourceCommit: registryCommit,
    license: repoLicense(join(root, 'vendor/registry')),
  }),
];

const modules = collect(join(root, 'catalog/modules/registry'), {
  kind: 'module',
  sourceFor: (namespace, name) =>
    `https://github.com/coder/registry/tree/main/registry/${namespace}/modules/${name}`,
  sourceCommit: registryCommit,
  license: repoLicense(join(root, 'vendor/registry')),
});

const sortUnits = (units) => units.sort((a, b) => a.path.localeCompare(b.path));

// The index is intentionally deterministic: it contains only data derived from
// the pinned source commits, so regenerating it never produces spurious diffs
// in CI. There is no wall-clock timestamp.
const index = {
  schemaVersion: SCHEMA_VERSION,
  sources: {
    coder: { repository: 'https://github.com/coder/coder', commit: coderCommit },
    registry: { repository: 'https://github.com/coder/registry', commit: registryCommit },
  },
  templates: sortUnits(templates),
  modules: sortUnits(modules),
};

mkdirSync(join(root, 'catalog'), { recursive: true });
writeFileSync(join(root, 'catalog/index.json'), `${JSON.stringify(index, null, 2)}\n`);
console.log(`Indexed ${index.templates.length} templates and ${index.modules.length} modules.`);
