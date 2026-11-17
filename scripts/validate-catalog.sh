#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
[[ -f vendor/coder/LICENSE ]] || { echo 'Missing Coder license' >&2; exit 1; }
[[ -f vendor/registry/LICENSE ]] || { echo 'Missing Registry license' >&2; exit 1; }
[[ -d catalog/templates/coder ]] || { echo 'Missing materialized Coder templates' >&2; exit 1; }
[[ -d catalog/modules/registry ]] || { echo 'Missing materialized Registry modules' >&2; exit 1; }
[[ -f catalog/index.json ]] || { echo 'Missing catalog/index.json; run import-catalog' >&2; exit 1; }

# Validates the index structurally and against the materialized trees: every
# indexed unit must have a main.tf, and no unit with a main.tf may be missing
# from the index. This catches the class of bug where the index silently drifts
# from the catalog (empty names, missing provenance, dropped or duplicated units).
node --input-type=module -e '
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const index = JSON.parse(readFileSync("catalog/index.json", "utf8"));
const errors = [];

if (index.schemaVersion !== 2) errors.push(`unexpected schemaVersion: ${index.schemaVersion}`);
for (const key of ["coder", "registry"]) {
  const source = index.sources?.[key];
  if (!source?.repository || !/^[0-9a-f]{40}$/.test(source?.commit ?? "")) {
    errors.push(`sources.${key} must have a repository and a 40-char commit`);
  }
}
if (!index.templates?.length) errors.push("no templates indexed");
if (!index.modules?.length) errors.push("no modules indexed");

const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const path = join(dir, entry.name);
    if (existsSync(join(path, "main.tf"))) out.push(path); else walk(path, out);
  }
  return out;
};

const check = (units, root) => {
  const indexed = new Set();
  for (const unit of units) {
    if (!unit.name) errors.push(`unit with empty name at ${unit.path}`);
    if (!unit.source || !unit.source.startsWith("https://github.com/")) errors.push(`unit ${unit.path} has no upstream source`);
    if (!unit.license) errors.push(`unit ${unit.path} has no license`);
    if (!existsSync(join(unit.path, "main.tf"))) errors.push(`indexed unit has no main.tf: ${unit.path}`);
    if (indexed.has(unit.path)) errors.push(`duplicate indexed path: ${unit.path}`);
    indexed.add(unit.path);
  }
  for (const path of walk(root)) if (!indexed.has(path)) errors.push(`materialized unit missing from index: ${path}`);
};

check(index.templates, "catalog/templates");
check(index.modules, "catalog/modules");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(JSON.stringify({
  templates: index.templates.length,
  modules: index.modules.length,
  coder: index.sources.coder.commit,
  registry: index.sources.registry.commit,
}, null, 2));
'

if git diff --quiet -- catalog; then echo 'Catalog is clean.'; else echo 'Catalog differs from the last materialization; review changes.'; fi
