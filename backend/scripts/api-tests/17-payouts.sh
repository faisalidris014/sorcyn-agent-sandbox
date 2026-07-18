#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# 17 — Payouts Tests (6 tests)
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail
source "$(dirname "$0")/_helpers.sh"

section "Payouts — List"

# 1. List seller payouts
api_get "/payouts" "$SELLER_TOKEN"
check "GET /payouts — seller can list payouts" 200 "$CODE" "$BODY"

# 2. Filter by status
api_get "/payouts?status=paid" "$SELLER_TOKEN"
check "GET /payouts?status=paid — filter works" 200 "$CODE" "$BODY"

# 3. Require auth
api_get "/payouts"
check "GET /payouts — requires auth" 401 "$CODE" "$BODY"

# 4. Buyer gets 404 (no seller profile)
api_get "/payouts" "$BUYER_TOKEN"
check "GET /payouts — buyer gets 404 (no seller profile)" 404 "$CODE" "$BODY"

section "Payouts — Summary"

# 5. Get earnings summary
api_get "/payouts/summary" "$SELLER_TOKEN"
check "GET /payouts/summary — earnings summary" 200 "$CODE" "$BODY"
check_json_exists "  → totalEarned exists" "$BODY" '.data.totalEarned'
check_json "  → currency is USD" "$BODY" '.data.currency' "USD"

# 6. Summary requires auth
api_get "/payouts/summary"
check "GET /payouts/summary — requires auth" 401 "$CODE" "$BODY"

summary "Payouts"
exit $?
