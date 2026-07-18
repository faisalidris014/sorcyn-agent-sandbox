# Requirements: Sorcyn

**Defined:** 2026-04-27 (synthesized from PRD v2.1, ADR aggregate, and 2 SPECs via `/gsd-ingest-docs`)
**Core Value:** Buyers describe what they need in plain language and get vetted, evidence-backed offers from local sellers — without paying anything for local cash transactions.

> **Source of truth for IDs:** `.planning/intel/requirements.md` (31 functional REQs + 9 NFRs). This file mirrors those IDs and adds derived IDs where the roadmap needs explicit phase deliverables (e.g., `REQ-mobile-design-system` for Phase 2 restyle, `REQ-launch-readiness` for Phase 4 hardening, `REQ-cold-start-launch` for Phase 5).

## v1 Requirements

Requirements for initial DFW Q3 2026 launch. Each maps to exactly one roadmap phase.

### Vision & Scope

- [x] **REQ-vision-reverse-marketplace**: Universal reverse marketplace where buyers post needs and sellers compete to fulfill them across products, services, and jobs (`§1`, `§3` PRD)
- [x] **REQ-mvp-three-categories**: MVP launches with three umbrella categories — Products (local FREE / shipped via escrow), Services (escrow + before/after photos), Jobs (lead-gen, $10–500 per lead) — in DFW; schema supports future categories shown as "Coming Soon"

### Authentication & User Management

- [x] **REQ-user-registration**: Email/password registration with email verification as MFA, phone collected (SMS deferred), bcrypt ≥12 rounds, disposable-domain block, 3/hour register rate limit
- [x] **REQ-account-toggle**: Single account with `buyer | seller | both` mode toggle; switching to seller/both auto-creates `SellerProfile`
- [x] **REQ-account-deletion**: Soft-delete with email prefixed `deleted_{ts}_`; reviews persist on seller profiles; ongoing transactions cancelled

### Buyer Posts

- [x] **REQ-create-post-manual**: Manual post creation with title (10–100 ch), description (50–1,000 ch), category/subcategory, transaction type, budget, location autocomplete, urgency, photos (≤10 × 5 MB), durations 24h/3d/7d/14d (default 7d, +3d single extension), auto-save drafts every 30s, editable only if `offerCount === 0`
- [x] **REQ-create-post-ai-assisted**: AI chat post creation via Gemini Flash-Lite returning category/subcategory slugs (server resolved to UUIDs), Zod-validated, optional product image pull, 20 req/hr per user, 503 fallback to manual form when key missing
- [x] **REQ-post-extension-and-repost**: Single +3-day extension; repost copies content into a fresh record (new ID, fresh counters, original preserved)
- [x] **REQ-max-active-posts**: Max 10 active posts per buyer (drafts excluded)
- [ ] **REQ-three-day-exclusivity**: 3-day buyer exclusivity window — `publicAfter = createdAt + 3d` filters seller feed; targeted sellers see post first, then offers go public *(partial in audit — Phase 3 closes the seller-feed filter logic)*

### Seller Profile & Offers

- [x] **REQ-seller-profile**: Seller profile with business info (name optional, defaults to legal name), service radius (5–100 mi), category multi-select, bio (50–500 ch), profile photo (1 MB), portfolio (≤10 × 2 MB), real-time `profileStrength` 0–100, verification tier displayed
- [ ] **REQ-seller-feed**: Seller browses buyer requests filtered by their categories AND service radius, with distance per post, budget/urgency badges, competition indicator, sort by Newest/Expiring/Highest budget/Closest, 3-day exclusivity respected *(radius-based geosearch missing — Phase 3 closes via geocoding utility integration)*
- [x] **REQ-submit-offer**: Quote ($10–$50 K within tier limit), timeline (can-start + completion), message (50–1,000 ch), portfolio attachments (≤10), client-side earnings preview, <2 s submission, buyer notified <60 s, unique `(post_id, seller_id)`, editable + withdrawable before acceptance with 24h cooldown
- [ ] **REQ-max-offers-per-post**: Max 25 offers per post *(code currently `MAX_OFFERS_PER_POST = 10` per audit — Phase 3 reconciles ADR vs code)*
- [x] **REQ-offer-visibility-private**: Sellers cannot see other sellers' offers on the same post; on accept, others get a "buyer chose another seller" notification
- [ ] **REQ-counter-offer**: Counter-offers via in-app messaging (no public bid wars), with structured counter modal *(missing per audit — Phase 3 ships modal + service flow; mobile design exists in BATCH_3_PLAN counter_offer modal)*

