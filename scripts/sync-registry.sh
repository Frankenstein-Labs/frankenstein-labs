#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

[[ -d vendor/registry/.git || -f vendor/registry/.git ]] || { echo 'vendor/registry is not an initialized submodule' >&2; exit 1; }

# Moves the vendor pin to the latest upstream main, changing the recorded
# submodule commit; review and commit the gitlink afterwards.
git -C vendor/registry fetch --all --tags --prune
BEFORE=$(git -C vendor/registry rev-parse HEAD)
git -C vendor/registry checkout --detach origin/main
git -C vendor/registry submodule update --init --recursive
AFTER=$(git -C vendor/registry rev-parse HEAD)
printf 'Registry source: %s -> %s\n' "$BEFORE" "$AFTER"
if [[ "$BEFORE" != "$AFTER" ]]; then
  # Only stage the gitlink when running inside a work tree (the worker container
  # clones the sources into a non-repository directory).
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git add vendor/registry
    printf 'Updated vendor/registry gitlink; review before committing.\n'
  else
    printf 'Updated vendor/registry checkout; no parent repository to stage the gitlink.\n'
  fi
fi
