#!/usr/bin/env bash
set -euo pipefail

# Post-deploy smoke test against a deployed environment (ADR-0009).
# Fails (non-zero exit) if the health endpoint or the app shell is unreachable.
# Usage: scripts/smoke.sh <base-url>
BASE="${1:?usage: smoke.sh <base-url>}"
BASE="${BASE%/}"

echo "smoke: ${BASE}"

# The API health endpoint must return 200 with status ok.
health="$(curl -fsS --max-time 15 "${BASE}/api/health")"
echo "  health -> ${health}"
echo "${health}" | grep -q '"status":"ok"'

# The root path must serve the SPA shell (200).
curl -fsS --max-time 15 -o /dev/null "${BASE}/"

echo "smoke passed"