### Payments & Escrow

- [x] **REQ-stripe-escrow**: Stripe Connect Standard with **Separate Charges + Transfers** (supersedes PRD §8.5); buyer charged upfront, funds held on platform, transfer to seller on approval, `transfer_group` links charge + transfer; cost breakdown at checkout; card / Apple Pay / Google Pay; 3DS for charges >$100; <3 s processing
- [x] **REQ-fee-structure-tiered**: Tiered fees — Services 5%/8%, Shipped 5%/6%, Local platform 3%/3%, Local cash $0, Inventory/B2B 5%/5% (Phase 6), Jobs $10–500 per lead
- [x] **REQ-stripe-onboarding**: Hosted Stripe Connect onboarding via `url_launcher` (external browser, not WebView), webhook syncs `stripeChargesEnabled`, prod gate on accept (dev bypass when `NODE_ENV !== 'production'`)
- [x] **REQ-escrow-release**: Buyer approval → Stripe Transfer (1–2 business days payout); 7-day auto-release sweep for services with per-record try/catch; `releaseEscrow(txId, reason)` called BEFORE status update (escrowStatus guard)
- [x] **REQ-milestone-payments**: Milestone payments with no minimum per-milestone threshold; different contractors per milestone allowed
- [x] **REQ-max-2-change-requests**: Max 2 buyer change requests per transaction (counted from `timeline` JSON), then approve or open dispute

### Transactions & Evidence

- [x] **REQ-before-after-photos**: Before AND after photos REQUIRED for all services; 1–5 after photos auto-compressed to <1 MB; cannot mark complete without after photos
- [x] **REQ-transaction-status-tracking**: 18-state TransactionStatus with type-aware transitions (services / shipped / local each have distinct progressions); push notification on every change; type-aware mobile UI buttons; `timeline` JSONB log

### Reviews

- [x] **REQ-rating-and-review**: 1–5 stars overall (required), category-specific ratings (optional), written review 50–500 ch (optional), "Would recommend" toggle, profanity auto-flag, immutable on submit, persists on seller profile through deletion; reminders at days 7/30/60/73 post-completion; auto 5-star at day 73 with `isAutoGenerated: true`; BullMQ `jobId` dedup

### Messaging

