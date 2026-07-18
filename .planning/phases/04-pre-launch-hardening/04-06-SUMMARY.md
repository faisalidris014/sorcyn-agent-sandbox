---
phase: 04-pre-launch-hardening
plan: "06"
subsystem: observability-drill
tags: [chaos-drill, synthetic, monitors, observability, D-08]
dependency_graph:
  requires: ["04-03"]
  provides: ["SC4-observability-partial", "force-500-endpoint", "synthetic-incident-script", "observability-runbook"]
  affects: ["backend/src/app.ts", "backend/src/config/env.ts", "backend/tests/audit/closeout-audit.test.ts"]
tech_stack:
  added: []
  patterns:
    - "NODE_ENV-gated route registration (primary) + module-level guard (belt-and-suspenders)"
    - "X-Test-Token header gate (min 16 chars) for staging-only chaos endpoint"
    - "bash trap handler for automatic staging restoration on script exit/abort"
    - "AUDIT-MARKER HTML comment brackets for machine-parseable evidence tables"
key_files:
  created:
    - backend/src/modules/test/test.routes.ts
    - backend/tests/test-routes.test.ts
    - scripts/synthetic-incident.sh
    - docs/runbooks/observability-drill.md
  modified:
    - backend/src/config/env.ts
    - backend/src/app.ts
    - backend/tests/audit/closeout-audit.test.ts
decisions:
  - "D-08: SC#4 synthetic verification = both quarterly chaos drill AND continuous Better Stack monitors"
  - "RESEARCH Open Question 3 Option (a): force-500 endpoint gated by NODE_ENV at registration + token header"
  - "T-S-05 mitigation: script aborts if STAGING_URL matches prod host fragment and does not contain 'staging'"
  - "T-S-09 cross-cut: drill explicitly inspects each alert payload for PII; AUDIT-MARKER table captures result"
metrics:
  duration: "~9 minutes"
  completed: "2026-05-11"
  tasks_completed: 3
  tasks_pending: 1
  files_created: 4
  files_modified: 3
---

# Phase 4 Plan 06: Synthetic Incident Drill (D-08) Summary

**One-liner:** Staging-only force-500 chaos endpoint (NODE_ENV + token-gated) + 4-step synthetic incident script with restoration trap + observability runbook with AUDIT-MARKER evidence template; 44 audit assertions passing.

## Task Status

| Task | Name | Status | Commit |
|------|------|--------|--------|
| 1 | Force-500 endpoint with token gate (TDD) | COMPLETE | 5d841be (RED), 42651af (GREEN) |
| 2 | Synthetic incident script + observability runbook | COMPLETE | f354994 |
| 3 | Execute first observability drill — capture Slack evidence | PENDING-CHECKPOINT | — |
| 4 | Audit-suite SC4 partial assertion | COMPLETE | a8c57a4 |

## Task 1: Force-500 Chaos Endpoint

**Implementation:** `backend/src/modules/test/test.routes.ts` registers `GET /api/v1/__test/force-500` with two layers of protection:
- **Primary gate:** `if (env.NODE_ENV !== 'production')` at registration in `app.ts` — route never appears in production
- **Belt-and-suspenders:** `if (env.NODE_ENV === 'production') return` inside the plugin itself
- **Token gate:** `X-Test-Token` header must match `TEST_FORCE_TOKEN` env var (min 16 chars)
- **Production guard:** `validateProductionEnv()` now rejects startup if `TEST_FORCE_TOKEN` is set when `NODE_ENV=production`

**Tests:** 3 tests cover 403 (no token), 403 (wrong token), 500 (correct token). All pass.

## Task 2: Synthetic Incident Script

**`scripts/synthetic-incident.sh`** implements the 4-step RESEARCH §7 procedure:
- Step 1: `docker compose stop api` → 90 s sleep → expect `ContainerDown` (<1 min target)
- Step 2: 50 parallel `curl` to `/api/v1/__test/force-500` → 90 s sleep → expect `ApiHigh5xxBurst` (<1 min target)
- Step 3: `pg_sleep(2)` via psql → 5 min window → expect `ApiP95LatencyBreach` (<2 min target)
- Step 4: Invalid `STRIPE_WEBHOOK_SECRET` + resend Stripe event → 3 min → expect `StripeWebhookFailureSpike` (<1 min target)

Safety features: staging-only guard (T-S-05), `trap restore EXIT` restores container even on Ctrl-C, `read -r _` prompts pause for screenshot capture.

**`docs/runbooks/observability-drill.md`** documents the full procedure including PII-inspection column (T-S-09) and Better Stack continuous monitor table.

## Task 3: First Observability Drill — PENDING CHECKPOINT

**Drill result:** NOT YET EXECUTED — awaiting human execution on staging.

The drill requires:
1. Better Stack continuous monitors configured (4 endpoints × multi-region per `user_setup`)
2. Staging environment healthy and `TEST_FORCE_TOKEN` populated
3. Execution of `scripts/synthetic-incident.sh` end-to-end
4. Slack screenshots captured at each `Press ENTER` prompt from `#sorcyn-prod-alerts`
5. AUDIT-MARKER:DRILL table filled with PASS/FAIL + PII-inspection result
6. Commit: `docs(04-06): record first observability drill — N/4 PASS`

**Observability drill SIGNED OFF:** PENDING — first drill not yet executed.
Phase 4 sign-off on SC#4 (observability side) is blocked until all 4 alert paths PASS and PII column = `clean`.

## Task 4: Audit Suite SC4 Partial

44 total audit assertions (39 prior + 5 new). New assertions in `Phase 4 Pre-Launch — SC4 partial: Observability drill`:
1. `scripts/synthetic-incident.sh` exists and is executable
2. Chaos script has `trap restore EXIT` and `Refusing to run` staging guard
3. `docs/runbooks/observability-drill.md` exists with `AUDIT-MARKER:DRILL` block and all 4 alert names
4. AUDIT-MARKER:DRILL block has parseable header + at least 1 data row
5. Force-500 route is gated by `NODE_ENV === 'production'` check

## Deviations from Plan

None — plan executed exactly as written. Task 3 is intentionally stopped at checkpoint per `autonomous: false` plan frontmatter.

## Threat Surface Scan

No new network endpoints beyond the explicitly planned `/api/v1/__test/force-500` (staging-only, never reachable in production). No schema changes. No new auth paths. Threat model T-04-06-01 through T-04-06-07 fully addressed in implementation.

## Self-Check

### Files Created
- `/Users/faisalidris/ReverseMarketplace/backend/src/modules/test/test.routes.ts` — exists
- `/Users/faisalidris/ReverseMarketplace/backend/tests/test-routes.test.ts` — exists
- `/Users/faisalidris/ReverseMarketplace/scripts/synthetic-incident.sh` — exists, executable
- `/Users/faisalidris/ReverseMarketplace/docs/runbooks/observability-drill.md` — exists

### Files Modified
- `backend/src/config/env.ts` — TEST_FORCE_TOKEN added + production guard added
- `backend/src/app.ts` — testRoutes import + conditional registration
- `backend/tests/audit/closeout-audit.test.ts` — 5 new SC4 assertions appended

### Commits
- `5d841be` — test(04-06): RED phase
- `42651af` — feat(04-06): GREEN phase
- `f354994` — feat(04-06): synthetic incident + runbook
- `a8c57a4` — test(04-06): audit SC4 partial

## Self-Check: PASSED
