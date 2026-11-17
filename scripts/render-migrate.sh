#!/usr/bin/env bash
set -Eeuo pipefail
: "${CODER_PG_CONNECTION_URL:?CODER_PG_CONNECTION_URL is required}"

# Coder owns its PostgreSQL schema and migrations. This script intentionally
# does not touch the database: the official Coder entrypoint applies migrations
# on startup. It exists so a Render pre-deploy step can assert that the DSN is
# configured before the server is (re)started.
echo 'Coder owns its migrations; the official entrypoint applies them at startup.'
