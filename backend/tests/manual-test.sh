#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# Reverse Marketplace — Interactive API End-to-End Test
# ═══════════════════════════════════════════════════════════════════
# Exercises the full buyer → seller → transaction → review flow.
# Requires: curl, jq, running server at localhost:3000, Docker (pg+redis)
#
# Usage:  chmod +x tests/manual-test.sh && ./tests/manual-test.sh
# ═══════════════════════════════════════════════════════════════════

set -uo pipefail

BASE="http://localhost:3000"
API="$BASE/api/v1"
PASS=0
FAIL=0
TIMESTAMP=$(date +%s)

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# ── Helpers ──────────────────────────────────────────────────────

check() {
  local label="$1"
  local expected_code="$2"
  local actual_code="$3"
  local body="$4"

  if [ "$actual_code" -eq "$expected_code" ]; then
    echo -e "  ${GREEN}✓${NC} $label ${CYAN}(HTTP $actual_code)${NC}"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $label — expected $expected_code, got $actual_code"
    echo "    Response: $(echo "$body" | jq -r '.error.detail // .error.title // .message // .' 2>/dev/null | head -1)"
    FAIL=$((FAIL + 1))
  fi
}

section() {
  echo ""
  echo -e "${BOLD}${YELLOW}━━━ $1 ━━━${NC}"
}

extract() {
  echo "$1" | jq -r "$2" 2>/dev/null
}

# ═════════════════════════════════════════════════════════════════
section "1. HEALTH CHECK"
# ═════════════════════════════════════════════════════════════════

RESP=$(curl -s -w "\n%{http_code}" "$BASE/health")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "GET /health" 200 "$CODE" "$BODY"

# ═════════════════════════════════════════════════════════════════
section "2. REGISTER BUYER"
# ═════════════════════════════════════════════════════════════════

BUYER_EMAIL="buyer_test_${TIMESTAMP}@example.com"
BUYER_PASS="BuyerPass123!"

RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$BUYER_EMAIL\",
    \"password\": \"$BUYER_PASS\",
    \"firstName\": \"Alice\",
    \"lastName\": \"TestBuyer\",
    \"accountType\": \"buyer\",
    \"locationZip\": \"75201\",
    \"agreeToTerms\": true,
    \"agreeToPrivacy\": true
  }")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Register buyer ($BUYER_EMAIL)" 201 "$CODE" "$BODY"

BUYER_ID=$(extract "$BODY" '.data.user.id')

# ═════════════════════════════════════════════════════════════════
section "3. VERIFY BUYER EMAIL (direct DB)"
# ═════════════════════════════════════════════════════════════════

# Verify email directly via DB (same as test suite does)
docker exec rm-postgres psql -U postgres -d reverse_marketplace -q -c \
  "UPDATE users SET email_verified = true WHERE user_id = '$BUYER_ID';" 2>/dev/null
echo -e "  ${GREEN}✓${NC} Email verified for buyer via DB"
PASS=$((PASS + 1))

# ═════════════════════════════════════════════════════════════════
section "4. LOGIN BUYER"
# ═════════════════════════════════════════════════════════════════

RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$BUYER_EMAIL\", \"password\": \"$BUYER_PASS\"}")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Login buyer" 200 "$CODE" "$BODY"

BUYER_TOKEN=$(extract "$BODY" '.data.tokens.accessToken')
BUYER_REFRESH=$(extract "$BODY" '.data.tokens.refreshToken')
BUYER_AUTH="Authorization: Bearer $BUYER_TOKEN"

# ═════════════════════════════════════════════════════════════════
section "5. GET BUYER PROFILE"
# ═════════════════════════════════════════════════════════════════

RESP=$(curl -s -w "\n%{http_code}" "$API/users/me" -H "$BUYER_AUTH")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "GET /users/me" 200 "$CODE" "$BODY"
echo -e "    Name: $(extract "$BODY" '.data.firstName') $(extract "$BODY" '.data.lastName')"
echo -e "    Email verified: $(extract "$BODY" '.data.emailVerified')"

