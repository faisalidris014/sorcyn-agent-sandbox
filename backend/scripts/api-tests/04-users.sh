#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# 04 — Users Tests (10 tests)
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail
source "$(dirname "$0")/_helpers.sh"

section "Users — Profile Read"

# 1. Get current user profile
api_get "/users/me" "$BUYER_TOKEN"
check "GET /users/me — buyer profile" 200 "$CODE" "$BODY"
check_json "GET /users/me — email matches" "$BODY" '.data.email' "$BUYER_EMAIL"

# 2. Get public user profile
api_get "/users/$SELLER_USER_ID"
check "GET /users/:userId — public profile" 200 "$CODE" "$BODY"
check_json_exists "GET /users/:userId — has firstName" "$BODY" '.data.firstName'

section "Users — Profile Update"

# 3. Update bio
api_patch "/users/me" '{"bio": "API test suite bio update"}' "$BUYER_TOKEN"
check "PATCH /users/me — update bio" 200 "$CODE" "$BODY"

# 4. Update photo
api_patch "/users/me/photo" '{"photoUrl": "https://example.com/test-photo.jpg"}' "$BUYER_TOKEN"
check "PATCH /users/me/photo — update photo" 200 "$CODE" "$BODY"

# 5. Update location
api_patch "/users/me" '{
  "locationCity": "Dallas",
  "locationState": "TX",
  "locationZip": "75201",
  "latitude": 32.7767,
  "longitude": -96.7970
}' "$BUYER_TOKEN"
check "PATCH /users/me — update location" 200 "$CODE" "$BODY"

section "Users — Password & Account"

# 6. Change password (and change back)
api_post "/users/me/change-password" '{
  "currentPassword": "TestPassword123!",
  "newPassword": "TempChanged456!"
}' "$BUYER_TOKEN"
check "POST /users/me/change-password — change" 200 "$CODE" "$BODY"

# Change it back immediately
api_post "/users/me/change-password" '{
  "currentPassword": "TempChanged456!",
  "newPassword": "TestPassword123!"
}' "$BUYER_TOKEN"
check "POST /users/me/change-password — revert" 200 "$CODE" "$BODY"

# 7. Switch marketplace context (may return 409 if account not eligible for b2b)
api_put "/users/me/marketplace-context" '{"context": "b2b"}' "$BUYER_TOKEN"
if [ "$CODE" -eq 200 ]; then
  check "PUT /users/me/marketplace-context — switch to b2b" 200 "$CODE" "$BODY"
  # Switch back
  api_put "/users/me/marketplace-context" '{"context": "b2c"}' "$BUYER_TOKEN"
elif [ "$CODE" -eq 409 ]; then
  echo -e "  ${GREEN}✓${NC} PUT /users/me/marketplace-context — endpoint works ${DIM}(HTTP 409 — not eligible, expected)${NC}"
  PASS=$((PASS + 1))
else
  check "PUT /users/me/marketplace-context — switch to b2b" 200 "$CODE" "$BODY"
fi

# 8. Update FCM token
api_put "/users/me/fcm-token" '{"fcmToken": "test-fcm-token-12345"}' "$BUYER_TOKEN"
check "PUT /users/me/fcm-token — set token" 200 "$CODE" "$BODY"

section "Users — Negative Tests"

# 9. No auth header
api_get "/users/me"
check "GET /users/me — no auth returns 401" 401 "$CODE" "$BODY"

# 10. Invalid data
api_patch "/users/me" '{"locationZip": "not-a-zip"}' "$BUYER_TOKEN"
check "PATCH /users/me — invalid zip rejected" 400 "$CODE" "$BODY"

summary "Users"
exit $?
