#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# Storage & Upload Integration Tests (8 tests)
# ═══════════════════════════════════════════════════════════════════
# Tests URL-based photo/file fields across all modules and documents
# architectural gaps (no presigned URL endpoint, no multipart).
#
# Requires: curl, jq, server at :3000, Docker (pg)
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
NC='\033[0m'
BOLD='\033[1m'

# ── Helpers ────────────────────────────────────────────────────────

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

# ── Prerequisites ──────────────────────────────────────────────────

echo ""
echo -e "${BOLD}Storage & Upload Tests${NC}"
echo -e "${BOLD}═════════════════════════════════════════${NC}"

command -v curl >/dev/null 2>&1 || { echo -e "${RED}ERROR: curl not found${NC}"; exit 1; }
command -v jq   >/dev/null 2>&1 || { echo -e "${RED}ERROR: jq not found${NC}"; exit 1; }

HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/health" 2>/dev/null)
if [ "$HEALTH" != "200" ]; then
  echo -e "${RED}ERROR: Server not running at localhost:3000${NC}"
  exit 1
fi

# ═════════════════════════════════════════════════════════════════
section "SETUP: Register buyer + seller, create full transaction flow"
# ═════════════════════════════════════════════════════════════════

BUYER_EMAIL="upload_buyer_${TIMESTAMP}@example.com"
BUYER_PASS="BuyerPass123!"
SELLER_EMAIL="upload_seller_${TIMESTAMP}@example.com"
SELLER_PASS="SellerPass123!"

# Register buyer
RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$BUYER_EMAIL\",
    \"password\": \"$BUYER_PASS\",
    \"firstName\": \"UploadBuyer\",
    \"lastName\": \"Test\",
    \"accountType\": \"buyer\",
    \"locationZip\": \"75201\",
    \"agreeToTerms\": true,
    \"agreeToPrivacy\": true
  }")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
BUYER_ID=$(extract "$BODY" '.data.user.id')

if [ "$CODE" != "201" ]; then
  echo -e "  ${RED}SETUP FAILED: Could not register buyer (HTTP $CODE)${NC}"
  echo "    $(extract "$BODY" '.error.detail // .message')"
  exit 1
fi
echo -e "  ${GREEN}✓${NC} Registered buyer"

# Verify buyer email
docker exec rm-postgres psql -U postgres -d reverse_marketplace -q -c \
  "UPDATE users SET email_verified = true WHERE user_id = '$BUYER_ID';" 2>/dev/null

# Login buyer
RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$BUYER_EMAIL\", \"password\": \"$BUYER_PASS\"}")
BODY=$(echo "$RESP" | sed '$d')
BUYER_TOKEN=$(extract "$BODY" '.data.tokens.accessToken')
BUYER_AUTH="Authorization: Bearer $BUYER_TOKEN"
echo -e "  ${GREEN}✓${NC} Logged in buyer"

# Register seller
RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$SELLER_EMAIL\",
    \"password\": \"$SELLER_PASS\",
    \"firstName\": \"UploadSeller\",
    \"lastName\": \"Test\",
    \"accountType\": \"seller\",
    \"locationZip\": \"75202\",
    \"agreeToTerms\": true,
    \"agreeToPrivacy\": true
  }")
BODY=$(echo "$RESP" | sed '$d')
SELLER_USER_ID=$(extract "$BODY" '.data.user.id')
echo -e "  ${GREEN}✓${NC} Registered seller"

# Verify seller email
docker exec rm-postgres psql -U postgres -d reverse_marketplace -q -c \
  "UPDATE users SET email_verified = true WHERE user_id = '$SELLER_USER_ID';" 2>/dev/null

# Login seller
RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$SELLER_EMAIL\", \"password\": \"$SELLER_PASS\"}")
BODY=$(echo "$RESP" | sed '$d')
SELLER_TOKEN=$(extract "$BODY" '.data.tokens.accessToken')
SELLER_AUTH="Authorization: Bearer $SELLER_TOKEN"
echo -e "  ${GREEN}✓${NC} Logged in seller"

# Get categories
RESP=$(curl -s -w "\n%{http_code}" "$API/categories/tree")
BODY=$(echo "$RESP" | sed '$d')
CATEGORY_ID=$(extract "$BODY" '.data[0].id')
SUBCATEGORY_ID=$(extract "$BODY" '.data[0].children[0].id')
echo -e "  ${GREEN}✓${NC} Got categories"

