#!/usr/bin/env bash
set -Eeuo pipefail
: "${CODER_PG_CONNECTION_URL:?CODER_PG_CONNECTION_URL is required}"
printf '%s\n' 'Coder owns its PostgreSQL migrations; start coderd with the official image and let the official entrypoint apply them.'
