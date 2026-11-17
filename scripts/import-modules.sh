#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
mkdir -p catalog/modules/registry

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

[[ -d vendor/registry/registry ]] || { echo 'Missing vendor/registry/registry; run: git submodule update --init' >&2; exit 1; }

for namespace in vendor/registry/registry/*; do
  [[ -d "$namespace/modules" ]] || continue
  sync_tree "$namespace/modules" "catalog/modules/registry/$(basename "$namespace")"
done
printf 'Imported %s module files.\n' "$(find catalog/modules -type f | wc -l)"
