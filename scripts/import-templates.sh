#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
mkdir -p catalog/templates/coder catalog/templates/registry
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete --exclude='.git' vendor/coder/examples/templates/ catalog/templates/coder/
else
  find catalog/templates/coder -mindepth 1 -maxdepth 1 -exec rm -rf {} +
  cp -a vendor/coder/examples/templates/. catalog/templates/coder/
fi
for namespace in vendor/registry/registry/*; do
  [[ -d "$namespace/templates" ]] || continue
  ns=$(basename "$namespace")
  mkdir -p "catalog/templates/registry/$ns"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete --exclude='.git' "$namespace/templates/" "catalog/templates/registry/$ns/"
  else
    find "catalog/templates/registry/$ns" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
    cp -a "$namespace/templates/." "catalog/templates/registry/$ns/"
  fi
done
printf 'Imported %s template files.\n' "$(find catalog/templates -type f | wc -l)"
