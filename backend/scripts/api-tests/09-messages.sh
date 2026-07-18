#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# 09 — Messages Tests (7 tests)
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail
source "$(dirname "$0")/_helpers.sh"

section "Messages — Conversations"

# 1. Buyer lists conversations (should have one from offer acceptance)
api_get "/messages/conversations" "$BUYER_TOKEN"
check "GET /messages/conversations — buyer" 200 "$CODE" "$BODY"
check_json_array_min "GET /messages/conversations — has conversations" "$BODY" '.data' 1

TEST_CONVERSATION_ID=$(extract "$BODY" '.data[0].id')
save_state "TEST_CONVERSATION_ID" "$TEST_CONVERSATION_ID"

# 2. Seller lists conversations
api_get "/messages/conversations" "$SELLER_TOKEN"
check "GET /messages/conversations — seller" 200 "$CODE" "$BODY"

# 3. Get conversation detail with messages
if [ -n "$TEST_CONVERSATION_ID" ] && [ "$TEST_CONVERSATION_ID" != "null" ]; then
  api_get "/messages/conversations/$TEST_CONVERSATION_ID" "$BUYER_TOKEN"
  check "GET /messages/conversations/:id — detail" 200 "$CODE" "$BODY"
else
  skip "GET /messages/conversations/:id" "no conversation found"
fi

section "Messages — Send & Read"

# 4. Buyer sends a message
if [ -n "$TEST_CONVERSATION_ID" ] && [ "$TEST_CONVERSATION_ID" != "null" ]; then
  api_post "/messages/conversations/$TEST_CONVERSATION_ID/messages" '{
    "messageText": "Hi, when can you come by for the kitchen sink repair?"
  }' "$BUYER_TOKEN"
  check "POST /messages/.../messages — buyer sends" 201 "$CODE" "$BODY"
else
  skip "POST /messages/.../messages — buyer sends" "no conversation"
fi

# 5. Seller sends a message
if [ -n "$TEST_CONVERSATION_ID" ] && [ "$TEST_CONVERSATION_ID" != "null" ]; then
  api_post "/messages/conversations/$TEST_CONVERSATION_ID/messages" '{
    "messageText": "I can come by tomorrow morning at 9 AM. Does that work for you?"
  }' "$SELLER_TOKEN"
  check "POST /messages/.../messages — seller sends" 201 "$CODE" "$BODY"
else
  skip "POST /messages/.../messages — seller sends" "no conversation"
fi

# 6. Mark conversation as read
if [ -n "$TEST_CONVERSATION_ID" ] && [ "$TEST_CONVERSATION_ID" != "null" ]; then
  api_put "/messages/conversations/$TEST_CONVERSATION_ID/mark-read" '{}' "$BUYER_TOKEN"
  check "PUT /messages/.../mark-read — buyer reads" 200 "$CODE" "$BODY"
else
  skip "PUT /messages/.../mark-read" "no conversation"
fi

section "Messages — Negative Tests"

# 7. No auth
api_get "/messages/conversations"
check "GET /messages/conversations — no auth returns 401" 401 "$CODE" "$BODY"

summary "Messages"
exit $?
