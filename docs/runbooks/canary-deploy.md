# Canary Deploy Runbook

> Forward 10/50/100 canary deploy with manual stage gates. Per D-01, D-02, D-04.

## Prerequisites
- D-04 forward-compatible-only migration ADR is locked (`.planning/intel/decisions.md`) — Wave 0 gate
- `npx vitest run tests/audit` passes locally — D-04 regex gate is green
- Nightly backup completed within last 24 h (per docs/runbooks/dr-drill.md)
- VPS-B is the current canary target per `nginx/canary-state.json`
- Stripe Connect onboarding succeeds against staging (smoke-test the new image once before canary)

## Stage Progression

### Stage 1: 10%
1. `gh workflow run deploy-canary.yml -f stage=canary-10`
2. Approve in GitHub Actions environments (required reviewer = Faisal — D-02)
3. Wait 60 min soak. Watch:
   - `#sorcyn-prod-alerts` (no Sentry error spike, no 5xx burst, no p95 latency breach)
   - Better Stack live tail filtered to `host:vps-b.internal`
   - Sentry Performance dashboard p95 of canary deployment

### Stage 2: 50%
1. `gh workflow run deploy-canary.yml -f stage=canary-50`
2. Approve.
3. Wait 60 min soak. Same watch list.

### Stage 3: 100%
1. `gh workflow run deploy-canary.yml -f stage=canary-100`
2. Approve.
3. Wait 60 min soak.
4. After clean soak: `ssh lb-host '/opt/sorcyn-lb/set-weights.sh promote'`
   - This swaps roles: VPS-B becomes the new stable; VPS-A becomes the next canary target.

## If Anything Looks Off
- `gh workflow run rollback.yml` (see `docs/runbooks/rollback.md`)

## D-04 Migration Reminder
The canary box does NOT run `prisma migrate deploy`. Schema is shared between VPS-A and VPS-B. If a migration is shipping, it MUST be additive-only per D-04 — verified by `backend/tests/audit/closeout-audit.test.ts`.
