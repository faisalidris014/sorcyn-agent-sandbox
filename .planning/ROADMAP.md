# Roadmap: Sorcyn

## Overview

Sorcyn is a mature project mid-rollout. Phase 1 (the 15-session MVP build covering 18 backend modules + 40 mobile screens + production stack) is **shipped and passing 295+ tests**, but a backend audit on 2026-04-18 found 41 MISSING and 23 PARTIAL items vs PRD scope and an in-flight mobile UI restyle (BATCH 2–8) is rebranding 37 Flutter screens to the Sorcyn purple-gradient design system. The roadmap reflects this reality: Phase 1 is collapsed as complete; Phases 2–5 finish what's needed for the DFW Q3 2026 soft launch (UI restyle → MVP closeout → pre-launch hardening → launch); Phases 6–7 carry the PRD's Phase 2/3 future scope (Texas + national expansion, OAuth, Elasticsearch, B2B, real estate, financing).

## Milestones

- ✅ **v1.0 MVP Backend + Mobile** — Phase 1 (shipped through commit `804c8ec`, 2026-04-18)
- 🚧 **v1.1 Sorcyn Launch (DFW Q3 2026)** — Phases 2–5 (in progress; Phases 2–3 complete, Phase 4 in progress)
- 📋 **v2.0 Texas + Enhancements** — Phase 6 (planned, post-launch)
- 📋 **v3.0 National + Verticals** — Phase 7 (planned)

### Label ↔ Milestone ↔ Version-prefix map (authoritative)

GitHub issues carry a `phase-N` label and a `vX.Y-EN-NN` title prefix. These are **not 1:1**
(milestone `v1.1` spans four phase labels). Any roadmap/state regen script MUST key off the
`phase-*` **label**, never the title version-prefix. This table is the source of truth:

| `phase-*` label | Roadmap phase | Milestone | Issue title prefix |
|-----------------|---------------|-----------|--------------------|
| `phase-1` | Phase 1 | v1.0 | `v1.0-*` |
| `phase-2` | Phase 2 | v1.1 | `v1.1-*` |
| `phase-3` | Phase 3 | v1.1 | `v1.1-*` |
| `phase-4` | Phase 4 | v1.1 | `v1.1-*` |
| `phase-5` | Phase 5 | v1.1 | `v1.1-*` |
| `phase-6` | Phase 6 | v2.0 | `v2.0-*` |
| `phase-7` | Phase 7 | v3.0 | `v3.0-*` |

Verified 2026-05-29: no `phase-6`/`phase-7` issue carries a stale `phase-5` label (see Bucket 1, B1.4).

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (e.g. 3.1): Reserved for urgent insertions discovered during execution

