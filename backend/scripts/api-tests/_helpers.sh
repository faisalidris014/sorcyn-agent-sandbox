#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# Shared Helper Functions for API Test Suite
# ═══════════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source config if not already loaded
[ -z "${API:-}" ] && source "$SCRIPT_DIR/_config.sh"

# Source state if it exists
[ -f "$SCRIPT_DIR/_state.sh" ] && source "$SCRIPT_DIR/_state.sh"

# ── Assertions ────────────────────────────────────────────────────

check() {
  local label="$1"
  local expected_code="$2"
  local actual_code="$3"
  local body="${4:-}"

  if [ "$actual_code" -eq "$expected_code" ]; then
    echo -e "  ${GREEN}✓${NC} $label ${DIM}(HTTP $actual_code)${NC}"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $label — expected $expected_code, got $actual_code"
    echo -e "    ${DIM}$(echo "$body" | jq -r '.error.detail // .error.title // .message // .' 2>/dev/null | head -1)${NC}"
    FAIL=$((FAIL + 1))
  fi
}

check_json() {
  local label="$1"
  local body="$2"
  local jq_expr="$3"
  local expected="$4"

  local actual
  actual=$(echo "$body" | jq -r "$jq_expr" 2>/dev/null)

  if [ "$actual" = "$expected" ]; then
    echo -e "  ${GREEN}✓${NC} $label ${DIM}($actual)${NC}"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $label — expected \"$expected\", got \"$actual\""
    FAIL=$((FAIL + 1))
  fi
}

check_json_exists() {
  local label="$1"
  local body="$2"
  local jq_expr="$3"

  local val
  val=$(echo "$body" | jq -r "$jq_expr" 2>/dev/null)

  if [ -n "$val" ] && [ "$val" != "null" ]; then
    echo -e "  ${GREEN}✓${NC} $label ${DIM}(exists)${NC}"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $label — field missing or null"
    FAIL=$((FAIL + 1))
  fi
}

check_json_array_min() {
  local label="$1"
  local body="$2"
  local jq_expr="$3"
  local min_len="$4"

  local len
  len=$(echo "$body" | jq "$jq_expr | length" 2>/dev/null)

  if [ -n "$len" ] && [ "$len" -ge "$min_len" ] 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} $label ${DIM}(count: $len)${NC}"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $label — expected >= $min_len items, got ${len:-null}"
    FAIL=$((FAIL + 1))
  fi
}

skip() {
  local label="$1"
  local reason="${2:-}"
  echo -e "  ${YELLOW}○${NC} $label ${DIM}[SKIP${reason:+: $reason}]${NC}"
  SKIP=$((SKIP + 1))
}

# ── HTTP Helpers ──────────────────────────────────────────────────
# Each sets global vars: BODY, CODE

api_get() {
  local path="$1"
  local token="${2:-}"

  local headers=()
  [ -n "$token" ] && headers+=(-H "Authorization: Bearer $token")

  local resp
  resp=$(curl -s -w "\n%{http_code}" -X GET "$API$path" ${headers[@]+"${headers[@]}"} 2>/dev/null)
  BODY=$(echo "$resp" | sed '$d')
  CODE=$(echo "$resp" | tail -1)
}

api_post() {
  local path="$1"
  local _empty='{}'
  local data="${2:-$_empty}"
  local token="${3:-}"

  local headers=(-H "Content-Type: application/json")
  [ -n "$token" ] && headers+=(-H "Authorization: Bearer $token")

  local resp
  resp=$(curl -s -w "\n%{http_code}" -X POST "$API$path" "${headers[@]}" -d "$data" 2>/dev/null)
  BODY=$(echo "$resp" | sed '$d')
  CODE=$(echo "$resp" | tail -1)
}

api_put() {
  local path="$1"
  local _empty='{}'
  local data="${2:-$_empty}"
  local token="${3:-}"

  local headers=(-H "Content-Type: application/json")
  [ -n "$token" ] && headers+=(-H "Authorization: Bearer $token")

  local resp
  resp=$(curl -s -w "\n%{http_code}" -X PUT "$API$path" "${headers[@]}" -d "$data" 2>/dev/null)
  BODY=$(echo "$resp" | sed '$d')
  CODE=$(echo "$resp" | tail -1)
}

api_patch() {
  local path="$1"
  local _empty='{}'
  local data="${2:-$_empty}"
  local token="${3:-}"

  local headers=(-H "Content-Type: application/json")
  [ -n "$token" ] && headers+=(-H "Authorization: Bearer $token")

  local resp
  resp=$(curl -s -w "\n%{http_code}" -X PATCH "$API$path" "${headers[@]}" -d "$data" 2>/dev/null)
  BODY=$(echo "$resp" | sed '$d')
  CODE=$(echo "$resp" | tail -1)
}

api_delete() {
  local path="$1"
  local data="${2:-}"
  local token="${3:-}"

  local headers=()
  [ -n "$data" ] && headers+=(-H "Content-Type: application/json")
  [ -n "$token" ] && headers+=(-H "Authorization: Bearer $token")

  local args=()
  [ -n "$data" ] && args+=(-d "$data")

  local resp
  resp=$(curl -s -w "\n%{http_code}" -X DELETE "$API$path" ${headers[@]+"${headers[@]}"} ${args[@]+"${args[@]}"} 2>/dev/null)
  BODY=$(echo "$resp" | sed '$d')
  CODE=$(echo "$resp" | tail -1)
}

# Raw curl for non-JSON endpoints (health, webhook)
api_raw() {
  local method="$1"
  local url="$2"
  shift 2

  local resp
  resp=$(curl -s -w "\n%{http_code}" -X "$method" "$url" "$@" 2>/dev/null)
  BODY=$(echo "$resp" | sed '$d')
  CODE=$(echo "$resp" | tail -1)
}

# ── State Management ─────────────────────────────────────────────

save_state() {
  local key="$1"
  local value="$2"
  local state_file="$SCRIPT_DIR/_state.sh"

  # Remove any existing entry for this key, then append
  if [ -f "$state_file" ]; then
    grep -v "^${key}=" "$state_file" > "${state_file}.tmp" 2>/dev/null || true
    mv "${state_file}.tmp" "$state_file"
  fi
  echo "${key}=\"${value}\"" >> "$state_file"

  # Also export in current shell
  export "${key}=${value}"
}

# ── Utilities ─────────────────────────────────────────────────────

extract() {
  echo "$1" | jq -r "$2" 2>/dev/null
}

section() {
  echo ""
  echo -e "${BOLD}${YELLOW}━━━ $1 ━━━${NC}"
}

db_query() {
  docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -t -A -c "$1" 2>/dev/null
}

# ── Summary ───────────────────────────────────────────────────────

summary() {
  local suite_name="${1:-Tests}"
  echo ""
  echo -e "${BOLD}───────────────────────────────────${NC}"
  local total=$((PASS + FAIL + SKIP))
  echo -e "  ${GREEN}Passed: $PASS${NC}  ${RED}Failed: $FAIL${NC}  ${YELLOW}Skipped: $SKIP${NC}  Total: $total"
  echo -e "${BOLD}───────────────────────────────────${NC}"

  if [ "$FAIL" -gt 0 ]; then
    return 1
  fi
  return 0
}
