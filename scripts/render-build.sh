#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
node scripts/generate-catalog-index.mjs
node --check services/api/server.mjs
node --check services/worker/worker.mjs
