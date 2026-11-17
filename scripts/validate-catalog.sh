#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
[[ -f vendor/coder/LICENSE ]] || { echo 'Missing Coder license' >&2; exit 1; }
[[ -f vendor/registry/LICENSE ]] || { echo 'Missing Registry license' >&2; exit 1; }
[[ -d catalog/templates/coder ]] || { echo 'Missing materialized Coder templates' >&2; exit 1; }
[[ -d catalog/modules/registry ]] || { echo 'Missing materialized Registry modules' >&2; exit 1; }
[[ -f catalog/index.json ]] || { echo 'Missing catalog/index.json; run import-catalog' >&2; exit 1; }
node -e "const m=require('./catalog/index.json'); if (!m.templates?.length || !m.modules?.length) process.exit(1); console.log(JSON.stringify({templates:m.templates.length,modules:m.modules.length,coder:m.sources.coder.commit,registry:m.sources.registry.commit},null,2))"
if git diff --exit-code -- catalog >/dev/null; then echo 'Catalog is clean.'; else echo 'Catalog differs from the last materialization; review changes.'; fi
