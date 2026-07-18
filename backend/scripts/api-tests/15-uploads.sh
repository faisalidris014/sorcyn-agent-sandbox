#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# 15 — Uploads Tests (5 tests)
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail
source "$(dirname "$0")/_helpers.sh"

section "Uploads — Presigned URL"

# 1. Generate presigned URL for image upload
api_post "/uploads" '{"filename":"photo.jpg","contentType":"image/jpeg","category":"post-photos"}' "$BUYER_TOKEN"
check "POST /uploads — presigned URL for image" 201 "$CODE" "$BODY"
check_json_exists "  → uploadUrl exists" "$BODY" '.data.uploadUrl'
check_json_exists "  → key exists" "$BODY" '.data.key'

# 2. Generate presigned URL for verification doc
api_post "/uploads" '{"filename":"license.pdf","contentType":"application/pdf","category":"verification-docs"}' "$BUYER_TOKEN"
check "POST /uploads — presigned URL for PDF doc" 201 "$CODE" "$BODY"

# 3. Reject invalid content type for image category
api_post "/uploads" '{"filename":"doc.pdf","contentType":"application/pdf","category":"post-photos"}' "$BUYER_TOKEN"
check "POST /uploads — reject PDF for image category" 400 "$CODE" "$BODY"

# 4. Reject without auth
api_post "/uploads" '{"filename":"photo.jpg","contentType":"image/jpeg","category":"post-photos"}'
check "POST /uploads — requires auth" 401 "$CODE" "$BODY"

section "Uploads — Delete"

# 5. Reject delete without auth
api_delete "/uploads?key=post-photos/fake-user/fake.jpg"
check "DELETE /uploads — requires auth" 401 "$CODE" "$BODY"

summary "Uploads"
exit $?
