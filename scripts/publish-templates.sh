#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
: "${CODER_URL:=${CODER_ACCESS_URL:-}}"
: "${CODER_ORGANIZATION:=}"
CODER_BIN="${CODER_BIN:-coder}"
TEMPLATES_ROOT="${TEMPLATES_ROOT:-$ROOT/catalog/templates}"
PUBLISH="${PUBLISH:-0}"
[[ -n "$CODER_URL" ]] || { echo 'CODER_URL or CODER_ACCESS_URL is required' >&2; exit 1; }
[[ -n "$CODER_ORGANIZATION" ]] || { echo 'CODER_ORGANIZATION is required' >&2; exit 1; }
mapfile -t templates < <(
  {
    find "$TEMPLATES_ROOT/coder" -mindepth 2 -maxdepth 2 -type f -name main.tf -printf '%h\n' 2>/dev/null || true
    find "$TEMPLATES_ROOT/registry" -mindepth 3 -maxdepth 3 -type f -name main.tf -printf '%h\n' 2>/dev/null || true
  } | sort -u
)
printf 'Discovered %s template directories.\n' "${#templates[@]}"
for directory in "${templates[@]}"; do
  name="$(basename "$directory")"
  if [[ "$PUBLISH" != 1 ]]; then
    printf '[DRY-RUN] coder templates push --org %q --directory %q --yes %q\n' "$CODER_ORGANIZATION" "$directory" "$name"
    continue
  fi
  "$CODER_BIN" templates push --url "$CODER_URL" --org "$CODER_ORGANIZATION" --directory "$directory" --yes "$name"
done
