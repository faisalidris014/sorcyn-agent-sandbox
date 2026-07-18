#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# 06 — Posts Tests (12 tests)
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail
source "$(dirname "$0")/_helpers.sh"

section "Posts — Create"

# 1. Create a post (buyer, for offers)
api_post "/posts" "{
  \"categoryId\": \"$SERVICES_CATEGORY_ID\",
  \"subcategoryId\": \"$PLUMBING_SUBCATEGORY_ID\",
  \"title\": \"Need plumber for kitchen sink repair\",
  \"description\": \"Kitchen sink has a major leak that needs professional plumbing repair urgently. Water is dripping constantly from the P-trap connection under the sink.\",
  \"budgetMin\": 100,
  \"budgetMax\": 300,
  \"budgetType\": \"range\",
  \"locationCity\": \"Dallas\",
  \"locationState\": \"TX\",
  \"locationZip\": \"75201\",
  \"latitude\": 32.7767,
  \"longitude\": -96.7970,
  \"urgency\": \"asap\"
}" "$BUYER_TOKEN"
check "POST /posts — create plumbing post" 201 "$CODE" "$BODY"

TEST_POST_ID=$(extract "$BODY" '.data.id')
save_state "TEST_POST_ID" "$TEST_POST_ID"

# 2. Create a second post (for deletion test)
api_post "/posts" "{
  \"categoryId\": \"$SERVICES_CATEGORY_ID\",
  \"title\": \"Need house cleaning service in Dallas\",
  \"description\": \"Looking for a thorough house cleaning service for a three bedroom two bathroom home in the Dallas area.\",
  \"budgetMin\": 80,
  \"budgetMax\": 150,
  \"budgetType\": \"range\",
  \"locationCity\": \"Dallas\",
  \"locationState\": \"TX\",
  \"locationZip\": \"75201\",
  \"urgency\": \"within_1_week\"
}" "$BUYER_TOKEN"
check "POST /posts — create cleaning post" 201 "$CODE" "$BODY"

TEST_POST_ID_2=$(extract "$BODY" '.data.id')
save_state "TEST_POST_ID_2" "$TEST_POST_ID_2"

section "Posts — Read"

# 3. Get my posts
api_get "/posts/my-posts" "$BUYER_TOKEN"
check "GET /posts/my-posts — list buyer posts" 200 "$CODE" "$BODY"
check_json_array_min "GET /posts/my-posts — has posts" "$BODY" '.data' 1

# 4. Get public feed
api_get "/posts/feed"
check "GET /posts/feed — public feed" 200 "$CODE" "$BODY"

# 5. Get feed filtered by category
api_get "/posts/feed?categoryId=$SERVICES_CATEGORY_ID"
check "GET /posts/feed?categoryId — filtered" 200 "$CODE" "$BODY"

# 6. Get single post
api_get "/posts/$TEST_POST_ID"
check "GET /posts/:postId — single post" 200 "$CODE" "$BODY"
check_json "GET /posts/:postId — ID matches" "$BODY" '.data.id' "$TEST_POST_ID"

section "Posts — Update & Actions"

# 7. Update post title (no offers yet, so update allowed)
api_put "/posts/$TEST_POST_ID" '{"title": "URGENT: Need plumber for kitchen sink repair ASAP"}' "$BUYER_TOKEN"
check "PUT /posts/:postId — update title" 200 "$CODE" "$BODY"

# 8. Extend post
api_post "/posts/$TEST_POST_ID/extend" '{}' "$BUYER_TOKEN"
check "POST /posts/:postId/extend — extend expiry" 200 "$CODE" "$BODY"

# 9. Delete second post
api_delete "/posts/$TEST_POST_ID_2" "" "$BUYER_TOKEN"
check "DELETE /posts/:postId — delete post" 204 "$CODE" "$BODY"

section "Posts — Search"

# 10. Search posts
api_get "/posts/search?q=plumber"
check "GET /posts/search?q=plumber — search" 200 "$CODE" "$BODY"

section "Posts — Negative Tests"

# 11. Create post without auth
api_post "/posts" '{"title": "test", "description": "test"}'
check "POST /posts — no auth returns 401" 401 "$CODE" "$BODY"

# 12. Create post with missing required fields
api_post "/posts" '{"title": "x"}' "$BUYER_TOKEN"
check "POST /posts — missing fields returns 400" 400 "$CODE" "$BODY"

# AI endpoints — skipped (require Gemini API key)
skip "POST /posts/ai/parse" "requires Gemini API key"
skip "POST /posts/ai/suggest-images" "requires Gemini API key"
skip "POST /posts/ai/generate-job-profile" "requires Gemini API key"

summary "Posts"
exit $?
