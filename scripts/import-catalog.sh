#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
"$ROOT/scripts/import-templates.sh"
"$ROOT/scripts/import-modules.sh"
node "$ROOT/scripts/generate-catalog-index.mjs"
