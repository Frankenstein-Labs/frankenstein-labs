#!/usr/bin/env bash
set -Eeuo pipefail
: "${CODER_ACCESS_URL:?CODER_ACCESS_URL is required}"
: "${CODER_PG_CONNECTION_URL:?CODER_PG_CONNECTION_URL is required}"
: "${CODER_SESSION_TOKEN:?CODER_SESSION_TOKEN is required}"
: "${FRANKENSTEIN_API_SECRET:?FRANKENSTEIN_API_SECRET is required}"

# Coder requires an absolute URL; accept a bare host and default to https.
CODER_URL="${CODER_ACCESS_URL}"
[[ "$CODER_URL" =~ ^https?:// ]] || CODER_URL="https://${CODER_URL}"
CODER_URL="${CODER_URL%/}"

curl --fail --silent --show-error --max-time "${HEALTHCHECK_TIMEOUT:-10}" "${CODER_URL}/healthz" >/dev/null \
  || { echo 'Coder health check failed; no provisioning test was attempted.' >&2; exit 1; }
echo 'Render deployment prerequisites and Coder health check passed.'
