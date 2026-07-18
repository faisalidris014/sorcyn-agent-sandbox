#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# 07 — Offers Tests (9 tests)
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail
source "$(dirname "$0")/_helpers.sh"

section "Offers — Submit"

# 1. Seller submits offer on buyer's post
api_post "/offers" "{
  \"postId\": \"$TEST_POST_ID\",
  \"offerType\": \"service\",
  \"quoteAmount\": 175,
  \"pricingType\": \"flat_rate\",
  \"canStart\": \"Within 2 hours\",
  \"completionTime\": \"Same day\",
  \"message\": \"I am a licensed plumber with 10 years experience in the DFW area. I can fix your kitchen sink leak today and will bring all necessary parts and tools for the job.\"
}" "$SELLER_TOKEN"
check "POST /offers — seller submits offer" 201 "$CODE" "$BODY"

TEST_OFFER_ID=$(extract "$BODY" '.data.id')
save_state "TEST_OFFER_ID" "$TEST_OFFER_ID"

# 2. Both-user submits a second offer (for withdraw test)
api_post "/offers" "{
  \"postId\": \"$TEST_POST_ID\",
  \"offerType\": \"service\",
  \"quoteAmount\": 200,
  \"pricingType\": \"flat_rate\",
  \"canStart\": \"Tomorrow morning\",
  \"completionTime\": \"2-3 hours\",
  \"message\": \"Professional plumbing services available. I specialize in kitchen plumbing repairs and can diagnose and fix your P-trap leak with a warranty on parts and labor.\"
}" "$BOTH_TOKEN"
check "POST /offers — both-user submits offer" 201 "$CODE" "$BODY"

TEST_OFFER_ID_2=$(extract "$BODY" '.data.id')
save_state "TEST_OFFER_ID_2" "$TEST_OFFER_ID_2"

section "Offers — Read"

# 3. Seller lists their offers
api_get "/offers/my-offers" "$SELLER_TOKEN"
check "GET /offers/my-offers — seller's offers" 200 "$CODE" "$BODY"
check_json_array_min "GET /offers/my-offers — has offers" "$BODY" '.data' 1

# 4. Buyer views offers on their post
api_get "/offers/post/$TEST_POST_ID" "$BUYER_TOKEN"
check "GET /offers/post/:postId — buyer sees offers" 200 "$CODE" "$BODY"
check_json_array_min "GET /offers/post/:postId — has offers" "$BODY" '.data' 1

# 5. Get single offer detail
api_get "/offers/$TEST_OFFER_ID" "$SELLER_TOKEN"
check "GET /offers/:offerId — offer detail" 200 "$CODE" "$BODY"

section "Offers — Update & Withdraw"

# 6. Update offer (seller, while still pending)
api_put "/offers/$TEST_OFFER_ID" '{
  "quoteAmount": 195,
  "message": "Revised quote: Licensed plumber with 10 years experience. Updated price includes potential parts replacement for the P-trap connection and surrounding fittings."
}' "$SELLER_TOKEN"
check "PUT /offers/:offerId — update quote" 200 "$CODE" "$BODY"

# 7. Withdraw the second offer
api_delete "/offers/$TEST_OFFER_ID_2" "" "$BOTH_TOKEN"
check "DELETE /offers/:offerId — withdraw offer" 204 "$CODE" "$BODY"

section "Offers — Accept"

# 8. Buyer accepts seller's offer (creates transaction + conversation)
api_post "/offers/$TEST_OFFER_ID/accept" '{}' "$BUYER_TOKEN"
check "POST /offers/:offerId/accept — buyer accepts" 201 "$CODE" "$BODY"

TEST_TRANSACTION_ID=$(extract "$BODY" '.data.transaction.id')
save_state "TEST_TRANSACTION_ID" "$TEST_TRANSACTION_ID"

section "Offers — Negative Tests"

# 9. Submit offer without auth
api_post "/offers" '{"postId": "fake", "offerType": "service", "quoteAmount": 100, "message": "test message that needs to be at least fifty characters long for validation."}'
check "POST /offers — no auth returns 401" 401 "$CODE" "$BODY"

summary "Offers"
exit $?
