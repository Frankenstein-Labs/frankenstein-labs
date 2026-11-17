#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
mkdir -p catalog/modules/registry
for namespace in vendor/registry/registry/*; do
  [[ -d "$namespace/modules" ]] || continue
  ns=$(basename "$namespace")
  mkdir -p "catalog/modules/registry/$ns"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete --exclude='.git' "$namespace/modules/" "catalog/modules/registry/$ns/"
  else
    find "catalog/modules/registry/$ns" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
    cp -a "$namespace/modules/." "catalog/modules/registry/$ns/"
  fi
done
printf 'Imported %s module files.\n' "$(find catalog/modules -type f | wc -l)"