# ═════════════════════════════════════════════════════════════════
section "6. BROWSE CATEGORIES"
# ═════════════════════════════════════════════════════════════════

RESP=$(curl -s -w "\n%{http_code}" "$API/categories/tree")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "GET /categories/tree" 200 "$CODE" "$BODY"

# Get first category (Products) and its first subcategory
CATEGORY_ID=$(extract "$BODY" '.data[0].id')
CATEGORY_NAME=$(extract "$BODY" '.data[0].name')
SUBCATEGORY_ID=$(extract "$BODY" '.data[0].children[0].id')
SUBCATEGORY_NAME=$(extract "$BODY" '.data[0].children[0].name')
echo -e "    Using category: $CATEGORY_NAME → $SUBCATEGORY_NAME"

# ═════════════════════════════════════════════════════════════════
section "7. CREATE A POST (buyer request)"
# ═════════════════════════════════════════════════════════════════

RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/posts" \
  -H "Content-Type: application/json" \
  -H "$BUYER_AUTH" \
  -d "{
    \"categoryId\": \"$CATEGORY_ID\",
    \"subcategoryId\": \"$SUBCATEGORY_ID\",
    \"title\": \"Need someone to fix my kitchen faucet\",
    \"description\": \"My kitchen faucet has been leaking for a week. Looking for a licensed plumber in the DFW area who can come out this week. Preferably someone with good reviews.\",
    \"budgetMin\": 100,
    \"budgetMax\": 300,
    \"budgetType\": \"range\",
    \"locationCity\": \"Dallas\",
    \"locationState\": \"Texas\",
    \"locationZip\": \"75201\",
    \"latitude\": 32.7767,
    \"longitude\": -96.7970,
    \"urgency\": \"within_3_days\",
    \"status\": \"active\"
  }")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Create post (kitchen faucet repair)" 201 "$CODE" "$BODY"

POST_ID=$(extract "$BODY" '.data.id')
echo -e "    Post ID: $POST_ID"
echo -e "    Status: $(extract "$BODY" '.data.status')"

# ═════════════════════════════════════════════════════════════════
section "8. VIEW PUBLIC FEED (as seller would)"
# ═════════════════════════════════════════════════════════════════

RESP=$(curl -s -w "\n%{http_code}" "$API/posts/feed?limit=5")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "GET /posts/feed" 200 "$CODE" "$BODY"

FEED_COUNT=$(extract "$BODY" '.data | length')
echo -e "    Posts in feed: $FEED_COUNT"

# ═════════════════════════════════════════════════════════════════
section "9. VIEW POST DETAIL"
# ═════════════════════════════════════════════════════════════════

RESP=$(curl -s -w "\n%{http_code}" "$API/posts/$POST_ID")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "GET /posts/:postId" 200 "$CODE" "$BODY"
echo -e "    Title: $(extract "$BODY" '.data.title')"
echo -e "    Budget: \$$(extract "$BODY" '.data.budgetMin') - \$$(extract "$BODY" '.data.budgetMax')"

# ═════════════════════════════════════════════════════════════════
section "10. REGISTER SELLER"
# ═════════════════════════════════════════════════════════════════

SELLER_EMAIL="seller_test_${TIMESTAMP}@example.com"
SELLER_PASS="SellerPass123!"

RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$SELLER_EMAIL\",
    \"password\": \"$SELLER_PASS\",
    \"firstName\": \"Bob\",
    \"lastName\": \"TestSeller\",
    \"accountType\": \"seller\",
    \"locationZip\": \"75202\",
    \"agreeToTerms\": true,
    \"agreeToPrivacy\": true
  }")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Register seller ($SELLER_EMAIL)" 201 "$CODE" "$BODY"

SELLER_USER_ID=$(extract "$BODY" '.data.user.id')

# Verify email
docker exec rm-postgres psql -U postgres -d reverse_marketplace -q -c \
  "UPDATE users SET email_verified = true WHERE user_id = '$SELLER_USER_ID';" 2>/dev/null
echo -e "  ${GREEN}✓${NC} Email verified for seller via DB"
PASS=$((PASS + 1))

