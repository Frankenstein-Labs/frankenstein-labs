#!/usr/bin/env bash
set -Eeuo pipefail
PATH_TO_CHECK="${HEALTHCHECK_PATH:-/healthz}"
curl --fail --silent --show-error --max-time "${HEALTHCHECK_TIMEOUT:-10}" "http://127.0.0.1:${PORT:-3000}${PATH_TO_CHECK}" >/dev/null
