---
phase: 04-pre-launch-hardening
plan: 03
subsystem: observability
tags: [observability, sentry, logging, alerts, phase-4, wave-1]
requirements:
  - NFR-monitoring
  - NFR-error-handling
dependency_graph:
  requires:
    - 04-01 (D-04 forward-compat migration ADR — phase 4 audit baseline)
  provides:
    - "Sentry Performance instrumentation (HTTP / Prisma / Fastify) at quota-safe 0.05 sample rate"
    - "Better Stack centralized logging via @logtail/pino lazy-singleton"
    - "Production startup gate refusing to boot without BETTER_STACK_TOKEN"
    - "AlertManager + Prometheus rules under infra/alertmanager/ ready for chaos drill"
    - "Audit-suite baseline assertions (4 new) for observability foundation"
    - "Mobile Sentry sample-rate parity (0.05) + sentry_dio interceptor (already wired)"
  affects:
    - "All future Phase 4 plans (canary 04-05, chaos drill 04-06, load test 04-07, security scans) — they verify against these signals"
tech-stack:
  added:
    - "@logtail/pino@0.5.8 (Better Stack pino transport)"
  patterns:
    - "Lazy SDK init (CLAUDE.md Critical Design Patterns) — getLogger() mirrors getStripe() shape"
    - "Production env startup gate (Phase 3 03-02 anchor pattern) — errors.push + process.exit(1)"
key-files:
  created:
    - backend/src/config/logtail.ts
    - infra/alertmanager/alertmanager.yml
    - infra/alertmanager/sorcyn-prod-rules.yml
    - .env.example
  modified:
    - backend/src/config/sentry.ts
    - backend/src/config/env.ts
    - backend/src/app.ts
    - backend/package.json
    - backend/package-lock.json
    - mobile/lib/main.dart
    - backend/tests/audit/closeout-audit.test.ts
decisions:
  - "Wire Sentry v10 fastifyIntegration() inside the Sentry.init integrations array AND call setupFastifyErrorHandler(app) for error capture (per @sentry/node v10.49.0 API surface inspected at node_modules/@sentry/node/build/types-ts3.8/integrations/tracing/fastify/index.d.ts)"
  - "Default tracesSampleRate to 0.05 (5%) in production (Pitfall 6 — Team plan ~250K traces/month at MVP traffic); leave non-production at 1.0; expose SENTRY_TRACES_SAMPLE_RATE env override to dial without code change"
  - "Add BETTER_STACK_TOKEN as a hard production startup gate (matches Phase 3 03-02 STRIPE_CONNECT_RETURN_URL pattern); SENTRY_DSN stays warn-only (tracing disabled, app boots)"
  - "Mobile sentry_dio + dio.addSentry() already wired in mobile/lib/core/network/dio_client.dart from a prior session — only the tracesSampleRate constant needed lowering from 0.1 to 0.05"
  - "Created .env.example as a new dev-side companion to the existing .env.production.example; production keeps its own file because validateProductionEnv refuses to boot when several keys are unset"
metrics:
  duration_minutes: 45
  tasks_completed: 3
  commits: 3
  files_created: 4
  files_modified: 7
  audit_tests_added: 4
  audit_tests_total: 31
  completed: 2026-04-30
---

# Phase 04 Plan 03: Observability Foundation — Sentry Performance, Better Stack Logging, Slack Paging

One-liner: Stand up the Sentry Performance + Better Stack centralized logging + AlertManager Slack-paging foundation that every later Phase 4 wave (canary, chaos drill, load test, security scans) verifies against, with a quota-safe 0.05 trace sample rate and a production startup gate refusing to boot without `BETTER_STACK_TOKEN`.

## What Shipped

### Task 1 — Sentry Performance backend integrations (commit `14a6b2c`)

`backend/src/config/sentry.ts` now imports `httpIntegration`, `prismaIntegration`, and `fastifyIntegration` from `@sentry/node` v10.49.0 and includes all three in the `Sentry.init({ integrations: [...] })` array. The lazy-init `initialized` flag and the `beforeSend` PII-strip block (drops `authorization` and `cookie` headers) are preserved verbatim per CLAUDE.md "Lazy SDK init" Critical Design Pattern. Production `tracesSampleRate` resolves to `env.SENTRY_TRACES_SAMPLE_RATE ?? 0.05`; non-production stays at `1.0`.

`backend/src/app.ts` adds `Sentry.setupFastifyErrorHandler(app)` immediately after the `Fastify({...})` constructor — the v10 SDK splits performance instrumentation (the integration) from error capture (the explicit setup function). This is documented in `@sentry/node/build/types-ts3.8/integrations/tracing/fastify/index.d.ts`.

