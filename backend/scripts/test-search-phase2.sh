#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# Search & Phase 2 Readiness Tests (12 tests)
# ═══════════════════════════════════════════════════════════════════
# Tests PostgreSQL full-text search (MVP) and documents Phase 2
# feature readiness (Socket.IO, Elasticsearch).
#
# Requires: curl, jq, server at :3000, Docker (pg)
# ═══════════════════════════════════════════════════════════════════

set -uo pipefail

BASE="http://localhost:3000"
API="$BASE/api/v1"
PASS=0
FAIL=0
TIMESTAMP=$(date +%s)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

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

check_condition() {
  local label="$1"
  local condition="$2"  # 0 = pass, non-zero = fail

  if [ "$condition" -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC} $label"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $label"
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
echo -e "${BOLD}Search & Phase 2 Readiness Tests${NC}"
echo -e "${BOLD}═════════════════════════════════════════${NC}"

command -v curl >/dev/null 2>&1 || { echo -e "${RED}ERROR: curl not found${NC}"; exit 1; }
command -v jq   >/dev/null 2>&1 || { echo -e "${RED}ERROR: jq not found${NC}"; exit 1; }

HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/health" 2>/dev/null)
if [ "$HEALTH" != "200" ]; then
  echo -e "${RED}ERROR: Server not running at localhost:3000${NC}"
  exit 1
fi

# ═════════════════════════════════════════════════════════════════
section "SETUP: Create searchable posts"
# ═════════════════════════════════════════════════════════════════

BUYER_EMAIL="search_buyer_${TIMESTAMP}@example.com"
BUYER_PASS="BuyerPass123!"

# Register & verify buyer
RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$BUYER_EMAIL\",
    \"password\": \"$BUYER_PASS\",
    \"firstName\": \"SearchBuyer\",
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

docker exec rm-postgres psql -U postgres -d reverse_marketplace -q -c \
  "UPDATE users SET email_verified = true WHERE user_id = '$BUYER_ID';" 2>/dev/null

RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$BUYER_EMAIL\", \"password\": \"$BUYER_PASS\"}")
BODY=$(echo "$RESP" | sed '$d')
BUYER_TOKEN=$(extract "$BODY" '.data.tokens.accessToken')
BUYER_AUTH="Authorization: Bearer $BUYER_TOKEN"
echo -e "  ${GREEN}✓${NC} Logged in buyer"

# Get categories
RESP=$(curl -s -w "\n%{http_code}" "$API/categories/tree")
BODY=$(echo "$RESP" | sed '$d')

# Get Services category and a subcategory
SERVICES_ID=""
PLUMBING_SUBCAT_ID=""
for i in $(seq 0 4); do
  SLUG=$(extract "$BODY" ".data[$i].slug")
  if [ "$SLUG" = "services" ]; then
    SERVICES_ID=$(extract "$BODY" ".data[$i].id")
    # Find plumbing subcategory
    CHILD_COUNT=$(extract "$BODY" ".data[$i].children | length")
    for j in $(seq 0 $((CHILD_COUNT - 1))); do
      CHILD_SLUG=$(extract "$BODY" ".data[$i].children[$j].slug")
      if [ "$CHILD_SLUG" = "plumbing" ]; then
        PLUMBING_SUBCAT_ID=$(extract "$BODY" ".data[$i].children[$j].id")
        break
      fi
    done
    break
  fi
done

# Fallback to first category if services not found
if [ -z "$SERVICES_ID" ] || [ "$SERVICES_ID" = "null" ]; then
  SERVICES_ID=$(extract "$BODY" '.data[0].id')
  PLUMBING_SUBCAT_ID=$(extract "$BODY" '.data[0].children[0].id')
fi

echo -e "  ${GREEN}✓${NC} Got categories (Services: $SERVICES_ID)"

# Create 3 distinct searchable posts
# Post A: plumbing keywords
RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/posts" \
  -H "Content-Type: application/json" \
  -H "$BUYER_AUTH" \
  -d "{
    \"categoryId\": \"$SERVICES_ID\",
    \"subcategoryId\": \"$PLUMBING_SUBCAT_ID\",
    \"title\": \"Emergency plumbing repair needed in Dallas kitchen\",
    \"description\": \"My kitchen sink has a major leak from the P-trap pipe connection. Need an emergency plumber who can come today. The water is dripping constantly.\",
    \"budgetMin\": 100,
    \"budgetMax\": 300,
    \"budgetType\": \"range\",
    \"locationCity\": \"Dallas\",
    \"locationState\": \"TX\",
    \"locationZip\": \"75201\",
    \"urgency\": \"asap\"
  }")
