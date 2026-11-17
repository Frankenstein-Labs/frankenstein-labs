#!/usr/bin/env bash
set -Eeuo pipefail
exec node services/api/server.mjs