- [x] **REQ-in-app-messaging**: Per-pair conversation auto-created atomically on offer acceptance; text + ≤5 photos × 5 MB; Socket.IO primary + 30s/60s polling fallback; <30 s push delivery; 50 msg/hr rate limit; venmo/cashapp/zelle/paypal regex flags moderation; permanent retention (CLAUDE.md canonical, supersedes PRD's 90-day)

### Notifications

- [x] **REQ-multi-channel-notifications**: BullMQ-backed delivery across in-app + email (SendGrid) + push (FCM); internal-only `createNotification` API; user preferences toggleable; FCM invalid-token auto-cleanup; workers disabled in `NODE_ENV=test`

### Search

- [ ] **REQ-mvp-search**: Basic search by category, distance, time posted via PostgreSQL `tsvector` + GIN with weighted title=A description=B; <500 ms; pagination 20/page *(distance/radius search component missing — Phase 3 closes geo integration; Elasticsearch upgrade is Phase 6)*

### Verification

- [ ] **REQ-verification-badges**: Badge-based verification (Licensed, Insured, ID Verified, Background Checked); `VerificationRequest` pending → approved/rejected; tier recalculated on approval (1→2 ID/EIN, 3 license/insurance, 4 background check); buyer filter by badges *(Stripe Identity for ID Verified missing — Phase 3 ships integration)*
- [ ] **REQ-business-account-ein**: Business sellers register with EIN + sales tax certificate verification *(EIN exists as verification type but is NOT required at registration per audit — Phase 3 closes registration enforcement)*

### Disputes

- [x] **REQ-dispute-mvp**: Buyer claim → escrow frozen <1 s, both parties notified <60 s, evidence uploadable (≤10 files × 5 MB) within 48 h, manual admin resolution

### Admin

- [x] **REQ-admin-dashboard**: Plugin-level `authenticate` + `requireAdmin`; transaction monitoring, dispute mgmt, user suspend/ban (admins cannot suspend admins), license/insurance approval, flagged content moderation, immutable AuditLog, force-logout via Redis SCAN

### Jobs

- [ ] **REQ-jobs-lead-gen**: Platform as lead navigator (NOT staffing); per-lead pricing $10–500 by role tier (Entry $10–20, Mid $30–50, Specialized/Senior $100–500); employer work-email domain verification (no Gmail); subcategories (full-time/part-time/remote/in-office); ranked match list (no spam) *(only `job_milestone` transaction type exists; lead pricing logic missing — Phase 3 ships pricing engine + employer email-domain check)*

### Implementation Closeout (Audit Gaps)

- [ ] **REQ-saved-sellers**: Buyers can follow/favorite sellers — save, unsave, list saved sellers *(model + endpoints missing per audit — Phase 3 ships `saved_sellers` module per CLAUDE.md scope)*
- [ ] **REQ-archived-post-status**: Buyers can archive posts (status added to PostStatus enum: draft/active/filled/expired/cancelled/archived) *(missing per audit — Phase 3 schema migration + API)*
- [ ] **REQ-video-mime-uploads**: Uploads service accepts video MIME types (mp4, mov) for after-photo evidence and portfolio *(currently jpeg/png/webp/heic/heif/pdf only — Phase 3 extends `storage.ts` allowlist + size limits)*
- [ ] **REQ-pii-blocked-until-payment**: Buyer address and full contact details only revealed to seller after payment is captured *(no enforcement logic per audit — Phase 3 ships service-layer redaction + post-payment unlock)*
- [ ] **REQ-stripe-connect-onboarding-completion**: Stripe Connect onboarding completes end-to-end on iOS simulator (NEW — Phase 2 UAT Gap 2 carry-over): backend defaults `STRIPE_CONNECT_RETURN_URL` to the registered `reversemarket://` deep link scheme; `StripeOnboardScreen` registers `WidgetsBindingObserver` and refetches seller status on `AppLifecycleState.resumed`; Earnings Dashboard menu item routes to `/seller/earnings` (existing-but-unreachable route) instead of `/seller/stripe-onboard`; `isInProgress` derived from server-backed `stripeStatus.onboarded && !stripeStatus.chargesEnabled` (not from ephemeral widget state); env validation refuses production startup when `STRIPE_CONNECT_RETURN_URL` is unset or `FRONTEND_URL` still equals localhost default *(Phase 3 ships 3-bug fix + env hardening)*

### Mobile Design System

- [ ] **REQ-mobile-design-system**: Sorcyn purple gradient brand applied across all 37 in-flight Flutter screens via Inter font, design tokens (`#7C3AED` / `#A855F7` gradient, 12/16/24 px radii, 52/56 px input/button heights, button shadow `0 8px 20px rgba(124,58,237,0.35)`), spring page transitions (stiffness 320, damping 32), `active:scale-[0.97]` tap animations, custom 6 shared widgets (gradient_fab, bottom_nav_bar, welcome_card, post_card, status_badge, urgency_chip), gradient bottom-nav active indicator dot, status badges (colored dot + tinted pill), social-auth outlined buttons; functionality preserved (Riverpod state, GoRouter, API calls unchanged) *(BATCH_2 through BATCH_8 plans — Phase 2)*

### Pre-Launch Hardening

- [ ] **REQ-launch-readiness**: WCAG 2.1 AA accessibility pass (keyboard nav, screen reader, 4.5:1 contrast, 16 px scalable to 200%, 44×44 px touch targets); test coverage ≥70% (70/20/10 unit/integration/E2E split); load test at 1,000 concurrent users sustaining NFR-throughput targets; OWASP ZAP scan + Snyk dependency audit clean; PCI-DSS attestation via Stripe; DR drill validating RTO <4 h / RPO <1 h; canary CI/CD pipeline (10% → 50% → 100%) with one-click rollback; centralized logging with search/filter; distributed tracing for API requests; Slack/PagerDuty alerts wired; 20-user UAT before launch

### Launch & Metrics

- [ ] **REQ-cold-start-launch**: Soft-launch executed in DFW Metroplex covering 80% of zip codes (350+) with seeded buyer-side liquidity (FAKE BUYER POSTS only — never fake sellers per Apr 15 transcript); Year 1 metrics dashboard tracking North Star (Weekly Active Transactions: 10 by M3, 30 by M6, 120 by M12), GMV target $140 K, Revenue $9,800 (~7% take), 2,500 users (1,500 buyers + 1,000 sellers), 200 active sellers (1+ offer), 750 active buyers (1+ post), 500 completed transactions, dispute rate <8%, avg rating >4.3; TikTok/Instagram launch campaign live; post-launch ops runbook executable

## Non-Functional Requirements

NFRs that gate the launch. Each maps to Phase 4 (pre-launch hardening) unless validated earlier in production.

- [ ] **NFR-performance**: API <200 ms median / <500 ms p95; page load <2 s web, <1.5 s mobile; search <500 ms (PG FTS MVP); payment <3 s; image upload <5 s for 5 MB; DB query <100 ms p95
- [ ] **NFR-throughput**: 1,000 concurrent users MVP; 1,000 req/s peak API; 100 max DB connections (pooled); WebSocket 5 K concurrent (Phase 6 target)
- [ ] **NFR-data-growth**: Capacity validated for 10 K users / 5 K posts/mo / 1 K transactions/mo / 50 K messages/mo / 100 GB images/mo at MVP scale
- [ ] **NFR-uptime**: 99.9% MVP (8.76 h/yr); maintenance Sundays 2–4 AM UTC with 48 h notice
- [ ] **NFR-disaster-recovery**: RTO <4 h, RPO <1 h; daily backups to separate region; 30-day retention; 7-day point-in-time recovery; quarterly restore drill
- [ ] **NFR-error-handling**: Auto-retry failed API requests (3 attempts, exponential backoff); circuit breaker after 5 consecutive failures; cached fallback for non-critical realtime data
- [ ] **NFR-accessibility**: WCAG 2.1 AA — keyboard nav, screen reader (semantic HTML, ARIA), 4.5:1 contrast minimum, descriptive alt text, visible focus indicators, 16 px scalable to 200%, 44×44 px touch targets *(co-owned by Phase 2 — design tokens must hit contrast — and Phase 4 audit)*
- [ ] **NFR-test-coverage**: ≥70% coverage (70/20/10 unit/integration/E2E); load test 1,000 concurrent; OWASP ZAP + Snyk; 20 beta-user UAT before launch
- [ ] **NFR-cicd**: Build on every commit; auto-deploy staging on `develop` merge; production manual approval + canary 10% → 50% → 100% with one-click rollback *(currently 3-job GitHub Actions: lint/typecheck → test → build-docker no-push; Phase 4 closes gap)*
- [ ] **NFR-monitoring**: Centralized logging with search/filter; distributed tracing (Jaeger or Datadog APM); Slack + PagerDuty automated alerts; Grafana/Datadog real-time dashboards; Sentry error tracking; Prometheus metrics
- [ ] **NFR-security**: TLS 1.2+, AES-256 at rest, JWT refresh rotation, rate limit 100–1,000 req/hr per user, server-side input validation, parameterized queries only, output encoding + CSP, CSRF tokens + SameSite cookies, PCI-DSS via Stripe, GDPR + CCPA

### Success Metrics

- [ ] **REQ-success-metrics**: Year 1 (DFW MVP) — 2,500 users (1,500 buyers / 1,000 sellers), 200 active sellers, 750 active buyers, 500 completed transactions, $140 K GMV, $9,800 revenue (~7% take rate), 80% DFW zip-code coverage (350+ zips), NSM Weekly Active Transactions (10 M3 / 30 M6 / 120 M12), dispute rate <8%, avg rating >4.3 *(tracked from Phase 5 onward)*

## v2 Requirements

Deferred to post-launch. Tracked but not in current launch-blocking roadmap. Mapped to Phase 6 / Phase 7 for visibility.

### Phase 6 — Texas Expansion + Enhancements (PRD §7 Phase 2)

- **REQ-elasticsearch-upgrade**: Migrate search from PostgreSQL FTS to Elasticsearch 8+ to hit <200 ms search latency at 100 K-user scale
- **REQ-oauth-login**: OAuth login (Google, Apple, Facebook) alongside email/password
- **REQ-shipping-integration**: Carrier integration for shipping label generation, tracking, address validation
- **REQ-twilio-sms-verification**: SMS phone verification via Twilio
- **REQ-b2b-wholesale-ui**: Inventory / wholesale category UI surfaced (DB schema already present)
- **REQ-automated-dispute-resolution**: Automated dispute tier-1 resolution with manual escalation
- **REQ-promotion-system**: Paid seller visibility boosts, time-window promotions, post-renewal patterns
- **REQ-texas-expansion**: Geographic rollout to Texas-wide coverage
- **REQ-rls-policies**: Defense-in-depth Row-Level Security policies on Supabase Postgres (currently app-level only)

### Phase 7 — National Rollout + Verticals (PRD §7 Phase 3)

- **REQ-houston-austin-sa**: Geographic rollout to Houston, Austin, San Antonio
- **REQ-real-estate-vertical**: Real Estate lead-gen vertical (DB schema already present, UI hidden)
- **REQ-financing-options**: Buyer financing / installment options
- **REQ-enterprise-features**: Enterprise team accounts, bulk procurement, custom contracts
- **REQ-claude-haiku-upgrade**: AI upgrade from Gemini Flash-Lite to Claude Haiku ($85–112/mo at 10 K users)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Native WebSocket (no Socket.IO) | Locked: Socket.IO 4 chosen for auto-reconnect, rooms, polling fallback, heartbeat, structured events |
| Supabase Auth + RLS as sole authz | Locked: custom JWT chosen; Supabase used as Postgres host only; RLS optional in Phase 4 as defense in depth |
| Meilisearch | Locked: PostgreSQL FTS for MVP, Elasticsearch (NOT Meilisearch) for Phase 6 |
| AWS S3 | Locked: Cloudflare R2 ($0 egress, S3-compatible) chosen |
| Destination Charges (Stripe) | Locked: Separate Charges + Transfers chosen for escrow control flexibility |
| 3-account model (Classic/Business/Both) | Locked: `buyer | seller | both` enum is canonical; `MarketplaceContext` enum (b2c/b2b/c2c) handles context switching |
| 60-day review window | Locked: day-73 auto-review with reminders at 7/30/60/73 |
| 3-day default post duration | Locked: 7-day default (168h), max 30 days (720h), single +3-day extension |
| Usernames/handles | Locked: display only legal first name publicly; no display-name customization in MVP |
| Live video streams in messages | MVP: text + image only |
| Per-buyer offer cap | Only per-post cap (25) is enforced |
| Custom RBAC | `isAdmin` boolean sufficient for MVP |
| Native iOS/Android | Single Flutter codebase |
| Mandatory verification gating | Badge-based: non-verified sellers allowed without badges |
| Promotions in MVP | Deferred to Phase 6 |
| Twilio SMS in MVP | Deferred to Phase 6 to save costs |
| OAuth in MVP | Deferred to Phase 6 |
| B2B / wholesale UI in MVP | DB schema present, UI hidden until Phase 6 |
| Real estate vertical in MVP | DB schema present, UI hidden until Phase 7 |
| Mobile app rename to "Sorcyn" repo/slug | Display name only; repo `ReverseMarketplace`, deep-link scheme `reversemarket://`, GitNexus index `ReverseMarketplace`, admin email `admin@reversemarketplace.com`, Stripe metadata, R2 bucket names all stay |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| REQ-vision-reverse-marketplace | Phase 1 | Complete |
| REQ-mvp-three-categories | Phase 1 | Complete |
| REQ-user-registration | Phase 1 | Complete |
| REQ-account-toggle | Phase 1 | Complete |
| REQ-account-deletion | Phase 1 | Complete |
| REQ-create-post-manual | Phase 1 | Complete |
| REQ-create-post-ai-assisted | Phase 1 | Complete |
| REQ-post-extension-and-repost | Phase 1 | Complete |
| REQ-max-active-posts | Phase 1 | Complete |
| REQ-three-day-exclusivity | Phase 3 | Pending (partial in audit) |
| REQ-seller-profile | Phase 1 | Complete |
| REQ-seller-feed | Phase 3 | Pending (radius missing) |
| REQ-submit-offer | Phase 1 | Complete |
| REQ-max-offers-per-post | Phase 3 | Pending (code drift 10 → 25) |
| REQ-offer-visibility-private | Phase 1 | Complete |
| REQ-counter-offer | Phase 3 | Pending (missing) |
| REQ-stripe-escrow | Phase 1 | Complete |
| REQ-fee-structure-tiered | Phase 1 | Complete |
| REQ-stripe-onboarding | Phase 1 | Complete |
| REQ-escrow-release | Phase 1 | Complete |
| REQ-milestone-payments | Phase 1 | Complete |
| REQ-max-2-change-requests | Phase 1 | Complete |
| REQ-before-after-photos | Phase 1 | Complete |
| REQ-transaction-status-tracking | Phase 1 | Complete |
| REQ-rating-and-review | Phase 1 | Complete |
| REQ-in-app-messaging | Phase 1 | Complete |
| REQ-multi-channel-notifications | Phase 1 | Complete |
| REQ-mvp-search | Phase 3 | Pending (radius missing) |
| REQ-verification-badges | Phase 3 | Pending (Stripe Identity missing) |
| REQ-business-account-ein | Phase 3 | Pending (registration enforcement missing) |
| REQ-dispute-mvp | Phase 1 | Complete |
| REQ-admin-dashboard | Phase 1 | Complete |
| REQ-jobs-lead-gen | Phase 3 | Pending (lead pricing missing) |
| REQ-saved-sellers | Phase 3 | Pending (audit gap) |
| REQ-archived-post-status | Phase 3 | Pending (audit gap) |
| REQ-video-mime-uploads | Phase 3 | Pending (audit gap) |
| REQ-pii-blocked-until-payment | Phase 3 | Pending (audit gap) |
| REQ-stripe-connect-onboarding-completion | Phase 3 | Pending (Phase 2 UAT Gap 2 carry-over) |
| REQ-mobile-design-system | Phase 2 | In Progress (BATCH 2–8) |
| REQ-launch-readiness | Phase 4 | Pending |
| REQ-cold-start-launch | Phase 5 | Pending |
| REQ-success-metrics | Phase 5 | Pending |
| NFR-performance | Phase 4 | Pending |
| NFR-throughput | Phase 4 | Pending |
| NFR-data-growth | Phase 4 | Pending |
| NFR-uptime | Phase 4 | Pending |
| NFR-disaster-recovery | Phase 4 | Pending |
| NFR-error-handling | Phase 4 | Pending |
| NFR-accessibility | Phase 4 | Pending (Phase 2 contributes design tokens) |
| NFR-test-coverage | Phase 4 | Pending |
| NFR-cicd | Phase 4 | Pending |
| NFR-monitoring | Phase 4 | Pending |
| NFR-security | Phase 4 | Pending |
| REQ-elasticsearch-upgrade | Phase 6 | Pending (v2) |
| REQ-oauth-login | Phase 6 | Pending (v2) |
| REQ-shipping-integration | Phase 6 | Pending (v2) |
| REQ-twilio-sms-verification | Phase 6 | Pending (v2) |
| REQ-b2b-wholesale-ui | Phase 6 | Pending (v2) |
| REQ-automated-dispute-resolution | Phase 6 | Pending (v2) |
| REQ-promotion-system | Phase 6 | Pending (v2) |
| REQ-texas-expansion | Phase 6 | Pending (v2) |
| REQ-rls-policies | Phase 6 | Pending (v2) |
| REQ-houston-austin-sa | Phase 7 | Pending (v2) |
| REQ-real-estate-vertical | Phase 7 | Pending (v2) |
| REQ-financing-options | Phase 7 | Pending (v2) |
| REQ-enterprise-features | Phase 7 | Pending (v2) |
| REQ-claude-haiku-upgrade | Phase 7 | Pending (v2) |

**Coverage:**
- v1 functional requirements: 37 total (31 from intel + 4 audit-gap closures + 1 mobile design system + 1 launch readiness — REQ-success-metrics + REQ-cold-start-launch counted under launch)
- NFRs: 11 total
- Mapped to phases: 48 / 48 ✓
- Unmapped: 0 ✓
- Mapped to v2 phases (6, 7): 14

---
*Requirements defined: 2026-04-27*
*Last updated: 2026-04-27 after `/gsd-new-project` ingest from synthesized intel (32 source documents)*