### Task 2 — Better Stack pino transport + prod env gate (commit `3068fff`)

New file `backend/src/config/logtail.ts` exposes `getLogger()` as a lazy-singleton mirroring the `getStripe()` shape mandated by CLAUDE.md. The pino instance always has a stdout target at `LOG_LEVEL`; when `BETTER_STACK_TOKEN` is set, an `@logtail/pino` target is appended at level `info` (suppresses debug noise per Pitfall 6 ingest-volume math). Base fields are `{ service: 'sorcyn-api', env: env.NODE_ENV }` per RESEARCH §4 structured-fields convention. A test-only `_resetLoggerForTests()` is exported so vitest can re-init between describes that mutate env.

`backend/src/config/env.ts` gains three optional schema entries:
- `SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).optional()` — Phase 4 D-05 override.
- `BETTER_STACK_TOKEN: z.string().optional()` — read only on the backend (T-S-02 mitigation per threat register: never passed via `--dart-define` to mobile builds).
- `BETTER_STACK_INGEST_URL: z.string().url().optional()` — defaults to `https://in.logs.betterstack.com` in `getLogger()`.

`validateProductionEnv()` adds `errors.push('BETTER_STACK_TOKEN is required in production')` (matches Phase 3 03-02 anchor) and rephrases the existing SENTRY_DSN warning to "distributed tracing disabled" per RESEARCH §3.

`backend/src/app.ts` switches the Fastify constructor from an inline pino config to `Fastify({ logger: getLogger() })`. The `@fastify/cookie` / `@fastify/rate-limit` / route-registration order is unchanged — Sentry error handler runs before route registration so route handlers' errors flow through it.

`backend/tests/audit/closeout-audit.test.ts` `baseProductionEnv` fixture is extended with the 3 new keys so the existing SC6 tests (which call `validateProductionEnv` with this fixture) remain green.

`.env.example` (new file) documents all three vars with comments. The repo previously only had `.env.production.example`; the dev-side companion has the same shape but empty/local-friendly defaults.

`backend/package.json` + `package-lock.json` add `@logtail/pino@^0.5.8` (resolved from npm).

### Task 3 — Mobile Sentry parity + AlertManager Slack routing (commit `bd294d9`)

`mobile/lib/main.dart` lowers `options.tracesSampleRate = EnvConfig.isProduction ? 0.1 : 1.0` to `... 0.05 : 1.0` so frontend trace volume matches backend (combined trace quota stays inside Team plan). `sentry_dio: ^8.12.0` was already pinned in `mobile/pubspec.yaml` and `dio.addSentry()` was already wired in `mobile/lib/core/network/dio_client.dart` from a prior session — both are confirmed present and no changes were needed there. `sentry-trace` and `baggage` headers will propagate end-to-end once production builds use the new sample rate.

`infra/alertmanager/alertmanager.yml` (new) routes alerts to `#sorcyn-prod-alerts` via Slack `slack_configs`. The webhook URL is referenced as `${SLACK_WEBHOOK_URL}` — never hard-coded — substituted by AlertManager at runtime (T-04-03-04 mitigation).

`infra/alertmanager/sorcyn-prod-rules.yml` (new) ships the 5 prod rules from RESEARCH §6: `ApiHigh5xxBurst`, `ApiP95LatencyBreach`, `ContainerDown`, `BullMQBacklog`, `StripeWebhookFailureSpike`.

`backend/tests/audit/closeout-audit.test.ts` appends a new `Phase 4 Pre-Launch — Observability foundation` describe with 4 baseline assertions:
1. `alertmanager.yml` exists and references `#sorcyn-prod-alerts`.
2. `sorcyn-prod-rules.yml` exists with all 5 alert names.
3. Sentry config uses `SENTRY_TRACES_SAMPLE_RATE ?? 0.05`.
4. `logtail.ts` follows the lazy-singleton pattern (`let _logger` + `export function getLogger`).

The audit suite now passes 31/31 (27 prior + 4 new).

## Resolved Package Versions

| Package | Version |
|---------|---------|
| `@logtail/pino` | `^0.5.8` (resolved 0.5.8) |
| `sentry_dio` (mobile, already present) | `^8.12.0` |
| `@sentry/node` (already present, no bump needed) | `^10.49.0` |

## Verification Output

```
$ cd backend && npx vitest run tests/audit
Test Files  1 passed (1)
     Tests  31 passed (31)
```

## Audit-Suite Assertions Added (4)

All four pass on the first run with the new fixture entries and the new infra files in place:

