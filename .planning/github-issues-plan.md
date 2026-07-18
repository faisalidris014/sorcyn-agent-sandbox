# GitHub Issues Plan — Sorcyn (Reverse Marketplace)

**Generated:** 2026-05-21
**Source:** `ReverseMktplPRD.md`, `docs/` (architecture, api, decisions, BACKEND_AUDIT_REPORT, SCREEN_HIERARCHY, DEPLOYMENT, FCM_SETUP, PCI_SAQ_A, meeting transcripts), `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`
**Scope:** Every feature, requirement, and tracked work item rolled up into proposed GitHub issues, grouped by milestone. Nothing is created on GitHub yet — this is a review artifact.

---

## How to read this document

Issues are grouped under four milestones:

| Milestone | Maps to | Status |
|-----------|---------|--------|
| **v1.0 — MVP Backend + Mobile** | PRD Phase 1 (shipped) / Roadmap Phase 1 | DONE — create as closed issues (or skip) for historical traceability |
| **v1.1 — Sorcyn DFW Launch** | PRD Phase 1 closeout / Roadmap Phases 2–5 | IN-FLIGHT — most actionable open work lives here |
| **v2.0 — Texas Expansion + Enhancements** | PRD Phase 2 / Roadmap Phase 6 | PLANNED — open as backlog issues |
| **v3.0 — National Rollout + Verticals** | PRD Phase 3 / Roadmap Phase 7 | PLANNED — open as backlog issues |

Each issue lists:
- **Title** (used verbatim)
- **REQ ID(s)** for traceability back to `.planning/REQUIREMENTS.md`
- **Labels** (suggested, see legend below)
- **Body summary** — what to put in the issue body

A separate backlog bucket at the end covers items that don't belong on a numbered milestone yet (Phase 999.x items, post-launch polish, etc.).

### Recommended label scheme

**Type** (one per issue): `epic`, `feature`, `bug`, `chore`, `infra`, `security`, `a11y`, `test`, `docs`, `spike`
**Area** (1–2 per issue): `auth`, `mobile`, `backend`, `posts`, `offers`, `payments`, `escrow`, `stripe`, `messaging`, `notifications`, `reviews`, `search`, `verification`, `jobs`, `disputes`, `admin`, `uploads`, `ai`, `observability`, `ci-cd`, `dr`, `database`, `design-system`, `i18n`, `marketing`, `analytics`
**Priority** (one per issue): `P0-launch-blocker`, `P1-must-have`, `P2-should-have`, `P3-nice-to-have`
**Milestone** (one per issue, set via GitHub milestone, not label): `v1.0`, `v1.1`, `v2.0`, `v3.0`
**Modifiers** (optional): `good-first-issue`, `needs-design`, `needs-research`, `blocked`, `phase-1`, `phase-2`, `phase-3`, `phase-4`, `phase-5`, `phase-6`, `phase-7`

### Recommended GitHub milestones to create

1. `v1.0 — MVP Backend + Mobile (SHIPPED 2026-04-18)` — closed
2. `v1.1 — Sorcyn DFW Launch (Q3 2026)` — open, target Q3 2026
3. `v2.0 — Texas Expansion + Enhancements` — open, no date
4. `v3.0 — National Rollout + Verticals` — open, no date

---

## v1.0 — MVP Backend + Mobile (SHIPPED)

> These are historical. Create as **closed** issues only if you want full traceability in GitHub for compliance/onboarding. Otherwise capture as a single rollup epic and skip the per-requirement issues.

### Option A: single rollup epic (recommended)

#### v1.0-EPIC-01 — v1.0 MVP delivery (rollup, closed)
- **REQ IDs:** REQ-vision-reverse-marketplace, REQ-mvp-three-categories, REQ-user-registration, REQ-account-toggle, REQ-account-deletion, REQ-create-post-manual, REQ-create-post-ai-assisted, REQ-post-extension-and-repost, REQ-max-active-posts, REQ-seller-profile, REQ-submit-offer, REQ-offer-visibility-private, REQ-stripe-escrow, REQ-fee-structure-tiered, REQ-stripe-onboarding, REQ-escrow-release, REQ-milestone-payments, REQ-max-2-change-requests, REQ-before-after-photos, REQ-transaction-status-tracking, REQ-rating-and-review, REQ-in-app-messaging, REQ-multi-channel-notifications, REQ-dispute-mvp, REQ-admin-dashboard
- **Labels:** `epic`, `backend`, `mobile`, `P1-must-have`, `phase-1`
- **Body:** Rollup of all shipped MVP work — 18 backend modules, 40 Flutter screens, full prod stack (Docker, Nginx SSL, GitHub Actions, Sentry, Prometheus), 295+ tests. Shipped through commit `804c8ec` (2026-04-18). See `BUILD_PROGRESS.md` for the per-session log and `.planning/REQUIREMENTS.md` for the traceability matrix.

### Option B: one closed issue per shipped requirement
Skipped here for brevity — same 25 REQ IDs above, each as `feature` + `phase-1` + `P1-must-have`, closed with reference to the commit that delivered it. Generate from REQUIREMENTS.md if needed.

---

## v1.1 — Sorcyn DFW Launch (IN-FLIGHT)

> This is where 90% of the actionable open work lives. Organized by epic, with sub-issues underneath each epic.

### EPIC v1.1-E1 — Phase 3: MVP Implementation Closeout

#### v1.1-E1-01 — Reconcile `MAX_OFFERS_PER_POST` from 10 to 25
- **REQ:** REQ-max-offers-per-post
- **Labels:** `chore`, `backend`, `offers`, `P0-launch-blocker`, `phase-3`
- **Body:** Code constant in `backend/src/modules/offers/offers.service.ts` is 10; ADR-locked value is 25. Update constant, update audit test, add migration to back-extend any post that hit the old cap. Source: ROADMAP Phase 3 plan `03-01-PLAN.md`.