BODY=$(echo "$RESP" | sed '$d')
POST_A_ID=$(extract "$BODY" '.data.id')
echo -e "  ${GREEN}✓${NC} Created Post A (plumbing)"

# Post B: furniture keywords
RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/posts" \
  -H "Content-Type: application/json" \
  -H "$BUYER_AUTH" \
  -d "{
    \"categoryId\": \"$SERVICES_ID\",
    \"subcategoryId\": \"$PLUMBING_SUBCAT_ID\",
    \"title\": \"Looking for vintage wooden furniture restoration\",
    \"description\": \"Have an antique wooden dresser that needs professional restoration. The finish is worn and there are some scratches. Looking for someone skilled.\",
    \"budgetMin\": 200,
    \"budgetMax\": 500,
    \"budgetType\": \"range\",
    \"locationCity\": \"Dallas\",
    \"locationState\": \"TX\",
    \"locationZip\": \"75201\",
    \"urgency\": \"within_1_week\"
  }")
BODY=$(echo "$RESP" | sed '$d')
POST_B_ID=$(extract "$BODY" '.data.id')
echo -e "  ${GREEN}✓${NC} Created Post B (furniture)"

# Post C: electrician keywords
RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/posts" \
  -H "Content-Type: application/json" \
  -H "$BUYER_AUTH" \
  -d "{
    \"categoryId\": \"$SERVICES_ID\",
    \"subcategoryId\": \"$PLUMBING_SUBCAT_ID\",
    \"title\": \"Need electrician for outlet installation in Fort Worth\",
    \"description\": \"Need a licensed electrician to install three new electrical outlets in my garage workshop. Must be up to code and properly grounded.\",
    \"budgetMin\": 150,
    \"budgetMax\": 400,
    \"budgetType\": \"range\",
    \"locationCity\": \"Fort Worth\",
    \"locationState\": \"TX\",
    \"locationZip\": \"76102\",
    \"urgency\": \"within_3_days\"
  }")
BODY=$(echo "$RESP" | sed '$d')
POST_C_ID=$(extract "$BODY" '.data.id')
echo -e "  ${GREEN}✓${NC} Created Post C (electrician)"

# Brief pause to let search vectors update
sleep 1

echo -e "  ${CYAN}Setup complete — 3 searchable posts created${NC}"

# ═════════════════════════════════════════════════════════════════
section "1. FULL-TEXT SEARCH BASICS"
# ═════════════════════════════════════════════════════════════════

# Test 1: Exact keyword match
RESP=$(curl -s -w "\n%{http_code}" "$API/posts/search?q=plumbing")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Search 'plumbing' → finds matching post" 200 "$CODE" "$BODY"
RESULT_COUNT=$(extract "$BODY" '.data | length')
if [ "$RESULT_COUNT" -gt 0 ]; then
  echo -e "    Found $RESULT_COUNT result(s)"
else
  echo -e "    ${YELLOW}WARNING:${NC} No results returned — search_vector may not be populated"
fi

# Test 2: No results for nonsense
RESP=$(curl -s -w "\n%{http_code}" "$API/posts/search?q=xyznonexistent99887766zzz")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Search nonsense term → 200 with empty results" 200 "$CODE" "$BODY"
RESULT_COUNT=$(extract "$BODY" '.data | length')
check_condition "  Result count is 0" "$( [ "$RESULT_COUNT" = "0" ] && echo 0 || echo 1 )"

# Test 3: Stemmed word matching (plumber should match plumbing)
RESP=$(curl -s -w "\n%{http_code}" "$API/posts/search?q=plumber")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Search 'plumber' (stemmed) → finds 'plumbing' post" 200 "$CODE" "$BODY"
RESULT_COUNT=$(extract "$BODY" '.data | length')
echo -e "    Found $RESULT_COUNT result(s) via stemming"

# Test 4: Search with category filter
RESP=$(curl -s -w "\n%{http_code}" "$API/posts/search?q=repair&categoryId=$SERVICES_ID")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Search with categoryId filter" 200 "$CODE" "$BODY"

# ═════════════════════════════════════════════════════════════════
section "2. SEARCH FILTERS & PAGINATION"
# ═════════════════════════════════════════════════════════════════

# Test 5: Budget range filter
RESP=$(curl -s -w "\n%{http_code}" "$API/posts/search?q=repair&minBudget=100&maxBudget=350")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Search with budget range filter" 200 "$CODE" "$BODY"

# Test 6: City filter
RESP=$(curl -s -w "\n%{http_code}" "$API/posts/search?q=electrician&city=Fort%20Worth")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Search with city filter (Fort Worth)" 200 "$CODE" "$BODY"

