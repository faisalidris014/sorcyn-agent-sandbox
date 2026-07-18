#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# 14 — Search Tests (4 tests)
# ═══════════════════════════════════════════════════════════════════
set -uo pipefail
source "$(dirname "$0")/_helpers.sh"

section "Search — Full-Text"

# 1. Search for plumber (should find the post we created)
api_get "/search/posts?q=plumber"
check "GET /search/posts?q=plumber — finds results" 200 "$CODE" "$BODY"

# 2. Search with no results
api_get "/search/posts?q=xyznonexistent99887766"
check "GET /search/posts?q=nonexistent — empty results" 200 "$CODE" "$BODY"

# 3. Search with city filter
api_get "/search/posts?q=kitchen&city=Dallas"
check "GET /search/posts?q=kitchen&city=Dallas — filtered" 200 "$CODE" "$BODY"

# 4. Search without query param
api_get "/search/posts"
check "GET /search/posts — missing q returns 400" 400 "$CODE" "$BODY"

summary "Search"
exit $?