#### v1.1-E1-02 — Fix Stripe Connect onboarding 3-bug cluster (iOS sim demo blocker)
- **REQ:** REQ-stripe-connect-onboarding-completion
- **Labels:** `bug`, `mobile`, `stripe`, `payments`, `P0-launch-blocker`, `phase-3`
- **Body:** (a) `STRIPE_CONNECT_RETURN_URL` defaults to localhost — must default to `reversemarket://` deep link. (b) `StripeOnboardScreen` doesn't refetch seller status on `AppLifecycleState.resumed`. (c) Earnings Dashboard menu item routes to `/seller/stripe-onboard` instead of `/seller/earnings`. Also (d) `isInProgress` should derive from server `stripeStatus.onboarded && !stripeStatus.chargesEnabled`, not ephemeral widget state. Add `validateProductionEnv` gate that refuses prod startup when env unset or still localhost. Source: Phase 2 UAT Gap 2 → Phase 3 plan `03-02-PLAN.md`.

#### v1.1-E1-03 — Implement 3-day buyer exclusivity feed filter
- **REQ:** REQ-three-day-exclusivity
- **Labels:** `feature`, `backend`, `posts`, `offers`, `P0-launch-blocker`, `phase-3`
- **Body:** `publicAfter = createdAt + 3d` is set on Post but the seller feed does not yet carve out "targeted sellers see post first." Mechanism = category match (Addendum A-03). Plan `03-03-PLAN.md`.

#### v1.1-E1-04 — Seller feed: radius + sort + filter
- **REQ:** REQ-seller-feed, REQ-mvp-search
- **Labels:** `feature`, `backend`, `mobile`, `posts`, `search`, `P0-launch-blocker`, `phase-3`
- **Body:** Sellers should see only requests within their `serviceRadius` (5–100 mi via Haversine — PostGIS deferred to Phase 6). Sorts: Newest / Expiring / Highest budget / Closest. Distance/budget/urgency/competition badges on each card. Audit test asserts 0.1 mi tolerance.

#### v1.1-E1-05 — Counter-offer flow (5-round depth cap)
- **REQ:** REQ-counter-offer
- **Labels:** `feature`, `backend`, `mobile`, `offers`, `P0-launch-blocker`, `phase-3`
- **Body:** Use shipped `Offer.parentOfferId` self-relation chain (no new `OfferRevision` table — Addendum A-02). Buyer counter modal in mobile; seller accepts/declines/re-counters. Cap depth at 5. Plan `03-04-PLAN.md`.

#### v1.1-E1-06 — PII gate: redact buyer address/contact until escrow funded
- **REQ:** REQ-pii-blocked-until-payment
- **Labels:** `feature`, `security`, `backend`, `mobile`, `posts`, `P0-launch-blocker`, `phase-3`
- **Body:** Service-layer redaction returns only city+state+zip+distance pre-payment; full address+phone+email unlock on `transaction.status === paid`. Mobile shows lock icon on locked fields. Plan `03-05-PLAN.md`.

#### v1.1-E1-07 — Stripe Identity for "ID Verified" badge
- **REQ:** REQ-verification-badges (Stripe Identity slice)
- **Labels:** `feature`, `backend`, `mobile`, `stripe`, `verification`, `P0-launch-blocker`, `phase-3`
- **Body:** Use Stripe Identity **hosted flow** via `url_launcher` (flutter_stripe does NOT support Identity). Webhook on shared `STRIPE_WEBHOOK_SECRET` auto-creates `VerificationRequest` with `status=approved` → recalculates tier. Plan `03-06-PLAN.md`.

#### v1.1-E1-08 — Business account EIN required at registration
- **REQ:** REQ-business-account-ein
- **Labels:** `feature`, `backend`, `mobile`, `auth`, `verification`, `P1-must-have`, `phase-3`
- **Body:** EIN verification type exists post-registration only. For Business accounts, gate registration on supplying an EIN that passes the existing verification pipeline. Plan `03-06-PLAN.md`.

#### v1.1-E1-09 — Jobs lead-pricing engine + employer domain denylist
- **REQ:** REQ-jobs-lead-gen
- **Labels:** `feature`, `backend`, `mobile`, `jobs`, `payments`, `P1-must-have`, `phase-3`
- **Body:** Per-lead pricing $10–500 by role tier (Entry $10–20, Mid $30–50, Specialized/Senior $100–500). Buyer-selected dropdown (Addendum A-05). Employer email domain check rejects Gmail/Yahoo/Outlook/etc. Ranked match list, no spam push. Plan `03-07-PLAN.md`.

#### v1.1-E1-10 — Saved sellers module
- **REQ:** REQ-saved-sellers
- **Labels:** `feature`, `backend`, `mobile`, `P1-must-have`, `phase-3`
- **Body:** New `saved_sellers` table, endpoints to save/unsave/list, mobile UI for "Save seller" action and "Saved sellers" list in profile.

#### v1.1-E1-11 — Add `Archived` to PostStatus enum
- **REQ:** REQ-archived-post-status
- **Labels:** `chore`, `backend`, `database`, `posts`, `P1-must-have`, `phase-3`
- **Body:** Forward-compatible Prisma migration adds `archived` to `PostStatus` enum. Update API + mobile filter chip. Per CLAUDE.md "forward-compatible-only" rule, no DROP / RENAME / SET NOT NULL.

