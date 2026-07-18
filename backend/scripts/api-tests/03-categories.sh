#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# 03 — Categories Tests (6 tests)
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail
source "$(dirname "$0")/_helpers.sh"

section "Categories — List & Filter"

# 1. List all categories
api_get "/categories"
check "GET /categories — returns list" 200 "$CODE" "$BODY"
check_json_array_min "GET /categories — has categories" "$BODY" '.data' 1

# 2. List MVP-only categories
api_get "/categories?mvpOnly=true"
check "GET /categories?mvpOnly=true — filtered" 200 "$CODE" "$BODY"

# 3. Category tree
api_get "/categories/tree"
check "GET /categories/tree — returns tree" 200 "$CODE" "$BODY"

section "Categories — By Slug"

# 4. Get services category by slug
api_get "/categories/services"
check "GET /categories/services — found" 200 "$CODE" "$BODY"
check_json "GET /categories/services — slug matches" "$BODY" '.data.slug' "services"

SERVICES_CATEGORY_ID=$(extract "$BODY" '.data.id')
save_state "SERVICES_CATEGORY_ID" "$SERVICES_CATEGORY_ID"

# 5. Get plumbing subcategory by slug
api_get "/categories/plumbing"
check "GET /categories/plumbing — found" 200 "$CODE" "$BODY"

PLUMBING_SUBCATEGORY_ID=$(extract "$BODY" '.data.id')
save_state "PLUMBING_SUBCATEGORY_ID" "$PLUMBING_SUBCATEGORY_ID"

# 6. Non-existent category
api_get "/categories/does-not-exist-xyz"
check "GET /categories/does-not-exist — 404" 404 "$CODE" "$BODY"

summary "Categories"
exit $?
