#!/usr/bin/env bash
set -euo pipefail
STATE_FILE="${STATE_FILE:-/opt/sorcyn-lb/canary-state.json}"
OUTPUT_FILE="${OUTPUT_FILE:-/etc/nginx/conf.d/canary-upstream.conf}"

echo "[$(date -Iseconds)] Rendering canary upstream from $STATE_FILE..."
jq -r '
  "upstream api_pool { ip_hash; server \(.stable_host):3000 weight=\(.stable_weight); server \(.canary_host):3000 weight=\(.canary_weight); keepalive 32; }"
' "$STATE_FILE" > "$OUTPUT_FILE"

echo "[$(date -Iseconds)] Validating nginx config..."
nginx -t

echo "[$(date -Iseconds)] Reloading nginx..."
nginx -s reload
