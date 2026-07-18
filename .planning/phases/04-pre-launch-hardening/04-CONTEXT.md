# Phase 4: Pre-Launch Hardening - Context

**Gathered:** 2026-04-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Prove every NFR gating the DFW Q3 2026 soft launch is passing — load + perf, security + PCI, accessibility, DR, observability, canary CI/CD, and 20-user UAT — through green test suites and signed-off runbooks. Also absorbs Phase 3's deferred mobile UX shell (Identity verify screen + EIN register field + Jobs roleTier dropdown + 2 backend smoke tests) per `03-VERIFICATION.md` Known Gaps.

**Scope (REQ-launch-readiness umbrella + 11 NFRs + Phase 3 carry-over):**
1. Load + perf hardening — sustain 1,000 concurrent users at API <500 ms p95 / search <500 ms / payment <3 s / DB <100 ms p95 for 15 min, zero error spike (NFR-performance, NFR-throughput, NFR-data-growth)
2. Security scan + PCI-DSS attestation — OWASP ZAP + Snyk no HIGH/CRITICAL, PCI-DSS SAQ-A via Stripe (NFR-security)
3. WCAG 2.1 AA accessibility audit + remediation across 40 customer-facing Flutter screens (NFR-accessibility)
4. DR drill — RTO <4 h / RPO <1 h, quarterly cadence, observability stack (centralized logging + distributed tracing + alerts + Grafana) verified by synthetic incident (NFR-disaster-recovery, NFR-uptime, NFR-error-handling, NFR-monitoring)
5. CI/CD canary 10/50/100 + one-click rollback (NFR-cicd) + 20-user UAT signed off in `docs/UAT_REPORT.md`
6. Test coverage to ≥70% with 70/20/10 unit/integration/E2E split (NFR-test-coverage)
7. **Phase 3 carry-over (folded as a Phase 4 sub-plan):** mobile Identity verify screen, register screen EIN field, Jobs roleTier dropdown, plus the 2 deferred backend smoke tests in `backend/tests/sellers.test.ts` + `backend/tests/auth.test.ts`

**Out of scope (deferred per CLAUDE.md / PRD §7 / STATE.md):**
- RLS policies (defense-in-depth) — Phase 6 (`REQ-rls-policies` v2)
- OAuth login + Twilio SMS verification — Phase 6
- Elasticsearch upgrade — Phase 6
- Shipping integration / B2B UI / Promotions / Automated dispute resolution — Phase 6
- Texas / national geo expansion — Phase 6 / 7
- Real estate / financing / enterprise verticals — Phase 7
- Claude Haiku AI upgrade — Phase 7
- Kubernetes + Argo Rollouts (canary alternative considered + rejected) — revisit only if traffic warrants
- Datadog APM (tracing alternative considered + rejected) — premium polish, revisit Phase 6+
- PagerDuty Professional — when team grows past solo founder

</domain>

<decisions>
## Implementation Decisions

### CI/CD Canary Architecture (NFR-cicd, SC#5)

