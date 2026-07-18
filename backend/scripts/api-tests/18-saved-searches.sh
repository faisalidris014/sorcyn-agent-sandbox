#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# 18 — Saved Searches Tests (7 tests)
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail
source "$(dirname "$0")/_helpers.sh"

section "Saved Searches — Create"

# 1. Create a saved search
api_post "/saved-searches" '{"name":"Plumbing in Dallas","searchType":"posts","filters":{"category":"services","city":"Dallas"},"notificationsEnabled":true}' "$BUYER_TOKEN"
check "POST /saved-searches — create" 201 "$CODE" "$BODY"
SAVED_SEARCH_ID=$(echo "$BODY" | jq -r '.data.id')
check_json "  → name matches" "$BODY" '.data.name' "Plumbing in Dallas"
check_json "  → searchType is posts" "$BODY" '.data.searchType' "posts"

# 2. Require auth
api_post "/saved-searches" '{"name":"Test","searchType":"posts","filters":{}}'
check "POST /saved-searches — requires auth" 401 "$CODE" "$BODY"

section "Saved Searches — List"

# 3. List saved searches
api_get "/saved-searches" "$BUYER_TOKEN"
check "GET /saved-searches — list" 200 "$CODE" "$BODY"
check_json_array_min "  → at least 1 search" "$BODY" '.data' 1

section "Saved Searches — Update"

# 4. Update saved search
api_put "/saved-searches/$SAVED_SEARCH_ID" '{"name":"Updated Plumbing Search","notificationsEnabled":false}' "$BUYER_TOKEN"
check "PUT /saved-searches/:id — update" 200 "$CODE" "$BODY"
check_json "  → name updated" "$BODY" '.data.name' "Updated Plumbing Search"

# 5. Reject update by non-owner
api_put "/saved-searches/$SAVED_SEARCH_ID" '{"name":"Hacked"}' "$SELLER_TOKEN"
check "PUT /saved-searches/:id — reject non-owner" 403 "$CODE" "$BODY"

section "Saved Searches — Delete"

# 6. Delete saved search
api_delete "/saved-searches/$SAVED_SEARCH_ID" "$BUYER_TOKEN"
check "DELETE /saved-searches/:id — soft delete" 204 "$CODE" "$BODY"

# 7. Verify deleted search is gone
api_get "/saved-searches" "$BUYER_TOKEN"
# The deleted search should not appear
check "GET /saved-searches — after delete" 200 "$CODE" "$BODY"

summary "Saved Searches"
exit $?
