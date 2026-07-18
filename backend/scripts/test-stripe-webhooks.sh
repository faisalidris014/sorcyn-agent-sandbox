#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# Stripe Webhook Integration Tests (6 tests)
# ═══════════════════════════════════════════════════════════════════
# Tests real webhook signature verification and Stripe CLI event
# triggers. Auto-starts stripe listen in the background.
#
# Requires: curl, jq, stripe CLI (authenticated), server at :3000
# ═══════════════════════════════════════════════════════════════════

set -uo pipefail

BASE="http://localhost:3000"
API="$BASE/api/v1"
PASS=0
FAIL=0
STRIPE_LISTEN_PID=""

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

check_exit() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  local output="$4"

  if [ "$actual" -eq "$expected" ]; then
    echo -e "  ${GREEN}✓${NC} $label ${CYAN}(exit $actual)${NC}"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $label — expected exit $expected, got $actual"
    echo "    Output: $(echo "$output" | tail -3)"
    FAIL=$((FAIL + 1))
  fi
}

section() {
  echo ""
  echo -e "${BOLD}${YELLOW}━━━ $1 ━━━${NC}"
}

cleanup() {
  if [ -n "$STRIPE_LISTEN_PID" ] && kill -0 "$STRIPE_LISTEN_PID" 2>/dev/null; then
    kill "$STRIPE_LISTEN_PID" 2>/dev/null
    wait "$STRIPE_LISTEN_PID" 2>/dev/null
    echo -e "  ${GREEN}✓${NC} Stopped stripe listen (PID $STRIPE_LISTEN_PID)"
  fi
  # Clean up temp file
  rm -f /tmp/stripe-listen-output.log
}

trap cleanup EXIT

# ── Prerequisites ──────────────────────────────────────────────────

echo ""
echo -e "${BOLD}Stripe Webhook Tests${NC}"
echo -e "${BOLD}═════════════════════════════════════════${NC}"

command -v curl   >/dev/null 2>&1 || { echo -e "${RED}ERROR: curl not found${NC}"; exit 1; }
command -v jq     >/dev/null 2>&1 || { echo -e "${RED}ERROR: jq not found${NC}"; exit 1; }

HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/health" 2>/dev/null)
if [ "$HEALTH" != "200" ]; then
  echo -e "${RED}ERROR: Server not running at localhost:3000${NC}"
  exit 1
fi

if ! command -v stripe >/dev/null 2>&1; then
  echo -e "${RED}ERROR: Stripe CLI not found${NC}"
  echo "  Install with:  brew install stripe/stripe-cli/stripe"
  echo "  Then run:       stripe login"
  exit 1
fi

# ═════════════════════════════════════════════════════════════════
section "1. WEBHOOK SIGNATURE VALIDATION (no Stripe CLI needed)"
# ═════════════════════════════════════════════════════════════════

# Test 1: Missing stripe-signature header
RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/payments/webhook" \
  -H "Content-Type: application/json" \
  -d '{"type":"test.event"}')
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Missing stripe-signature header → 400" 400 "$CODE" "$BODY"

# Test 2: Invalid signature value
RESP=$(curl -s -w "\n%{http_code}" -X POST "$API/payments/webhook" \
  -H "Content-Type: application/json" \
  -H "stripe-signature: t=1234567890,v1=invalid_signature_value_here" \
  -d '{"type":"test.event","id":"evt_fake"}')
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1)
check "Invalid signature → 400" 400 "$CODE" "$BODY"

# ═════════════════════════════════════════════════════════════════
section "2. STRIPE CLI EVENT TRIGGERS"
# ═════════════════════════════════════════════════════════════════

# Auto-start stripe listen in the background
echo -e "  ${CYAN}Starting stripe listen in background...${NC}"
stripe listen --forward-to "$API/payments/webhook" > /tmp/stripe-listen-output.log 2>&1 &
STRIPE_LISTEN_PID=$!

# Wait for stripe listen to be ready (up to 15 seconds)
READY=0
for i in $(seq 1 30); do
  if grep -q "Ready!" /tmp/stripe-listen-output.log 2>/dev/null; then
    READY=1
    break
  fi
  sleep 0.5
done

if [ "$READY" -eq 0 ]; then
  echo -e "  ${RED}ERROR: stripe listen did not become ready within 15 seconds${NC}"
  echo -e "  ${YELLOW}Make sure you have run 'stripe login' first${NC}"
  echo "  Log output:"
  cat /tmp/stripe-listen-output.log 2>/dev/null | head -5
  # Still run the tests — they'll fail with clear output
fi

if [ "$READY" -eq 1 ]; then
  echo -e "  ${GREEN}✓${NC} stripe listen ready (PID $STRIPE_LISTEN_PID)"
fi

# Give it a moment to fully initialize
sleep 1

# Test 3: payment_intent.succeeded
OUTPUT=$(stripe trigger payment_intent.succeeded 2>&1)
EXIT_CODE=$?
check_exit "stripe trigger payment_intent.succeeded" 0 "$EXIT_CODE" "$OUTPUT"

# Test 4: payment_intent.payment_failed
OUTPUT=$(stripe trigger payment_intent.payment_failed 2>&1)
EXIT_CODE=$?
check_exit "stripe trigger payment_intent.payment_failed" 0 "$EXIT_CODE" "$OUTPUT"

# Test 5: charge.refunded
OUTPUT=$(stripe trigger charge.refunded 2>&1)
EXIT_CODE=$?
check_exit "stripe trigger charge.refunded" 0 "$EXIT_CODE" "$OUTPUT"

# Test 6: account.updated
OUTPUT=$(stripe trigger account.updated 2>&1)
EXIT_CODE=$?
check_exit "stripe trigger account.updated" 0 "$EXIT_CODE" "$OUTPUT"

# ═════════════════════════════════════════════════════════════════
# SUMMARY
# ═════════════════════════════════════════════════════════════════

echo ""
echo -e "${BOLD}═════════════════════════════════════════${NC}"
TOTAL=$((PASS + FAIL))
if [ "$FAIL" -eq 0 ]; then
  echo -e "${BOLD}${GREEN}  STRIPE WEBHOOKS: ALL $TOTAL CHECKS PASSED ✓${NC}"
else
  echo -e "${BOLD}${RED}  STRIPE WEBHOOKS: $FAIL/$TOTAL CHECKS FAILED${NC}"
  echo -e "${BOLD}${GREEN}  $PASS/$TOTAL CHECKS PASSED${NC}"
fi
echo -e "${BOLD}═════════════════════════════════════════${NC}"

exit $FAIL