# Create seller profile
RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/sellers" \
  -H "Content-Type: application/json" \
  -H "$SELLER_AUTH" \
  -d "{
    \"businessName\": \"Upload Test Services\",
    \"bio\": \"Test seller for storage and upload integration tests.\",
    \"serviceRadiusMiles\": 25,
    \"categories\": [\"$CATEGORY_ID\"],
    \"yearsExperience\": 5
  }")
BODY=$(echo "$RESP" | sed '$d')
SELLER_PROFILE_ID=$(extract "$BODY" '.data.id')
echo -e "  ${GREEN}✓${NC} Created seller profile"

# Enable Stripe for seller
docker exec rm-postgres psql -U postgres -d reverse_marketplace -q -c \
  "UPDATE seller_profiles SET stripe_account_id = 'acct_test_upload', stripe_charges_enabled = true, stripe_payouts_enabled = true WHERE seller_id = '$SELLER_PROFILE_ID';" 2>/dev/null
echo -e "  ${GREEN}✓${NC} Stripe enabled for seller"

echo -e "  ${CYAN}Setup complete${NC}"

# ═════════════════════════════════════════════════════════════════
section "1. URL-BASED PHOTO FIELDS"
# ═════════════════════════════════════════════════════════════════

# Test 1: Create post WITH photos array
RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/posts" \
  -H "Content-Type: application/json" \
  -H "$BUYER_AUTH" \
  -d "{
    \"categoryId\": \"$CATEGORY_ID\",
    \"subcategoryId\": \"$SUBCATEGORY_ID\",
    \"title\": \"Need furniture with reference photos\",
    \"description\": \"Looking for a specific piece of furniture. Here are reference photos showing exactly what I want. Must be in good condition.\",
    \"budgetMin\": 50,
    \"budgetMax\": 200,
    \"budgetType\": \"range\",
    \"photos\": [\"https://example.com/ref-photo-1.jpg\", \"https://example.com/ref-photo-2.jpg\"],
    \"locationCity\": \"Dallas\",
    \"locationState\": \"Texas\",
    \"locationZip\": \"75201\",
    \"urgency\": \"flexible\"
  }")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Create post with photos array (2 URLs)" 201 "$CODE" "$BODY"
POST_WITH_PHOTOS_ID=$(extract "$BODY" '.data.id')
PHOTO_COUNT=$(extract "$BODY" '.data.photos | length')
if [ "$PHOTO_COUNT" = "2" ]; then
  echo -e "    ${GREEN}✓${NC} photos field has $PHOTO_COUNT items"
else
  echo -e "    ${RED}✗${NC} Expected 2 photos, got $PHOTO_COUNT"
fi

# Test 2: Create post WITHOUT photos (default empty)
RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/posts" \
  -H "Content-Type: application/json" \
  -H "$BUYER_AUTH" \
  -d "{
    \"categoryId\": \"$CATEGORY_ID\",
    \"subcategoryId\": \"$SUBCATEGORY_ID\",
    \"title\": \"Need basic repair without photos\",
    \"description\": \"Looking for someone to do a basic repair job. No reference photos needed for this one.\",
    \"budgetMin\": 100,
    \"budgetMax\": 300,
    \"budgetType\": \"range\",
    \"locationCity\": \"Dallas\",
    \"locationState\": \"Texas\",
    \"locationZip\": \"75201\",
    \"urgency\": \"flexible\"
  }")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Create post without photos (default empty)" 201 "$CODE" "$BODY"
POST_NO_PHOTOS_ID=$(extract "$BODY" '.data.id')

# ═════════════════════════════════════════════════════════════════
section "2. TRANSACTION PHOTO FLOW"
# ═════════════════════════════════════════════════════════════════

# Create a post for the transaction flow
RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/posts" \
  -H "Content-Type: application/json" \
  -H "$BUYER_AUTH" \
  -d "{
    \"categoryId\": \"$CATEGORY_ID\",
    \"subcategoryId\": \"$SUBCATEGORY_ID\",
    \"title\": \"Need service for transaction photo test\",
    \"description\": \"This post is created to test photo uploads during the transaction lifecycle. Need a service provider.\",
    \"budgetMin\": 100,
    \"budgetMax\": 300,
    \"budgetType\": \"range\",
    \"locationCity\": \"Dallas\",
    \"locationState\": \"Texas\",
    \"locationZip\": \"75201\",
    \"urgency\": \"within_3_days\"
  }")
