# Sorcyn

> **Note on naming:** "Sorcyn" is the canonical product name (display, marketing, app store). The repository is `ReverseMarketplace` and code/slug references (Stripe metadata, R2 buckets, deep-link scheme `reversemarket://`, `reverseMarketplace` GitNexus index, test admin email `admin@reversemarketplace.com`) remain unchanged. Do **not** rename folders, slugs, or DB seed accounts as part of any phase. CLAUDE.md and `ReverseMktplPRD.md` still say "TBD" / "Reverse Marketplace Platform" — those are stale; Sorcyn is canonical going forward.

## What This Is

Sorcyn is a reverse marketplace where buyers post what they need (products, services, or job leads) and sellers compete to fulfill them, with an AI chatbot as the primary post-creation interface and Stripe-Connect escrow holding funds until before/after-photo evidence proves the work is done. Targeting the DFW Metroplex for a Q3 2026 launch with 2,500 users in Year 1.

## Core Value

**Buyers describe what they need in plain language and get vetted, evidence-backed offers from local sellers — without paying anything for local cash transactions.** Local-free pricing is the moat against Facebook Marketplace and OfferUp; before/after photos tied to escrow release are the moat against Thumbtack/Craigslist trust failures.

## Requirements

### Validated

<!-- Shipped and confirmed in code as of latest commit `804c8ec`. Backend audit Apr 18, 2026: 75.6% health (104 IMPLEMENTED, 23 PARTIAL, 41 MISSING). Production-quality strong areas listed below. -->

- ✓ Universal reverse-marketplace flow: post → offers → accept → escrow → completion → review (Phases 1, sessions 1–15)
- ✓ Three MVP categories: Products, Services, Jobs (38 seeded categories) (Phase 1)
- ✓ Custom JWT auth with refresh rotation + reuse detection + Redis blacklist (Phase 1)
- ✓ Single-account toggle (`buyer | seller | both`) with auto-created SellerProfile (Phase 1)
- ✓ Manual + AI-assisted post creation (Gemini Flash-Lite, Zod-validated slugs, 20 req/hr) (Phase 1)
- ✓ Offer submission with `(post_id, seller_id)` uniqueness, 24h withdraw cooldown (Phase 1)
- ✓ Stripe Connect Standard with **Separate Charges + Transfers** escrow flow (Phase 1)
- ✓ Tiered fee model (services 5%/8%, shipped 5%/6%, local platform 3%/3%, local cash $0) (Phase 1)
- ✓ 7-day auto-release via BullMQ sweep, max 2 change requests (Phase 1)
- ✓ Before/after photo evidence pipeline + transaction status tracking (Phase 1)
- ✓ Reviews with day-73 auto 5-star + reminders at days 7/30/60/73 (Phase 1)
- ✓ Real-time messaging via Socket.IO + 30s/60s polling fallback, 50/hr rate limit (Phase 1)
- ✓ Multi-channel notifications via BullMQ (in-app + SendGrid email + FCM push) (Phase 1)
- ✓ MVP search via PostgreSQL `tsvector` + GIN + auto-update trigger (Phase 1)
- ✓ Verification request pipeline + badges (Licensed, Insured, ID Verified, Background Checked) (Phase 1)
- ✓ Dispute MVP with frozen escrow + 48h evidence window (Phase 1)
- ✓ Admin dashboard with plugin-level `requireAdmin`, immutable AuditLog (Phase 1)
- ✓ Flutter app — 40 of 51 screens, Riverpod, GoRouter auth guards, Material 3 purple, 10-language i18n, FCM push, Sentry, deep linking (Phase 1)
- ✓ Production stack — Docker multi-stage, Nginx SSL, GitHub Actions CI/CD, Prometheus, Sentry (Phase 1)
- ✓ **Sorcyn brand restyle** — 37 Flutter screens to Figma reference, locked design tokens (`#7C3AED` primary, `#A855F7` secondary, gradient `135deg`, button shadow `0 8px 20px rgba(124,58,237,0.35)`, 12/16/24 px radii, 52/56 px heights), spring page transitions (stiffness 320, damping 32, mass 1.0, 420ms), `TapScale` widget (pressedScale 0.97), 32 standalone GoRoutes wired to `springPage<void>`, audit script + 39/39 conformance + 26 widget/a11y/regression tests + UAT 4-pass/2-issue/2-skipped (both issues are non-regressions, routed to 999.2 + Phase 3) (Phase 2)
- ✓ **MVP implementation closeout** — `MAX_OFFERS_PER_POST=25` reconciliation, Stripe Connect 3-bug fix (deep-link return_url, lifecycle observer, profile menu route), targeted-seller exclusivity carve-out via category match, counter-offer 5-round cap (`MAX_COUNTER_DEPTH=5` chain walk), PII gate (`locationAddress` redacted to non-funded sellers), Stripe Identity hosted-flow + EIN business gate (backend), Jobs lead-pricing engine + free-email denylist, env hardening blocks production start when `STRIPE_CONNECT_RETURN_URL` unset / `FRONTEND_URL=localhost`, Phase 3 closeout audit suite (26 assertions across 6 SC blocks). Mobile Identity verify screen + register EIN field + Jobs roleTier dropdown deferred to a follow-up. (Phase 3, 2026-04-30)

