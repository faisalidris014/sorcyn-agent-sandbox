# Phase 4: Pre-Launch Hardening - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `04-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-04-30
**Phase:** 04-pre-launch-hardening
**Areas discussed:** CI/CD canary architecture, Observability (tracing + paging)
**Areas deferred to Claude's discretion:** Load test tooling + target environment, Mobile shell + test coverage gap path

---

## Gray-Area Selection

| Area | Description | Selected for discussion |
|------|-------------|-------------------------|
| CI/CD canary architecture | SC#5 demands canary 10/50/100 + one-click rollback; current single-VPS deploy has no canary mechanism | ✓ |
| Load test tooling + target env | k6 vs Artillery vs Gatling; staging vs ephemeral CI vs prod-clone target | (deferred — Claude's discretion) |
| Observability: tracing + paging | Distributed tracing platform + on-call paging stack | ✓ |
| Mobile shell + test coverage path | Fold Phase 3 mobile shell into Phase 4 vs 999.x backlog; how to close 70% coverage gap | (deferred — Claude's discretion) |

**User's selection:** CI/CD canary architecture, Observability: tracing + paging

---

## CI/CD Canary Architecture

### Q1: Canary infrastructure shape

| Option | Description | Selected |
|--------|-------------|----------|
| 2nd VPS + Nginx weighted upstream (Recommended) | 2nd Hetzner-style VPS, Nginx in front with weighted upstream blocks, GitHub Actions flips weights per stage. Stays inside SSH+docker-compose model. ~$15-30/mo extra. Rollback via re-flip <60s. | ✓ |
| Migrate API to Fly.io / Railway | Native canary primitives but throws out existing Docker+Nginx+SSL stack; 1-2 plans of pure migration before any canary lands | |
| Blue-green via health-check (skip true canary) | Single VPS, two docker-compose stacks side-by-side, health-gated cutover; does not satisfy strict reading of "10/50/100" | |
| Kubernetes + Argo Rollouts | Production-grade progressive delivery; massive ops overhead; wrong scale for solo founder | |

**User's choice:** 2nd VPS + Nginx weighted upstream
**Notes:** Aligns with modular-monolith ethos, preserves Phase 1 deploy investment, marginal cost increase fits MVP envelope.

### Q2: Canary stage progression mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Manual gate at each stage (Recommended) | GitHub Actions `environments` with required reviewer = Faisal; 10% → human approval → 50% → human approval → 100% | ✓ |
| Automated time-windowed promotion | Auto-promotion after fixed soak window unless metrics breach trigger auto-rollback; requires metric-check + rollback plumbing trust | |
| Slack-triggered manual promotion | Same human gate as option 1, surfaced in Slack via incoming webhook + `repository_dispatch` | |

**User's choice:** Manual gate at each stage
**Notes:** Solo-founder reality — no team to recover from misfiring auto-promotion. Re-evaluate Phase 6.

### Q3: One-click rollback mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Nginx weight flip back to old VPS (Recommended) | Old version stays running on VPS-A during canary; rollback workflow re-applies prior Nginx config; <60s recovery; alternating roles after success | ✓ |
| Image tag re-pin via `docker compose up` | Single VPS, latest-stable tag pointer; tighter timing, less safe | |
| Stripe-style runbook (no automation) | Document only, manual SSH; misses "one-click" SC#5 wording | |

**User's choice:** Nginx weight flip back to old VPS
**Notes:** Tighter recovery SLO than NFR-uptime needs; designed so rollback doesn't dent the uptime budget. DB migrations explicitly forward-compatible only — no schema rollback path (handled in Q4).

### Q4: Database migration interaction with canary window

| Option | Description | Selected |
|--------|-------------|----------|
| Forward-compatible-only contract (Recommended) | Hard rule: every Prisma migration must be additive-only (nullable cols, new tables, no DROPs/RENAMEs/NOT NULL backfill) during canary; destructive migrations ship in follow-up after drain. Lock as ADR. | ✓ |
| Migration-window outage (apply at 0% traffic) | Run migrations during NFR-uptime maintenance window; burns the window on every breaking change | |
| Two-deploy expand/contract | Three deploys per breaking change; most robust, most overhead | |

**User's choice:** Forward-compatible-only contract
**Notes:** **Highest-stakes decision in this phase.** Must be locked as a new ADR in `.planning/intel/decisions.md` and surfaced in CLAUDE.md before any Phase 4 plan ships.

### Continuation gate

Asked: "More questions about CI/CD canary, or move to Observability?"
**User's choice:** Move to Observability

---

## Observability — Tracing + Paging

### Q1: Distributed tracing platform

| Option | Description | Selected |
|--------|-------------|----------|
| Sentry Performance (extend existing) (Recommended) | Sentry already wired Phase 1; enable Performance Monitoring with `tracesSampleRate`; ~$26/mo Team plan; zero new infra; frontend↔backend trace correlation | ✓ |
| OpenTelemetry → Jaeger (self-hosted) | Industry standard, no per-trace pricing; real ops burden + storage backend | |
| Datadog APM | Best-in-class with Watchdog auto-anomaly detection; $31/host/mo + ingestion; premium price | |

**User's choice:** Sentry Performance (extend existing)
**Notes:** Single-vendor consolidation around already-installed SDK; lowest ops overhead.

### Q2: On-call paging stack

| Option | Description | Selected |
|--------|-------------|----------|
| Slack-only paging (Recommended) | Sentry + Prometheus AlertManager → `#sorcyn-prod-alerts`; mobile push from Slack acts as page; $0 | ✓ |
| PagerDuty (single user, free tier) | Free tier with proper SMS/phone-call paging; useful only if "phone-rings-at-3am" matters more than checking Slack on phone | |
| PagerDuty + Slack (Professional plan) | Full escalation + schedules + runbook integration; $21/user/mo; right call for a real on-call team | |

**User's choice:** Slack-only paging
**Notes:** Solo founder = no rotation. Re-evaluate Phase 6 when team grows.

### Q3: Centralized logging stack

| Option | Description | Selected |
|--------|-------------|----------|
| Better Stack (Logtail) (Recommended) | Hosted, ~$24/mo for 30 GB; `pino-logtail` drop-in; bundles uptime synthetic monitors | ✓ |
| Grafana Loki (self-hosted) | Same Grafana ecosystem as Prometheus dashboards; storage on Hetzner VPS; ops burden | |
| Sentry Logs (single vendor) | New Sentry feature; correlation story strong; less mature search UX | |
| Datadog Logs | Best-in-class but $0.10/GB ingest compounds | |

**User's choice:** Better Stack (Logtail)
**Notes:** Bundle bonus — Better Stack synthetic monitors used in Q4 for SC#4 verification.

### Q4: Synthetic incident verification (SC#4 mandate)

| Option | Description | Selected |
|--------|-------------|----------|
| Scripted chaos drill on staging (Recommended) | `scripts/synthetic-incident.sh` runbook intentionally trips each alert path; quarterly cadence; runbook captures evidence | |
| Better Stack uptime synthetic monitors | Built-in HTTP probes from multiple regions every 1-5 min; passive coverage; doesn't validate downstream alerts | |
| Both (drill + continuous synthetic) | Quarterly chaos drill for full-pipeline + continuous monitors for passive health; best coverage; bundled with Better Stack | ✓ |

**User's choice:** Both (drill + continuous synthetic)
**Notes:** Quarterly drill cadence committed to `docs/runbooks/observability-drill.md`.

### Continuation gate

Asked: "More questions about Observability, or done with selected areas?"
**User's choice:** Done — ready for context

---

## Claude's Discretion

The following gray areas were not selected by the user during gray-area selection — Claude has flexibility during planning/research. Defaults are documented in `04-CONTEXT.md` `<decisions>` and may be overridden during plan review.

- **Load test tooling + target environment** — Default: k6 + dedicated staging cluster mirroring prod
- **Mobile shell carry-over from Phase 3** — Default: fold into Phase 4 as early-wave sub-plan (NOT 999.x backlog), because SC#3 + SC#5 need full mobile surface
- **Test coverage gap path** — Default: measure first via existing V8 coverage, then prioritize CONCERNS.md "Test Coverage Gaps" High-priority items (payment webhook idempotency, transaction state transitions, auth session rotation)
- **Accessibility tooling** — Default: Flutter `accessibility_test` + manual screen-reader walkthrough (TalkBack/VoiceOver) + `axe-core` for any web touchpoints
- **DR drill mechanics** — Default: full restore-to-different-region drill, Phase 4 produces signed-off `docs/runbooks/dr-drill.md`, quarterly cadence
- **20-user UAT recruitment + script** — Default: 10 buyers + 10 sellers from DFW (waitlist + Reddit + local network); script covers full transaction loop + Phase 3 closeout surfaces
- **PCI-DSS attestation timing** — Default: research Stripe SAQ-A coverage during Phase 4 research (per STATE.md flagged blocker), file attestation as Phase 4 deliverable; surface re-scoping if SAQ-A path is blocked

---

## Deferred Ideas

Captured in `04-CONTEXT.md` `<deferred>` section. Highlights:

- Kubernetes + Argo Rollouts canary (Phase 7 if traffic warrants)
- Datadog APM (Phase 6+ when team justifies premium)
- PagerDuty Professional (when team grows)
- Sentry Logs single-vendor consolidation (next contract renewal)
- OpenTelemetry → Jaeger self-host (Phase 6+ alternative if Sentry trace quota expensive)
- Automated time-windowed canary promotion (Phase 6+)
- Two-deploy expand/contract migrations (revisit if D-04 backlog grows)
- Slack-triggered canary promotion (defer until pain shows)
- Better Stack public status pages (Phase 5 or 6)
- Multi-device FCM token storage (Phase 6 polish per CONCERNS.md)
- Broader webhook-idempotency-key infrastructure (Phase 6)
- Message moderation / content filtering (Phase 6 trust + safety)
- N+1 query refactor in conversation listing (Phase 4 IF load test surfaces it, else Phase 6)

---

*Discussion captured: 2026-04-30 via /gsd-discuss-phase 4*