# Login seller
RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$SELLER_EMAIL\", \"password\": \"$SELLER_PASS\"}")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Login seller" 200 "$CODE" "$BODY"

SELLER_TOKEN=$(extract "$BODY" '.data.tokens.accessToken')
SELLER_AUTH="Authorization: Bearer $SELLER_TOKEN"

# ═════════════════════════════════════════════════════════════════
section "11. CREATE SELLER PROFILE"
# ═════════════════════════════════════════════════════════════════

RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/sellers" \
  -H "Content-Type: application/json" \
  -H "$SELLER_AUTH" \
  -d "{
    \"businessName\": \"Bob's Plumbing Co.\",
    \"bio\": \"Licensed plumber with 10 years experience in the DFW area. Specializing in residential plumbing repairs, installations, and emergency services.\",
    \"serviceRadiusMiles\": 30,
    \"categories\": [\"$CATEGORY_ID\"],
    \"yearsExperience\": 10
  }")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Create seller profile" 201 "$CODE" "$BODY"

SELLER_PROFILE_ID=$(extract "$BODY" '.data.id')
echo -e "    Seller Profile ID: $SELLER_PROFILE_ID"
echo -e "    Profile Strength: $(extract "$BODY" '.data.profileStrength')%"

# Enable Stripe for seller (required for accepting paid offers)
docker exec rm-postgres psql -U postgres -d reverse_marketplace -q -c \
  "UPDATE seller_profiles SET stripe_account_id = 'acct_test_manual', stripe_charges_enabled = true, stripe_payouts_enabled = true WHERE seller_id = '$SELLER_PROFILE_ID';" 2>/dev/null
echo -e "  ${GREEN}✓${NC} Stripe enabled for seller (test mode)"
PASS=$((PASS + 1))

# ═════════════════════════════════════════════════════════════════
section "12. SUBMIT OFFER (seller responds to post)"
# ═════════════════════════════════════════════════════════════════

RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/offers" \
  -H "Content-Type: application/json" \
  -H "$SELLER_AUTH" \
  -d "{
    \"postId\": \"$POST_ID\",
    \"offerType\": \"service\",
    \"quoteAmount\": 225,
    \"pricingType\": \"flat_rate\",
    \"estimatedHours\": 2,
    \"canStart\": \"Tomorrow morning\",
    \"completionTime\": \"Same day\",
    \"message\": \"I can fix your kitchen faucet leak. I've handled hundreds of similar repairs. I'll bring all necessary parts and tools. The job should take about 2 hours including cleanup.\",
    \"terms\": \"Parts included in price. 30-day warranty on labor.\",
    \"warranty\": \"30-day labor warranty\"
  }")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Submit offer (\$225 flat rate)" 201 "$CODE" "$BODY"

OFFER_ID=$(extract "$BODY" '.data.id')
echo -e "    Offer ID: $OFFER_ID"
echo -e "    Platform Fee: \$$(extract "$BODY" '.data.platformFee')"
echo -e "    Estimated Payout: \$$(extract "$BODY" '.data.estimatedPayout')"

# ═════════════════════════════════════════════════════════════════
section "13. VIEW OFFERS ON POST (buyer reviews)"
# ═════════════════════════════════════════════════════════════════

RESP=$(curl -s -w "\n%{http_code}" "$API/offers/post/$POST_ID" -H "$BUYER_AUTH")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "GET /offers/post/:postId" 200 "$CODE" "$BODY"

OFFER_COUNT=$(extract "$BODY" '.data | length')
echo -e "    Offers received: $OFFER_COUNT"
echo -e "    Best offer: \$$(extract "$BODY" '.data[0].quoteAmount') from $(extract "$BODY" '.data[0].seller.businessName // .data[0].seller.firstName')"

# ═════════════════════════════════════════════════════════════════
section "14. ACCEPT OFFER (creates transaction)"
# ═════════════════════════════════════════════════════════════════

RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/offers/$OFFER_ID/accept" \
  -H "$BUYER_AUTH")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Accept offer → creates transaction" 201 "$CODE" "$BODY"

