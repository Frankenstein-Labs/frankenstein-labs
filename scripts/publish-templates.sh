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
command -v "$CODER_BIN" >/dev/null 2>&1 || { echo "Coder CLI not found: $CODER_BIN (set CODER_BIN)" >&2; exit 1; }

# Discover template directories by locating main.tf and deriving the directory
# that owns it. This handles both single-level names
# (catalog/templates/coder/aws-linux) and multi-level names such as the
# experimental catalog/templates/coder/x/docker-chat-sandbox, which the previous
# fixed-depth glob skipped entirely.
mapfile -t templates < <(find "$TEMPLATES_ROOT" -type f -name main.tf -printf '%h\n' | sort -u)

printf 'Discovered %s template directories.\n' "${#templates[@]}"
[[ "${#templates[@]}" -gt 0 ]] || { echo 'No templates found; run scripts/import-catalog.sh first' >&2; exit 1; }

for directory in "${templates[@]}"; do
  name="$(basename "$directory")"
  if [[ "$PUBLISH" != 1 ]]; then
    printf '[DRY-RUN] coder templates push --org %q --directory %q --yes %q\n' "$CODER_ORGANIZATION" "$directory" "$name"
    continue
  fi
  "$CODER_BIN" templates push --url "$CODER_URL" --org "$CODER_ORGANIZATION" --directory "$directory" --yes "$name"
done