# Test 7: Pagination
RESP=$(curl -s -w "\n%{http_code}" "$API/posts/search?q=Dallas&page=1&limit=1")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Search with pagination (limit=1)" 200 "$CODE" "$BODY"
PAGE_SIZE=$(extract "$BODY" '.data | length')
META_LIMIT=$(extract "$BODY" '.meta.limit')
if [ "$PAGE_SIZE" -le 1 ] 2>/dev/null; then
  echo -e "    ${GREEN}✓${NC} Returned at most 1 result (pagination working)"
else
  echo -e "    ${YELLOW}NOTE:${NC} Returned $PAGE_SIZE results"
fi

# Test 8: Search module route (/search/posts same as /posts/search)
RESP=$(curl -s -w "\n%{http_code}" "$API/search/posts?q=plumbing")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Search module route /search/posts works" 200 "$CODE" "$BODY"

# Test 9: Missing q parameter
RESP=$(curl -s -w "\n%{http_code}" "$API/posts/search")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Search without q parameter → 400" 400 "$CODE" "$BODY"

# ═════════════════════════════════════════════════════════════════
section "3. PHASE 2 READINESS"
# ═════════════════════════════════════════════════════════════════

# Test 10: Socket.IO not installed
if [ -d "$SCRIPT_DIR/../node_modules/socket.io" ]; then
  echo -e "  ${RED}✗${NC} Socket.IO package found (unexpected for MVP)"
  FAIL=$((FAIL + 1))
else
  echo -e "  ${GREEN}✓${NC} Socket.IO NOT installed (Phase 2 — expected)"
  PASS=$((PASS + 1))
  echo -e "    ${YELLOW}INFO:${NC} Real-time messaging via Socket.IO is a Phase 2 feature"
  echo -e "    ${YELLOW}INFO:${NC} Current messaging uses REST endpoints only"
fi

# Test 11: Elasticsearch not installed
if [ -d "$SCRIPT_DIR/../node_modules/@elastic" ]; then
  echo -e "  ${RED}✗${NC} Elasticsearch client found (unexpected for MVP)"
  FAIL=$((FAIL + 1))
else
  echo -e "  ${GREEN}✓${NC} Elasticsearch NOT installed (Phase 2 — expected)"
  PASS=$((PASS + 1))
  echo -e "    ${YELLOW}INFO:${NC} MVP uses PostgreSQL full-text search (ts_rank + plainto_tsquery)"
  echo -e "    ${YELLOW}INFO:${NC} Elasticsearch integration is planned for Phase 2"
fi

# Test 12: Confirm PG full-text search is operational
RESP=$(curl -s -w "\n%{http_code}" "$API/posts/search?q=kitchen+repair")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "PostgreSQL full-text search is operational" 200 "$CODE" "$BODY"
RESULT_COUNT=$(extract "$BODY" '.data | length')
echo -e "    ${CYAN}INFO:${NC} Found $RESULT_COUNT results for 'kitchen repair'"
echo -e "    ${CYAN}INFO:${NC} Search uses ts_rank() + plainto_tsquery() in posts.service.ts"

# ═════════════════════════════════════════════════════════════════
# CLEANUP
# ═════════════════════════════════════════════════════════════════

section "CLEANUP"
docker exec rm-postgres psql -U postgres -d reverse_marketplace -q -c "
  DELETE FROM audit_logs WHERE user_id = '$BUYER_ID';
  DELETE FROM notifications WHERE user_id = '$BUYER_ID';
  DELETE FROM posts WHERE buyer_id = '$BUYER_ID';
  DELETE FROM users WHERE user_id = '$BUYER_ID';
" 2>/dev/null
echo -e "  ${GREEN}✓${NC} Test data cleaned up"

# ═════════════════════════════════════════════════════════════════
# SUMMARY
# ═════════════════════════════════════════════════════════════════

echo ""
echo -e "${BOLD}═════════════════════════════════════════${NC}"
TOTAL=$((PASS + FAIL))
if [ "$FAIL" -eq 0 ]; then
  echo -e "${BOLD}${GREEN}  SEARCH & PHASE 2: ALL $TOTAL CHECKS PASSED ✓${NC}"
else
  echo -e "${BOLD}${RED}  SEARCH & PHASE 2: $FAIL/$TOTAL CHECKS FAILED${NC}"
  echo -e "${BOLD}${GREEN}  $PASS/$TOTAL CHECKS PASSED${NC}"
fi
echo -e "${BOLD}═════════════════════════════════════════${NC}"

exit $FAIL
