# Phase 3: MVP Implementation Closeout - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Reconcile shipped code with locked ADRs, audit findings (2026-04-18 backend audit: 41 MISSING + 23 PARTIAL), and Phase 2 UAT carry-overs (2026-04-29: Stripe Connect 3-bug cluster + Profile menu mis-routing). Every v1 requirement audited as MISSING or PARTIAL becomes IMPLEMENTED so DFW launch ships against the same surface area the PRD/ADRs promised.

**Scope (13 requirements / 6 success criteria):**
1. Geocoding utility + radius-based seller-feed filter (REQ-three-day-exclusivity, REQ-seller-feed, REQ-mvp-search distance component)
2. Counter-offer flow + mobile structured modal (REQ-counter-offer)
3. Audit-gap reconciliation cluster: `MAX_OFFERS_PER_POST` 10→25, `Archived` PostStatus, video MIMEs (mp4/mov), saved-sellers (follow/favorite), PII gate until escrow funded (5 reqs)
4. Jobs lead-pricing engine + employer email-domain check (REQ-jobs-lead-gen)
5. Stripe Identity webhook → ID Verified badge auto-award + EIN required at business registration (REQ-verification-badges, REQ-business-account-ein)
6. Stripe Connect onboarding 3-bug fix (NEW REQ-stripe-connect-onboarding-completion — Phase 2 UAT Gap 2 carry-over)
7. Cross-cutting Vitest audit suite + audit re-run (Success Criteria 3 verification mechanism)

**Out of scope (deferred per CLAUDE.md / PRD §7 / STATE.md deferred items):**
- Promotions / paid visibility — Phase 6
- OAuth + Twilio SMS — Phase 6
- Elasticsearch upgrade — Phase 6
- Texas-wide / national rollout — Phase 6/7
- Claude Haiku upgrade — Phase 7
- Real estate / financing / enterprise — Phase 7
- Profile menu Help & Support → Settings mis-routing — 999.2 backlog finding I (separate from this phase)
- B2B/wholesale UI surface — Phase 6

</domain>

<decisions>
## Implementation Decisions

### Geocoding & Distance (REQ-seller-feed, REQ-mvp-search distance component)

- **D-01:** Distance computation uses **PostGIS** extension on the existing PostgreSQL database. Migration enables the extension; seller-feed radius filter uses `ST_DWithin` with `geography(Point, 4326)` columns for accurate spheroid math at 5–100 mi distances. No raw-SQL hand-rolling of Haversine.
- **D-02:** Address → lat/lng conversion uses the **Google Geocoding API** (the existing-but-unused `GOOGLE_MAPS_API_KEY` env var becomes active). Geocode once at post creation and at seller-profile location updates; cache `lat`, `lng` directly on the row so reads never re-hit the API. Cost projection: ~$25/yr at MVP volumes (~5K posts/yr × $5/1000 requests).
- **D-03:** Tolerance: 0.1 mi per Success Criteria 1. PostGIS native distance precision exceeds this — no special handling needed.
- **D-04:** Failure mode: if geocoding fails at post create, the post is rejected with a structured error pointing to the location field; no fallback to "best-guess" coordinates. Same for seller-profile location updates.

### Counter-Offer Data Model (REQ-counter-offer)

