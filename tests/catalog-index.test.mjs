import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const index = JSON.parse(readFileSync(join(root, 'catalog', 'index.json'), 'utf8'));

const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const path = join(dir, entry.name);
    if (existsSync(join(path, 'main.tf'))) out.push(path); else walk(path, out);
  }
  return out;
};

describe('catalog index', () => {
  it('is deterministic and free of wall-clock timestamps', () => {
    assert.equal(index.generatedAt, undefined);
    assert.equal(index.schemaVersion, 2);
  });

  it('pins both upstream sources to full commits', () => {
    for (const key of ['coder', 'registry']) {
      assert.match(index.sources[key].repository, /^https:\/\/github\.com\//);
      assert.match(index.sources[key].commit, /^[0-9a-f]{40}$/);
    }
  });

  it('indexes templates and modules', () => {
    assert.ok(index.templates.length > 0);
    assert.ok(index.modules.length > 0);
  });

  it('gives every unit a non-empty name, provenance, license and main.tf', () => {
    for (const unit of [...index.templates, ...index.modules]) {
      assert.ok(unit.name, `empty name at ${unit.path}`);
      assert.match(unit.source, /^https:\/\/github\.com\//, `bad source at ${unit.path}`);
      assert.ok(unit.license, `missing license at ${unit.path}`);
      assert.ok(existsSync(join(root, unit.path, 'main.tf')), `missing main.tf at ${unit.path}`);
    }
  });

  it('has no duplicate paths', () => {
    const paths = [...index.templates, ...index.modules].map((unit) => unit.path);
    assert.equal(new Set(paths).size, paths.length);
  });

  it('accounts for every materialized unit', () => {
    const indexed = new Set([...index.templates, ...index.modules].map((unit) => unit.path));
    for (const tree of ['catalog/templates', 'catalog/modules']) {
      for (const path of walk(join(root, tree))) {
        assert.ok(indexed.has(path.replace(`${root}/`, '')), `materialized unit missing from index: ${path}`);
      }
    }
  });
});
