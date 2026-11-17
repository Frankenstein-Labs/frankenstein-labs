#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
git -C vendor/registry fetch --all --tags --prune
BEFORE=$(git -C vendor/registry rev-parse HEAD)
git -C vendor/registry checkout --detach origin/main
git -C vendor/registry submodule update --init --recursive
AFTER=$(git -C vendor/registry rev-parse HEAD)
printf 'Registry source: %s -> %s\n' "$BEFORE" "$AFTER"
if [[ "$BEFORE" != "$AFTER" ]]; then
  git add vendor/registry
  printf 'Updated vendor/registry gitlink; review before committing.\n'
fi
