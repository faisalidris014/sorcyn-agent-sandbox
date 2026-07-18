#!/usr/bin/env bash
# Phase 4 D-08 quarterly chaos drill — staging only. RESEARCH §7.
# Captures Slack screenshot evidence for #sorcyn-prod-alerts.
#
# Usage:
#   STAGING_VPS=user@staging-host \
#   STAGING_URL=https://staging.sorcyn.com \
#   TEST_FORCE_TOKEN=<staging-only-token> \
#   STAGING_DATABASE_URL=<staging-db-url> \
#   ./scripts/synthetic-incident.sh
#
# See docs/runbooks/observability-drill.md for full procedure.
set -euo pipefail

# ── Staging-only guard (T-S-05) ──────────────────────────────────────────────
: "${STAGING_VPS:?Set STAGING_VPS to your staging SSH host (e.g. ubuntu@1.2.3.4)}"
: "${STAGING_URL:?Set STAGING_URL (e.g. https://staging.sorcyn.com)}"
: "${TEST_FORCE_TOKEN:?Set TEST_FORCE_TOKEN to staging /__test/force-500 token (min 16 chars)}"
: "${STAGING_DATABASE_URL:?Set STAGING_DATABASE_URL to the staging PostgreSQL URL}"

PROD_HOST_FRAGMENTS="${PROD_HOST_FRAGMENTS:-api.sorcyn.com sorcyn.com}"
for frag in $PROD_HOST_FRAGMENTS; do
  if [[ "$STAGING_URL" == *"$frag"* ]] && [[ "$STAGING_URL" != *"staging"* ]]; then
    echo "ABORT: STAGING_URL ($STAGING_URL) looks like production (matched: $frag). Refusing to run." >&2
    exit 2
  fi
done

echo "[$(date -Iseconds)] Staging guard passed. STAGING_URL=$STAGING_URL STAGING_VPS=$STAGING_VPS"

# ── Restoration trap ─────────────────────────────────────────────────────────
restore() {
  local exit_code=$?
  echo
  echo "[$(date -Iseconds)] === Restoring staging to healthy state (trap) ==="
  ssh "$STAGING_VPS" 'cd /opt/reverse-marketplace && docker compose start api' 2>/dev/null || true
  ssh "$STAGING_VPS" 'cd /opt/reverse-marketplace && docker compose restart api' 2>/dev/null || true
  echo "[$(date -Iseconds)] Restoration attempted. Verify $STAGING_URL/health returns 200."
  if [ "$exit_code" -ne 0 ]; then
    echo "[$(date -Iseconds)] Script exited with code $exit_code — check staging health manually."
  fi
}
trap restore EXIT

# ── Step 1: Container down (ContainerDown uptime alert) ──────────────────────
echo
echo "[$(date -Iseconds)] === Step 1: Container down (ContainerDown alert) ==="
echo "Stopping API container on staging..."
ssh "$STAGING_VPS" 'cd /opt/reverse-marketplace && docker compose stop api'
echo "[$(date -Iseconds)] API container stopped. Waiting 90 s for ContainerDown alert to fire..."
sleep 90
echo
echo "VERIFY: ContainerDown alert fired in #sorcyn-prod-alerts."
echo "        Capture a screenshot of the Slack alert. Check PII column (no email/address in payload)."
echo "Press ENTER to continue to Step 2..."
read -r _
ssh "$STAGING_VPS" 'cd /opt/reverse-marketplace && docker compose start api'
echo "[$(date -Iseconds)] API container restarted."
sleep 10

# ── Step 2: 5xx burst (ApiHigh5xxBurst alert) ────────────────────────────────
echo
echo "[$(date -Iseconds)] === Step 2: 5xx burst (ApiHigh5xxBurst alert) ==="
echo "Firing 50 parallel requests to $STAGING_URL/api/v1/__test/force-500 ..."
for i in $(seq 1 50); do
  curl -s -o /dev/null -X GET \
    -H "X-Test-Token: $TEST_FORCE_TOKEN" \
    "$STAGING_URL/api/v1/__test/force-500" &
done
wait
echo "[$(date -Iseconds)] 50 force-500 requests sent. Waiting 90 s for ApiHigh5xxBurst alert..."
sleep 90
echo
echo "VERIFY: ApiHigh5xxBurst fired in #sorcyn-prod-alerts (target: <1 min)."
echo "        Capture screenshot. Inspect alert payload — should contain NO email/address/Stripe customer ID."
echo "Press ENTER to continue to Step 3..."
read -r _

# ── Step 3: Slow query (ApiP95LatencyBreach alert) ───────────────────────────
echo
echo "[$(date -Iseconds)] === Step 3: Slow query (ApiP95LatencyBreach alert) ==="
echo "Injecting pg_sleep(2) via staging database connection..."
ssh "$STAGING_VPS" "psql \"$STAGING_DATABASE_URL\" -c 'SELECT pg_sleep(2);'" &
echo "[$(date -Iseconds)] Slow query fired. Waiting 5 min for ApiP95LatencyBreach alert..."
sleep 300
echo
echo "VERIFY: ApiP95LatencyBreach fired in #sorcyn-prod-alerts (target: <2 min)."
echo "        Capture screenshot. Check alert payload for PII leakage."
echo "Press ENTER to continue to Step 4..."
read -r _

# ── Step 4: Stripe webhook secret revoke (StripeWebhookFailureSpike alert) ───
echo
echo "[$(date -Iseconds)] === Step 4: Stripe webhook secret revoke (StripeWebhookFailureSpike alert) ==="
echo "Replacing STRIPE_WEBHOOK_SECRET with invalid value on staging..."
ssh "$STAGING_VPS" "cd /opt/reverse-marketplace && \
  sed -i 's/^STRIPE_WEBHOOK_SECRET=.*/STRIPE_WEBHOOK_SECRET=invalid_secret_chaos_$(date +%s)/' .env && \
  docker compose restart api"
echo "[$(date -Iseconds)] Staging API restarted with invalid Stripe webhook secret."
echo
echo "ACTION REQUIRED: Go to Stripe Dashboard → Developers → Webhooks → staging endpoint"
echo "                 → Resend the most recent event to the staging webhook URL."
echo "Press ENTER when you have resent the Stripe event..."
read -r _
echo "[$(date -Iseconds)] Waiting 3 min for StripeWebhookFailureSpike alert..."
sleep 180
echo
echo "VERIFY: StripeWebhookFailureSpike fired in #sorcyn-prod-alerts (target: <1 min)."
echo "        Capture screenshot. Check alert payload for PII leakage."
echo "Press ENTER to finalize drill (restoration will run automatically)..."
read -r _

# ── Restore Stripe webhook secret ────────────────────────────────────────────
echo "[$(date -Iseconds)] Restoring original Stripe webhook secret..."
echo "NOTE: You must manually restore STRIPE_WEBHOOK_SECRET in staging .env"
echo "      to the real secret, then run: docker compose restart api on $STAGING_VPS"

echo
echo "[$(date -Iseconds)] === Drill complete. Trap will restore staging container on exit. ==="
echo "Next: Fill in docs/runbooks/observability-drill.md AUDIT-MARKER:DRILL table with results."
echo "      Commit with: git commit -m 'docs(04-06): record first observability drill — N/4 PASS'"
