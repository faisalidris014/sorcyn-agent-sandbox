#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# Reverse Marketplace — Integration Test Suite (Master Runner)
# ═══════════════════════════════════════════════════════════════════
# Runs all integration test suites and aggregates results.
#
# Usage:  chmod +x backend/scripts/*.sh && bash backend/scripts/run-all-tests.sh
# ═══════════════════════════════════════════════════════════════════

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'
BOLD='\033[1m'

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Reverse Marketplace — Integration Test Suite${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════════${NC}"
echo ""

# ── Shared prerequisites ──────────────────────────────────────────

command -v curl >/dev/null 2>&1 || { echo -e "${RED}ERROR: curl not found. Install curl first.${NC}"; exit 1; }
command -v jq   >/dev/null 2>&1 || { echo -e "${RED}ERROR: jq not found. Install with: brew install jq${NC}"; exit 1; }

HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>/dev/null)
if [ "$HEALTH" != "200" ]; then
  echo -e "${RED}ERROR: Server not running at localhost:3000${NC}"
  echo "  Start with:  cd backend && npm run dev"
  exit 1
fi
echo -e "${GREEN}✓${NC} Server running at localhost:3000"
echo ""

TOTAL_PASS=0
TOTAL_FAIL=0
SUITE_RESULTS=""

# ── Run each suite ────────────────────────────────────────────────

for suite in test-stripe-webhooks.sh test-storage-uploads.sh test-search-phase2.sh; do
  echo -e "${BOLD}${CYAN}━━━ Running $suite ━━━${NC}"
  bash "$SCRIPT_DIR/$suite"
  EXIT=$?
  if [ $EXIT -eq 0 ]; then
    SUITE_RESULTS="${SUITE_RESULTS}\n  ${GREEN}✓${NC} $suite — ALL PASSED"
  else
    SUITE_RESULTS="${SUITE_RESULTS}\n  ${RED}✗${NC} $suite — $EXIT FAILURE(S)"
    TOTAL_FAIL=$((TOTAL_FAIL + EXIT))
  fi
  echo ""
done

# ── Summary ───────────────────────────────────────────────────────

echo -e "${BOLD}═══════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  SUITE RESULTS${NC}"
echo -e "$SUITE_RESULTS"
echo ""
if [ $TOTAL_FAIL -eq 0 ]; then
  echo -e "${BOLD}${GREEN}  ALL SUITES PASSED ✓${NC}"
else
  echo -e "${BOLD}${RED}  $TOTAL_FAIL TOTAL FAILURE(S) ACROSS SUITES${NC}"
fi
echo -e "${BOLD}═══════════════════════════════════════════════════════${NC}"
echo ""
exit $TOTAL_FAIL
