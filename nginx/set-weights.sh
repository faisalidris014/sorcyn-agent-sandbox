#!/usr/bin/env bash
set -euo pipefail
# set-weights.sh <stage>
# Mutates /opt/sorcyn-lb/canary-state.json per stage and re-renders Nginx.
# Stages: canary-10, canary-50, canary-100, rollback, promote

STATE_FILE="${STATE_FILE:-/opt/sorcyn-lb/canary-state.json}"
RENDER_SCRIPT="${RENDER_SCRIPT:-/opt/sorcyn-lb/render-canary.sh}"
STAGE="${1:?Usage: set-weights.sh <canary-10|canary-50|canary-100|rollback|promote>}"

case "$STAGE" in
  canary-10)  STABLE=90;  CANARY=10  ;;
  canary-50)  STABLE=50;  CANARY=50  ;;
  canary-100) STABLE=0;   CANARY=100 ;;
  rollback)   STABLE=100; CANARY=0   ;;
  promote)
    # role-swap: canary becomes the new stable; old stable retired and rebuilt
    jq '.stable_host as $s | .canary_host as $c
        | .stable_host = $c | .canary_host = $s
        | .stable_weight = 100 | .canary_weight = 0
        | .stage = "stable" | .last_promotion = now | todate' \
      "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"
    "$RENDER_SCRIPT"
    exit 0
    ;;
  *) echo "Unknown stage: $STAGE" >&2; exit 2 ;;
esac

jq --argjson s "$STABLE" --argjson c "$CANARY" --arg stage "$STAGE" \
   '.stable_weight = $s | .canary_weight = $c | .stage = $stage' \
   "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"

"$RENDER_SCRIPT"
