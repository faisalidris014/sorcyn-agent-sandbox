#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# 12 — Notifications Tests (6 tests)
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail
source "$(dirname "$0")/_helpers.sh"

section "Notifications — List"

# 1. List notifications
api_get "/notifications" "$BUYER_TOKEN"
check "GET /notifications — list" 200 "$CODE" "$BODY"

# Try to grab a notification ID if any exist
TEST_NOTIFICATION_ID=$(extract "$BODY" '.data[0].id')
save_state "TEST_NOTIFICATION_ID" "${TEST_NOTIFICATION_ID:-}"

# 2. List unread only
api_get "/notifications?unreadOnly=true" "$BUYER_TOKEN"
check "GET /notifications?unreadOnly=true — filter" 200 "$CODE" "$BODY"

section "Notifications — Actions"

# 3. Mark single notification as read
if [ -n "$TEST_NOTIFICATION_ID" ] && [ "$TEST_NOTIFICATION_ID" != "null" ]; then
  api_put "/notifications/$TEST_NOTIFICATION_ID/read" '{}' "$BUYER_TOKEN"
  check "PUT /notifications/:id/read — mark read" 200 "$CODE" "$BODY"
else
  skip "PUT /notifications/:id/read" "no notifications found"
fi

# 4. Mark all as read
api_put "/notifications/read-all" '{}' "$BUYER_TOKEN"
check "PUT /notifications/read-all — mark all read" 200 "$CODE" "$BODY"

# 5. Delete notification
if [ -n "$TEST_NOTIFICATION_ID" ] && [ "$TEST_NOTIFICATION_ID" != "null" ]; then
  api_delete "/notifications/$TEST_NOTIFICATION_ID" "" "$BUYER_TOKEN"
  check "DELETE /notifications/:id — delete" 204 "$CODE" "$BODY"
else
  skip "DELETE /notifications/:id" "no notifications found"
fi

section "Notifications — Negative Tests"

# 6. No auth
api_get "/notifications"
check "GET /notifications — no auth returns 401" 401 "$CODE" "$BODY"

summary "Notifications"
exit $?
