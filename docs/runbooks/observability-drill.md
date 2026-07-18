# Observability Drill Runbook

> Quarterly chaos drill verifying every Phase 4 alert path reaches `#sorcyn-prod-alerts`.
> Per D-08 (CONTEXT.md): drill + continuous monitors are BOTH required for SC#4.
> Alert latency targets per RESEARCH §6: 5xx burst <1 min, latency breach <2 min,
> container down <1 min, webhook failure <1 min.

## Cadence

Quarterly: Q1 (Jan), Q2 (Apr), Q3 (Jul), Q4 (Oct). Calendar reminder set in Faisal's Google Calendar.

## Pre-Drill Checklist

- [ ] AlertManager + Prometheus rules wired (Phase 4 plan 04-03 — `infra/alertmanager/`)
- [ ] Sentry → Slack integration installed; rules covering 4 alert types in #sorcyn-prod-alerts
- [ ] Better Stack monitors configured per `user_setup` block in 04-06-PLAN.md (4 endpoints × multi-region)
- [ ] Staging URL is accessible: `curl https://staging.sorcyn.com/health` returns 200
- [ ] `TEST_FORCE_TOKEN` is set in staging `.env` (min 16 chars, different from any production token)
- [ ] `STAGING_DATABASE_URL`, `STAGING_VPS`, `STAGING_URL` are populated locally
- [ ] You have a private folder ready for screenshots: `docs/incidents/{YYYY-MM-DD}-observability-drill-evidence/`

## Procedure

Run the synthetic incident script:

```bash
STAGING_VPS=ubuntu@<staging-ip> \
STAGING_URL=https://staging.sorcyn.com \
TEST_FORCE_TOKEN=<staging-only-token> \
STAGING_DATABASE_URL=<staging-db-url> \
./scripts/synthetic-incident.sh
```

The script intentionally trips 4 alerts in sequence. At each `Press ENTER` prompt:

1. Capture a Slack screenshot from `#sorcyn-prod-alerts` showing the alert fired
2. Record whether the alert arrived within the target latency window
3. Inspect the alert payload for accidental PII (email addresses, street addresses, Stripe customer IDs)

## Step-by-Step Alert Expectations

| Step | Chaos action | Expected Prometheus alert | Target latency |
|------|-------------|---------------------------|---------------|
| 1 | `docker compose stop api` (90 s) | `ContainerDown` | < 1 min after container stops |
| 2 | 50 parallel `/api/v1/__test/force-500` requests | `ApiHigh5xxBurst` | < 1 min after burst |
| 3 | `pg_sleep(2)` injected (5 min window) | `ApiP95LatencyBreach` | < 2 min after query |
| 4 | Invalid `STRIPE_WEBHOOK_SECRET` + resend Stripe event | `StripeWebhookFailureSpike` | < 1 min after webhook |

## PII Inspection (T-S-09 cross-cut)

For each Slack alert payload, check that the following fields are **absent**:
- User email addresses
- Street addresses or location strings
- Stripe customer IDs (e.g. `cus_...`)
- Any field that would uniquely identify an individual

Record `clean` in the "PII leak in alerts?" column if all fields pass. Record `leak detected` and file a blocker if any PII is found — this blocks Phase 4 sign-off.

## Slack Evidence

<!-- AUDIT-MARKER:DRILL -->
| Drill date | Step 1 ContainerDown | Step 2 ApiHigh5xxBurst | Step 3 ApiP95LatencyBreach | Step 4 StripeWebhookFailureSpike | PII leak in alerts? | Status |
|------------|----------------------|------------------------|-----------------------------|-----------------------------------|---------------------|--------|
| 2026-XX-XX | TBD                  | TBD                    | TBD                         | TBD                               | TBD                 | TBD    |
<!-- /AUDIT-MARKER:DRILL -->

For each step, fill in `PASS` (alert reached Slack within target latency) or `FAIL` (with notes).
`Status: PASS` only if all 4 steps PASS **and** PII column = `clean`.

Save Slack screenshots to `docs/incidents/{YYYY-MM-DD}-observability-drill-evidence/`.

Commit results with:
```
git commit -m "docs(04-06): record first observability drill — 4/4 PASS [or N/4 PASS]"
```

## Continuous Monitors (Better Stack)

Configured per `user_setup` in 04-06-PLAN.md. Monitors run every 1–5 min from US-East / US-West / EU.

| Endpoint | Monitor type | Alert threshold |
|----------|-------------|-----------------|
| `GET /health` | HTTP | 2-of-3 regions fail for 2 consecutive checks |
| `POST /api/v1/auth/login` | HTTP | 2-of-3 regions fail for 2 consecutive checks |
| `GET /api/v1/posts` | HTTP | 2-of-3 regions fail for 2 consecutive checks |
| Stripe webhook URL | HTTP | 2-of-3 regions fail for 2 consecutive checks |

Alert routing: Better Stack → Slack `#sorcyn-prod-alerts` on 2-of-3 region failure.

## Rollback if Drill Fails

If any step FAILS or PII leak is detected:

1. File `docs/incidents/{YYYY-MM-DD}-observability-drill-failure.md` with the failing alert path and notes
2. Open a backlog plan to remediate the failed alert path (misconfigured AlertManager rule, missing Prometheus metric, PII in log format)
3. **BLOCK Phase 4 sign-off** until a clean drill (4/4 PASS, PII = clean) is recorded
4. Re-run the drill after remediation; record the second run in a new table row above
