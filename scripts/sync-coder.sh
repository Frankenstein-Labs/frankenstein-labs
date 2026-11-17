#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

[[ -d vendor/coder/.git || -f vendor/coder/.git ]] || { echo 'vendor/coder is not an initialized submodule' >&2; exit 1; }

# Moves the vendor pin to the latest upstream main, changing the recorded
# submodule commit; review and commit the gitlink afterwards.
git -C vendor/coder fetch --all --tags --prune
BEFORE=$(git -C vendor/coder rev-parse HEAD)
git -C vendor/coder checkout --detach origin/main
git -C vendor/coder submodule update --init --recursive
AFTER=$(git -C vendor/coder rev-parse HEAD)
printf 'Coder source: %s -> %s\n' "$BEFORE" "$AFTER"
if [[ "$BEFORE" != "$AFTER" ]]; then
  # Only stage the gitlink when running inside a work tree (the worker container
  # clones the sources into a non-repository directory).
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git add vendor/coder
    printf 'Updated vendor/coder gitlink; review before committing.\n'
  else
    printf 'Updated vendor/coder checkout; no parent repository to stage the gitlink.\n'
  fi
fi