TRANSACTION_ID=$(extract "$BODY" '.data.transaction.id')
echo -e "    Transaction ID: $TRANSACTION_ID"
echo -e "    Status: $(extract "$BODY" '.data.transaction.status')"
echo -e "    Escrow: $(extract "$BODY" '.data.transaction.escrowStatus')"
echo -e "    Amount: \$$(extract "$BODY" '.data.transaction.quoteAmount')"

# ═════════════════════════════════════════════════════════════════
section "15. VIEW TRANSACTION (buyer)"
# ═════════════════════════════════════════════════════════════════

RESP=$(curl -s -w "\n%{http_code}" "$API/transactions/$TRANSACTION_ID" \
  -H "$BUYER_AUTH")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "GET /transactions/:id (buyer view)" 200 "$CODE" "$BODY"

# ═════════════════════════════════════════════════════════════════
section "16. UPDATE TRANSACTION STATUS (seller: scheduled → started)"
# ═════════════════════════════════════════════════════════════════

RESP=$(curl -s -w "\n%{http_code}" -X PUT "$API/transactions/$TRANSACTION_ID/status" \
  -H "Content-Type: application/json" \
  -H "$SELLER_AUTH" \
  -d '{"status": "scheduled"}')
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Update status → scheduled" 200 "$CODE" "$BODY"

RESP=$(curl -s -w "\n%{http_code}" -X PUT "$API/transactions/$TRANSACTION_ID/status" \
  -H "Content-Type: application/json" \
  -H "$SELLER_AUTH" \
  -d '{"status": "started"}')
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Update status → started" 200 "$CODE" "$BODY"

# ═════════════════════════════════════════════════════════════════
section "17. MARK COMPLETE (seller uploads after photos)"
# ═════════════════════════════════════════════════════════════════

RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/transactions/$TRANSACTION_ID/mark-complete" \
  -H "Content-Type: application/json" \
  -H "$SELLER_AUTH" \
  -d '{
    "beforePhotos": ["https://example.com/photos/leaking-faucet-1.jpg"],
    "afterPhotos": ["https://example.com/photos/fixed-faucet-1.jpg", "https://example.com/photos/fixed-faucet-2.jpg"],
    "workSummary": "Replaced the worn-out O-ring and cartridge. Tested for 10 minutes - no more leaks."
  }')
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Mark complete (with after photos)" 200 "$CODE" "$BODY"
echo -e "    Status: $(extract "$BODY" '.data.status')"

# ═════════════════════════════════════════════════════════════════
section "18. APPROVE & RELEASE (buyer confirms)"
# ═════════════════════════════════════════════════════════════════

RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/transactions/$TRANSACTION_ID/approve" \
  -H "Content-Type: application/json" \
  -H "$BUYER_AUTH" \
  -d '{"note": "Great work! Faucet is no longer leaking."}')
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Approve & release payment" 200 "$CODE" "$BODY"
echo -e "    Status: $(extract "$BODY" '.data.status')"
echo -e "    Escrow: $(extract "$BODY" '.data.escrowStatus')"

# ═════════════════════════════════════════════════════════════════
section "19. SUBMIT REVIEW"
# ═════════════════════════════════════════════════════════════════

RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/reviews" \
  -H "Content-Type: application/json" \
  -H "$BUYER_AUTH" \
  -d "{
    \"transactionId\": \"$TRANSACTION_ID\",
    \"overallRating\": 5,
    \"categoryRatings\": {
      \"quality\": 5,
      \"communication\": 5,
      \"timeliness\": 4,
      \"professionalism\": 5,
      \"value\": 4
    },
    \"writtenReview\": \"Bob did an amazing job fixing my faucet. He arrived on time, explained everything, and left the place clean.\",
    \"wouldRecommend\": true,
    \"completionPhotos\": [\"https://example.com/photos/review-1.jpg\"]
  }")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Submit review (5 stars)" 201 "$CODE" "$BODY"

# ═════════════════════════════════════════════════════════════════
section "20. VIEW SELLER REVIEWS (public)"
# ═════════════════════════════════════════════════════════════════

