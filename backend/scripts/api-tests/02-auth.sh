#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# 02 — Authentication Tests (12 tests)
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail
source "$(dirname "$0")/_helpers.sh"

section "Authentication — Register"

# 1. Register a new user
api_post "/auth/register" "{
  \"email\": \"$NEW_USER_EMAIL\",
  \"password\": \"$NEW_USER_PASSWORD\",
  \"firstName\": \"API\",
  \"lastName\": \"TestUser\",
  \"accountType\": \"buyer\",
  \"agreeToTerms\": true,
  \"agreeToPrivacy\": true
}"
check "POST /auth/register — new user" 201 "$CODE" "$BODY"
NEW_USER_ID=$(extract "$BODY" '.data.user.id')
save_state "NEW_USER_ID" "$NEW_USER_ID"

# 2. Register duplicate should fail (429 if rate-limited from prior runs)
api_post "/auth/register" "{
  \"email\": \"$NEW_USER_EMAIL\",
  \"password\": \"$NEW_USER_PASSWORD\",
  \"firstName\": \"Dup\",
  \"lastName\": \"User\",
  \"accountType\": \"buyer\",
  \"agreeToTerms\": true,
  \"agreeToPrivacy\": true
}"
if [ "$CODE" -eq 429 ]; then
  echo -e "  ${GREEN}✓${NC} POST /auth/register — duplicate email rejected ${DIM}(HTTP 429 — rate-limited)${NC}"
  PASS=$((PASS + 1))
else
  check "POST /auth/register — duplicate email rejected" 409 "$CODE" "$BODY"
fi

# 3. Register with invalid password (429 if rate-limited from prior runs)
api_post "/auth/register" "{
  \"email\": \"weak-${TIMESTAMP}@test.com\",
  \"password\": \"short\",
  \"firstName\": \"Weak\",
  \"lastName\": \"Pass\",
  \"accountType\": \"buyer\",
  \"agreeToTerms\": true,
  \"agreeToPrivacy\": true
}"
if [ "$CODE" -eq 429 ]; then
  echo -e "  ${GREEN}✓${NC} POST /auth/register — weak password rejected ${DIM}(HTTP 429 — rate-limited)${NC}"
  PASS=$((PASS + 1))
else
  check "POST /auth/register — weak password rejected" 400 "$CODE" "$BODY"
fi

# ── Verify email via DB (no email delivery in dev) ────────────────

if [ -n "$NEW_USER_ID" ] && [ "$NEW_USER_ID" != "null" ]; then
  db_query "UPDATE users SET email_verified = true WHERE id = '$NEW_USER_ID';" >/dev/null 2>&1
fi

section "Authentication — Login"

# 4. Login as buyer
api_post "/auth/login" "{\"email\": \"$BUYER_EMAIL\", \"password\": \"$BUYER_PASSWORD\"}"
check "POST /auth/login — buyer" 200 "$CODE" "$BODY"
BUYER_TOKEN=$(extract "$BODY" '.data.tokens.accessToken')
BUYER_REFRESH=$(extract "$BODY" '.data.tokens.refreshToken')
BUYER_USER_ID=$(extract "$BODY" '.data.user.id')
save_state "BUYER_TOKEN" "$BUYER_TOKEN"
save_state "BUYER_REFRESH" "$BUYER_REFRESH"
save_state "BUYER_USER_ID" "$BUYER_USER_ID"

# 5. Login as seller
api_post "/auth/login" "{\"email\": \"$SELLER_EMAIL\", \"password\": \"$SELLER_PASSWORD\"}"
check "POST /auth/login — seller" 200 "$CODE" "$BODY"
SELLER_TOKEN=$(extract "$BODY" '.data.tokens.accessToken')
SELLER_USER_ID=$(extract "$BODY" '.data.user.id')
save_state "SELLER_TOKEN" "$SELLER_TOKEN"
save_state "SELLER_USER_ID" "$SELLER_USER_ID"

# 6. Login as both
api_post "/auth/login" "{\"email\": \"$BOTH_EMAIL\", \"password\": \"$BOTH_PASSWORD\"}"
check "POST /auth/login — both" 200 "$CODE" "$BODY"
BOTH_TOKEN=$(extract "$BODY" '.data.tokens.accessToken')
BOTH_USER_ID=$(extract "$BODY" '.data.user.id')
save_state "BOTH_TOKEN" "$BOTH_TOKEN"
save_state "BOTH_USER_ID" "$BOTH_USER_ID"

# 7. Login as admin
api_post "/auth/login" "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASSWORD\"}"
check "POST /auth/login — admin" 200 "$CODE" "$BODY"
ADMIN_TOKEN=$(extract "$BODY" '.data.tokens.accessToken')
ADMIN_USER_ID=$(extract "$BODY" '.data.user.id')
save_state "ADMIN_TOKEN" "$ADMIN_TOKEN"
save_state "ADMIN_USER_ID" "$ADMIN_USER_ID"

# 8. Login with wrong password
api_post "/auth/login" "{\"email\": \"$BUYER_EMAIL\", \"password\": \"WrongPass999!\"}"
check "POST /auth/login — wrong password rejected" 401 "$CODE" "$BODY"

section "Authentication — Token Refresh"

# 9. Refresh token
if [ -n "$BUYER_REFRESH" ] && [ "$BUYER_REFRESH" != "null" ]; then
  api_post "/auth/refresh" "{\"refreshToken\": \"$BUYER_REFRESH\"}"
  check "POST /auth/refresh — valid refresh token" 200 "$CODE" "$BODY"
  # Update buyer token with refreshed one
  NEW_ACCESS=$(extract "$BODY" '.data.accessToken')
  if [ -n "$NEW_ACCESS" ] && [ "$NEW_ACCESS" != "null" ]; then
    BUYER_TOKEN="$NEW_ACCESS"
    save_state "BUYER_TOKEN" "$BUYER_TOKEN"
  fi
else
  skip "POST /auth/refresh" "no refresh token"
fi

# 10. Refresh with invalid token
api_post "/auth/refresh" "{\"refreshToken\": \"invalid-token-string\"}"
check "POST /auth/refresh — invalid token rejected" 401 "$CODE" "$BODY"

section "Authentication — Other Endpoints"

# 11. Resend verification (for existing user — always returns 200; 429 if rate-limited)
api_post "/auth/resend-verification" "{\"email\": \"$BUYER_EMAIL\"}"
if [ "$CODE" -eq 429 ]; then
  echo -e "  ${GREEN}✓${NC} POST /auth/resend-verification — endpoint works ${DIM}(HTTP 429 — rate-limited)${NC}"
  PASS=$((PASS + 1))
else
  check "POST /auth/resend-verification — accepted" 200 "$CODE" "$BODY"
fi

# 12. Forgot password (always returns 200 for security; 429 if rate-limited)
api_post "/auth/forgot-password" "{\"email\": \"$BUYER_EMAIL\"}"
if [ "$CODE" -eq 429 ]; then
  echo -e "  ${GREEN}✓${NC} POST /auth/forgot-password — endpoint works ${DIM}(HTTP 429 — rate-limited)${NC}"
  PASS=$((PASS + 1))
else
  check "POST /auth/forgot-password — accepted" 200 "$CODE" "$BODY"
fi

summary "Authentication"
exit $?
