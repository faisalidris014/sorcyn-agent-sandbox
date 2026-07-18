#!/usr/bin/env bash
# Phase 4 SC#1 — export Sentry Performance DB span p95 for the load-test window.
#
# Per RESEARCH §5: "DB threshold not directly measurable from k6 — use Sentry
# Performance DB span p95 captured during the same load test window."
#
# B-1 hardening: 04-08 SC1 final hard-asserts the output of this script:
#   - File exists: docs/sentry-db-p95.json
#   - dbP95Ms < 100
#   - sampleCount > 0
#
# Usage:
#   export SENTRY_AUTH_TOKEN=sntryu_...
#   export SENTRY_ORG_SLUG=nifty-byte
#   export SENTRY_PROJECT_SLUG=sorcyn-api
#   ./backend/scripts/export-sentry-db-p95.sh 2026-05-12T00:00:00Z 2026-05-12T01:00:00Z
#
# Optional:
#   OUTPUT=custom/path.json ./backend/scripts/export-sentry-db-p95.sh <start> <end>
set -euo pipefail

WINDOW_START="${1:?Usage: export-sentry-db-p95.sh <window-start-iso> <window-end-iso>}"
WINDOW_END="${2:?Usage: export-sentry-db-p95.sh <window-start-iso> <window-end-iso>}"

: "${SENTRY_AUTH_TOKEN:?Set SENTRY_AUTH_TOKEN (project:read + event:read scope)}"
: "${SENTRY_ORG_SLUG:?Set SENTRY_ORG_SLUG (e.g. nifty-byte)}"
: "${SENTRY_PROJECT_SLUG:?Set SENTRY_PROJECT_SLUG (e.g. sorcyn-api)}"

OUTPUT="${OUTPUT:-docs/sentry-db-p95.json}"

echo "[$(date -Iseconds)] Querying Sentry DB span p95 for window: ${WINDOW_START} → ${WINDOW_END}"

# Sentry Discover/Events API: query db spans during the window, aggregate p95(span.duration).
# transaction.op:db spans cover Prisma ORM database queries on the sorcyn-api project.
RESPONSE=$(curl -fsSL \
  -H "Authorization: Bearer ${SENTRY_AUTH_TOKEN}" \
  "https://sentry.io/api/0/organizations/${SENTRY_ORG_SLUG}/events/?project=${SENTRY_PROJECT_SLUG}&query=transaction.op%3Adb&field=p95%28span.duration%29&field=count%28%29&start=${WINDOW_START}&end=${WINDOW_END}&statsPeriod=&dataset=spans" \
  2>&1) || {
  echo "ERROR: Sentry API request failed" >&2
  echo "Response: $RESPONSE" >&2
  exit 1
}

# Sentry returns span.duration in milliseconds for aggregation fields.
DB_P95_MS=$(echo "$RESPONSE" | jq -r '.data[0]["p95(span.duration)"] // empty' 2>/dev/null || true)
SAMPLE_COUNT=$(echo "$RESPONSE" | jq -r '.data[0]["count()"] // 0' 2>/dev/null || echo "0")

if [[ -z "$DB_P95_MS" ]]; then
  echo "ERROR: Sentry returned no DB span data for window ${WINDOW_START} → ${WINDOW_END}" >&2
  echo "Full response:" >&2
  echo "$RESPONSE" | jq '.' >&2 2>/dev/null || echo "$RESPONSE" >&2
  echo "" >&2
  echo "Possible causes:" >&2
  echo "  1. No DB spans recorded during the load-test window (check Sentry Performance view)" >&2
  echo "  2. SENTRY_PROJECT_SLUG does not match the project where sorcyn-api sends traces" >&2
  echo "  3. The 'spans' dataset requires Sentry Performance enabled (D-05 / Phase 4 observability)" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUTPUT")"
jq -n \
  --arg start  "$WINDOW_START" \
  --arg end    "$WINDOW_END" \
  --argjson db "$DB_P95_MS" \
  --argjson n  "$SAMPLE_COUNT" \
  '{ windowStart: $start, windowEnd: $end, dbP95Ms: $db, sampleCount: $n }' \
  > "$OUTPUT"

echo "[$(date -Iseconds)] Wrote $OUTPUT"
echo "  windowStart  = $WINDOW_START"
echo "  windowEnd    = $WINDOW_END"
echo "  dbP95Ms      = $DB_P95_MS"
echo "  sampleCount  = $SAMPLE_COUNT"

# Warn (do not fail) if threshold already breached — 04-08 SC1 final fails closed.
if (( $(echo "$DB_P95_MS >= 100" | bc -l 2>/dev/null || echo "0") )); then
  echo "WARNING: dbP95Ms=$DB_P95_MS exceeds NFR-performance DB threshold of 100ms p95" >&2
  echo "         04-08 SC1 final will FAIL — investigate slow Prisma queries before sign-off" >&2
fi