### Active

<!-- Current build scope. Phases 4-5 in roadmap. -->

- [ ] **Phase 4 — Pre-launch hardening (next):** Security baseline (RLS or documented app-level enforcement, OWASP ZAP, Snyk, PCI-DSS via Stripe), test coverage to ≥70%, load test at 1,000 concurrent users, DR drill (RTO <4h / RPO <1h), WCAG 2.1 AA accessibility audit, alerting/monitoring completeness, canary CI/CD with one-click rollback, 20-user UAT. **Carry-over from Phase 3:** mobile Identity verify screen + register EIN field + Jobs roleTier dropdown.
- [ ] **Phase 5 — DFW soft-launch + cold-start seed:** Cold-start strategy (seed FAKE BUYER POSTS only — no fake sellers — per Apr 15 transcript), 80% DFW zip-code coverage (350+ zips), Year 1 metrics dashboard (NSM = Weekly Active Transactions: 10 by M3, 30 by M6, 120 by M12), TikTok/Instagram launch campaign, post-launch ops runbook.

### Out of Scope

<!-- Explicit boundaries with reasoning. -->

- **Native WebSocket protocol** — chose Socket.IO 4 for auto-reconnect, rooms, polling fallback. Locked.
- **Supabase Auth + RLS as the sole authz layer** — chose custom JWT (`@fastify/jwt` + jsonwebtoken), with Supabase as PostgreSQL host only. RLS optional in Phase 4 as defense in depth.
- **Meilisearch or Elasticsearch in MVP** — PostgreSQL FTS is the locked MVP choice; Elasticsearch is Phase 6 (Phase 2 in PRD numbering).
- **Promotions / paid visibility / subscription tiers** — deferred until user base is established (Session 2 transcript, CLAUDE.md). Phase 6 candidate.
- **Twilio SMS verification** — deferred to Phase 6 to save costs; email verification serves as MFA in MVP.
- **OAuth (Google/Apple/Facebook)** — Phase 6.
- **Shipping carrier integration (label generation)** — Phase 6.
- **B2B / wholesale UI** — DB schema present, UI hidden as "Coming Soon" until Phase 6.
- **Real Estate vertical** — DB schema present, hidden until Phase 7.
- **Geographic expansion beyond DFW** — Texas Phase 6, national Phase 7.
- **Custom RBAC** — `isAdmin` boolean is sufficient for MVP.
- **Self-hosted file storage** — Cloudflare R2 ($0 egress) is the locked choice over AWS S3.
- **Destination Charges** — chose Separate Charges + Transfers for escrow control flexibility (supersedes PRD §8.5).
- **Usernames/handles** — display only legal first name publicly.
- **Live video streams in messages** — text + image only in MVP; video MIME in uploads is a Phase 3 closeout, but in-message video is out.
- **Per-buyer offer cap** — only per-post offer cap (25) is enforced.
- **Native iOS/Android (non-Flutter)** — single Flutter codebase.

## Context

**Mature project, mid-rollout.**

