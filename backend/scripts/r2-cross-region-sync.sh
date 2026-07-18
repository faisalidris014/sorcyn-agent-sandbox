#!/usr/bin/env bash
# Phase 4 D-disaster-recovery: nightly cross-region sync of R2 buckets.
# Per RESEARCH §11 option (a): 24h RPO acceptable for image evidence.
set -euo pipefail

: "${R2_DUMP_BUCKET:?}"
: "${R2_DUMP_BUCKET_DR:?}"
: "${R2_IMAGES_BUCKET:?}"
: "${R2_IMAGES_BUCKET_DR:?}"
: "${R2_ENDPOINT:?}"
: "${R2_ACCESS_KEY_ID:?}"
: "${R2_SECRET_ACCESS_KEY:?}"

export AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}"

echo "[$(date -Iseconds)] Sync DB dumps: ${R2_DUMP_BUCKET} → ${R2_DUMP_BUCKET_DR}"
aws s3 sync "s3://${R2_DUMP_BUCKET}" "s3://${R2_DUMP_BUCKET_DR}" \
  --endpoint-url "${R2_ENDPOINT}" --delete=false

echo "[$(date -Iseconds)] Sync images: ${R2_IMAGES_BUCKET} → ${R2_IMAGES_BUCKET_DR}"
aws s3 sync "s3://${R2_IMAGES_BUCKET}" "s3://${R2_IMAGES_BUCKET_DR}" \
  --endpoint-url "${R2_ENDPOINT}" --delete=false

echo "[$(date -Iseconds)] Cross-region sync complete"
