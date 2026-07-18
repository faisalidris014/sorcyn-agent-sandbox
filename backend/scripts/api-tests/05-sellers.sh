#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# 05 — Sellers Tests (8 tests)
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail
source "$(dirname "$0")/_helpers.sh"

section "Sellers — Read Profile"

# 1. Get my seller profile (seller@test.com already has one from seed)
api_get "/sellers/me" "$SELLER_TOKEN"
check "GET /sellers/me — seller profile" 200 "$CODE" "$BODY"
check_json_exists "GET /sellers/me — has businessName" "$BODY" '.data.businessName'

SELLER_PROFILE_ID=$(extract "$BODY" '.data.id')
save_state "SELLER_PROFILE_ID" "$SELLER_PROFILE_ID"

# 2. Get seller by profile ID (public)
api_get "/sellers/$SELLER_PROFILE_ID"
check "GET /sellers/:sellerId — public profile" 200 "$CODE" "$BODY"

# 3. Get seller by user ID (public)
api_get "/sellers/user/$SELLER_USER_ID"
check "GET /sellers/user/:userId — by user ID" 200 "$CODE" "$BODY"

section "Sellers — Update Profile"

# 4. Update seller profile
api_patch "/sellers/me" '{
  "bio": "Updated bio from API test suite - professional plumbing services",
  "serviceRadiusMiles": 30,
  "yearsExperience": 10
}' "$SELLER_TOKEN"
check "PATCH /sellers/me — update bio & radius" 200 "$CODE" "$BODY"

section "Sellers — Verification"

# 5. Submit verification request
api_post "/sellers/me/verification" '{
  "verificationType": "id",
  "documents": ["https://example.com/id-front.jpg", "https://example.com/id-back.jpg"]
}' "$SELLER_TOKEN"
check "POST /sellers/me/verification — submit ID" 201 "$CODE" "$BODY"

VERIFICATION_REQUEST_ID=$(extract "$BODY" '.data.id')
save_state "VERIFICATION_REQUEST_ID" "$VERIFICATION_REQUEST_ID"

# 6. Get my verification requests
api_get "/sellers/me/verification" "$SELLER_TOKEN"
check "GET /sellers/me/verification — list requests" 200 "$CODE" "$BODY"

section "Sellers — Negative Tests"

# 7. No auth
api_get "/sellers/me"
check "GET /sellers/me — no auth returns 401" 401 "$CODE" "$BODY"

# 8. Get both user's seller profile (also has one from seed)
api_get "/sellers/me" "$BOTH_TOKEN"
check "GET /sellers/me — both user has profile" 200 "$CODE" "$BODY"

BOTH_SELLER_PROFILE_ID=$(extract "$BODY" '.data.id')
save_state "BOTH_SELLER_PROFILE_ID" "$BOTH_SELLER_PROFILE_ID"

summary "Sellers"
exit $?