- **D-05:** New **`OfferRevision`** table (separate from `Offer`). Linear chain pattern, NOT a state machine.
- **D-06:** Schema: `id` (UUID PK), `parent_offer_id` (FK → `offers.id`), `revision_number` (int, monotonically increasing per parent_offer), `proposed_by` (enum: `buyer` | `seller`), `price` (numeric), `timeline_can_start` (timestamptz), `timeline_completion` (timestamptz), `message` (text 50–1,000 ch — same constraints as REQ-submit-offer), `status` (enum: `proposed` | `accepted` | `declined` | `superseded`), `created_at`, `created_by` (UUID FK → users.id). Soft-delete via `deleted_at` like other models.
- **D-07:** Round cap: **5 total revisions per Offer** (original offer + 4 counters max). Beyond 5, the offer thread auto-closes; buyer must accept, decline, or open a fresh post. (Claude pick — open to override during plan review.)
- **D-08:** Privacy: counter-offer rounds remain private to the buyer + offering seller (no public bid wars). Other sellers on the same post never see counter content. Enforced at service layer, not via RLS.
- **D-09:** Latest non-superseded revision is the "active" one; older revisions persist as audit trail. When a new revision is proposed by either party, the previous active revision flips to `superseded` (single atomic transaction).
- **D-10:** Mobile: structured counter modal lives at `mobile/lib/features/offers/presentation/widgets/counter_offer_modal.dart` (matches pattern from Phase 2 batch design). Modal posts to a new `POST /api/v1/offers/:id/revisions` endpoint.

### PII Gate UX (REQ-pii-blocked-until-payment) — Claude Discretion

- **D-11:** Pre-payment reveal granularity: **city + state + zip** (e.g., `"Dallas, TX 75201"`). Distance from seller is also shown (computed from D-01). Full street address + buyer phone/email contact details revealed to seller only after `transaction.escrowFundedAt` is set.
- **D-12:** Enforcement: redaction at the service layer in `posts.service.ts` and `offers.service.ts` — applied conditionally based on the requester's relationship to the post + funded-status of any associated transaction. NOT via DB views (avoids dual-source-of-truth).
- **D-13:** UI: post detail screen shows redacted fields with an explicit lock icon + "Full address shared after payment" microcopy so sellers don't think it's a data bug.

### Audit Re-Run Mechanism (Success Criteria 3) — Claude Discretion

- **D-14:** Audit re-run lives as a **Vitest test file**: `backend/tests/audit/closeout-audit.test.ts`. Matches the 22-existing-test-file convention, runs via `npm test`, integrates with CI, gives assertion-level failure reports. Bash + curl pattern was rejected because audit needs schema-level + business-rule assertions (does enum value exist? does endpoint enforce constraint?), not just HTTP smoke.
- **D-15:** Each Phase 3 success criterion gets at least one assertion block in the audit suite. Failures map directly back to the success criterion that wasn't met. CI gate: this file MUST pass green for the phase to merge.

### Stripe Identity Badge Flow (Success Criteria 5) — Claude Discretion

- **D-16:** Webhook flow: `identity.verification_session.verified` event fires → handler **auto-creates a `VerificationRequest`** with `type='id_verified'`, `status='approved'`, `approvedBy='system_stripe_identity'`, `approvedAt=now()`, `evidence={stripeVerificationSessionId}` → existing badge-award path triggers tier recalculation. Preserves the existing approval pipeline + AuditLog trail; admin can revoke via the existing admin tooling.
- **D-17:** Webhook handler lives at `backend/src/modules/payments/payments.webhook.ts` alongside existing Stripe Connect webhooks (single canonical Stripe webhook endpoint). New webhook signing secret (`STRIPE_IDENTITY_WEBHOOK_SECRET`) added to env if Stripe Identity uses a separate endpoint per Stripe's webhook architecture (verify during research phase).
- **D-18:** Mobile: `IdentityVerificationScreen` uses `stripe-react-native` Identity SDK or `url_launcher` to hosted flow, depending on what's available in the Flutter Stripe ecosystem. Researcher will confirm the Flutter integration shape.

### Video Upload Cap (REQ-video-mime-uploads) — Claude Discretion

- **D-19:** New **50MB** size tier added for the `post-videos` and `transaction-photos` storage categories (after-photo evidence videos). Existing tiers unchanged: images 10MB, docs 25MB. Rationale: 1 minute of phone-shot 1080p H.264 ≈ 60–80MB compressed; 25MB cap was too tight for service-evidence videos.
- **D-20:** MIME allowlist additions: `video/mp4`, `video/quicktime` (covers `.mov`). Validation in `backend/src/common/utils/storage.ts` `getMimeAllowlist()` for the relevant categories.
- **D-21:** Client-side guidance: mobile compresses to H.264 1080p before upload (existing photo-compression pipeline extended to video). No server-side transcoding in MVP — files served via R2 public URL as-is.