- 15 build sessions complete (`BUILD_PROGRESS.md`). Latest commit at audit: `804c8ec` on `main`.
- 18 backend modules under `backend/src/modules/`, 19 route groups under `/api/v1/`.
- 295+ tests across 22 test files passing (309/309 at audit time, 16.40s suite).
- 18 curl-based bash API E2E scripts with shared `_state.sh`, runnable via `run-all.sh`.
- Flutter app with 40 of 51 screens (`docs/SCREEN_HIERARCHY.md`); BATCH_2_PLAN through BATCH_8_PLAN cover the remaining UI restyle.
- GitNexus index: 2,907 symbols, 6,614 relationships, 160 execution flows. Refresh via `npx gitnexus analyze` (preserve embeddings with `--embeddings`).
- Production deployment runbook in `docs/DEPLOYMENT.md` (VPS, Docker Compose, Nginx + Let's Encrypt, automated DB backups, GitHub Actions CI/CD, Prometheus + Sentry).
- Cost ceiling at 10K users: $1,000–1,600/mo infra, $85–112/mo AI on Claude Haiku (free Gemini tier covers MVP).
- Cold-start strategy is asymmetric: seed buyer demand (fake buyer posts) only — never fake sellers. Surfaced from Apr 15 transcript.
- Meeting transcripts (8 Granola exports) are lowest precedence; PRD/ADR override.

## Constraints

- **Tech stack — Backend:** Node.js 20+ LTS, TypeScript 5+ ESM (`.js` import extensions), Fastify 5, Prisma 7 driver-adapter (`@prisma/adapter-pg`, no `url` in schema, connection in `prisma.config.ts`), Zod 4 (`z.record(z.string(), z.any())` two-arg form), BullMQ v5, Socket.IO 4, ioredis, `@fastify/compress` threshold 1024 bytes, Sentry `@sentry/node` lazy init, Prometheus via `prom-client`. Locked.
- **Tech stack — Mobile:** Flutter 3.16+, Dart 3.2+, Riverpod (StateNotifier, no codegen), GoRouter (`StatefulShellRoute.indexedStack` + `redirect` auth guard), Dio singleton with `AuthInterceptor` + `LoggingInterceptor`, `flutter_secure_storage` (`encryptedSharedPreferences: true` on Android), `socket_io_client`, `firebase_messaging`, `sentry_flutter` + `sentry_dio`, `flutter_localizations` + `intl`, `url_launcher` for Stripe Connect onboarding. Locked.
- **Tech stack — Data:** Supabase Postgres (host only), Postgres on `:5433` locally to avoid Mac dev conflicts, Redis 7+, Cloudflare R2 (S3-compatible) with MinIO `:9000` local fallback. Locked.
- **Tech stack — Third-party:** Stripe Connect Standard (Separate Charges + Transfers), SendGrid (email), Firebase FCM (push), Google Maps (Places, Geocoding, Distance Matrix), Google Gemini Flash-Lite (AI). Locked.
- **Geography:** DFW Metroplex MVP only (350+ zip codes, 80% coverage target). Texas-wide Phase 6, national Phase 7. Locked.
- **Pricing:** Local cash $0; tiered take rates by transaction type. Locked. Cannot raise local fees without revisiting Core Value.
- **Compliance:** PCI-DSS via Stripe (no PAN storage), GDPR + CCPA, before/after photos required for all services. Locked.
- **Performance targets:** API <200 ms median, <500 ms p95; search <500 ms (PG FTS MVP); payment <3 s; image upload <5 s for 5 MB; DB query <100 ms p95. Locked NFR-performance.
- **Throughput targets:** 1,000 concurrent MVP, 1,000 req/s peak API, 100 max DB connections (pooled). Locked NFR-throughput.
- **Availability:** 99.9% uptime MVP (8.76 h/yr), maintenance Sundays 2–4 AM UTC with 48 h notice, RTO <4 h / RPO <1 h. Locked NFR-uptime + NFR-disaster-recovery.
- **Quality gate:** ≥70% test coverage (70% unit / 20% integration / 10% E2E), OWASP ZAP + Snyk pre-launch, 20-user UAT before Q3 2026 launch. Locked NFR-test-coverage.
- **Accessibility:** WCAG 2.1 AA — keyboard nav, screen reader, 4.5:1 contrast, 16 px scalable to 200%, 44×44 px touch targets. Locked NFR-accessibility.
- **Security baseline:** TLS 1.2+, AES-256 at rest, JWT refresh rotation with reuse detection, bcrypt ≥12 rounds, RFC 7807 errors, parameterized queries only, CSP + CSRF + SameSite cookies, rate limits 100–1,000 req/hr per user. Locked NFR-security.
- **Schema invariants:** UUID v4 PKs, `deleted_at` soft-deletes (AuditLog exempt), camelCase code → snake_case DB, JSONB for flexible fields, `Unsupported("tsvector")` on posts with GIN index + custom trigger. Locked.
- **Critical implementation patterns:** `sellerId === SellerProfile.id` (NEVER `User.id`); `prisma.$transaction([...])` array form for multi-write atomic ops, interactive form for read-compute-write; `Prisma.JsonNull` not `null`; static routes before parameterized routes in Fastify; lazy SDK init (Stripe / Gemini / Sentry); graceful external-service stubs (`sendEmail` / `sendPush` never throw). See CLAUDE.md "Critical Design Patterns".

## Key Decisions

<!-- 73 ADR-locked decisions captured in .planning/intel/decisions.md. Decisions below are the ones most likely to constrain future phase work. The full log is the source of truth. -->

<decisions>
| Decision | Rationale | Outcome |
|----------|-----------|---------|
| **Fastify 5 over Express** (DEC-fastify-framework) | Built-in schema validation, pino logging, plugin system, TypeScript-first, faster, official Swagger plugin | ✓ Good — shipped in 15 sessions |
| **Prisma 7 driver adapter pattern** (DEC-prisma-7-driver-adapter) | Required by Prisma 7; `prisma.config.ts` + `PrismaPg({ connectionString })`; no `url` in schema | ✓ Good — locked |
| **Cloudflare R2 over AWS S3** (DEC-cloudflare-r2) | $0 egress vs AWS egress fees; S3-compatible API | ✓ Good — locked |
| **Gemini Flash-Lite for MVP AI** (DEC-gemini-flash-lite-mvp) | Free 1K req/day tier; plan upgrade to Claude Haiku at scale | ✓ Good — adequate for MVP scale |
| **Custom JWT auth, not Supabase Auth** (DEC-jwt-access-refresh) | 15 min access + 30 d/180 d refresh, separate secrets, rotation with reuse detection, Redis blacklist | ✓ Good — supersedes PRD narrative |
| **Single-account `buyer | seller | both` toggle** (DEC-single-account-toggle) | Uber driver/rider model; auto-creates SellerProfile on switch | ✓ Good — supersedes PRD's three-account model |
| **Badge-based verification, not gatekeeping** (DEC-badge-based-verification) | Non-verified sellers allowed; background check only for high-risk categories | ✓ Good — locked |
| **Max 25 offers per post** (DEC-max-offers-per-post) | Prevents analysis paralysis; limits per-post DB growth | ⚠️ Revisit — code currently `MAX_OFFERS_PER_POST = 10`, reconcile in Phase 3 |
| **3-day buyer exclusivity window** (REQ-three-day-exclusivity) | Buyer's targeted sellers see post first; goes public after 3 days | ⚠️ Revisit — partial in audit, complete in Phase 3 |
| **Stripe Connect Standard, Separate Charges + Transfers** (DEC-separate-charges-and-transfers) | Full platform escrow control; `transfer_group` links charge and transfer | ✓ Good — supersedes PRD §8.5 Destination Charges |
| **7-day auto-release via BullMQ sweep** (DEC-7-day-auto-release, DEC-bullmq-sweep-pattern) | Sweep pattern (vs per-record delayed jobs) is naturally idempotent | ✓ Good — production-tested |
| **Day-73 auto 5-star review** (DEC-auto-review-day-73) | Reminders at 7/30/60, then auto-review at 73 with `isAutoGenerated: true`; BullMQ `jobId` dedup | ✓ Good — supersedes PRD's 60-day window |
| **Socket.IO 4 over native WebSocket** (DEC-socketio-over-websocket) | Auto-reconnect, rooms, polling fallback, heartbeat, structured events | ✓ Good — locked |
| **Hybrid realtime + polling** (DEC-hybrid-realtime-polling) | Socket.IO primary + 30 s active chat / 60 s convs list silent polling | ✓ Good — production-tested |
| **PostgreSQL FTS for MVP, Elasticsearch for Phase 6** (DEC-fts-postgres-mvp) | tsvector + GIN + auto-update trigger; <500 ms target acceptable for MVP | ✓ Good — supersedes PRD's Meilisearch |
| **DFW-only MVP** (DEC-dfw-only-mvp) | Geographic concentration drives liquidity; expansion is Phase 6 (TX) and Phase 7 (national) | — Pending validation Phase 5 |
| **Local cash $0 platform fee** (DEC-local-products-free) | Drives adoption against Facebook Marketplace and OfferUp | — Pending validation Phase 5 |
| **Before AND after photos required for all services** (DEC-before-after-photos-required) | Trust differentiator; tied to escrow release evidence | ✓ Good — locked |
| **Milestone payments with no minimum threshold** (DEC-milestone-payments) | Enables multi-contractor projects | ✓ Good — locked |
| **10 target languages** (DEC-10-target-languages) | en, es, zh, ar (RTL), fr, pt, hi, vi, ko, ja — DFW demographics + expansion | ✓ Good — flutter_localizations + ARB |
| **Material 3 purple `#7C3AED` brand** (DEC-material3-purple) | Brand identity; gradient `#7C3AED → #A855F7` for Phase 2 restyle | ✓ Good — locked |
| **Promotions deferred** (Session 2 transcript, CLAUDE.md) | Build user base before monetizing visibility | — Pending — Phase 6 candidate |

**Full ADR log:** `.planning/intel/decisions.md` (73 locked decisions)
</decisions>

---
*Last updated: 2026-04-30 after Phase 3 (MVP Implementation Closeout) shipped — backend complete; mobile Identity/register-EIN/Jobs-dropdown shell deferred to Phase 4.*
