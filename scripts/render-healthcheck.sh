#!/usr/bin/env bash
set -Eeuo pipefail
curl --fail --silent --show-error "http://127.0.0.1:${PORT:-3000}/healthz" >/dev/null