RESP=$(curl -s -w "\n%{http_code}" "$API/reviews/sellers/$SELLER_PROFILE_ID")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "GET /reviews/sellers/:sellerId" 200 "$CODE" "$BODY"
echo -e "    Average rating: $(extract "$BODY" '.data.summary.averageRating')"
echo -e "    Total reviews: $(extract "$BODY" '.data.summary.totalReviews')"

# ═════════════════════════════════════════════════════════════════
section "21. NOTIFICATIONS"
# ═════════════════════════════════════════════════════════════════

RESP=$(curl -s -w "\n%{http_code}" "$API/notifications" -H "$BUYER_AUTH")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "GET /notifications (buyer)" 200 "$CODE" "$BODY"
echo -e "    Notifications: $(extract "$BODY" '.data | length')"

RESP=$(curl -s -w "\n%{http_code}" "$API/notifications" -H "$SELLER_AUTH")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "GET /notifications (seller)" 200 "$CODE" "$BODY"

# ═════════════════════════════════════════════════════════════════
section "22. MY POSTS (buyer dashboard)"
# ═════════════════════════════════════════════════════════════════

RESP=$(curl -s -w "\n%{http_code}" "$API/posts/my-posts" -H "$BUYER_AUTH")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "GET /posts/my-posts" 200 "$CODE" "$BODY"
echo -e "    Total posts: $(extract "$BODY" '.meta.total')"

# ═════════════════════════════════════════════════════════════════
section "23. MY OFFERS (seller dashboard)"
# ═════════════════════════════════════════════════════════════════

RESP=$(curl -s -w "\n%{http_code}" "$API/offers/my-offers" -H "$SELLER_AUTH")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "GET /offers/my-offers" 200 "$CODE" "$BODY"
echo -e "    Total offers: $(extract "$BODY" '.meta.total')"

# ═════════════════════════════════════════════════════════════════
section "24. MY TRANSACTIONS"
# ═════════════════════════════════════════════════════════════════

RESP=$(curl -s -w "\n%{http_code}" "$API/transactions/my-transactions" -H "$BUYER_AUTH")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "GET /transactions/my-transactions (buyer)" 200 "$CODE" "$BODY"
echo -e "    Total transactions: $(extract "$BODY" '.meta.total')"

# ═════════════════════════════════════════════════════════════════
section "25. SEARCH POSTS"
# ═════════════════════════════════════════════════════════════════

RESP=$(curl -s -w "\n%{http_code}" "$API/posts/search?q=faucet")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "GET /posts/search?q=faucet" 200 "$CODE" "$BODY"
echo -e "    Results: $(extract "$BODY" '.data | length')"

# ═════════════════════════════════════════════════════════════════
section "26. ADMIN OPERATIONS"
# ═════════════════════════════════════════════════════════════════

# Promote buyer to admin for admin tests
docker exec rm-postgres psql -U postgres -d reverse_marketplace -q -c \
  "UPDATE users SET is_admin = true WHERE user_id = '$BUYER_ID';" 2>/dev/null

# Re-login to get admin token
RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$BUYER_EMAIL\", \"password\": \"$BUYER_PASS\"}")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
ADMIN_TOKEN=$(extract "$BODY" '.data.tokens.accessToken')
ADMIN_REFRESH=$(extract "$BODY" '.data.tokens.refreshToken')
ADMIN_AUTH="Authorization: Bearer $ADMIN_TOKEN"

RESP=$(curl -s -w "\n%{http_code}" "$API/admin/stats" -H "$ADMIN_AUTH")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "GET /admin/stats (dashboard)" 200 "$CODE" "$BODY"
echo -e "    Total users: $(extract "$BODY" '.data.totalUsers')"
echo -e "    Active posts: $(extract "$BODY" '.data.activePosts')"

RESP=$(curl -s -w "\n%{http_code}" "$API/admin/users" -H "$ADMIN_AUTH")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "GET /admin/users" 200 "$CODE" "$BODY"

RESP=$(curl -s -w "\n%{http_code}" "$API/admin/transactions" -H "$ADMIN_AUTH")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "GET /admin/transactions" 200 "$CODE" "$BODY"

