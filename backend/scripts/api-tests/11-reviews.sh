#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# 11 — Reviews Tests (5 tests)
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail
source "$(dirname "$0")/_helpers.sh"

section "Reviews — Submit"

# 1. Buyer submits review (transaction must be completed/approved)
api_post "/reviews" "{
  \"transactionId\": \"$TEST_TRANSACTION_ID\",
  \"overallRating\": 5,
  \"categoryRatings\": {
    \"quality\": 5,
    \"communication\": 5,
    \"timeliness\": 4,
    \"professionalism\": 5,
    \"value\": 4
  },
  \"writtenReview\": \"Excellent plumbing work! Fixed the kitchen sink leak quickly and professionally. Highly recommend.\",
  \"wouldRecommend\": true
}" "$BUYER_TOKEN"
check "POST /reviews — submit review" 201 "$CODE" "$BODY"

TEST_REVIEW_ID=$(extract "$BODY" '.data.id')
save_state "TEST_REVIEW_ID" "$TEST_REVIEW_ID"

section "Reviews — Read"

# 2. Get reviews for seller (public)
api_get "/reviews/sellers/$SELLER_PROFILE_ID"
check "GET /reviews/sellers/:sellerId — list reviews" 200 "$CODE" "$BODY"
check_json_array_min "GET /reviews/sellers/:sellerId — has reviews" "$BODY" '.data' 1

section "Reviews — Report"

# 3. Report a review
if [ -n "$TEST_REVIEW_ID" ] && [ "$TEST_REVIEW_ID" != "null" ]; then
  api_put "/reviews/$TEST_REVIEW_ID/report" '{
    "reason": "Testing the review report functionality via the API test suite"
  }' "$SELLER_TOKEN"
  check "PUT /reviews/:reviewId/report — report review" 200 "$CODE" "$BODY"
else
  skip "PUT /reviews/:reviewId/report" "no review ID"
fi

section "Reviews — Negative Tests"

# 4. Submit review without auth
api_post "/reviews" '{"transactionId": "fake-id", "overallRating": 5, "wouldRecommend": true}'
check "POST /reviews — no auth returns 401" 401 "$CODE" "$BODY"

# 5. Submit duplicate review (already reviewed this transaction)
api_post "/reviews" "{
  \"transactionId\": \"$TEST_TRANSACTION_ID\",
  \"overallRating\": 3,
  \"writtenReview\": \"Trying to submit a duplicate review for the same transaction.\",
  \"wouldRecommend\": false
}" "$BUYER_TOKEN"
check "POST /reviews — duplicate rejected" 409 "$CODE" "$BODY"

summary "Reviews"
exit $?