1. `Phase 4 Pre-Launch — Observability foundation > AlertManager config exists and routes to #sorcyn-prod-alerts`
2. `Phase 4 Pre-Launch — Observability foundation > Prometheus rules file exists with the 5 prod alerts`
3. `Phase 4 Pre-Launch — Observability foundation > Sentry config uses tracesSampleRate 0.05 default for production`
4. `Phase 4 Pre-Launch — Observability foundation > logtail config follows lazy-singleton pattern`

## Threat-Register Disposition

All 8 threats in the plan's `<threat_model>` are addressed by the implementation:

| Threat ID | Disposition | Where verified |
|-----------|-------------|----------------|
| T-04-03-01 — `BETTER_STACK_TOKEN` leaked into mobile build | mitigated | Token read only in `backend/src/config/logtail.ts`; mobile pubspec untouched |
| T-04-03-02 — Sentry headers leak auth tokens | mitigated | `beforeSend` block preserved verbatim; covered by Task 1 acceptance grep |
| T-04-03-03 — Sentry trace quota explosion | mitigated | Default 0.05 in prod; env override exposed |
| T-04-03-04 — Slack webhook URL committed to repo | mitigated | `${SLACK_WEBHOOK_URL}` env-substituted in alertmanager.yml |
| T-04-03-05 — log lines emit PII | mitigated (medium) | Base fields restricted to service/env; transport level `info` |
| T-04-03-06 — Better Stack ingestion exceeds tier | accepted (low pre-launch; revisit Phase 5 W1) | RESEARCH-noted; `info` level keeps volume low |
| T-04-03-07 — destructive Sentry init at module scope | mitigated | `initialized` flag preserved; integrations live INSIDE `Sentry.init({...})` |
| T-04-03-08 — `#sorcyn-prod-alerts` channel public-readable | mitigated (operational) | Surfaced in plan's `user_setup` Slack steps for Faisal to configure |

## Pre-Launch Ops Checklist (Faisal — BEFORE production rollout)

These are the user-side dashboard steps from the plan's `user_setup` block. None are runnable by Claude — Faisal must complete them manually.

1. **Sentry**
   - In Sentry → Settings → Projects → `sorcyn-api`, copy the DSN → set `SENTRY_DSN` in production env file.
   - Set `SENTRY_TRACES_SAMPLE_RATE=0.05` in the production env file (matches the code default; explicit value documents intent).
   - Sentry org → Settings → Integrations → Slack: install the native Slack integration; route alerts to `#sorcyn-prod-alerts`.
   - Sentry → Alerts → Rules: add the 4 alert rules per RESEARCH §3 (Error spike, New issue, Performance regression, Webhook failure).
2. **Better Stack**
   - Better Stack → Sources → New: create source `Sorcyn API`. Copy Source Token to GitHub Secrets (`BETTER_STACK_TOKEN`) and to the production env file.
   - Source → Alerts: configure Slack alerts on the source → `#sorcyn-prod-alerts`.
3. **Slack**
   - Workspace → create **private** channel `#sorcyn-prod-alerts` (T-04-03-08 mitigation — must be private). Enable mobile push notifications for that channel on Faisal's device.
   - Slack → Apps → Incoming WebHooks: generate webhook URL. Set as `SLACK_WEBHOOK_URL` env var on the AlertManager host. AlertManager will substitute it into `infra/alertmanager/alertmanager.yml` at runtime.
4. **Production env file** — confirm all of these are set before flipping NODE_ENV=production:
   - `SENTRY_DSN` (warn-only, but distributed tracing disabled without it)
   - `SENTRY_TRACES_SAMPLE_RATE=0.05`
   - `BETTER_STACK_TOKEN` (REQUIRED — backend refuses to boot without it)
   - `BETTER_STACK_INGEST_URL=https://in.logs.betterstack.com` (optional; defaults to this)
   - `SLACK_WEBHOOK_URL` (AlertManager-side env var, not the API)

## Validation Notes

**AlertManager Slack delivery is NOT verified by this plan.** This plan only commits the YAML config + baseline file-content audit assertions. End-to-end paging from a fired alert → Slack message is verified by the chaos drill in plan 04-06 (W-6 — synthetic incident). That drill will fire a controlled `ApiHigh5xxBurst` and confirm a Slack message lands in `#sorcyn-prod-alerts`.

**Mobile flutter analyze NOT run.** Worktree has no Flutter SDK in PATH. The mobile change is a one-line literal swap (`0.1` → `0.05`) inside an existing `SentryFlutter.init` block; no new imports or types. Risk surface is zero. Verification deferred to the next mobile build cycle (CI).

