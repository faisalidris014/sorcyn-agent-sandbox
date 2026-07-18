#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# 13 — Admin Tests (16 tests)
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail
source "$(dirname "$0")/_helpers.sh"

section "Admin — Dashboard"

# 1. Get stats
api_get "/admin/stats" "$ADMIN_TOKEN"
check "GET /admin/stats — dashboard stats" 200 "$CODE" "$BODY"

section "Admin — User Management"

# 2. List users
api_get "/admin/users" "$ADMIN_TOKEN"
check "GET /admin/users — list users" 200 "$CODE" "$BODY"
check_json_array_min "GET /admin/users — has users" "$BODY" '.data' 4

# 3. Search users
api_get "/admin/users?search=buyer" "$ADMIN_TOKEN"
check "GET /admin/users?search=buyer — search" 200 "$CODE" "$BODY"

# 4. Get user detail
api_get "/admin/users/$BUYER_USER_ID" "$ADMIN_TOKEN"
check "GET /admin/users/:id — detail" 200 "$CODE" "$BODY"

# 5. Suspend user (use the test-registered user)
if [ -n "$NEW_USER_ID" ] && [ "$NEW_USER_ID" != "null" ]; then
  api_post "/admin/users/$NEW_USER_ID/suspend" '{
    "reason": "Testing suspension functionality from the automated API test suite"
  }' "$ADMIN_TOKEN"
  check "POST /admin/users/:id/suspend — suspend user" 200 "$CODE" "$BODY"

  # 6. Reactivate user
  api_post "/admin/users/$NEW_USER_ID/reactivate" '{}' "$ADMIN_TOKEN"
  check "POST /admin/users/:id/reactivate — reactivate" 200 "$CODE" "$BODY"

  # 7. Ban user
  api_post "/admin/users/$NEW_USER_ID/ban" '{
    "reason": "Testing ban functionality from the automated API test suite"
  }' "$ADMIN_TOKEN"
  check "POST /admin/users/:id/ban — ban user" 200 "$CODE" "$BODY"

  # 8. Reactivate after ban
  api_post "/admin/users/$NEW_USER_ID/reactivate" '{}' "$ADMIN_TOKEN"
  check "POST /admin/users/:id/reactivate — after ban" 200 "$CODE" "$BODY"

  # 9. Force logout
  api_post "/admin/users/$NEW_USER_ID/force-logout" '{}' "$ADMIN_TOKEN"
  check "POST /admin/users/:id/force-logout — force logout" 200 "$CODE" "$BODY"
else
  skip "POST /admin/users/:id/suspend" "no test user"
  skip "POST /admin/users/:id/reactivate" "no test user"
  skip "POST /admin/users/:id/ban" "no test user"
  skip "POST /admin/users/:id/reactivate (ban)" "no test user"
  skip "POST /admin/users/:id/force-logout" "no test user"
fi

section "Admin — Verifications"

# 10. List verification requests
api_get "/admin/verifications" "$ADMIN_TOKEN"
check "GET /admin/verifications — list" 200 "$CODE" "$BODY"

# 11. Review verification (approve the one submitted in sellers test)
if [ -n "${VERIFICATION_REQUEST_ID:-}" ] && [ "$VERIFICATION_REQUEST_ID" != "null" ]; then
  api_post "/admin/verifications/$VERIFICATION_REQUEST_ID/review" '{
    "action": "approve",
    "notes": "Approved during automated API testing"
  }' "$ADMIN_TOKEN"
  check "POST /admin/verifications/:id/review — approve" 200 "$CODE" "$BODY"
else
  skip "POST /admin/verifications/:id/review" "no verification request"
fi

section "Admin — Disputes & Moderation"

# 12. List disputes
api_get "/admin/disputes" "$ADMIN_TOKEN"
check "GET /admin/disputes — list" 200 "$CODE" "$BODY"

# 13. List flagged content
api_get "/admin/moderation/flagged" "$ADMIN_TOKEN"
check "GET /admin/moderation/flagged — list" 200 "$CODE" "$BODY"

section "Admin — Transactions & Audit"

# 14. List all transactions
api_get "/admin/transactions" "$ADMIN_TOKEN"
check "GET /admin/transactions — list" 200 "$CODE" "$BODY"

# 15. List audit logs
api_get "/admin/audit-logs" "$ADMIN_TOKEN"
check "GET /admin/audit-logs — list" 200 "$CODE" "$BODY"

section "Admin — Negative Tests"

# 16. Non-admin user tries admin endpoint
api_get "/admin/stats" "$BUYER_TOKEN"
check "GET /admin/stats — non-admin returns 403" 403 "$CODE" "$BODY"

summary "Admin"
exit $?