- **D-01:** Canary infrastructure = **2nd VPS + Nginx weighted upstream**. Provision a second Hetzner-style VPS, put Nginx in front with weighted `upstream` blocks, and have GitHub Actions flip weights per stage (10% → 50% → 100%). Stays inside the existing SSH + docker-compose deploy model from Phase 1. Estimated additional infra cost ~$15–30/mo. Rejected: Fly.io/Railway migration (too much pure-migration scope), blue-green-via-health-check (does not satisfy strict reading of SC#5 "10/50/100 canary"), Kubernetes + Argo Rollouts (wrong scale for solo founder).
- **D-02:** Canary stage progression = **manual gate at each stage**. GitHub Actions deploys 10% on green CI → waits for human approval (workflow `environments` with required reviewer = Faisal) before flipping to 50% → same gate for 100%. Solo-founder reality: there is no on-call team to recover from a misfiring auto-promotion. Re-evaluate automated time-windowed promotion in Phase 6.
- **D-03:** One-click rollback = **Nginx weight flip back to old VPS**. Old version stays running on VPS-A while new version is on VPS-B during the canary window. `gh workflow run rollback.yml` re-applies the prior Nginx config (weight 100 → VPS-A, 0 → VPS-B). Recovery target <60 s. After 100% promotion + soak window, VPS-A is pulled and the next canary uses A as the fresh target (alternating roles). DB migrations are forward-compatible only — no schema rollback (see D-04).
- **D-04:** Forward-compatible-only migration contract during canary windows. Every Prisma migration must be **additive-only**: new columns nullable, new tables, no DROPs, no `NOT NULL` on existing columns. Destructive migrations (DROP, RENAME, NOT NULL backfill) ship in a follow-up release after the prior version has fully drained. **Lock as ADR in `.planning/intel/decisions.md` and reference from CLAUDE.md before any Phase 4 plan ships.** Prevents the 10%/90% schema-drift trap during canary.

### Observability Stack (NFR-monitoring, NFR-error-handling, SC#4)

- **D-05:** Distributed tracing = **Sentry Performance** (extend existing Sentry SDK). Sentry is already wired in `backend/src/config/sentry.ts` (Phase 1) and on mobile via `sentry_flutter`. Enable Performance Monitoring with `tracesSampleRate` config — same SDK, gives request traces + DB span breakdown + frontend↔backend trace correlation. Estimated $26/mo (Sentry Team plan covers MVP traffic). Zero new infrastructure. Rejected: OpenTelemetry → Jaeger self-hosted (real ops burden), Datadog APM (premium price, $31/host/mo + ingestion).
- **D-06:** On-call paging = **Slack-only**. Sentry + Prometheus AlertManager fire into a dedicated `#sorcyn-prod-alerts` Slack channel; mobile push from Slack acts as the page. Solo-founder reality: there is no rotation, you ARE the rotation. PagerDuty's value (escalation chains, multi-person rotation) does not apply pre-launch. Cost: $0. Re-evaluate in Phase 6 when team grows.
- **D-07:** Centralized logging = **Better Stack (Logtail)**. Hosted log aggregation, ~$24/mo for ~30 GB/month — covers MVP + headroom. Drop-in via `pino-logtail` transport (Fastify already uses pino). Search + alert + dashboard in one tool. Bonus adjacency: same vendor offers status pages and uptime synthetic monitors (used in D-08). Rejected: Grafana Loki self-hosted (ops burden), Sentry Logs (newer, weaker search UX), Datadog Logs (cost compounds fast).
- **D-08:** Synthetic incident verification (SC#4) = **both drill + continuous monitors**. Quarterly chaos drill via `scripts/synthetic-incident.sh` runbook that intentionally trips each alert path on staging: kill the API container (uptime alert), force a 5xx burst (error-rate alert), insert a slow query (latency alert), revoke a Stripe webhook secret (webhook-failure alert). Capture Slack-page screenshot evidence; document in `docs/runbooks/observability-drill.md`. **Plus** Better Stack continuous HTTP synthetic monitors from multiple regions every 1–5 min for passive coverage. Quarterly drill cadence committed to runbook.

### Claude's Discretion

The following gray areas were explicitly deferred to Claude during planning/research. The default approach is documented here — open to override during plan review.

- **Load test tooling + target environment (NFR-throughput, SC#1):** Default = **k6** (JavaScript scripting matches existing TS codebase, native Prometheus output integrates with D-05/D-06 stack, free tier sufficient at MVP volume). Target environment = dedicated staging cluster mirroring prod shape (same VPS class, same RDS-equivalent tier, anonymized prod data clone). Researcher to confirm k6 vs Artillery vs Gatling tradeoffs.
- **Mobile shell carry-over from Phase 3:** Default = **fold into Phase 4 as a sub-plan**, NOT push to 999.x backlog. Reason: SC#3 (accessibility audit on every customer-facing screen) and SC#5 (20-user UAT covering full transaction loop) both need full mobile surface to test against — pushing to backlog would force Phase 4 to test against an incomplete surface and re-test post-fix. Five small files per `03-VERIFICATION.md` Known Gaps: `identity_verify_screen.dart` (new), `seller_provider.dart` (action), `seller_repository.dart` (API call), `register_screen.dart` (EIN field), `app.dart` (route). Plus `manual_post_creation_screen.dart` (roleTier dropdown) and 2 backend smoke tests.
- **Test coverage gap path (NFR-test-coverage, SC#2):** Default = **measure first, then fill highest-risk gaps**. Run V8 coverage via existing `backend/vitest.config.ts` to establish baseline, then prioritize `.planning/codebase/CONCERNS.md` "Test Coverage Gaps" — payment webhook idempotency, transaction state transitions, auth session rotation (all flagged High). Re-evaluate 70% feasibility after gap-fill. Mobile coverage is a separate sub-question (Flutter `flutter test --coverage` already wired in Phase 1).
- **Accessibility tooling (NFR-accessibility, SC#3):** Default = **Flutter `accessibility_test` package + manual screen-reader walkthrough (TalkBack on Android, VoiceOver on iOS) per screen** + `axe-core` for any web touchpoints. Flutter has no axe-core equivalent; manual walkthrough is canonical for WCAG 2.1 AA on Flutter. Capture pass/fail per screen in `docs/A11Y_AUDIT.md`.
- **DR drill mechanics (NFR-disaster-recovery, SC#4):** Default = full restore-to-different-region drill with timed RTO + RPO measurement, executed once during Phase 4 produces signed-off `docs/runbooks/dr-drill.md`. Quarterly cadence committed.
- **20-user UAT recruitment + script (SC#5):** Default = 10 buyers + 10 sellers from DFW (mix of Sorcyn waitlist + DFW Reddit + Faisal's local network); UAT script covers full transaction loop (post → offer → accept → escrow → completion → review) plus the Phase 3 closeout surfaces (counter-offer, Stripe Identity, EIN business registration, Jobs lead-pricing). Sign-off captured in `docs/UAT_REPORT.md`.
- **PCI-DSS attestation timing (NFR-security, SC#2):** Default = research Stripe SAQ-A coverage path during Phase 4 research (per STATE.md blocker "confirm with Stripe support before scoping the security plan"); file the SAQ-A attestation as a Phase 4 deliverable. If Stripe support indicates SAQ-A is not currently filable for our integration shape, surface the blocker before plan execution and consider re-scoping.

### Folded Todos

None — `.planning/todos/pending/` is not populated.

</decisions>

<specifics>
## Specific Ideas

- **Solo-founder constraint is load-bearing on D-02, D-06, D-07.** Multiple choices (manual canary gate, Slack-only paging, hosted logs) optimize for "no team to escalate to" rather than for ergonomics or scale. Re-evaluate every observability + ops decision when Sami onboards or first hire lands (Phase 6+).
- **New ops cost envelope: ~$65–80/mo** = $15–30 (2nd VPS) + $26 (Sentry Perf) + $24 (Better Stack). Inside the CLAUDE.md infrastructure budget ($1,000–1,600/mo at 10K users). Re-budget if Sentry trace quota or Better Stack log volume exceeds plan tier at 1K+ DAU.
- **The forward-compatible-only migration ADR (D-04) is the highest-stakes decision in this phase.** A future plan that ships a destructive migration during the canary window will silently corrupt data for the 10%/90% split. Surface this rule in the planner's checklist, in CLAUDE.md, and in `.planning/intel/decisions.md` before any Phase 4 plan executes.
- **Phase 3 mobile shell folding rationale:** Pushing to 999.x backlog would create a chicken-and-egg with SC#3 + SC#5 — you cannot WCAG-audit a screen that does not yet exist, and the UAT script per SC#5 explicitly covers Phase 3 closeout surfaces. Folding it into Phase 4 as a small early-wave sub-plan unblocks the rest of the phase.
- **Audit suite expansion**: Phase 4 NFR audits (load test thresholds, accessibility pass-counts, security-scan zero-HIGH gate) extend `backend/tests/audit/closeout-audit.test.ts` rather than replace it. Phase 3's 26-assertion baseline is preserved as the foundation; Phase 4 adds NFR-specific blocks. CI gate stays single-command: `npx vitest run tests/audit`.
- **Rollback recovery time SLO of <60 s** (D-03) is intentionally tighter than NFR-uptime's 99.9% allowance; the goal is "rollback so fast it doesn't dent the uptime budget."

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase / Roadmap Anchors
- `.planning/ROADMAP.md` (Phase 4 section) — Goal, REQ-launch-readiness + 11 NFRs, 5 success criteria, ~6 plans estimate
- `.planning/REQUIREMENTS.md` — REQ-launch-readiness + NFR-performance / -throughput / -data-growth / -uptime / -disaster-recovery / -error-handling / -accessibility / -test-coverage / -cicd / -monitoring / -security
- `.planning/STATE.md` — Phase 4 setup notes; flagged blocker: "PCI-DSS attestation path depends on Stripe SAQ-A coverage; confirm with Stripe support before scoping the security plan"

### Phase 3 Carry-Over
- `.planning/phases/03-mvp-implementation-closeout/03-VERIFICATION.md` — "Known Gaps (deferred to follow-up)" section: precise file list for the mobile shell sub-plan + 2 backend smoke-test deferrals
- `.planning/phases/03-mvp-implementation-closeout/03-CONTEXT.md` — D-22 through D-26 Stripe Connect env-hardening pattern reused for Phase 4 prod-startup gates
- `.planning/phases/03-mvp-implementation-closeout/03-RESEARCH.md` — Stripe Identity hosted-flow integration shape + shared `STRIPE_WEBHOOK_SECRET` pattern (relevant for any new webhook plumbing in Phase 4)

### Locked ADRs / Decisions
- `.planning/intel/decisions.md` — 73 locked ADRs. Phase 4 will add new ADR for D-04 (forward-compatible-only migrations) before any plan ships
- `.planning/intel/requirements.md` — Source-of-truth for requirement IDs
- `CLAUDE.md` — Project constraints, scope guardrails, deferred-items list, infrastructure budget envelope ($1,000–1,600/mo at 10K users)
- `ReverseMktplPRD.md` — Full PRD spec (14,500+ lines). Treat as authoritative for any detail not in REQUIREMENTS.md

### Codebase Intel (Read for Patterns + Reusable Assets)
- `.planning/codebase/STRUCTURE.md` — Backend module pattern, Flutter feature module pattern
- `.planning/codebase/INTEGRATIONS.md` — Sentry / Stripe / R2 / Gemini / Google Maps env-var inventory + lazy-init patterns; Sentry init shape feeds D-05
- `.planning/codebase/TESTING.md` — Vitest test patterns, helpers, beforeAll/afterAll cleanup conventions, mocking rules (Stripe/SendGrid/etc. mocked, Prisma + Redis NOT mocked)
- `.planning/codebase/CONCERNS.md` — Tech debt, security considerations, performance bottlenecks, **Test Coverage Gaps** (payment webhook edge cases / transaction state transitions / auth session rotation flagged High → Phase 4 priorities for D-Claude-discretion test-coverage path)
- `.planning/codebase/ARCHITECTURE.md` — Modular monolith shape; Phase 4 canary infra preserves this
- `.planning/codebase/CONVENTIONS.md` — Code conventions

### Existing Code Anchors (Direct File:Line Refs)
- `backend/src/config/sentry.ts` — Existing Sentry init (Phase 1). D-05 enables Performance Monitoring on this surface
- `backend/src/config/env.ts` (with Phase 3 plan 03-02 `validateProductionEnv` block) — Pattern for D-04 ADR enforcement and any new Phase 4 env gates
- `backend/vitest.config.ts` — Existing V8 coverage config. Test-coverage Claude-discretion path measures from this baseline
- `backend/tests/audit/closeout-audit.test.ts` — Phase 3 audit suite (26/26 passing). Phase 4 NFR audits extend this; CI gate stays `npx vitest run tests/audit`
- `backend/tests/helpers.ts` — Shared test utilities (createTestUser, makeAdmin, cleanupTestData, clearAuthRedisKeys); Phase 4 test additions reuse these
- `.github/workflows/*.yml` — Current 3-job CI pipeline (lint/typecheck → test → build-docker no-push). D-01 + D-02 + D-03 extend this with deploy + canary + rollback workflows
- `docker-compose.yml` + `Dockerfile` — Reused on the second VPS for D-01
- `nginx/` config (location TBD by researcher) — Modified for D-01 weighted upstream + D-03 weight-flip rollback
- `docs/DEPLOYMENT.md` — Current single-VPS deploy guide. Phase 4 expands this with canary + rollback + DR drill sections

### Phase 3 Mobile Shell Carry-Over (Fold-In Targets)
- `mobile/lib/features/sellers/presentation/screens/identity_verify_screen.dart` (NEW) — `url_launcher` opens Stripe Identity hosted-flow URL; `WidgetsBindingObserver` refetches profile on `AppLifecycleState.resumed`
- `mobile/lib/features/sellers/providers/seller_provider.dart` — `startIdentityVerification` action
- `mobile/lib/features/sellers/data/repositories/seller_repository.dart` — `POST /sellers/identity/verify` call
- `mobile/lib/features/auth/presentation/screens/register_screen.dart` — EIN input field shown when `isBusiness` toggle is on; client-side regex validation
- `mobile/lib/app.dart` — Register `IdentityVerifyScreen` route
- `mobile/lib/features/posts/presentation/screens/manual_post_creation_screen.dart` — `roleTier` `DropdownButtonFormField` shown when category is Jobs (entry / mid / specialized_senior)
- `backend/tests/sellers.test.ts` + `backend/tests/auth.test.ts` — Identity-session + EIN-gate API smoke tests (deferred from 03-06)

### Documentation Targets (Phase 4 Will Create)
- `docs/runbooks/observability-drill.md` — Quarterly chaos-drill runbook (D-08)
- `docs/runbooks/dr-drill.md` — DR restore drill runbook (Claude discretion)
- `docs/runbooks/rollback.md` — One-click rollback runbook (D-03)
- `docs/A11Y_AUDIT.md` — Per-screen WCAG 2.1 AA pass/fail (Claude discretion)
- `docs/UAT_REPORT.md` — 20-user UAT sign-off (Claude discretion, SC#5 mandate)
- `docs/PCI_SAQ_A.md` — Stripe SAQ-A attestation (Claude discretion, pending Stripe support confirmation)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Sentry SDK already wired** (`backend/src/config/sentry.ts` + `mobile/lib/main.dart` via `sentry_flutter`) — D-05 flips Performance Monitoring on without adding a new vendor
- **Pino logger in Fastify** — D-07 adds `pino-logtail` transport without replacing the logger
- **Prometheus metrics via `prom-client`** (Phase 1) — Grafana dashboards for SC#4 read from this; AlertManager configuration extends existing scrape targets
- **`validateProductionEnv` pattern** (`backend/src/config/env.ts`, Phase 3 plan 03-02) — Reused to enforce Phase 4 prod-startup gates (e.g., refuse start if `BETTER_STACK_TOKEN` unset in prod)
- **`backend/tests/audit/closeout-audit.test.ts`** (Phase 3) — Phase 4 NFR audits add describe blocks per success criterion; preserves the single CI gate command
- **`backend/tests/helpers.ts`** — `createTestUser`, `makeAdmin`, `cleanupTestData`, `clearAuthRedisKeys` reused by load-test seeding scripts and any new audit assertions
- **GitHub Actions 3-job pipeline** (lint/typecheck → test → build-docker no-push) — Phase 4 adds 4th job (push to GHCR) + 5th workflow (canary deploy) + 6th workflow (rollback)
- **Existing Docker + Nginx + SSL stack** (Phase 1) — Reused on the 2nd VPS for D-01 (no platform migration)
- **Phase 3 Stripe Identity hosted-flow pattern** (RESEARCH.md, plan 03-06) — Mobile shell carry-over implements the documented `url_launcher` flow; no design uncertainty

### Established Patterns
- **Single Stripe webhook endpoint with shared `STRIPE_WEBHOOK_SECRET`** (Phase 3 RESEARCH.md Pitfall 2) — Any new Phase 4 webhook (e.g., Stripe SAQ-A workflow events) reuses the existing endpoint
- **Lazy SDK init pattern** (`getStripe()`, `getGemini()`) — Better Stack client (D-07) follows the same lazy-singleton pattern
- **Backend audit-suite-as-CI-gate** (Phase 3) — Phase 4 NFR audits inherit this pattern; do not introduce a parallel CI mechanism
- **Test isolation: `beforeAll` setup, `afterAll` teardown, `beforeEach` Redis clear** — Load test scripts respect this where they share the test DB
- **Forward-compatible-only migrations** (D-04, NEW) — Locked as ADR; planner enforces in plan check

### Integration Points
- **2nd VPS provisioning (D-01)**: New `infra/` directory or extension of existing deploy config; Hetzner API or Terraform module; SSH key distribution via GitHub Secrets
- **Nginx weighted upstream (D-01, D-03)**: Modify Nginx config (likely in `nginx/` or rendered via the deploy workflow); add `weight=X` to `upstream` directive; rollback workflow re-renders config from a saved-state file
- **GitHub Actions environment gates (D-02)**: Define `staging-canary-10`, `staging-canary-50`, `production` environments in repo settings with required reviewer
- **Sentry Performance enablement (D-05)**: One-line `tracesSampleRate` config in `backend/src/config/sentry.ts` + same in `mobile/lib/main.dart` — researcher to recommend sampling rate at MVP traffic
- **Better Stack ingestion (D-07)**: `pino-logtail` transport + `BETTER_STACK_TOKEN` env var added to `validateProductionEnv` enforcement
- **Slack alert routing (D-06)**: AlertManager config + Sentry → Slack integration via Sentry's native Slack app + dedicated `#sorcyn-prod-alerts` channel
- **Synthetic incident script (D-08)**: New `scripts/synthetic-incident.sh` runs against staging; CI optionally invokes it post-deploy as a health check
- **Mobile shell carry-over**: Phase 4 sub-plan reuses Phase 2 Sorcyn design tokens + `gradient_button` / `app_input_field` shared widgets; no new design contract needed

</code_context>

<deferred>
## Deferred Ideas

- **Kubernetes + Argo Rollouts canary** — wrong scale for solo-founder MVP; revisit Phase 7 if traffic warrants progressive-delivery sophistication
- **Datadog APM** — premium polish at premium price ($31/host/mo + ingestion); revisit Phase 6+ when team can justify the tool premium
- **PagerDuty Professional plan** — relevant when team grows past one person; out of scope for pre-launch
- **Sentry Logs (single-vendor consolidation)** — interesting future move; revisit at next Sentry/Better Stack contract renewal
- **OpenTelemetry → Jaeger self-hosted** — viable Phase 6+ alternative if Sentry Performance trace quota becomes cost-prohibitive at >10K DAU
- **Automated time-windowed canary promotion** — moves from manual gates (D-02) to threshold-driven auto-promotion when team can write + trust the metric-check + auto-rollback plumbing; Phase 6+
- **Two-deploy expand/contract migration pattern** — more robust than D-04's forward-compatible-only rule but 3 deploys per breaking change; revisit if D-04 ever produces a deferred-migration backlog longer than ~3 items
- **Slack-triggered manual canary promotion** — UX polish over GitHub Actions environment gates (D-02); marginal win, defer until pain shows
- **Better Stack status pages** — adjacency to D-07 logging plan; spin up post-launch when public status page becomes meaningful (Phase 5 or 6)
- **Multi-device FCM token storage** (per CONCERNS.md "Dependencies at Risk") — single-device limitation predates Phase 4; capture as a Phase 6 polish item, not a launch blocker
- **Webhook idempotency keys** (per CONCERNS.md "Missing Critical Features") — flagged High priority for Phase 4 test-coverage gap-fill (auth + payment paths); the broader idempotency-key infrastructure is Phase 6
- **Message moderation / content filtering** (per CONCERNS.md) — payment-detection regex is in place but no moderation actions; Phase 6 trust + safety scope
- **N+1 query in conversation listing** (per CONCERNS.md) — performance refactor; capture as Phase 4 perf-pass candidate IF load test surfaces it as a blocker, otherwise Phase 6 polish

### Reviewed Todos (not folded)

None — no todos in `.planning/todos/pending/` to review.

</deferred>

---

*Phase: 04-pre-launch-hardening*
*Context gathered: 2026-04-30 via /gsd-discuss-phase 4*