### Stripe Connect Fix Scope (REQ-stripe-connect-onboarding-completion) — Claude Discretion

- **D-22:** **Three-bug fix + env-validation hardening** (not minimal-only). The same misconfig that bit Phase 2 UAT will bite production silently if not guarded.
- **D-23:** Bug A — env defaults: set `STRIPE_CONNECT_RETURN_URL=reversemarket://seller/stripe/complete` and `STRIPE_CONNECT_REFRESH_URL=reversemarket://seller/stripe/refresh` (deep link scheme already registered at `mobile/ios/Runner/Info.plist:59` + `mobile/android/app/src/main/AndroidManifest.xml:34`).
- **D-24:** Bug B — `StripeOnboardScreen` becomes a `WidgetsBindingObserver`, refetches `loadStripeStatus()` + `loadProfile()` on `AppLifecycleState.resumed`. `isInProgress` derives from server-backed `stripeStatus.onboarded == true && stripeStatus.chargesEnabled == false` (drop the ephemeral `_onboardingStarted` widget-state flag at line 21).
- **D-25:** Bug C — `mobile/lib/features/profile/presentation/screens/profile_screen.dart:531` Earnings Dashboard menu item routes to `/seller/earnings` (existing-but-unreachable route at `app.dart:455`) instead of `/seller/stripe-onboard`. Payment Methods menu item at line 538 also leaves the Stripe-onboard route — repurposed or removed during plan.
- **D-26:** Env hardening: `backend/src/config/env.ts` validation refuses backend startup when `NODE_ENV !== 'test'` AND (`STRIPE_CONNECT_RETURN_URL` is unset OR `FRONTEND_URL` still equals the localhost default). Five-line guard, prevents silent prod regressions.

### Plan Sequencing — Claude Discretion (open to override)

- **D-27:** Recommended wave order for ~7-9 plans:
  - **Wave 1 (parallel, foundational):** PostGIS migration + geocoding utility | OfferRevision schema + service | audit-gap micro-fixes (`MAX_OFFERS_PER_POST=25`, `Archived` PostStatus, video MIMEs)
  - **Wave 2 (depends on Wave 1):** Seller-feed radius filter + sort | Counter-offer mobile modal + endpoints | Saved-sellers module | PII gate enforcement
  - **Wave 3 (depends on Wave 1):** Stripe Identity integration + EIN registration | Jobs lead-pricing engine + employer email-domain check
  - **Wave 4 (independent — could ship Wave 1):** Stripe Connect 3-bug fix + env hardening (high-priority demo unblocker; fast-track if planner agrees)
  - **Wave 5 (final):** Vitest closeout audit suite covering all 6 success criteria
