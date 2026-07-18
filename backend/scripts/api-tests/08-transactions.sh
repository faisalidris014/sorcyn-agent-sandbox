#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# 08 — Transactions Tests (8 tests)
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail
source "$(dirname "$0")/_helpers.sh"

section "Transactions — Read"

# 1. Buyer lists transactions
api_get "/transactions/my-transactions" "$BUYER_TOKEN"
check "GET /transactions/my-transactions — buyer" 200 "$CODE" "$BODY"
check_json_array_min "GET /transactions/my-transactions — has items" "$BODY" '.data' 1

# 2. Seller lists transactions
api_get "/transactions/my-transactions?role=seller" "$SELLER_TOKEN"
check "GET /transactions/my-transactions — seller" 200 "$CODE" "$BODY"

# 3. Get transaction detail
api_get "/transactions/$TEST_TRANSACTION_ID" "$BUYER_TOKEN"
check "GET /transactions/:id — detail" 200 "$CODE" "$BODY"
check_json "GET /transactions/:id — ID matches" "$BODY" '.data.id' "$TEST_TRANSACTION_ID"

section "Transactions — Lifecycle"

# Status flow: in_progress → scheduled → started → awaiting_approval → approved

# 4. Seller updates status to scheduled
api_put "/transactions/$TEST_TRANSACTION_ID/status" '{
  "status": "scheduled",
  "scheduledDate": "2026-04-20",
  "scheduledTime": "9:00 AM - 12:00 PM"
}' "$SELLER_TOKEN"
check "PUT /transactions/:id/status — scheduled" 200 "$CODE" "$BODY"

# 5. Seller updates status to started
api_put "/transactions/$TEST_TRANSACTION_ID/status" '{
  "status": "started",
  "note": "Arrived on site, beginning work"
}' "$SELLER_TOKEN"
check "PUT /transactions/:id/status — started" 200 "$CODE" "$BODY"

# 6. Seller marks complete (with after photos)
api_post "/transactions/$TEST_TRANSACTION_ID/mark-complete" '{
  "afterPhotos": ["https://example.com/after-1.jpg", "https://example.com/after-2.jpg"],
  "workSummary": "Fixed the P-trap connection and replaced the worn gasket. Tested for leaks and confirmed no dripping.",
  "completionNotes": "Replaced the gasket and tightened all connections. Recommend checking again in 6 months."
}' "$SELLER_TOKEN"
check "POST /transactions/:id/mark-complete — seller completes" 200 "$CODE" "$BODY"

# 7. Buyer approves and releases
api_post "/transactions/$TEST_TRANSACTION_ID/approve" '{
  "note": "Excellent work, the sink is no longer leaking. Very professional."
}' "$BUYER_TOKEN"
check "POST /transactions/:id/approve — buyer approves" 200 "$CODE" "$BODY"

section "Transactions — Negative Tests"

# 8. No auth
api_get "/transactions/my-transactions"
check "GET /transactions/my-transactions — no auth returns 401" 401 "$CODE" "$BODY"

summary "Transactions"
exit $?
