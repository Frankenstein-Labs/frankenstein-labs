#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
mkdir -p catalog/templates/coder catalog/templates/registry

# Copy a directory tree, replacing the destination so removed upstream files do
# not linger. rsync is used when available; the cp fallback removes the whole
# destination first (rm -rf) so nested directories are fully replaced too.
sync_tree() {
  local src="$1" dest="$2"
  mkdir -p "$dest"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete --exclude='.git' "$src/" "$dest/"
  else
    rm -rf "$dest"
    mkdir -p "$dest"
    cp -a "$src/." "$dest/"
  fi
}

[[ -d vendor/coder/examples/templates ]] || { echo 'Missing vendor/coder/examples/templates; run: git submodule update --init' >&2; exit 1; }
[[ -d vendor/registry/registry ]] || { echo 'Missing vendor/registry/registry; run: git submodule update --init' >&2; exit 1; }

sync_tree vendor/coder/examples/templates catalog/templates/coder

for namespace in vendor/registry/registry/*; do
  [[ -d "$namespace/templates" ]] || continue
  sync_tree "$namespace/templates" "catalog/templates/registry/$(basename "$namespace")"
done
printf 'Imported %s template files.\n' "$(find catalog/templates -type f | wc -l)"