#### v1.1-E1-12 — Allow video uploads (mp4/mov) for portfolio + after-photo evidence
- **REQ:** REQ-video-mime-uploads
- **Labels:** `feature`, `backend`, `uploads`, `P1-must-have`, `phase-3`
- **Body:** Extend `backend/src/common/utils/storage.ts` allowlist to include `video/mp4` + `video/quicktime`. Cap stays at 100 MB (D-19 50 MB rejected per Addendum A-04). Mobile upload picker accepts videos.

#### v1.1-E1-13 — Phase 3 closeout audit suite (Vitest)
- **REQ:** Audit gate
- **Labels:** `test`, `backend`, `ci-cd`, `P1-must-have`, `phase-3`
- **Body:** `backend/tests/audit/closeout-audit.test.ts` — one `describe` per Phase 3 Success Criterion, including the 0.1 mi radius tolerance assertion. Becomes CI gate. Plan `03-08-PLAN.md`.

#### v1.1-E1-14 — Photo upload on post creation (mobile UI)
- **REQ:** Backlog Phase 999.1 (promote to v1.1)
- **Labels:** `feature`, `mobile`, `posts`, `uploads`, `P0-launch-blocker`, `phase-3`
- **Body:** Backend already supports `photos[]` (max 10) — mobile does not yet collect on create-post (manual + AI flows). Launch-blocker because reverse-marketplace value depends on visual context. Wire to existing `/uploads/*` presigned URL flow.

---

### EPIC v1.1-E2 — Phase 4: Pre-Launch Hardening

#### v1.1-E2-01 — ADR + CI gate: forward-compatible-only Prisma migrations
- **REQ:** Cross-cutting Phase 4 (T-01, D-04)
- **Labels:** `chore`, `infra`, `database`, `ci-cd`, `P0-launch-blocker`, `phase-4`
- **Body:** Lock D-04 ADR in `.planning/intel/decisions.md` and surface in CLAUDE.md. Audit suite enforces regex: no `DROP COLUMN`, no `RENAME`, no `SET NOT NULL` on existing columns during canary windows. Plan `04-01-PLAN.md` (Wave 0 blocking).

#### v1.1-E2-02 — Mobile shell carry-over (Identity screen, EIN field, Jobs roleTier dropdown)
- **REQ:** Phase 3 → Phase 4 carry-over
- **Labels:** `feature`, `mobile`, `verification`, `jobs`, `P0-launch-blocker`, `phase-4`
- **Body:** Identity verify screen (launches Stripe hosted URL), EIN field on Business registration, Jobs `roleTier` dropdown. 2 backend smoke tests. Plan `04-02-PLAN.md`.

#### v1.1-E2-03 — Observability foundation (Sentry Performance + Better Stack + Slack paging)
- **REQ:** NFR-monitoring
- **Labels:** `infra`, `observability`, `P0-launch-blocker`, `phase-4`
- **Body:** Sentry Performance for distributed tracing (extends Phase 1 SDK, lazy-init preserved). Better Stack/Logtail for centralized logs via pino-logtail transport. Slack-only paging to `#sorcyn-prod-alerts` (solo-founder, no PagerDuty rotation). AlertManager rules. Plan `04-03-PLAN.md`.

#### v1.1-E2-04 — Canary CI/CD pipeline (2nd VPS + Nginx weighted upstream)
- **REQ:** NFR-cicd
- **Labels:** `infra`, `ci-cd`, `P0-launch-blocker`, `phase-4`
- **Body:** 2nd VPS at +$15–30/mo, Nginx weighted upstream for 10% → 50% → 100% canary, GitHub Actions environment gates per stage, weight-flip rollback <60s with alternating VPS roles. Nginx `ip_hash` + `weight=N` for Socket.IO sticky sessions (T-07). Plan `04-04-PLAN.md`. ✅ Closed at commit `e76fc97`.

#### v1.1-E2-05 — Disaster recovery: nightly pg_dump → R2 + cross-region + drill
- **REQ:** NFR-disaster-recovery
- **Labels:** `infra`, `dr`, `database`, `P0-launch-blocker`, `phase-4`
- **Body:** Nightly `pg_dump` to Cloudflare R2, cross-region sync. First measured RTO/RPO drill (target RTO <4h / RPO <1h). Quarterly cadence committed. Plan `04-05-PLAN.md`. ✅ First drill PASS — RTO 322 min wall / ~81 min active, RPO ~0 min.

