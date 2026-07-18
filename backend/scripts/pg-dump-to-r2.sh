#!/usr/bin/env bash
# Phase 4 D-disaster-recovery: nightly pg_dump → Cloudflare R2.
# Satisfies NFR-disaster-recovery 30-day retention via R2 lifecycle rule.
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${R2_DUMP_BUCKET:?R2_DUMP_BUCKET is required (e.g. sorcyn-backups)}"
: "${R2_ENDPOINT:?R2_ENDPOINT is required (e.g. https://<account>.r2.cloudflarestorage.com)}"
: "${R2_ACCESS_KEY_ID:?R2_ACCESS_KEY_ID is required}"
: "${R2_SECRET_ACCESS_KEY:?R2_SECRET_ACCESS_KEY is required}"

TIMESTAMP="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
DUMP_FILE="/tmp/sorcyn-${TIMESTAMP}.dump"
KEY="db/sorcyn-${TIMESTAMP}.dump"

echo "[$(date -Iseconds)] pg_dump → ${DUMP_FILE}"
pg_dump --format=custom --no-owner --no-privileges --file="${DUMP_FILE}" "${DATABASE_URL}"

echo "[$(date -Iseconds)] Uploading to s3://${R2_DUMP_BUCKET}/${KEY}"
AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}" \
AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}" \
  aws s3 cp "${DUMP_FILE}" "s3://${R2_DUMP_BUCKET}/${KEY}" \
  --endpoint-url "${R2_ENDPOINT}"

echo "[$(date -Iseconds)] Cleanup local dump"
rm -f "${DUMP_FILE}"

echo "[$(date -Iseconds)] pg-dump-to-r2 complete: ${KEY}"