BODY=$(echo "$RESP" | sed '$d')
TX_POST_ID=$(extract "$BODY" '.data.id')

# Submit offer
RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/offers" \
  -H "Content-Type: application/json" \
  -H "$SELLER_AUTH" \
  -d "{
    \"postId\": \"$TX_POST_ID\",
    \"offerType\": \"service\",
    \"quoteAmount\": 200,
    \"pricingType\": \"flat_rate\",
    \"message\": \"I can handle this job for you. I have all the tools and experience needed. Will complete within the timeline you specified.\"
  }")
BODY=$(echo "$RESP" | sed '$d')
OFFER_ID=$(extract "$BODY" '.data.id')

# Accept offer (creates transaction)
RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/offers/$OFFER_ID/accept" \
  -H "$BUYER_AUTH")
BODY=$(echo "$RESP" | sed '$d')
TRANSACTION_ID=$(extract "$BODY" '.data.transaction.id')

# Progress to started
curl -s -o /dev/null -X PUT "$API/transactions/$TRANSACTION_ID/status" \
  -H "Content-Type: application/json" \
  -H "$SELLER_AUTH" \
  -d '{"status": "scheduled"}'
curl -s -o /dev/null -X PUT "$API/transactions/$TRANSACTION_ID/status" \
  -H "Content-Type: application/json" \
  -H "$SELLER_AUTH" \
  -d '{"status": "started"}'

echo -e "  ${CYAN}Transaction $TRANSACTION_ID ready for photo tests${NC}"

# Test 3: Mark complete WITH afterPhotos + beforePhotos
RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/transactions/$TRANSACTION_ID/mark-complete" \
  -H "Content-Type: application/json" \
  -H "$SELLER_AUTH" \
  -d '{
    "afterPhotos": ["https://example.com/after-1.jpg", "https://example.com/after-2.jpg"],
    "beforePhotos": ["https://example.com/before-1.jpg"],
    "workSummary": "Completed the work as described. Before and after photos show the improvement clearly."
  }')
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Mark complete with afterPhotos + beforePhotos" 200 "$CODE" "$BODY"

# Test 4: Try mark complete WITHOUT afterPhotos on a second transaction
# Create another post/offer/transaction for this test
RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/posts" \
  -H "Content-Type: application/json" \
  -H "$BUYER_AUTH" \
  -d "{
    \"categoryId\": \"$CATEGORY_ID\",
    \"subcategoryId\": \"$SUBCATEGORY_ID\",
    \"title\": \"Second service for validation test\",
    \"description\": \"This post tests that afterPhotos is required when marking a transaction complete.\",
    \"budgetMin\": 50,
    \"budgetMax\": 150,
    \"budgetType\": \"range\",
    \"locationCity\": \"Dallas\",
    \"locationState\": \"Texas\",
    \"locationZip\": \"75201\",
    \"urgency\": \"flexible\"
  }")
BODY=$(echo "$RESP" | sed '$d')
TX_POST_2_ID=$(extract "$BODY" '.data.id')

RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/offers" \
  -H "Content-Type: application/json" \
  -H "$SELLER_AUTH" \
  -d "{
    \"postId\": \"$TX_POST_2_ID\",
    \"offerType\": \"service\",
    \"quoteAmount\": 100,
    \"pricingType\": \"flat_rate\",
    \"message\": \"Second offer for the validation test. I can complete this work quickly and efficiently.\"
  }")
BODY=$(echo "$RESP" | sed '$d')
OFFER_2_ID=$(extract "$BODY" '.data.id')

RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/offers/$OFFER_2_ID/accept" \
  -H "$BUYER_AUTH")
BODY=$(echo "$RESP" | sed '$d')
TRANSACTION_2_ID=$(extract "$BODY" '.data.transaction.id')

curl -s -o /dev/null -X PUT "$API/transactions/$TRANSACTION_2_ID/status" \
  -H "Content-Type: application/json" \
  -H "$SELLER_AUTH" \
  -d '{"status": "scheduled"}'
curl -s -o /dev/null -X PUT "$API/transactions/$TRANSACTION_2_ID/status" \
  -H "Content-Type: application/json" \
  -H "$SELLER_AUTH" \
  -d '{"status": "started"}'

RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/transactions/$TRANSACTION_2_ID/mark-complete" \
  -H "Content-Type: application/json" \
  -H "$SELLER_AUTH" \
  -d '{"workSummary": "Done with the job"}')
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Mark complete WITHOUT afterPhotos → 400 (validation)" 400 "$CODE" "$BODY"