- [x] **Phase 1: MVP Backend + Mobile App (SHIPPED)** — Modular monolith backend, 18 modules, Flutter app with 40 screens, full prod stack
- [x] **Phase 2: Mobile UI Restyle (Sorcyn Brand) (SHIPPED)** — Apply Sorcyn purple-gradient design system to 37 Flutter screens via BATCH 2–8 — completed 2026-04-29
- [x] **Phase 3: MVP Implementation Closeout (SHIPPED with deferred mobile shell)** — Reconcile 41 MISSING + 23 PARTIAL audit items against locked v1 scope — completed 2026-04-30
- [ ] **Phase 4: Pre-Launch Hardening (IN PROGRESS — 5 complete + 2 partial of 8 plans; Wave 2 closed 2026-05-02; Wave 3 auto-tasks merged 2026-05-12, 2 human checkpoints pending — issues #102/#103)** — Security, accessibility, load test, DR drill, canary CI/CD, 20-user UAT
- [ ] **Phase 5: DFW Soft-Launch + Cold-Start Seed** — Seeded buyer-side liquidity, 80% DFW zip coverage, Year 1 metrics dashboard, marketing launch
- [ ] **Phase 6: Texas Expansion + Enhancements (PRD Phase 2)** — Elasticsearch, OAuth, SMS verification, shipping integration, B2B UI, automated disputes, promotions, RLS, Texas-wide rollout
- [ ] **Phase 7: National Rollout + Verticals (PRD Phase 3)** — Houston/Austin/SA, Real Estate vertical, financing, enterprise features, Claude Haiku AI upgrade

## Phase Details

### Phase 1: MVP Backend + Mobile App (SHIPPED)
**Goal**: Deliver a functioning reverse marketplace covering the full transaction loop (post → offer → accept → escrow → completion → review) on backend + mobile, deployable to production.
**Depends on**: Nothing (first phase)
**Requirements**: REQ-vision-reverse-marketplace, REQ-mvp-three-categories, REQ-user-registration, REQ-account-toggle, REQ-account-deletion, REQ-create-post-manual, REQ-create-post-ai-assisted, REQ-post-extension-and-repost, REQ-max-active-posts, REQ-seller-profile, REQ-submit-offer, REQ-offer-visibility-private, REQ-stripe-escrow, REQ-fee-structure-tiered, REQ-stripe-onboarding, REQ-escrow-release, REQ-milestone-payments, REQ-max-2-change-requests, REQ-before-after-photos, REQ-transaction-status-tracking, REQ-rating-and-review, REQ-in-app-messaging, REQ-multi-channel-notifications, REQ-dispute-mvp, REQ-admin-dashboard
**Success Criteria** (what was TRUE on completion):
  1. Buyer can register, verify email, post a request manually or via AI chat, and see offers come in
  2. Seller can register, complete Stripe Connect onboarding, browse the seller feed, and submit a competitive offer
  3. Buyer can accept an offer, pay through Stripe escrow, exchange real-time messages with the seller, approve completion against before/after photos, and leave a review
  4. Admin can suspend/ban users, approve verification documents, and resolve disputes against an immutable audit log
  5. The full stack runs in production via Docker + Nginx SSL + GitHub Actions CI/CD with Sentry + Prometheus observability and 295+ tests passing
**Plans**: 15 sessions (complete)
**Status**: ✅ Complete — shipped through commit `804c8ec` (2026-04-18); audit health 75.6% (104/168). Strong areas: core transactional flow, Stripe Connect, Socket.IO, BullMQ schedulers, admin moderation. See `BUILD_PROGRESS.md` for the per-session log.

### Phase 2: Mobile UI Restyle (Sorcyn Brand)
**Goal**: Every customer-facing Flutter screen wears the Sorcyn purple-gradient brand identity, polished animations, and shared widget library — without changing any backing functionality.
**Depends on**: Phase 1
**Requirements**: REQ-mobile-design-system, NFR-accessibility (design-token contribution; full audit lives in Phase 4)
**Success Criteria** (what must be TRUE):
  1. All 37 in-flight Flutter screens (across BATCH_2 through BATCH_8) match their Figma/TSX reference in `designs/src/app/components/` for layout, gradient buttons, custom 52 px input fields, status badges, and post cards
  2. Inter font is loaded across the app and Material 3 theme uses the Sorcyn palette (`#7C3AED` primary, `#A855F7` secondary, gradient `linear-gradient(135deg, #7C3AED, #A855F7)`, button shadow `0 8px 20px rgba(124,58,237,0.35)`)
  3. Six shared widgets — `gradient_fab`, `bottom_nav_bar` (with active gradient indicator dot), `welcome_card`, `post_card`, `status_badge`, `urgency_chip` — are reused everywhere instead of bespoke implementations
  4. Spring page transitions (stiffness 320, damping 32) and `active:scale-[0.97]` tap animations are applied via a shared route builder + button wrapper
  5. All Riverpod state, GoRouter routes, and Dio API calls produce identical behavior to Phase 1 (zero functional regression in existing tests; smoke pass on auth → post → offer → accept → message → review)
**Plans**: 4 plans (4/4 complete)
Plans:
- [x] 02-01-PLAN.md — Foundation gap closure: Spring page transition route builder + reusable TapScale wrapper widget (shared/transitions + shared/widgets)
- [x] 02-02-PLAN.md — Conformance remediation: bring 5 audit-flagged screens (settings, help_support, my_offers, dispute_detail, seller_earnings) to locked Sorcyn token usage
- [x] 02-03-PLAN.md — Wire spring page transitions into all 32 standalone GoRoutes in app.dart (depends on 02-01)
- [x] 02-04-PLAN.md — Phase 2 closure: automated audit script + widget conformance tests + a11y design-token tests + regression smoke + cross-flow manual checkpoint — completed 2026-04-29
**UI hint**: yes
**Closure verification**: UAT 4 pass / 2 issue / 2 skipped-with-reason. Both issues confirmed NON-Phase-2-regressions: Gap 1 (Profile menu routing) routed to 999.2 backlog; Gap 2 (Stripe Connect 3-bug cluster) routed to Phase 3 requirements. Frontend↔backend integration audit confirmed zero 404 risk across all Flutter API calls.

### Phase 3: MVP Implementation Closeout
**Goal**: Every v1 requirement audited as MISSING or PARTIAL becomes IMPLEMENTED, reconciling code with locked ADRs and CLAUDE.md scope so DFW launch ships against the same surface area the PRD promised. Includes Phase 1 carry-over fixes surfaced during Phase 2 closure UAT.
**Depends on**: Phase 2
**Requirements**: REQ-three-day-exclusivity, REQ-seller-feed, REQ-max-offers-per-post, REQ-counter-offer, REQ-mvp-search, REQ-verification-badges, REQ-business-account-ein, REQ-jobs-lead-gen, REQ-saved-sellers, REQ-archived-post-status, REQ-video-mime-uploads, REQ-pii-blocked-until-payment, REQ-stripe-connect-onboarding-completion (NEW — added 2026-04-29 from Phase 2 UAT Gap 2)
**Success Criteria** (what must be TRUE):
  1. A seller browsing the feed only sees buyer requests within their service radius (5–100 mi via geocoded `lat/lng` distance), and the seller-feed sort/filter (Newest / Expiring / Highest budget / Closest) returns geo-correct results within 0.1 mi tolerance
  2. Buyer and seller can run a full counter-offer cycle in-app — seller submits offer, buyer counters with a structured modal, seller accepts/declines/re-counters — without bid-war exposure to other sellers
  3. Backend-audit gap closures verifiable by re-running the audit script: `MAX_OFFERS_PER_POST` is 25, follow/favorite-seller endpoints work end-to-end, `Archived` is a real `PostStatus`, video MIMEs (mp4, mov) upload via the presigned-URL flow, buyer address/contact is hidden from the seller until escrow is funded, and the 3-day exclusivity window actually filters non-targeted sellers from the feed
  4. Jobs category has functioning lead-based pricing — companies are charged $10–500 per matched lead by role tier (Entry / Mid / Specialized-Senior), employer email-domain check rejects Gmail/Yahoo/etc., and ranked match list returns highest-fit candidates only
  5. ID Verified badge is awarded automatically via Stripe Identity verification webhook (replacing manual document review for that single badge), and Business sellers cannot complete registration without supplying an EIN that passes the existing verification pipeline
  6. **Stripe Connect onboarding completes end-to-end on the iOS simulator** (NEW — Phase 2 UAT Gap 2): backend env defaults `STRIPE_CONNECT_RETURN_URL` to the registered `reversemarket://` deep link scheme (NOT localhost); StripeOnboardScreen registers a `WidgetsBindingObserver` and refetches seller status on `AppLifecycleState.resumed`; Earnings Dashboard menu item routes to `/seller/earnings` (existing-but-unreachable route) instead of `/seller/stripe-onboard`; `isInProgress` derived from server-backed `stripeStatus.onboarded && !stripeStatus.chargesEnabled` (not from ephemeral widget state). Seller can complete onboarding in test mode and reach the actual SellerEarningsScreen.
**Plans**: 8 plans in 4 waves (planned 2026-04-29 via /gsd-plan-phase 3, plan-checker passed iter 2):

  **Wave 1** *(no dependencies — parallel-safe)*
  - `03-01-PLAN.md` — Offer cap reconciliation (`MAX_OFFERS_PER_POST` 10→25)
  - `03-02-PLAN.md` — Stripe Connect 3-bug fix + env hardening + mobile widget tests (Phase 2 UAT Gap 2 carry-over; promoted to Wave 1 per D-28 — demo-blocker)

  **Wave 2** *(blocked on Wave 1 completion)*
  - `03-03-PLAN.md` — 3-day exclusivity targeted-seller carve-out (category match per A-03) + seller-feed
  - `03-04-PLAN.md` — Counter-offer 5-round depth cap on shipped Offer.parentOfferId chain (per A-02; depends_on=[01])
  - `03-05-PLAN.md` — PII gate redaction (service-layer + mobile lock-icon UI; depends_on=[03])

  **Wave 3** *(blocked on Wave 2 completion)*
  - `03-06-PLAN.md` — Stripe Identity hosted-flow + webhook + EIN registration gate (depends_on=[02])
  - `03-07-PLAN.md` — Jobs lead-pricing engine + employer email-domain denylist (depends_on=[03,05])

  **Wave 4** *(blocked on all prior waves; final verification gate)*
  - `03-08-PLAN.md` — Vitest closeout audit suite (1 describe block per Success Criterion, including 0.1 mi radius tolerance assertion)

**Cross-cutting constraints** *(must_haves.truths shared across plans):*
- PostGIS migration deferred to Phase 6 — Phase 3 keeps shipped Haversine SQL (Addendum A-01)
- Counter-offer model = shipped `Offer.parentOfferId` self-relation chain — no new `OfferRevision` table (Addendum A-02; D-05/D-06 superseded)
- Targeted-seller mechanism for 3-day exclusivity = category match (Addendum A-03)
- Video upload cap stays 100MB — D-19 50MB tier rejected (Addendum A-04)
- Jobs role tier source = buyer-selected dropdown `entry`/`mid`/`specialized_senior` (Addendum A-05)
- Stripe Identity uses hosted-flow via `url_launcher` — `flutter_stripe` does NOT support Identity (RESEARCH.md Pitfall 1)
- Single `STRIPE_WEBHOOK_SECRET` reused for Identity + Connect on the existing endpoint — no new signing-secret env var (RESEARCH.md Pitfall 2)

**UI hint**: yes

### Phase 4: Pre-Launch Hardening
**Goal**: All non-functional requirements gating the DFW Q3 2026 launch are passing — security, performance, accessibility, DR, observability, canary CI/CD, and a 20-user UAT — proven by green test suites and signed-off runbooks.
**Depends on**: Phase 3
**Requirements**: REQ-launch-readiness, NFR-performance, NFR-throughput, NFR-data-growth, NFR-uptime, NFR-disaster-recovery, NFR-error-handling, NFR-accessibility, NFR-test-coverage, NFR-cicd, NFR-monitoring, NFR-security
**Success Criteria** (what must be TRUE):
  1. A 1,000-concurrent-user load test (k6 or Artillery against staging) sustains API <500 ms p95, search <500 ms, payment <3 s, and DB query <100 ms p95 with zero error-rate spike for 15 minutes
  2. Test coverage report shows ≥70% coverage with the 70/20/10 unit/integration/E2E split, OWASP ZAP and Snyk scans return no HIGH or CRITICAL findings, and a documented PCI-DSS attestation via Stripe SAQ-A is filed
  3. WCAG 2.1 AA accessibility audit (axe-core or manual Flutter accessibility scanner) passes on every customer-facing screen — keyboard nav, screen reader semantics, 4.5:1 contrast, 16 px scalable to 200%, 44×44 px touch targets
  4. DR drill restores the production database from backup into a separate region within 4 hours (RTO) with at most 1 hour of lost data (RPO), and a quarterly drill schedule is committed; centralized logging, distributed tracing, Slack + PagerDuty alerts, and Grafana dashboards are wired and verified by a synthetic incident
  5. CI/CD pipeline supports canary deploys (10% → 50% → 100%) with one-click rollback, and 20 beta users complete a UAT script covering the full transaction loop with sign-off captured in `docs/UAT_REPORT.md`
**Plans**: 8 plans in 5 waves (planned 2026-04-30 via /gsd-plan-phase 4):

  **Wave 0** *(BLOCKING — must land before any other Phase 4 plan)*
  - `04-01-PLAN.md` — D-04 forward-compatible-only migration ADR + audit-suite regex enforcement

  **Wave 1** *(parallel-safe; depends on 04-01)*
  - `04-02-PLAN.md` — Phase 3 mobile shell carry-over (Identity verify screen + EIN field + Jobs roleTier dropdown + 2 backend smoke tests)
  - `04-03-PLAN.md` — Observability foundation (Sentry Performance D-05 + Better Stack D-07 + Slack-only paging D-06 + AlertManager rules)

  **Wave 2** *(blocked on Wave 1; ✅ COMPLETE 2026-05-02)*
  - [x] `04-04-PLAN.md` — Canary CI/CD (2nd VPS + Nginx weighted upstream + GitHub Actions environments + rollback workflow) — SUMMARY at `e76fc97`
  - [x] `04-05-PLAN.md` — DR drill (nightly pg_dump → R2 + cross-region sync + first measured RTO/RPO drill + quarterly cadence) — drill PASS (mechanics): RTO 322 min wall / ~81 min active, RPO ~0 min; SUMMARY at `d910ebd`

  **Wave 3** *(blocked on Wave 1; parallel with Wave 2; 🚧 IN PROGRESS — automatable tasks COMPLETE 2026-05-12; awaiting 2 human-action checkpoints)*
  - [~] `04-06-PLAN.md` — Synthetic incident drill (D-08) + Better Stack continuous monitors + force-500 chaos endpoint — Tasks 1/2/4 complete (`5d841be`/`42651af`/`f354994`/`a8c57a4`); SUMMARY at `a96709d`; **Task 3 PENDING**: live drill on staging (capture Slack screenshots for 4 alert paths, fill AUDIT-MARKER:DRILL table)
  - [~] `04-07-PLAN.md` — k6 load test + Snyk + OWASP ZAP + test-coverage gap-fill + PCI-DSS SAQ-A skeleton — Tasks 1/2/3/4 complete (`a324807`/`d74186f`/`ecb5997`/`c524dbc`); SUMMARY at `3910a5c`; merged `728066d`; audit suite at 51 tests green; **Task 5 PENDING**: Stripe SAQ-A applicability ticket (Path A SAQ-A filed OR Path B SAQ-A-EP deferred); **B-1 dbP95Ms PENDING**: needs first k6 staging run + `export-sentry-db-p95.sh`

  **Wave 4** *(blocked on Waves 1–3; final verification gate)*
  - `04-08-PLAN.md` — A11Y audit + 20-user UAT + final audit-suite SC1–SC5 closure (extends Phase 3 26-assertion baseline)

**Cross-cutting constraints** *(must_haves.truths shared across plans):*
- T-01 D-04 forward-compatible-only Prisma migrations during canary windows (locked by 04-01 as ADR + audit gate)
- T-02 Sentry SDK lazy-init pattern preserved (no init at import per CLAUDE.md "Critical Design Patterns")
- T-03 `validateProductionEnv` gate refuses production startup when new prod-blocking env vars are unset (Phase 3 03-02 pattern)
- T-04 Single `STRIPE_WEBHOOK_SECRET` shared for Identity + Connect (Phase 3 RESEARCH Pitfall 2)
- T-05 Audit-suite-as-CI-gate — `npx vitest run tests/audit` is the single command; Phase 4 EXTENDS the Phase 3 26-assertion suite, does NOT replace it
- T-06 Phase 2 Sorcyn design tokens reused by mobile shell carry-over (no new design contract)
- T-07 Nginx ip_hash + weight=N for Socket.IO sticky sessions (RESEARCH Pitfall 7)
- T-08 Solo-founder constraint — manual canary gates + Slack-only paging; no on-call team for after-hours escalation

**Threat model**: security_enforcement = true; ASVS L1; block_on=high. Each plan ships a `<threat_model>` block with at least one HIGH-severity threat (forward-compat migration violation, ZAP-against-prod, BETTER_STACK_TOKEN leak to mobile, k6 seed bleeding into prod, etc.).

**UI hint**: yes

### Phase 5: DFW Soft-Launch + Cold-Start Seed
**Goal**: Sorcyn goes live to real DFW users with seeded buyer-side liquidity, a metrics dashboard tracking the North Star, and a marketing campaign generating first transactions.
**Depends on**: Phase 4
**Requirements**: REQ-cold-start-launch, REQ-success-metrics
**Success Criteria** (what must be TRUE):
  1. Soft-launch announcement is live on TikTok and Instagram, the production app is approved on the iOS App Store and Google Play, and at least 350 of DFW's zip codes (80% coverage) have at least one fake-buyer-post seed or one real buyer post within the first week
  2. The cold-start seed contains FAKE BUYER POSTS only (no fake sellers), is generated by a documented one-time script that flags seeded posts for analytics, and seeded posts are deleted before any real seller offer can land on them
  3. A live metrics dashboard (Grafana or Datadog) tracks Weekly Active Transactions (NSM), GMV, take-rate revenue, active buyers/sellers, dispute rate, and avg rating with thresholds wired to the Year 1 targets (10 WAT by M3 / 30 by M6 / 120 by M12; $140 K GMV; <8% dispute; >4.3 avg rating)
  4. A post-launch ops runbook covers Stripe outages, Gemini outage fallback, FCM/SendGrid failure paths, escalation contacts, and an on-call rotation, exercised once via tabletop before launch day
  5. First 10 real completed transactions are logged within the first 30 days post-launch, validating the end-to-end flow against real users
**Plans**: TBD (expected ≈4 plans — cold-start seed script + DFW zip plan; metrics dashboard wiring; marketing + app-store launch; ops runbook + on-call)

### Phase 6: Texas Expansion + Enhancements (PRD Phase 2)
**Goal**: Sorcyn scales beyond DFW to Texas-wide with the v2 feature set the PRD promised — Elasticsearch search, OAuth, SMS verification, shipping integration, B2B UI, automated disputes, the promotion system, and defense-in-depth RLS.
**Depends on**: Phase 5 (validated DFW user base + metrics)
**Requirements**: REQ-elasticsearch-upgrade, REQ-oauth-login, REQ-shipping-integration, REQ-twilio-sms-verification, REQ-b2b-wholesale-ui, REQ-automated-dispute-resolution, REQ-promotion-system, REQ-texas-expansion, REQ-rls-policies
**Success Criteria** (what must be TRUE):
  1. Search hits <200 ms latency at 100 K-user-equivalent load via Elasticsearch 8+, with PostgreSQL FTS retired or kept only as an offline fallback
  2. New users can register via OAuth (Google, Apple, Facebook) and verify their phone via Twilio SMS, with the existing email/password path preserved
  3. Sellers shipping products can generate carrier labels, attach tracking, and validate addresses inside the app; B2B / wholesale category UI is surfaced (Inventory umbrella exits "Coming Soon")
  4. Promotion system is live — sellers can pay for visibility boosts, time-window promotions, and post-renewals, with revenue routed through the existing Stripe Connect flow
  5. Geographic radius is expanded to all of Texas with documented zip-code coverage, and Supabase RLS policies are deployed as defense in depth (parallel to the application-level enforcement that remains canonical)
**Plans**: TBD
**UI hint**: yes

### Phase 7: National Rollout + Verticals (PRD Phase 3)
**Goal**: Sorcyn extends nationally and unlocks the Real Estate, financing, and enterprise verticals that the PRD reserved for Phase 3, with AI infrastructure scaling to Claude Haiku.
**Depends on**: Phase 6 (validated Texas expansion)
**Requirements**: REQ-houston-austin-sa, REQ-real-estate-vertical, REQ-financing-options, REQ-enterprise-features, REQ-claude-haiku-upgrade
**Success Criteria** (what must be TRUE):
  1. Houston, Austin, and San Antonio have live coverage with city-specific zip-code seeding, then national rollout extends radius caps and unblocks national-level search/filtering
  2. Real Estate vertical exits "Coming Soon" with broker-reviewed copy and lead-gen flow live
  3. Buyer financing / installment options are integrated into the checkout flow alongside the existing Stripe Connect escrow path
  4. Enterprise features (team accounts, bulk procurement, custom contracts) are available behind a B2B onboarding flow, with appropriate AuditLog and admin support
  5. AI infrastructure migrates from Gemini Flash-Lite to Claude Haiku at the projected $85–112/month spend at 10 K users, preserving the existing slug-resolution and Zod-validation contract
**Plans**: TBD
**UI hint**: yes

## Backlog

### Phase 999.1: Photo upload on post creation (BACKLOG)

**Goal:** [Captured for future planning] — Buyers can attach photos when creating a post (manual + AI flows). Backend already supports `photos[]` (max 10) per `backend/src/modules/posts/posts.schemas.ts:28`, and the `/uploads/*` module emits R2 presigned URLs. Mobile UI does NOT collect photos today. Surfaced during Phase 02-04 manual smoke test (2026-04-29). Not a smoke-test blocker, but is a launch blocker for Sorcyn DFW Q3 2026 because reverse-marketplace value (e.g. "show me what needs cleaning", before/after photo evidence) depends on visual context. Likely belongs in Phase 3 (MVP Implementation Closeout) rather than current UI restyle phase.
**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.2: Post-lifecycle UX gaps + Profile menu routing (BACKLOG)

**Goal:** [Captured for future planning] — Resolve six pre-existing UX defects surfaced during Phase 02-04 manual smoke (2026-04-29). None are Phase 2 regressions; all predate the Sorcyn restyle. Not launch-blockers individually but together they erode trust in post management + profile navigation.
**Findings (verified against source on 2026-04-29):**
  - **B — Repost UX implies in-place reactivation.** `POST /posts/:id/repost` returns `201 Created` (new post). Frontend at `mobile/lib/features/posts/presentation/screens/post_detail_screen.dart:661` invalidates the *old* post detail and surfaces a "Post reposted" toast that mis-frames the operation. Fix: auto-route to the new post detail and re-word toast, OR change server semantics to reopen-in-place.
  - **C — Delete missing on filled/expired/cancelled posts.** `post_detail_screen.dart:617` gates Delete behind `post.canEdit`, and `post_model.dart:94` defines `canEdit = isDraft || isActive`. Owners cannot delete completed posts. Fix: add `canDelete` getter (true for owner unless an active transaction is in flight) and gate the menu item on it.
  - **F — No status filter on My Posts.** `my_posts_screen.dart` shows all post statuses in one list. Fix: add segmented control (All / Active / Filled / Expired / Cancelled) consistent with locked Sorcyn tokens.
  - **G — Transactions screen has no back button when entered from Settings.** `transactions_screen.dart:52` uses `StyledAppBar` without passing `onBack`; `styled_app_bar.dart:30` sets `automaticallyImplyLeading: false` and only renders a leading icon if `onBack != null`. Fix: pass `onBack: () => context.pop()` (issue is screen-specific, not a global StyledAppBar bug — post detail and other screens render back correctly).
  - **H — RenderFlex 3px overflow in EmptyState (Transactions empty list).** Logged during the smoke run inside a parent giving `h<=131px`. Cosmetic but throws debug-mode warnings. Fix: wrap EmptyState in `SingleChildScrollView` or shrink vertical padding.
  - **I — Profile menu routes to wrong destinations** (Phase 2 UAT Gap 1, added 2026-04-29). `profile_screen.dart:557` routes "Help & Support" to `/settings` instead of `/help` (HelpSupportScreen unreachable from menu). Same file lines 531/538 route "Earnings Dashboard" and "Payment Methods" to `/seller/stripe-onboard` — note the Earnings Dashboard mis-route is also addressed by Phase 3 Gap 2 (which fixes the broader Stripe Connect cluster). Fix here: 1-line change at line 557 to `context.push('/help')`. Fix for line 531/538 lives in Phase 3.
**Requirements:** TBD (likely REQ-post-lifecycle-ux + REQ-profile-menu-routing)
**Plans:** 0 plans

Plans:
- [ ] TBD (promote with /gsd-review-backlog when ready)

## Progress

**Execution Order:**
Phases execute in numeric order: 2 → 3 → 4 → 5 → 6 → 7 (Phase 1 is shipped). Decimal phases reserved for in-flight insertions if discovered during execution.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. MVP Backend + Mobile | v1.0 | 15/15 | Complete | 2026-04-18 (commit `804c8ec`) |
| 2. Mobile UI Restyle | v1.1 | 4/4 | Complete | 2026-04-29 |
| 3. MVP Closeout | v1.1 | 8/8 | Shipped (mobile shell deferred) | 2026-04-30 |
| 4. Pre-Launch Hardening | v1.1 | 0/8 | Planned | - |
| 5. DFW Soft-Launch | v1.1 | 0/TBD | Not started | - |
| 6. Texas Expansion | v2.0 | 0/TBD | Not started | - |
| 7. National Rollout | v3.0 | 0/TBD | Not started | - |
