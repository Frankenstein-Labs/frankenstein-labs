#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

node --check services/api/server.mjs
node --check services/worker/worker.mjs
node --check scripts/generate-catalog-index.mjs
node scripts/generate-catalog-index.mjs
bash scripts/validate-catalog.sh