# ═════════════════════════════════════════════════════════════════
section "3. REVIEW & SELLER PROFILE PHOTOS"
# ═════════════════════════════════════════════════════════════════

# Approve the first transaction so we can review
RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/transactions/$TRANSACTION_ID/approve" \
  -H "Content-Type: application/json" \
  -H "$BUYER_AUTH" \
  -d '{"note": "Looks good, approving for photo test."}')
BODY=$(echo "$RESP" | sed '$d')

# Test 5: Submit review with completionPhotos
RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/reviews" \
  -H "Content-Type: application/json" \
  -H "$BUYER_AUTH" \
  -d "{
    \"transactionId\": \"$TRANSACTION_ID\",
    \"overallRating\": 5,
    \"categoryRatings\": {\"quality\": 5, \"communication\": 5, \"timeliness\": 4, \"professionalism\": 5, \"value\": 4},
    \"writtenReview\": \"Great work, the photos clearly show the quality of work done.\",
    \"wouldRecommend\": true,
    \"completionPhotos\": [\"https://example.com/review-photo-1.jpg\"]
  }")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Submit review with completionPhotos" 201 "$CODE" "$BODY"

# Test 6: Update seller profile with portfolioPhotos
RESP=$(curl -s -w "\n%{http_code}" -X PATCH "$API/sellers/me" \
  -H "Content-Type: application/json" \
  -H "$SELLER_AUTH" \
  -d '{
    "portfolioPhotos": ["https://example.com/portfolio-1.jpg", "https://example.com/portfolio-2.jpg", "https://example.com/portfolio-3.jpg"],
    "profilePhotoUrl": "https://example.com/headshot.jpg"
  }')
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Update seller profile with portfolioPhotos (3) + profilePhotoUrl" 200 "$CODE" "$BODY"

# ═════════════════════════════════════════════════════════════════
section "4. ARCHITECTURAL GAP DOCUMENTATION"
# ═════════════════════════════════════════════════════════════════

# Test 7: No presigned URL endpoint exists
RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/uploads/presigned-url" \
  -H "Content-Type: application/json" \
  -H "$BUYER_AUTH" \
  -d '{"filename":"test.jpg","contentType":"image/jpeg","category":"post-photos"}')
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "No presigned URL endpoint (expected 404)" 404 "$CODE" "$BODY"
echo -e "    ${YELLOW}INFO:${NC} No presigned URL endpoint exists yet — clients must upload files externally and pass URLs"
echo -e "    ${YELLOW}INFO:${NC} storage.ts has generatePresignedUploadUrl() but it's not exposed as a route"

# Test 8: Multipart upload not accepted
RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/users/me/photo" \
  -H "$BUYER_AUTH" \
  -F "file=@/dev/null;type=image/jpeg;filename=test.jpg")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
# Expect 400 or 415 (anything that's NOT 200/201 confirms multipart is not configured)
if [ "$CODE" -ne 200 ] && [ "$CODE" -ne 201 ]; then
  echo -e "  ${GREEN}✓${NC} Multipart upload correctly rejected ${CYAN}(HTTP $CODE)${NC}"
  PASS=$((PASS + 1))
else
  echo -e "  ${RED}✗${NC} Multipart upload unexpectedly accepted (HTTP $CODE)"
  FAIL=$((FAIL + 1))
fi
echo -e "    ${YELLOW}INFO:${NC} @fastify/multipart is installed but NOT registered in app.ts"
echo -e "    ${YELLOW}INFO:${NC} All photo fields accept URL strings via JSON body"

# ═════════════════════════════════════════════════════════════════
# CLEANUP
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
echo -e "${BOLD}═════════════════════════════════════════${NC}"
TOTAL=$((PASS + FAIL))
if [ "$FAIL" -eq 0 ]; then
  echo -e "${BOLD}${GREEN}  STORAGE & UPLOADS: ALL $TOTAL CHECKS PASSED ✓${NC}"
else
  echo -e "${BOLD}${RED}  STORAGE & UPLOADS: $FAIL/$TOTAL CHECKS FAILED${NC}"
  echo -e "${BOLD}${GREEN}  $PASS/$TOTAL CHECKS PASSED${NC}"
fi
echo -e "${BOLD}═════════════════════════════════════════${NC}"

exit $FAIL