#### v1.1-E2-06 — Synthetic incident drill + chaos endpoint
- **REQ:** NFR-monitoring (SC#4)
- **Labels:** `test`, `observability`, `P0-launch-blocker`, `phase-4`
- **Body:** Better Stack continuous monitors + `scripts/synthetic-incident.sh` + force-500 chaos endpoint. **PENDING HUMAN ACTION:** live drill on staging — capture Slack screenshots for 4 alert paths, fill AUDIT-MARKER:DRILL table. Plan `04-06-PLAN.md` (Task 3 still pending).

#### v1.1-E2-07 — Load test (k6) + Snyk + OWASP ZAP + test-coverage gap-fill
- **REQ:** NFR-test-coverage, NFR-security, NFR-performance, NFR-throughput
- **Labels:** `test`, `security`, `infra`, `P0-launch-blocker`, `phase-4`
- **Body:** 1,000-concurrent k6 run sustaining API <500ms p95, search <500ms, payment <3s, DB <100ms p95 for 15 min. Snyk + OWASP ZAP clean of HIGH/CRITICAL. Test coverage ≥70% with 70/20/10 split. **PENDING:** k6 staging run + `export-sentry-db-p95.sh` for `dbP95Ms` baseline. Plan `04-07-PLAN.md`.

#### v1.1-E2-08 — PCI-DSS SAQ-A applicability + filing
- **REQ:** NFR-security (PCI slice)
- **Labels:** `security`, `docs`, `P0-launch-blocker`, `phase-4`
- **Body:** **PENDING HUMAN ACTION:** Confirm with Stripe Support whether Path A SAQ-A applies (no PAN handling on platform) or Path B SAQ-A-EP. File the chosen SAQ. Skeleton in `docs/PCI_SAQ_A.md`. Plan `04-07-PLAN.md` Task 5.

#### v1.1-E2-09 — Accessibility audit (WCAG 2.1 AA) across all customer-facing screens
- **REQ:** NFR-accessibility
- **Labels:** `a11y`, `mobile`, `P0-launch-blocker`, `phase-4`
- **Body:** Flutter `accessibility_test` + manual TalkBack/VoiceOver walkthrough. Audit: keyboard nav, screen reader semantics, 4.5:1 contrast minimum, 16 px scalable to 200%, 44×44 px touch targets, visible focus indicators. Plan `04-08-PLAN.md`.

#### v1.1-E2-10 — 20-user UAT + sign-off
- **REQ:** REQ-launch-readiness (UAT slice)
- **Labels:** `test`, `mobile`, `P0-launch-blocker`, `phase-4`
- **Body:** 10 buyers + 10 sellers in DFW (waitlist + Reddit + local network). Script covers full transaction loop. Sign-off captured in `docs/UAT_REPORT.md`. Plan `04-08-PLAN.md`.

#### v1.1-E2-11 — Audit suite SC1–SC5 final closure
- **REQ:** Phase 4 verification gate
- **Labels:** `test`, `ci-cd`, `P1-must-have`, `phase-4`
- **Body:** Extends Phase 3's 26-assertion suite (does NOT replace). One describe per Phase 4 SC. CI green required to promote v1.1 to launch.

---

### EPIC v1.1-E3 — Phase 5: DFW Soft-Launch + Cold-Start

#### v1.1-E3-01 — Cold-start seed script (FAKE BUYER POSTS only)
- **REQ:** REQ-cold-start-launch
- **Labels:** `feature`, `backend`, `database`, `analytics`, `P0-launch-blocker`, `phase-5`
- **Body:** One-time script generates fake buyer posts (NEVER fake sellers — per Apr 15 transcript) across 350+ DFW zip codes (80% coverage). Seeded posts flagged for analytics. Deleted before any real seller offer can land.

#### v1.1-E3-02 — Year 1 metrics dashboard (Grafana or Datadog)
- **REQ:** REQ-success-metrics, REQ-cold-start-launch
- **Labels:** `feature`, `infra`, `observability`, `analytics`, `P0-launch-blocker`, `phase-5`
- **Body:** Dashboard tracks NSM Weekly Active Transactions (10 M3 / 30 M6 / 120 M12), GMV ($140K target), revenue ($9,800 ~9% blended avg take rate — 8% products / 10% services, seller-side only), active buyers (750) / sellers (200), 500 completed transactions, dispute rate <8%, avg rating >4.3.

#### v1.1-E3-03 — Marketing launch (TikTok + Instagram + app stores)
- **REQ:** REQ-cold-start-launch
- **Labels:** `feature`, `marketing`, `P0-launch-blocker`, `phase-5`
- **Body:** Soft-launch announcement on TikTok + Instagram. iOS App Store + Google Play approvals (privacy disclosures, screenshots, app review). Coordinated push when both stores approve.

#### v1.1-E3-04 — Post-launch ops runbook + on-call rotation
- **REQ:** NFR-uptime, REQ-cold-start-launch
- **Labels:** `docs`, `infra`, `observability`, `P0-launch-blocker`, `phase-5`
- **Body:** Runbook covers Stripe outage, Gemini outage fallback, FCM failure, SendGrid failure, escalation contacts, on-call rotation. Tabletop exercise once before launch day.

#### v1.1-E3-05 — First 10 real transactions logged within 30 days post-launch
- **REQ:** REQ-cold-start-launch (success criterion)
- **Labels:** `chore`, `analytics`, `P1-must-have`, `phase-5`
- **Body:** Validation issue — track first 10 real end-to-end completed transactions. Close when met. Should NOT need engineering work if Phases 1–4 closed clean.

---

### EPIC v1.1-E4 — Bug-fix / UX gap bucket (Phase 999.2 backlog promoted)

#### v1.1-E4-01 — Profile menu: "Help & Support" routes to `/settings` instead of `/help`
- **REQ:** Backlog 999.2 finding I
- **Labels:** `bug`, `mobile`, `P1-must-have`
- **Body:** 1-line fix at `mobile/lib/features/profile/.../profile_screen.dart:557` — `context.push('/help')`.

#### v1.1-E4-02 — Repost UX: auto-route to new post detail + reword toast
- **REQ:** Backlog 999.2 finding B
- **Labels:** `bug`, `mobile`, `posts`, `P2-should-have`
- **Body:** `POST /posts/:id/repost` returns `201 Created` (new post). Mobile currently invalidates the old post detail and toasts "Post reposted" — mis-frames as in-place reactivation. Either route to new post detail, or change server semantics to reopen-in-place (decide before fixing).

#### v1.1-E4-03 — Add `canDelete` getter — allow delete on filled/expired/cancelled posts
- **REQ:** Backlog 999.2 finding C
- **Labels:** `bug`, `mobile`, `posts`, `P2-should-have`
- **Body:** `post.canEdit` currently gates Delete but is `isDraft || isActive`. Add `canDelete` (true for owner unless an active transaction is in flight). Gate the menu item on it.

#### v1.1-E4-04 — My Posts: add status filter segmented control
- **REQ:** Backlog 999.2 finding F
- **Labels:** `feature`, `mobile`, `posts`, `design-system`, `P2-should-have`
- **Body:** Segmented control: All / Active / Filled / Expired / Cancelled (+ Archived when E1-11 lands). Use Sorcyn locked tokens.

#### v1.1-E4-05 — Transactions screen: missing back button when entered from Settings
- **REQ:** Backlog 999.2 finding G
- **Labels:** `bug`, `mobile`, `P2-should-have`
- **Body:** Pass `onBack: () => context.pop()` to `StyledAppBar` in `transactions_screen.dart:52`. Screen-specific, not a global bug.

#### v1.1-E4-06 — RenderFlex 3px overflow in EmptyState on Transactions empty list
- **REQ:** Backlog 999.2 finding H
- **Labels:** `bug`, `mobile`, `design-system`, `P3-nice-to-have`
- **Body:** Cosmetic — wrap EmptyState in `SingleChildScrollView` or shrink vertical padding when parent gives h<=131px.

#### v1.1-E4-07 — Help & Support FAQ accordion overflows ~80px during expand/collapse transition
- **REQ:** v1.1-E4 follow-up from manual flow audit (Help & Support screen, 2026-05-22)
- **Labels:** `bug`, `mobile`, `design-system`, `P2-should-have`
- **Body:** Tapping any FAQ row throws `A RenderFlex overflowed by 80–100 pixels on the bottom` (reproduces on all five FAQs). **Re-tested 2026-05-23 on physical iPhone (iOS 26.4.2):** the overflow now appears on *collapse* rather than expand — expand is clean, collapse triggers the assertion. Whichever direction triggers it, the root cause is the same: `mobile/lib/features/settings/presentation/screens/help_support_screen.dart:307` — the inner `Column` is wrapped in `IntrinsicHeight → Row` (line 286), which locks each row to a `BoxConstraints(w=323.0, h=20.0)` height when collapsed. When `AnimatedCrossFade` swaps the answer text in or out, the Column can't grow past the intrinsic height mid-transition. Fix options: (a) drop `IntrinsicHeight` since the 4px gradient strip can use a non-stretched layout (e.g., move the strip into the `Column` as a left-aligned `Container` via `Stack` or `Row`-with-fixed-strip-and-Expanded), or (b) keep `IntrinsicHeight` but wrap the strip in a `Positioned.fill`/`Stack` so vertical sizing comes from the content, not the strip. Verify the gradient strip still grows to match expanded height after the fix AND that collapse no longer throws. No data loss — purely a layout error.

#### v1.1-E4-08 — Help & Support: Email + Phone buttons silently fail on iOS (missing `LSApplicationQueriesSchemes`)
- **REQ:** v1.1-E4 follow-up from manual flow audit (Help & Support screen, 2026-05-22)
- **Labels:** `bug`, `mobile`, `ios`, `P1-must-have`
- **Body:** Tapping "Email Support" (`help_support_screen.dart:147-148`) or "Phone" (`:177`) does nothing on iOS. Root cause: `mobile/ios/Runner/Info.plist` has no `LSApplicationQueriesSchemes` array — iOS 9+ requires `mailto` and `tel` to be declared there or `launchUrl` silently no-ops. Compounded by three code-level issues: (a) `launchUrl(...)` is not awaited, (b) no `canLaunchUrl` pre-check, (c) no user-visible fallback (snackbar / dialog with copy-to-clipboard) when launch fails. Fix: add `<key>LSApplicationQueriesSchemes</key><array><string>mailto</string><string>tel</string><string>sms</string><string>https</string></array>` to `Info.plist`, and wrap each launch in `final ok = await canLaunchUrl(uri); if (ok) await launchUrl(uri, mode: LaunchMode.externalApplication); else showSnackBar(...)`. Apply the same hardening to the `Send Message` GradientButton (`:184`) and the `_sendMessage` helper (`:49`). **Note for QA:** `tel:` never works in the iOS simulator (no Phone app) — must verify on a real device. `mailto:` works on the sim only if a mail account is configured in iOS Mail. ✅ Fixed at commit `3c3e7f4`.

#### v1.1-E4-09 — Help & Support: "Live Chat" is a `mailto` stub mislabeled with "Online" badge
- **REQ:** v1.1-E4 follow-up from manual flow audit (Help & Support screen, 2026-05-22)
- **Labels:** `bug`, `mobile`, `messaging`, `P2-should-have`
- **Body:** The "Live Chat" row (`help_support_screen.dart:158-164`) is wired to `_sendMessage`, which is just `launchUrl('mailto:support@sorcyn.com?subject=...')` (`:49-52`). It shares a hardcoded `_OnlineBadge` ("Online", green dot, "Usually responds in minutes") — actively misleading users to expect real-time chat. Two paths forward: (1) **Hide it for v1.1** — remove the row and the "Send Message" CTA until a real support chat handoff exists; or (2) **Build it on existing infra** — the in-app messaging module (`backend/src/modules/messages/`) and Socket.IO gateway already power buyer↔seller chat; reuse by creating a `support` user/queue and opening a conversation thread when tapped. Decision needed before implementation. In the meantime, at minimum remove the "Online" badge so the stub isn't a false promise. Confirmed still reproducing on physical iPhone 2026-05-23.

#### v1.1-E4-10 — Help & Support: rename "Send Message" CTA to "Submit Inquiry" + change icon
- **REQ:** v1.1-E4 follow-up from real-device E4-08 verification (physical iPhone, 2026-05-23)
- **Labels:** `bug`, `mobile`, `design-system`, `copy`, `P2-should-have`
- **Body:** The gradient CTA at `help_support_screen.dart:181-189` reads "Send Message" with a paper-plane (`Icons.send`) icon, but the underlying behavior is `_sendMessage` → `launchUrl('mailto:support@sorcyn.com?subject=Support%20Request')` — i.e. it opens the user's email composer, not a chat. The label + icon strongly imply real-time messaging (consistent with the misleading "Live Chat" row in E4-09), which sets the wrong expectation. Fix: rename the button to **"Submit Inquiry"** and swap the icon to something email/form-shaped — candidates: `Icons.email_outlined`, `Icons.contact_support_outlined`, or `Icons.outgoing_mail` (design call). Apply the same intent to the Live Chat row when E4-09 is resolved (the two should not contradict each other). Locked Sorcyn gradient + 16px radius stays the same — copy + icon change only.

#### v1.1-E4-11 — Help & Support: Legal section rows (Privacy / Terms / Community Guidelines) are no-op
- **REQ:** v1.1-E4 follow-up from real-device E4-08 verification (physical iPhone, 2026-05-23)
- **Labels:** `bug`, `mobile`, `legal`, `P1-must-have`
- **Body:** All three rows in the LEGAL section (`help_support_screen.dart:202`, `:211`, `:220`) are wired to `onTap: () {}` — they tap-acknowledge but go nowhere. This is a P1 (not P2) because shipping a marketplace without reachable Terms of Service / Privacy Policy is a legal/compliance gap (App Store review will also flag missing Privacy URL). Fix paths: (a) host the three docs as static pages (e.g. `https://sorcyn.com/legal/{terms,privacy,community}`) and wire each row through the same `_launchExternal` helper added in E4-08 — fastest; or (b) build in-app screens with `flutter_markdown` and route via GoRouter — better UX, more work. App Store submission will require the Privacy URL specifically. Decide before v1.1 launch.

#### v1.1-E4-12 — Dev infra: physical iOS device launch command undocumented (`--dart-define=API_BASE_URL=...`)
- **REQ:** v1.1-E4 follow-up from real-device E4-08 verification (physical iPhone, 2026-05-23)
- **Labels:** `docs`, `dx`, `mobile`, `P3-nice-to-have`
- **Body:** During E4-08 real-device verification, login failed on the physical iPhone with "Unable to connect. Check your internet connection." Root cause: `mobile/lib/core/config/env_config.dart:22-27` defaults iOS to `http://localhost:3000/api/v1`, which resolves to the device itself on a physical phone (works on sim because sim shares the Mac's loopback). Fix is documented inline at `env_config.dart:21` but not surfaced anywhere user-facing — `mobile/README.md:84`, `docs/setup.md:126`, `docs/README.md:80` all show the sim-only command. Three improvements to consider (pick at least one): (a) add a "Physical device" section to both READMEs and `docs/setup.md` showing `flutter run -d <udid> --dart-define=API_BASE_URL=http://<mac-lan-ip>:3000/api/v1` with a one-liner for finding the Mac IP (`ipconfig getifaddr en0`); (b) provide a `mobile/.vscode/launch.json` with an "iOS device (LAN)" configuration; (c) auto-detect the LAN IP from a `.env.local` (gitignored) read by `env_config.dart`. Option (a) is minimum-viable and unblocks anyone else on the team picking up a physical device test.

#### v1.1-E4-14 — Sorcyn rebrand: rename runtime/deployment surfaces (iOS bundle, package.json, DB, URL scheme, repo) — **GH Issue #80**
- **REQ:** v1.1-E4 follow-up from manual flow audit + brand-rename planning (2026-05-24)
- **Labels:** `chore`, `infra`, `area/mobile`, `area/backend`, `P1-must-have`
- **GitHub:** [#80](https://github.com/SorcynMarketplace/ReverseMarketplace/issues/80) — milestone v1.1
- **Body:** The doc-level CLAUDE.md / PRD rename to "Sorcyn" is tracked separately in **GH Issue #69 (BL-DOCS-01)** and is still pending (CLAUDE.md currently still reads "TBD" / "Reverse Marketplace Platform"). This issue (#80) covers the remaining "Reverse Marketplace" / "reversemarketplace" references that have runtime/env-var/App-Store impact and need a coordinated rollout: iOS `CFBundleDisplayName`, custom URL scheme (`reversemarket://` → grace-period both), Android intent (`app.reversemarket.com`), `backend/package.json` `name`, Docker image tag (`IMAGE_NAME` in `ci.yml`), test DB name (`reverse_marketplace_test`), prod DB name (needs maintenance window or logical-replication cutover), seed admin email (`admin@reversemarketplace.com`), repo folder name. **Must land before the public Sorcyn DFW launch** — App Store listing must show "Sorcyn" by then. Recommended sequencing (lowest coupling first): App Store + iOS bundle → URL scheme migration with grace period → backend package + Docker tag → test DB → prod DB → seed admin email → repo folder. Already-done renames not in scope: logger (`sorcyn-api`), support email (`support@sorcyn.com`), infra runbooks, planning docs, design tokens, `Sorcyn_PRD_v2.2.md`. Out of scope: archival/rename of legacy `ReverseMktplPRD.md` (its remaining TBDs are real, not brand placeholders), email forwarding DNS coordination. Full breakdown in the GH issue body.

#### v1.1-E4-13 — Restore backend coverage thresholds to 80/75/65/80 (currently lowered to 80/75/60/77)
- **REQ:** v1.1-E4 follow-up from CI fix during PR #78 (2026-05-24)
- **Labels:** `tech-debt`, `backend`, `test`, `ci`, `P2-should-have`
- **Body:** `backend/vitest.config.ts` thresholds were temporarily lowered on PR #78 to ship the v2.2 business-accounts bundle (statements 80→77, branches 65→60; lines + functions unchanged at 80/75). Original 80/75/65/80 was set by `9025ff2` ("snapshot WIP baseline before Phase 2 execution") as an aspirational target, but PR #78 was the first CI run after multiple commits with low-coverage source code landed (v2.2 backend, plus pre-existing low-coverage areas). Drivers of the current gap: (1) **pre-existing** — `payments.service.ts` 37%/29%, `notifications.service.ts` 59%/36%, `common/utils/{push,geo,storage}.ts` single-digit %; (2) **v2.2-added but only partially covered** — `admin.service.ts` branches 58.97%, `posts.service.ts` 71%/65%. Work to restore the gates: write integration tests for the payments flow (highest-impact since it's the lowest-coverage core module — Stripe Connect happy paths, refund, dispute, escrow release), add unit tests for `notifications.service.ts` queue/delivery branches, decide whether `common/utils/{push,geo,storage}.ts` should stay excluded from coverage (they're thin wrappers over external SDKs that get exercised in integration but not unit tests — could be added to vitest.config.ts `exclude` list instead of being tested). After improvements, revert the threshold lines in `vitest.config.ts:24-27` to `lines: 80, functions: 75, branches: 65, statements: 80` and run `npm run test:coverage` locally to confirm green before pushing.

---

## v2.0 — Texas Expansion + Enhancements

> PRD Phase 2 scope. Open issues now as backlog so they're discoverable; do not start until Phase 5 launch metrics validate DFW.

### EPIC v2.0-E1 — Search & Auth upgrades

#### v2.0-E1-01 — Migrate search to Elasticsearch 8+
- **REQ:** REQ-elasticsearch-upgrade
- **Labels:** `feature`, `backend`, `search`, `infra`, `P1-must-have`
- **Body:** Target <200 ms search latency at 100K-user load. PostgreSQL FTS retired or kept as offline fallback. Migration plan + dual-write window + cutover.

#### v2.0-E1-02 — OAuth login (Google, Apple, Facebook)
- **REQ:** REQ-oauth-login
- **Labels:** `feature`, `auth`, `backend`, `mobile`, `P1-must-have`
- **Body:** Add OAuth alongside email/password. Token mapping into existing JWT flow. Apple required for iOS app store compliance when other social providers are offered.

#### v2.0-E1-03 — Twilio SMS phone verification
- **REQ:** REQ-twilio-sms-verification
- **Labels:** `feature`, `backend`, `mobile`, `auth`, `verification`, `P1-must-have`
- **Body:** Activates the deferred `phoneVerified` flow. Twilio Verify API + rate limits + cost monitoring.

### EPIC v2.0-E2 — Marketplace surfaces

#### v2.0-E2-01 — Shipping integration (carrier labels, tracking, address validation)
- **REQ:** REQ-shipping-integration
- **Labels:** `feature`, `backend`, `mobile`, `payments`, `P1-must-have`
- **Body:** Pick carrier (EasyPost / Shippo / direct USPS+UPS+FedEx). Label generation, tracking webhooks, address validation on checkout.

#### v2.0-E2-02 — B2B / Wholesale UI surfaced
- **REQ:** REQ-b2b-wholesale-ui
- **Labels:** `feature`, `mobile`, `backend`, `design-system`, `P2-should-have`
- **Body:** DB schema already present, UI hidden. Exit "Coming Soon" state for Inventory umbrella. New category navigation, bulk-pricing fields, B2B fee tier (5% / 5%).

#### v2.0-E2-03 — Promotion system (paid seller visibility)
- **REQ:** REQ-promotion-system
- **Labels:** `feature`, `backend`, `mobile`, `payments`, `P2-should-have`
- **Body:** Visibility boosts, time-window promotions, post-renewals. Revenue routed through existing Stripe Connect flow. Tier model documented in Session 2 Feb 12th transcript.

#### v2.0-E2-04 — Automated tier-1 dispute resolution
- **REQ:** REQ-automated-dispute-resolution
- **Labels:** `feature`, `backend`, `disputes`, `P2-should-have`
- **Body:** Rules engine for low-value / common-pattern disputes. Manual escalation for everything else. Builds on existing dispute MVP.

### EPIC v2.0-E3 — Geo + defense-in-depth

#### v2.0-E3-01 — Texas-wide rollout (zip-code coverage map)
- **REQ:** REQ-texas-expansion
- **Labels:** `feature`, `analytics`, `marketing`, `P1-must-have`
- **Body:** Documented Texas zip-code coverage targets. Per-city soft-launch playbook. Expansion gate: DFW must hit M6 success metrics first.

#### v2.0-E3-02 — Supabase RLS policies (defense in depth)
- **REQ:** REQ-rls-policies
- **Labels:** `security`, `database`, `infra`, `P2-should-have`
- **Body:** Add Postgres Row-Level Security as a second layer behind the canonical app-level enforcement. Per CLAUDE.md: app-level remains canonical, RLS is defense-in-depth only.

#### v2.0-E3-03 — PostGIS migration (replace Haversine SQL)
- **REQ:** Implied by REQ-seller-feed / REQ-mvp-search at Texas scale
- **Labels:** `chore`, `backend`, `database`, `search`, `P2-should-have`
- **Body:** Deferred from Phase 3 (Addendum A-01). Migrate distance queries to PostGIS for performance + accuracy at Texas-wide radius. Forward-compatible migration.

---

## v3.0 — National Rollout + Verticals

> PRD Phase 3 scope. Open issues now as backlog; do not start until v2.0 lands and is stable.

### EPIC v3.0-E1 — Geographic + vertical expansion

#### v3.0-E1-01 — Houston / Austin / San Antonio city rollouts
- **REQ:** REQ-houston-austin-sa
- **Labels:** `feature`, `marketing`, `analytics`, `P1-must-have`
- **Body:** Per-city zip-code seeding + marketing campaign + launch dashboard. Reuse DFW playbook.

#### v3.0-E1-02 — National radius caps + national search/filter
- **REQ:** REQ-houston-austin-sa (national slice)
- **Labels:** `feature`, `backend`, `mobile`, `search`, `P1-must-have`
- **Body:** Extend radius caps beyond Texas. Unblock national-level search/filtering. Address national-scale performance regressions surfaced by Phase 4 load test patterns.

#### v3.0-E1-03 — Real Estate vertical
- **REQ:** REQ-real-estate-vertical
- **Labels:** `feature`, `backend`, `mobile`, `verification`, `P2-should-have`
- **Body:** DB schema already present. Exit "Coming Soon" with broker-reviewed copy + lead-gen flow. License verification path required for agents.

#### v3.0-E1-04 — Buyer financing / installment options
- **REQ:** REQ-financing-options
- **Labels:** `feature`, `payments`, `backend`, `mobile`, `P2-should-have`
- **Body:** Integrate buyer financing (Affirm / Klarna / Stripe Capital) alongside existing escrow path. Compliance review required.

#### v3.0-E1-05 — Enterprise features (team accounts, bulk procurement, custom contracts)
- **REQ:** REQ-enterprise-features
- **Labels:** `feature`, `backend`, `mobile`, `admin`, `P2-should-have`
- **Body:** B2B onboarding flow. Team accounts with role hierarchy. Bulk procurement workflows. Custom contract storage. AuditLog + admin support.

### EPIC v3.0-E2 — AI infrastructure scale

#### v3.0-E2-01 — Migrate AI from Gemini Flash-Lite to Claude Haiku
- **REQ:** REQ-claude-haiku-upgrade
- **Labels:** `feature`, `backend`, `ai`, `infra`, `P1-must-have`
- **Body:** Spend envelope $85–112/mo at 10K users. Preserve existing slug-resolution + Zod validation contract. Provider-abstracted adapter so future swaps are cheap.

---

## Out-of-Phase Backlog (not yet milestoned)

### Documentation & developer experience

#### BL-DOCS-01 — Update CLAUDE.md / PRD: brand name is "Sorcyn"
- **Labels:** `docs`, `chore`, `P3-nice-to-have`
- **Body:** Both CLAUDE.md and `ReverseMktplPRD.md` still say "Name: TBD" — brand name is Sorcyn (confirmed). Update without changing repo / slug / deep-link scheme (those stay `ReverseMarketplace` / `reversemarket://` per locked decision in `.planning/REQUIREMENTS.md` Out of Scope).

#### BL-DOCS-02 — Onboarding guide for new contributors
- **Labels:** `docs`, `P3-nice-to-have`
- **Body:** Consolidate `docs/README.md` + `docs/setup.md` + `docs/API_TESTING_GUIDE.md` + CLAUDE.md into a single onboarding flow. Currently three doors into the codebase.

#### BL-DOCS-03 — Decision log cross-link from CLAUDE.md
- **Labels:** `docs`, `chore`, `P3-nice-to-have`
- **Body:** `.planning/intel/decisions.md` holds 73 ADRs. CLAUDE.md doesn't reference it. Add a "Decisions" section pointing readers there for the why behind the patterns.

### Tech debt surfaced by audit but not yet milestoned

#### BL-TECH-01 — Orphan worktree cleanup
- **Labels:** `chore`, `P3-nice-to-have`
- **Body:** `.claude/worktrees/agent-ab3d175aee4ec467d` left in place after Wave 2 spawned-executor preflight failure. Per STATE.md, cleanup command documented but not yet run.

#### BL-TECH-02 — Confirm audit script location before Phase 3 re-run
- **Labels:** `chore`, `test`, `P2-should-have`
- **Body:** Phase 3 SC requires audit re-run as proof. STATE.md flags location confirmation as a Phase 3 blocker. Capture canonical path in a single source-of-truth doc.

#### BL-TECH-03 — Stripe AccountSession (embedded onboarding) as a future option
- **Labels:** `spike`, `stripe`, `P3-nice-to-have`
- **Body:** Audit gap #6. Hosted onboarding is canonical for v1.1 (works with `url_launcher`). Spike whether AccountSession would improve UX once we ship.

#### BL-TECH-04 — Per-buyer offer cap (currently only per-post)
- **Labels:** `spike`, `offers`, `P3-nice-to-have`
- **Body:** Out-of-scope per REQUIREMENTS.md. Re-evaluate if marketplace abuse patterns emerge post-launch.

#### BL-TECH-05 — Custom RBAC (beyond `isAdmin` boolean)
- **Labels:** `spike`, `admin`, `P3-nice-to-have`
- **Body:** Out-of-scope per REQUIREMENTS.md ("`isAdmin` boolean sufficient for MVP"). Re-evaluate when admin team grows beyond single founder.

---

## Summary counts

| Milestone | Epics | Issues | P0 launch-blockers |
|-----------|-------|--------|--------------------|
| v1.0 (shipped) | 1 rollup | 1 (or 25 if Option B) | — |
| v1.1 (DFW launch) | 4 | 31 | 22 |
| v2.0 (Texas) | 3 | 11 | — (none gate launch) |
| v3.0 (national) | 2 | 6 | — |
| Backlog (no milestone) | — | 8 | — |
| **Total** | **10 epics** | **57 issues** | **22 P0** |

---

## Suggested execution order when creating in GitHub

1. Create the four GitHub milestones first (v1.0 closed, v1.1/v2.0/v3.0 open).
2. Create labels from the legend (24 area + 4 priority + 10 type + modifiers).
3. Create v1.1 epics + their sub-issues first, link sub-issues to epics with checkbox lists in the epic body.
4. Create v2.0 + v3.0 epics + sub-issues (backlog, no due date).
5. Create the backlog bucket (no milestone).
6. Optionally close v1.0 rollup epic with a link to commit `804c8ec` for traceability.

Use `gh issue create` with `--milestone` + `--label` flags to script the creation once the plan is approved. Don't run that yet — review this file first.