RESP=$(curl -s -w "\n%{http_code}" "$API/admin/audit-logs" -H "$ADMIN_AUTH")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "GET /admin/audit-logs" 200 "$CODE" "$BODY"

# ═════════════════════════════════════════════════════════════════
section "27. TOKEN REFRESH"
# ═════════════════════════════════════════════════════════════════

RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$BUYER_REFRESH\"}")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "POST /auth/refresh (token rotation)" 200 "$CODE" "$BODY"

# ═════════════════════════════════════════════════════════════════
section "28. LOGOUT"
# ═════════════════════════════════════════════════════════════════

RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/auth/logout" \
  -H "Content-Type: application/json" \
  -H "$ADMIN_AUTH" \
  -d "{\"refreshToken\": \"$ADMIN_REFRESH\"}")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "POST /auth/logout (blacklists token)" 200 "$CODE" "$BODY"

# Verify token is blacklisted
RESP=$(curl -s -w "\n%{http_code}" "$API/users/me" -H "$ADMIN_AUTH")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "GET /users/me after logout (should 401)" 401 "$CODE" "$BODY"

# ═════════════════════════════════════════════════════════════════
section "29. ERROR HANDLING"
# ═════════════════════════════════════════════════════════════════

# Bad request (missing required fields)
RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/posts" \
  -H "Content-Type: application/json" \
  -H "$SELLER_AUTH" \
  -d '{"title": "x"}')
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Validation error (RFC 7807 format)" 400 "$CODE" "$BODY"

# Unauthorized
RESP=$(curl -s -w "\n%{http_code}" "$API/users/me")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Unauthorized (no token)" 401 "$CODE" "$BODY"

# Not found
RESP=$(curl -s -w "\n%{http_code}" "$API/posts/00000000-0000-0000-0000-000000000000" \
  -H "$SELLER_AUTH")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Not found (invalid UUID)" 404 "$CODE" "$BODY"

# ═════════════════════════════════════════════════════════════════
# CLEANUP — remove test data
# ═════════════════════════════════════════════════════════════════

section "CLEANUP"
docker exec rm-postgres psql -U postgres -d reverse_marketplace -q -c "
  DELETE FROM audit_logs WHERE user_id IN ('$BUYER_ID', '$SELLER_USER_ID');
  DELETE FROM notifications WHERE user_id IN ('$BUYER_ID', '$SELLER_USER_ID');
  DELETE FROM reviews WHERE buyer_id = '$BUYER_ID';
  DELETE FROM transactions WHERE buyer_id = '$BUYER_ID';
  DELETE FROM offers WHERE seller_id = '$SELLER_PROFILE_ID';
  DELETE FROM posts WHERE buyer_id = '$BUYER_ID';
  DELETE FROM conversations WHERE participant_1_id IN ('$BUYER_ID', '$SELLER_USER_ID') OR participant_2_id IN ('$BUYER_ID', '$SELLER_USER_ID');
  DELETE FROM seller_profiles WHERE seller_id = '$SELLER_PROFILE_ID';
  DELETE FROM users WHERE user_id IN ('$BUYER_ID', '$SELLER_USER_ID');
" 2>/dev/null
echo -e "  ${GREEN}✓${NC} Test data cleaned up"

# ═════════════════════════════════════════════════════════════════
# SUMMARY
# ═════════════════════════════════════════════════════════════════

echo ""
echo -e "${BOLD}═══════════════════════════════════════════${NC}"
TOTAL=$((PASS + FAIL))
if [ "$FAIL" -eq 0 ]; then
  echo -e "${BOLD}${GREEN}  ALL $TOTAL CHECKS PASSED ✓${NC}"
else
  echo -e "${BOLD}${RED}  $FAIL/$TOTAL CHECKS FAILED${NC}"
  echo -e "${BOLD}${GREEN}  $PASS/$TOTAL CHECKS PASSED${NC}"
fi
echo -e "${BOLD}═══════════════════════════════════════════${NC}"
echo ""
echo -e "Swagger UI: ${CYAN}http://localhost:3000/docs${NC}"
echo ""
