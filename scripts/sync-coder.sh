#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
git -C vendor/coder fetch --all --tags --prune
BEFORE=$(git -C vendor/coder rev-parse HEAD)
git -C vendor/coder checkout --detach origin/main
git -C vendor/coder submodule update --init --recursive
AFTER=$(git -C vendor/coder rev-parse HEAD)
printf 'Coder source: %s -> %s\n' "$BEFORE" "$AFTER"
if [[ "$BEFORE" != "$AFTER" ]]; then
  git add vendor/coder
  printf 'Updated vendor/coder gitlink; review before committing.\n'
fi