- **D-28:** Stripe Connect fix is demo-blocking; planner should consider promoting it to Wave 1 if plan-level dependency analysis allows (no Stripe Identity work depends on the Connect fix; they're independent code paths).

### Folded Todos

None — `.planning/todos/pending/` is not populated.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase / Roadmap Anchors
- `.planning/ROADMAP.md` (Phase 3 section) — Goal, 13 requirements, 6 success criteria, ~7-9 plans estimate
- `.planning/REQUIREMENTS.md` — Mirror of canonical requirement IDs (Phase 3 reqs at lines 29, 34, 36, 38, 68, 72-73, 85, 89-92)
- `.planning/STATE.md` — Phase 3 setup notes, blockers/concerns, deferred items table

### Locked ADRs / Decisions
- `.planning/intel/decisions.md` — 73 locked ADRs (frameworks, DB, payments, messaging, reviews, frontend, ops). MUST consult before any architectural choice.
- `.planning/intel/requirements.md` — Source-of-truth for requirement IDs (31 functional + 9 NFRs)
- `CLAUDE.md` — Project constraints, scope guardrails, deferred-items list
- `ReverseMktplPRD.md` — Full PRD spec (14,500+ lines). Treat as authoritative for any detail not in REQUIREMENTS.md.

### Phase 2 Carry-Over (Stripe Connect Diagnosis)
- `.planning/phases/02-mobile-ui-restyle-sorcyn-brand/02-UAT.md` — Stripe Connect 3-bug root-cause diagnosis (Tests 4 + 7), full file:line citations for every fix in D-23 through D-25
- `.planning/debug/stripe-connect-uat-bugs.md` — Detailed debug session notes referenced by 02-UAT.md (read if D-23 through D-25 implementation needs deeper context)

### Codebase Intel (Read for Patterns + Reusable Assets)
- `.planning/codebase/STRUCTURE.md` — Backend module pattern (`{name}.routes.ts` + `.service.ts` + `.schemas.ts`), Flutter feature module pattern, naming conventions
- `.planning/codebase/INTEGRATIONS.md` — Stripe Connect / R2 / Gemini / Google Maps env-var inventory + lazy-init patterns
- `.planning/codebase/CONVENTIONS.md` — Code conventions
- `.planning/codebase/CONCERNS.md` — Known concerns

### Existing Code Anchors (Direct File:Line Refs)
- `backend/src/modules/offers/offers.service.ts:21` — `MAX_OFFERS_PER_POST = 10` constant to update to 25
- `backend/src/modules/posts/posts.service.ts:83-85, 165-166, 321, 497, 517-520` — `publicAfter` 3-day exclusivity logic; seller-feed filter at 517-520 needs the targeted-seller carve-out
- `backend/src/modules/payments/payments.service.ts:232, 380` — Stripe Connect return_url + handleAccountUpdated webhook handler
- `backend/src/config/env.ts:52, 65, 99` — STRIPE_CONNECT_RETURN_URL + FRONTEND_URL env validation gaps
- `backend/src/common/utils/storage.ts` — MIME allowlist for video extension
- `mobile/lib/features/sellers/presentation/screens/stripe_onboard_screen.dart:21, 63, 76, 478` — `_onboardingStarted` widget state to remove + WidgetsBindingObserver to add
- `mobile/lib/features/profile/presentation/screens/profile_screen.dart:531, 538, 557` — menu route mis-wirings (line 557 = 999.2 backlog, lines 531+538 = this phase)
- `mobile/lib/app.dart:447, 455` — `/help` and `/seller/earnings` route registrations (already exist, just unreachable)
- `mobile/ios/Runner/Info.plist:59`, `mobile/android/app/src/main/AndroidManifest.xml:34` — `reversemarket://` deep link scheme registration

### Existing Test/Audit Patterns
- `backend/scripts/run-all-tests.sh` — Existing bash + curl test orchestration (referenced for pattern, NOT used for the audit re-run per D-14)
- `mobile/scripts/audit_phase_2_conformance.sh` — Phase 2 mobile audit script (only existing audit script today)
- `backend/tests/` — 22 Vitest test files; new `backend/tests/audit/closeout-audit.test.ts` follows their pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Verification badge pipeline** (`backend/src/modules/sellers/`): existing `VerificationRequest` model + admin approval flow — Stripe Identity webhook (D-16) plugs into this rather than building a parallel path.
- **Stripe webhook handler** (`backend/src/modules/payments/payments.webhook.ts`): existing signature-verification + raw-body content-type parser — Identity webhook reuses this scaffolding.
- **R2 storage util** (`backend/src/common/utils/storage.ts`): existing category-based size tiers — extending with the 50MB video tier (D-19) is a one-line config change.
- **Counter-offer modal pattern** (Phase 2 BATCH_3 design): mobile design exists for the structured counter modal — implementation references this.
- **`status_badge` shared widget** (Phase 2): used for status pills across screens — counter-offer revision states (proposed/accepted/declined/superseded) reuse it.
- **Soft-delete + audit columns convention** (`deleted_at`, `created_by`, `updated_by`): OfferRevision schema (D-06) follows this.
- **Lazy SDK init pattern** (`getStripe()`, `getGemini()`): Google Maps Geocoding client follows the same lazy-singleton pattern.

### Established Patterns
- **Backend module triplet**: every new module = `{name}.routes.ts` + `.service.ts` + `.schemas.ts`. OfferRevision lives inside the existing `offers/` module (not a new module) since it's tightly coupled.
- **Atomic transactions for multi-step ops**: `prisma.$transaction([...])` for offer revision state flip (mark old `superseded` + insert new). Matches existing offer-acceptance pattern.
- **PII redaction at service layer (not DB)**: matches the existing pattern where `getSellerProfile()` resolves and shapes response objects.
- **Service-level rate limits**: D-07 round cap (5 revisions max) enforced in service, not at the DB level.
- **JWT + role-based access**: counter-offer endpoints use `app.authenticate` + role check (only buyer or offering seller may post a revision).

### Integration Points
- **PostGIS migration**: new Prisma migration + `Unsupported("geography(Point, 4326)")` columns on `posts` and `seller_profiles` (similar to existing `tsvector` `Unsupported` pattern). May need a `custom-migrations/` SQL file for the `CREATE EXTENSION` step.
- **Google Maps client**: new `backend/src/config/maps.ts` (lazy-init pattern) + `backend/src/common/utils/geocoding.ts` (callable from posts/sellers services).
- **Stripe Identity webhook routing**: confirm during research whether Identity uses the same webhook endpoint as Connect (single signing secret) or requires a new endpoint (separate signing secret env var).
- **Mobile counter-offer flow**: integrates into existing offer detail screen via a new modal route; uses existing Riverpod `offerProvider` + Dio API client.
- **Audit-gap micro-fixes are independent**: `MAX_OFFERS_PER_POST=10→25`, `Archived` enum value, video MIMEs, can land in Wave 1 with no cross-dependencies.

</code_context>

<specifics>
## Specific Ideas

- **Geocoding cost ceiling**: Google Geocoding at MVP scale (~5K posts/yr) ≈ $25/yr. Re-evaluate if traffic 10×s; PostGIS distance math is already free, so the only paid component is address→coords conversion. Caching `lat`/`lng` on the row is non-negotiable to keep costs predictable.
- **Counter-offer round cap rationale**: 5 rounds (offer + 4 counters) is enough for most negotiations to converge without enabling endless back-and-forth that frustrates buyers. Open to changing to 3 or unlimited during plan review.
- **OfferRevision `superseded` status**: kept distinct from `declined` so the audit trail shows whether a counter was actively rejected vs simply replaced by a new round.
- **Stripe Connect fix priority**: this is the only currently-demo-blocking gap. Planner should consider promoting it to Wave 1 if dependency analysis allows; it's independent of the geosearch + counter-offer + Stripe Identity workstreams.
- **Vitest closeout audit naming**: `backend/tests/audit/closeout-audit.test.ts` keeps the audit suite separate from per-module tests so it can be run as a single CI gate (`npx vitest run tests/audit`).
- **Stripe Identity Flutter SDK uncertainty**: research phase will confirm whether `stripe-react-native` parallel exists for Flutter (`flutter_stripe`) or if hosted flow via `url_launcher` is the only path. Either is acceptable; affects mobile work estimate slightly.

</specifics>

<deferred>
## Deferred Ideas

- **Profile menu Help & Support routing fix** (`profile_screen.dart:557`) — already routed to 999.2 backlog finding I per Phase 2 UAT closure. Not part of this phase.
- **Server-side video transcoding** — out of scope for MVP; clients compress before upload. Revisit at scale (Phase 6+).
- **PostGIS-based heatmaps / clustering for "popular areas"** — could be derived from the same coords later, but not in scope.
- **Per-category video size tiers** (e.g., higher cap for portfolio videos) — single 50MB tier ships in this phase; tier-by-category if real usage shows the cap is too tight.
- **Counter-offer auto-expire timers** (e.g., counter expires if not responded to within 24h) — not in REQ-counter-offer; capture for Phase 6 enhancement.
- **Stripe Identity for Background Checked badge** — REQ-verification-badges scopes Background Checked separately (high-risk categories only); Phase 3 only delivers ID Verified via Identity. Background Checked stays manual.
- **Geocoding fallback to Nominatim if Google quota hit** — single-provider for MVP; revisit if quota becomes a real concern.
- **Saved-searches integration with seller-feed geo filter** — `saved_searches` module already shipped (Phase 1); integrating saved geo filters into seller feed is a future polish item.

### Reviewed Todos (not folded)

None — no todos in `.planning/todos/pending/` to review.

</deferred>

---

## Addendum — Post-Research Reconciliations (2026-04-29, after `/gsd-plan-phase 3` research pass)

The research pass (03-RESEARCH.md, sections "Open Questions" and "Recommendations for Planner") surfaced that several locked decisions were authored against the 2026-04-18 audit but the codebase has since shipped the underlying features. The following reconciliations are USER-CONFIRMED 2026-04-29 and OVERRIDE the original decisions where they conflict. These are the planner's source of truth.

### A-01: D-01 PostGIS migration → DEFERRED to Phase 6 (overrides D-01, D-03)
- **What changes:** Phase 3 will NOT migrate to PostGIS. Distance computation continues to use the existing Haversine SQL in `backend/src/modules/posts/posts.service.ts`. The seller-feed radius filter uses the shipped implementation.
- **What stays:** D-02 (Google Geocoding API for address→lat/lng) and D-04 (failure mode) still apply — those code paths are already shipped (`backend/src/config/geocoding.ts`).
- **Phase 6 follow-up:** Add a Phase 6 task "Migrate seller-feed radius filter to PostGIS for index-backed performance at 100K-post scale" (planner does NOT need to create this; it can be added to ROADMAP.md when Phase 3 closes).

### A-02: D-05/D-06 OfferRevision table → SUPERSEDED, keep shipped Offer.parentOfferId chain (overrides D-05, D-06, D-09, D-10 partial)
- **What changes:** Phase 3 will NOT introduce a new `OfferRevision` table. The shipped `Offer.parentOfferId` self-relation chain + existing `/offers/:id/counter` endpoint + shipped `counter_offer_modal.dart` (419 lines) are the canonical counter-offer path. D-05's "linear chain pattern" intent is preserved by the existing chain.
- **What stays:**
  - **D-07** (round cap = 5 total revisions) APPLIES — implement as a depth check inside the existing `offersService.counterOffer()` by counting `parentOfferId` ancestors; reject when depth ≥ 4.
  - **D-08** (privacy: revisions private to buyer + offering seller) APPLIES — verify the existing service-layer enforcement honors this; add a test if missing.
  - **D-10** (mobile modal location) is already met by the shipped `mobile/lib/features/offers/presentation/widgets/counter_offer_modal.dart`. Phase 3 verifies wiring; no new modal file.
- **Plan implication:** Counter-offer plan shrinks from "build new model + endpoint + modal" to "verify shipped surface + add round cap + add any missing privacy assertion + extend offers.test.ts to cover depth cap and privacy".

### A-03: REQ-three-day-exclusivity targeted-seller mechanism = CATEGORY MATCH (resolves Open Question #1)
- **Definition:** A seller is "targeted" for a post if `seller_profile.categories` overlaps the post's `category_id` (direct match or descendant in the category hierarchy).
- **Implementation tier:** Service-layer SQL filter in `posts.service.ts` `getSellerFeed()`. No new schema column. No new mobile UI.
- **Phase 6 enhancement:** Buyer-curated allowlist (post-creation seller picker) is captured for Phase 6.

### A-04: D-19 video size cap → SUPERSEDED, keep shipped 100MB cap (overrides D-19)
- **What changes:** Phase 3 keeps the existing 100MB cap on `post-videos` and `transaction-photos` categories. The 50MB tier in D-19 is rejected — 100MB handles 60s 1080p H.264 worst-case, 50MB is too tight for service-evidence videos.
- **What stays:** **D-20** (MIME allowlist additions for `video/mp4`, `video/quicktime`) — verify the allowlist already includes these (research confirms it does); plan task is verification + audit-suite assertion, not a code change.

### A-05: REQ-jobs-lead-gen role-tier source = BUYER-SELECTED DROPDOWN (resolves Open Question #4)
- **Definition:** Buyer picks one of `entry` | `mid` | `specialized_senior` from a dropdown during Jobs post creation. Backend stores the tier on the post; lead-pricing engine reads it directly.
- **Phase 6 enhancement:** Gemini-classified role tier from job description text is captured for Phase 6 polish.

### Inventory of CONTEXT.md decisions vs reality (post-research)

| ID | Status | Notes |
|----|--------|-------|
| D-01, D-03 | **SUPERSEDED by A-01** | PostGIS deferred to Phase 6 |
| D-02, D-04 | KEEP | Google Geocoding API + failure mode — code already shipped |
| D-05, D-06, D-09, D-10 (partial) | **SUPERSEDED by A-02** | Keep shipped Offer.parentOfferId chain + shipped modal |
| D-07 | KEEP (re-targeted) | 5-round cap implemented on shipped chain (depth check, not new table) |
| D-08 | KEEP | Privacy enforcement verified on shipped chain |
| D-11, D-12, D-13 | KEEP | PII gate — service-layer redaction + lock-icon UI |
| D-14, D-15 | KEEP | Vitest closeout audit suite at `backend/tests/audit/closeout-audit.test.ts` |
| D-16, D-17, D-18 | KEEP (refined by RESEARCH.md) | Stripe Identity hosted-flow via `url_launcher`; webhook reuses existing endpoint with shared `STRIPE_WEBHOOK_SECRET` (no new env var) |
| D-19 | **SUPERSEDED by A-04** | Keep 100MB video cap |
| D-20, D-21 | KEEP (mostly verification) | MIME allowlist + client-side compression already shipped — verify only |
| D-22 through D-26 | KEEP | Stripe Connect 3-bug fix + env hardening (Phase 2 UAT carry-over) |
| D-27, D-28 | KEEP (planner re-confirms) | Wave order — planner may promote Stripe Connect fix to Wave 1 |

### Pre-shipped surface — verify, don't rebuild (per RESEARCH.md Pitfall 3)

The planner MUST grep before writing any plan task that creates new files. The following are already shipped:
- `backend/src/modules/saved-sellers/` (routes + service + schemas + tests)
- `PostStatus.archived` enum value + `POST /posts/:id/archive` endpoint
- `video/mp4` and `video/quicktime` in MIME allowlist (verify exact names in `backend/src/common/utils/storage.ts`)
- `Offer.parentOfferId` self-relation chain + `/offers/:id/counter` endpoint
- `mobile/lib/features/offers/presentation/widgets/counter_offer_modal.dart` (419 lines, wired to offer detail screen)
- `backend/src/config/geocoding.ts` geocoding utility (Google Maps API)
- Haversine radius filter in `posts.service.ts` (verified working at MVP scale)
- 3-day exclusivity write/read paths (`posts.public_after`)

For each Phase 3 plan, the first task should include a `<read_first>` block citing the relevant shipped file(s) and an `<acceptance_criteria>` line that confirms the existing behavior is preserved.

---

*Phase: 03-mvp-implementation-closeout*
*Context gathered: 2026-04-29 via /gsd-discuss-phase*
*Reconciliations appended: 2026-04-29 via /gsd-plan-phase 3 research pass*
