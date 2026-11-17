#!/usr/bin/env bash
set -Eeuo pipefail
: "${CODER_PG_CONNECTION_URL:?CODER_PG_CONNECTION_URL is required}"
BACKUP_DIR="${BACKUP_DIR:-backups}"
mkdir -p "$BACKUP_DIR"
output="$BACKUP_DIR/coder-$(date -u +%Y%m%dT%H%M%SZ).dump"
pg_dump --format=custom --file "$output" "$CODER_PG_CONNECTION_URL"
printf 'Created PostgreSQL backup: %s\n' "$output"
