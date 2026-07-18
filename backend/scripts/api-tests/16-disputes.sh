#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# 16 — Disputes Tests (8 tests)
# Depends on: transaction created by 08-transactions.sh
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail
source "$(dirname "$0")/_helpers.sh"

section "Disputes — Create"

# 1. Create a dispute (requires TRANSACTION_ID from state)
if [ -z "${TRANSACTION_ID:-}" ]; then
  skip "POST /disputes — no TRANSACTION_ID in state"
  skip "GET /disputes/my-disputes"
  skip "GET /disputes/:id"
  skip "POST /disputes/:id/evidence"
  summary "Disputes"
  exit $?
fi

api_post "/disputes" "{\"transactionId\":\"$TRANSACTION_ID\",\"disputeType\":\"quality_issue\",\"description\":\"The work completed was below the agreed standard and missing key deliverables.\"}" "$BUYER_TOKEN"
check "POST /disputes — create dispute" 201 "$CODE" "$BODY"
DISPUTE_ID=$(echo "$BODY" | jq -r '.data.id')
save_state "DISPUTE_ID" "$DISPUTE_ID"

# 2. Reject duplicate dispute
api_post "/disputes" "{\"transactionId\":\"$TRANSACTION_ID\",\"disputeType\":\"non_delivery\",\"description\":\"Another attempt to file a dispute on the same transaction.\"}" "$BUYER_TOKEN"
check "POST /disputes — reject duplicate" 409 "$CODE" "$BODY"

# 3. Require auth
api_post "/disputes" "{\"transactionId\":\"$TRANSACTION_ID\",\"disputeType\":\"quality_issue\",\"description\":\"Unauthorized dispute filing attempt.\"}"
check "POST /disputes — requires auth" 401 "$CODE" "$BODY"

section "Disputes — List & Detail"

# 4. List my disputes
api_get "/disputes/my-disputes" "$BUYER_TOKEN"
check "GET /disputes/my-disputes — buyer sees disputes" 200 "$CODE" "$BODY"
check_json_array_min "  → at least 1 dispute" "$BODY" '.data' 1

# 5. Get dispute detail
api_get "/disputes/$DISPUTE_ID" "$BUYER_TOKEN"
check "GET /disputes/:id — detail" 200 "$CODE" "$BODY"
check_json "  → correct dispute type" "$BODY" '.data.disputeType' "quality_issue"

section "Disputes — Evidence"

# 6. Submit evidence
api_post "/disputes/$DISPUTE_ID/evidence" '{"evidence":[{"type":"text","description":"The seller missed 3 of 5 agreed deliverables."}]}' "$BUYER_TOKEN"
check "POST /disputes/:id/evidence — submit" 200 "$CODE" "$BODY"

# 7. Seller submits evidence
api_post "/disputes/$DISPUTE_ID/evidence" '{"evidence":[{"type":"text","description":"All work was completed as per scope agreed in the chat."}]}' "$SELLER_TOKEN"
check "POST /disputes/:id/evidence — seller submits" 200 "$CODE" "$BODY"

# 8. Reject evidence without auth
api_post "/disputes/$DISPUTE_ID/evidence" '{"evidence":[{"type":"text","description":"Unauthorized."}]}'
check "POST /disputes/:id/evidence — requires auth" 401 "$CODE" "$BODY"

summary "Disputes"
exit $?