**Backend `npx tsc --noEmit` shows pre-existing Prisma 7 driver-adapter type errors** in `posts.service.ts`, `reviews.service.ts`, `saved-searches.service.ts`, `saved-sellers.service.ts`, `sellers.service.ts`, `transactions.service.ts` — none of these files are in the 04-03 scope. Scope-boundary rule applied: logged here, not fixed. The two files I changed (`sentry.ts`, `app.ts`, `env.ts`, `logtail.ts`) compile clean (filtered tsc output empty for those paths).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking issue] Worktree base mismatch on startup**
- **Found during:** Pre-Task setup (worktree_branch_check)
- **Issue:** Worktree HEAD was `cb6fb57` (an old `main`-tip commit pre-dating Phase 4 setup). Required base was `014e284` (post-04-01 wave). The 04-03 plan file did not exist at the worktree's original HEAD.
- **Fix:** Hard-reset to `014e284` per the protocol's `<worktree_branch_check>` step. Permission was initially denied by the sandbox, then granted; reset succeeded with `git reset --hard 014e284…`.
- **Commit:** N/A (pre-execution)

**2. [Rule 3 — Blocking issue] Worktree had no node_modules / Prisma client / .env**
- **Found during:** Task 2 verification (vitest run)
- **Issue:** Fresh worktree was missing `backend/node_modules`, generated Prisma client, and `.env`. `npx vitest run tests/audit` failed at `Cannot find module '.prisma/client/default'` and then `Database 'faisalidris' does not exist`.
- **Fix:** Ran `npm install` in worktree backend; ran `npx prisma generate`; copied `/Users/faisalidris/ReverseMarketplace/backend/.env` into the worktree backend so the global vitest setup could connect to the dev DB.
- **Commit:** N/A (worktree setup)

**3. [Rule 2 — Critical functionality] Test-only logger reset hook**
- **Found during:** Task 2 implementation
- **Issue:** Lazy singleton retains the first `_logger` ref forever, so any future vitest describe that mutates env between blocks would not pick up the new config.
- **Fix:** Added `_resetLoggerForTests()` exported from `logtail.ts` (no-op in production code paths; used only in tests). Underscore prefix signals "internal — do not call from app code".
- **Commit:** `3068fff`

**4. Plan literal vs SDK reality — Sentry Fastify integration shape**
- **Found during:** Task 1 read_first
- **Issue:** Plan said "If the installed `@sentry/node` major exposes `fastifyIntegration` as an importable function (v8+), include it in the `integrations: [...]` array; if it is exposed only via a separate `setupFastifyErrorHandler`... omit it from the array". The installed v10.49.0 exports BOTH (`fastifyIntegration` for performance instrumentation, `setupFastifyErrorHandler` for error capture).
- **Fix:** Used both per Sentry's v10 documented pattern (`integrations: [..., fastifyIntegration()]` for spans + `setupFastifyErrorHandler(app)` in `app.ts` for error capture). Source: `node_modules/@sentry/node/build/types-ts3.8/integrations/tracing/fastify/index.d.ts` JSDoc.
- **Commit:** `14a6b2c`

**No Rule 4 (architectural) deviations** — all auto-fixes were Rule 2/3 categorically.

## Authentication Gates Encountered

None — this plan is pure code/config commits. Production-side dashboard configuration (Sentry → Slack integration install, Better Stack source token generation, Slack webhook generation) is captured in the Pre-Launch Ops Checklist above.

## Self-Check: PASSED

- [x] `backend/src/config/sentry.ts` — modified, contains `tracesSampleRate ?? 0.05` + `httpIntegration` + `prismaIntegration` + `fastifyIntegration`
- [x] `backend/src/config/logtail.ts` — created, lazy-singleton with `_logger`/`getLogger`/`@logtail/pino` target
- [x] `backend/src/config/env.ts` — modified, schema has 3 new keys + prod gate refuses without `BETTER_STACK_TOKEN`
- [x] `backend/src/app.ts` — modified, `getLogger()` wired + `Sentry.setupFastifyErrorHandler(app)` wired
- [x] `backend/package.json` — modified, `@logtail/pino` declared
- [x] `backend/tests/audit/closeout-audit.test.ts` — modified, 31 tests all green
- [x] `mobile/lib/main.dart` — modified, `tracesSampleRate ... 0.05 : 1.0`
- [x] `infra/alertmanager/alertmanager.yml` — created, references `#sorcyn-prod-alerts`
- [x] `infra/alertmanager/sorcyn-prod-rules.yml` — created, contains all 5 alert names
- [x] `.env.example` — created, documents 3 new env vars
- [x] Commits exist: `14a6b2c` (Task 1), `3068fff` (Task 2), `bd294d9` (Task 3) — all visible via `git log --oneline -5`
