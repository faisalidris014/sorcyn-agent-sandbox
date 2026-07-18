# Requirements (PRD Intel)

Functional and non-functional requirements extracted from classified PRD sources.

**Primary source:** ReverseMktplPRD.md (PRD v2.1 — MVP, Last Updated Feb 12, 2026; Target Launch Q3 2026 DFW)

Each requirement entry includes a stable ID, source PRD path, scope, description, and acceptance criteria.

---

## Vision & Scope

### REQ-vision-reverse-marketplace
- **scope:** Product vision
- **description:** Universal reverse marketplace where buyers post needs and sellers compete to fulfill them. Covers products, services, inventory, and jobs in one platform.
- **source:** ReverseMktplPRD.md §1 (Executive Summary), §3 (Solution Overview)

### REQ-mvp-three-categories
- **scope:** MVP launch scope
- **description:** MVP launches with three umbrella categories — Products, Services, Jobs — in DFW Metroplex. Schema supports all future categories from Day 1 (displayed as "Coming Soon" in UI).
- **acceptance:**
  - Products: local pickup FREE, shipped via escrow
  - Services: full subcategories (plumbing, electrical, HVAC, cleaning, etc.) — escrow + before/after photos
  - Jobs: lead generation model (per-lead pricing $10-500)
  - Real Estate, Inventory/Wholesale, Junk: Phase 2/3 (DB schema present, UI hidden)
- **source:** ReverseMktplPRD.md §7 (Phase 1 MVP), CLAUDE.md

---

## User Management

### REQ-user-registration
- **scope:** Auth — registration
- **description:** Users register via email/password. Email verification serves as MFA. Phone collected but SMS verification deferred to Phase 2 (cost). OAuth Phase 2.
- **acceptance:**
  - Collects first/last legal name, email, password (8+ chars, mixed case, number, symbol), phone (E.164), zip
  - Display only legal first name publicly (no usernames/handles)
  - Verification email within 60s, link valid 24h, single-use
  - Cannot post/offer until email verified
  - Duplicate email returns 409
  - Rate limit 3 attempts/IP/hour
  - bcrypt 12+ rounds; password never logged or returned
  - Disposable email domains blocked
- **source:** ReverseMktplPRD.md §8.1 FR-UM-001, §15.1 US-B-001

### REQ-account-toggle
- **scope:** Account model
- **description:** Single account with buyer/seller mode toggle (Uber driver/rider style). `account_type` enum: buyer, seller, both. Switching to seller/both auto-creates SellerProfile.
- **acceptance:**
  - Same login, same profile — UI tab/button to switch views
  - Mode persists across sessions
  - Both modes can be active for `accountType: both`
- **source:** ReverseMktplPRD.md §7, §8.1

### REQ-account-deletion
- **scope:** Account lifecycle
- **description:** Users can deactivate (reactivatable on login) or delete (permanent). On delete: reviews/ratings remain visible (name attribution preserved); ongoing transactions cancelled; posts deleted.
- **acceptance:**
  - Deactivation: reactivated by logging in
  - Deletion: soft-delete with email prefixed `deleted_{ts}_` to free original email
  - Reviews persist on seller profiles
  - Stated in Terms & Conditions
- **source:** ReverseMktplPRD.md §7 (MVP)

---

## Buyer Journey — Posts

### REQ-create-post-manual
- **scope:** Buyer post creation (manual)
- **description:** Buyers create posts with universal fields (title, description, category, subcategory, transaction type, budget, location, photos, urgency, post duration) plus category-specific fields.
- **acceptance:**
  - Title 10-100 chars; description 50-1000 chars
  - Up to 10 photos (5MB each, auto-compressed to <1MB)
  - Location autocomplete via Google Places
  - Budget min/max OR "Open to offers"
  - Urgency: ASAP / Within 24h / Within 1 week / Within 2 weeks / Flexible / Specific date
  - Post duration: 24h / 3d / 7d / 14d (PRD §8.2 default 3d; ADR-locked default 7d in code — see INGEST-CONFLICTS auto-resolved)
  - Auto-save draft every 30s; drafts never expire and are creator-only
  - Estimated sellers in area shown before posting
  - Editable only if `offerCount === 0`
- **source:** ReverseMktplPRD.md §8.2 FR-BUY-001, §15.1 US-B-002

### REQ-create-post-ai-assisted
- **scope:** Buyer post creation (AI)
- **description:** Buyers can create posts via AI chat ("I need bathroom sink repaired") → AI generates structured post (category/subcategory slugs, title, description, budget hint, urgency). Two-step flow: text input → review/edit → publish.
- **acceptance:**
  - AI returns category/subcategory slugs (resolved server-side to UUIDs)
  - AI output validated through Zod schema
  - For product requests, AI may pull product images from web (e.g., "iPhone 16 Pro Gold 256GB")
  - 20 req/hr per-user rate limit
  - 503 with clear message if `GEMINI_API_KEY` missing — manual form fallback
- **source:** ReverseMktplPRD.md §7 (MVP — AI-assisted post creation), CLAUDE.md

### REQ-post-extension-and-repost
- **scope:** Post lifecycle
- **description:** Posts can be extended exactly once (+3 days). Reposting copies content into a fresh record (new ID, fresh counters); original preserved.
- **source:** ReverseMktplPRD.md §7 (MVP), docs/decisions.md (Session 4)

### REQ-max-active-posts
- **scope:** Spam prevention
- **description:** Max 10 active posts per buyer (drafts excluded)
- **source:** docs/decisions.md (Session 4); aligns with PRD spam-prevention intent

### REQ-three-day-exclusivity
- **scope:** Buyer-seller offer exclusivity
- **description:** Buyer gets a 3-day exclusivity window where seller offers are private to that buyer. After 3 days, offers go public.
- **acceptance:**
  - `publicAfter = createdAt + 3 days` on each post
  - Seller feed filters out posts where `publicAfter > now` (unless seller is the original target)
  - After window, all sellers can see the post
- **source:** ReverseMktplPRD.md §7 / Feb 11 PRD review, CLAUDE.md
- **note:** Audit shows partial implementation — see context.md "Backend Gaps"

---

## Seller Journey — Offers

### REQ-seller-profile
- **scope:** Seller onboarding
- **description:** Seller creates profile (business info, service radius, categories, bio, portfolio photos). License/insurance optional → earns badges if uploaded and verified.
- **acceptance:**
  - Business name optional; defaults to "FirstName LastName"
  - Service radius 5-100 miles
  - Multi-select categories/subcategories
  - Bio 50-500 chars
  - Profile photo required (1MB max)
  - Up to 10 portfolio photos (2MB each)
  - Real-time `profileStrength` score (0-100)
  - Verification tier displayed (Tier 1-4)
- **source:** ReverseMktplPRD.md §15.2 US-S-002

### REQ-seller-feed
- **scope:** Seller browsing
- **description:** Sellers browse buyer requests filtered by their categories and service radius.
- **acceptance:**
  - Distance shown per post
  - Budget visible
  - Urgency badge displayed
  - Competition indicator (Low/Med/High)
  - Filters: budget, distance, urgency, category
  - Sort: Newest / Expiring soon / Highest budget / Closest
  - 3-day exclusivity respected
- **source:** ReverseMktplPRD.md §15.2 US-S-003

### REQ-submit-offer
- **scope:** Seller offer submission
- **description:** Sellers submit competitive offers with quote, timeline, message, portfolio attachments.
- **acceptance:**
  - Quote $10-$50,000 (within seller tier limit)
  - Timeline: can-start + completion-time
  - Message 50-1000 chars
  - Up to 10 portfolio photo attachments
  - Earnings calculator shows estimated payout (client-side preview)
  - Submission completes in <2s
  - Buyer notified within 60s
  - Duplicate offers prevented (unique `(post_id, seller_id)`)
  - Editable before buyer acceptance
  - Withdrawable before acceptance (24h cooldown before re-submit)
- **source:** ReverseMktplPRD.md §15.2 US-S-004

### REQ-max-offers-per-post
- **scope:** Offer cap
- **description:** Max 25 offers per post (LOCKED ADR). Code constant currently `MAX_OFFERS_PER_POST = 10` (audit) — see INGEST-CONFLICTS auto-resolved.
- **source:** docs/decisions.md (Session 5)

### REQ-offer-visibility-private
- **scope:** Offer privacy
- **description:** Sellers cannot see other sellers' offers on the same post. When buyer accepts one offer, others are notified the buyer chose another seller.
- **source:** ReverseMktplPRD.md §7 (MVP), Feb 6/8 transcripts

### REQ-counter-offer
- **scope:** Counter-offer flow
- **description:** Counter-offers via in-app messaging (no public bid wars). Documented in PRD/CLAUDE but per audit §4.x: not implemented — see context.md "Backend Gaps".
- **source:** ReverseMktplPRD.md §7, CLAUDE.md, docs/BACKEND_AUDIT_REPORT.md

---

## Payments & Escrow

### REQ-stripe-escrow
- **scope:** Payment escrow
- **description:** Stripe Connect escrow flow. **Implementation: Separate Charges + Transfers** (LOCKED ADR; supersedes PRD §8.5 "Destination Charges"). Platform charges full amount via PaymentIntent → holds funds → creates Transfer to seller's connected account on approval. `transfer_group` links charge and transfer.
- **acceptance:**
  - Buyer charged upfront (full for services/products; initial milestone for jobs)
  - Funds held on platform Stripe account until release
  - Escrow status visible to both parties
  - Cost breakdown shown at checkout (quote + buyer fee + Stripe fee + total)
  - Payment methods: card, Apple Pay, Google Pay
  - 3D Secure (SCA) for cards >$100
  - Payment processed in <3s
- **source:** ReverseMktplPRD.md §8.5 FR-PAY-001, §15.1 US-B-004; ADR override docs/decisions.md (Session 6)

### REQ-fee-structure-tiered
- **scope:** Marketplace fees
- **description:** Tiered fees by transaction type:
  - Services: buyer +5%, seller -8% (+ Stripe fees absorbed by platform)
  - Shipped products: buyer +5%, seller -6% (+ Stripe fees)
  - Local platform: buyer +3%, seller -3% (+ Stripe fees)
  - Local cash: $0 (free, no Stripe)
  - Inventory/B2B: buyer +5%, seller -5%
  - Jobs: per-lead pricing $10-500 (companies pay regardless of hire)
- **source:** ReverseMktplPRD.md §8.5, docs/decisions.md (Session 5)

### REQ-stripe-onboarding
- **scope:** Seller payouts
- **description:** Sellers connect Stripe Connect Standard account via hosted onboarding (external browser).
- **acceptance:**
  - Onboarding link generated in <1s
  - Seller redirected to Stripe-hosted onboarding
  - Webhook fires on completion
  - `stripeChargesEnabled` synced to platform
  - Unverified sellers cannot receive payouts (production gate)
  - Dev bypass: `NODE_ENV !== 'production'` skips Stripe gate (test seller can complete full flow)
- **source:** ReverseMktplPRD.md §15.2 US-S-007, docs/decisions.md (Session 6, Post-Session)

### REQ-escrow-release
- **scope:** Funds release
- **description:** On buyer approval, escrow released to seller (Stripe Transfer). Auto-release after 7 days for services if buyer unresponsive.
- **acceptance:**
  - Approval → Stripe transfer initiated immediately, payout in 1-2 business days
  - 7-day auto-release for services
  - Auto-release worker calls `releaseEscrow()` BEFORE updating transaction status (escrowStatus guard)
  - Per-record try/catch in sweep — one failure doesn't block others
  - `releaseEscrow(txId, reason)` — reason `'auto_release'` for sweep, `'buyer_approved'` for approval
- **source:** ReverseMktplPRD.md §15.1 US-B-006, docs/decisions.md (Post-Session 13)

### REQ-milestone-payments
- **scope:** Multi-stage projects
- **description:** Milestone-based payments with NO minimum threshold. Each milestone paid upon completion. Different contractors can handle different milestones in same parent project.
- **source:** ReverseMktplPRD.md §7 (MVP), docs/decisions.md (Pre-Build)

### REQ-max-2-change-requests
- **scope:** Change request cap
- **description:** Max 2 buyer change requests per transaction. Then buyer must approve or open dispute.
- **source:** docs/decisions.md (Session 5)

---

## Transactions & Evidence

### REQ-before-after-photos
- **scope:** Service evidence
- **description:** Before AND after photos REQUIRED for all services. Seller uploads before-photos before starting work, after-photos when done.
- **acceptance:**
  - Required for both simple and complex services
  - 1-5 after photos, auto-compressed to <1MB
  - Cannot mark complete without after photos (Phase 2 enforcement per PRD US-S-005)
- **source:** ReverseMktplPRD.md §7 (MVP), docs/decisions.md (Pre-Build)

### REQ-transaction-status-tracking
- **scope:** Transaction lifecycle
- **description:** Buyer and seller see transaction status updates with timestamps. Status transitions are validated per `transactionType` (services / shipped / local each have distinct progressions).
- **acceptance:**
  - Status transitions logged in `timeline` JSON
  - Push notification on every status change
  - Transaction-type-aware status buttons in mobile UI
- **source:** ReverseMktplPRD.md §15.1 US-B-005, docs/decisions.md (Session 5, 12)

---

## Reviews

### REQ-rating-and-review
- **scope:** Post-transaction reviews
- **description:** Buyer rates seller (1-5 stars overall, optional category-specific ratings, optional written review 50-500 chars, "Would recommend" toggle). Reviews immutable, persist on seller profile after account deletion.
- **acceptance:**
  - Overall rating required
  - Profanity auto-flagged
  - Seller rating updates immediately (interactive Prisma transaction)
  - Verified-transaction badge displayed
  - Reminders at days 7, 30, 60, 73 post-completion
  - Auto 5-star review at day 73 if no submission (with `isAutoGenerated: true` flag)
  - BullMQ `jobId` dedup prevents duplicate reminder emails
- **source:** ReverseMktplPRD.md §15.1 US-B-007, docs/decisions.md (Session 7), CLAUDE.md
- **note:** PRD US-B-007 says "60-day window for skip" — superseded by ADR (day 73 auto-review). See INGEST-CONFLICTS auto-resolved.

---

## Messaging

### REQ-in-app-messaging
- **scope:** Buyer ↔ Seller communication
- **description:** In-app chat per buyer-seller pair, attached to post detail. One continuous thread per pair. Chat history preserved permanently. Offer details viewable in chat.
- **acceptance:**
  - Text + basic image sharing (up to 5 photos, 5MB each)
  - Conversation auto-created atomically on offer acceptance
  - Real-time delivery via Socket.IO + 30s/60s polling fallback
  - Unread badge count accurate
  - Push notification within 30s
  - 50 messages/hour rate limit per user
  - External payment terms (venmo/cashapp/zelle/paypal) flagged for moderation review
  - Messaging tab in bottom navigation
  - 90-day retention post-transaction (PRD US-P-002); permanent per CLAUDE.md (CLAUDE.md is canonical for production)
- **source:** ReverseMktplPRD.md §7 (MVP), §8.4, §15.3 US-P-002, docs/decisions.md (Session 7, 13)

---

## Notifications

### REQ-multi-channel-notifications
- **scope:** Notification delivery
- **description:** Multi-channel notifications (in-app, email via SendGrid, push via FCM). Async via BullMQ. Critical events: new offer, offer accepted, job complete, payment released, review reminders.
- **acceptance:**
  - Internal `NotificationsService.createNotification()` only — no public POST
  - User-facing API only reads/marks-read/deletes
  - User notification preferences (email/SMS/push toggles per channel)
  - FCM invalid-token auto-cleanup (clears `fcmToken` on `messaging/registration-token-not-registered`)
  - Workers disabled in `NODE_ENV=test`
- **source:** ReverseMktplPRD.md §7, docs/decisions.md (Session 7, 14)

---

## Search

### REQ-mvp-search
- **scope:** Search & discovery
- **description:** Basic search by category, distance, time posted (PostgreSQL full-text via tsvector + GIN index, weighted title=A description=B). Elasticsearch upgrade planned Phase 2.
- **acceptance:**
  - Results return in <500ms (PostgreSQL MVP); <200ms (ES Phase 2)
  - Keyword search matches title + description
  - Location-based search accurate within 0.1 miles
  - Filters: budget, distance, urgency, category
  - Sort options
  - Pagination (20/page)
- **source:** ReverseMktplPRD.md §15.3 US-P-001, §16.1, docs/decisions.md (Session 4)
- **note:** Audit shows radius-based geolocation search NOT implemented (geocoding utility exists). See INGEST-CONFLICTS warnings/context.md gaps.

---

## Verification

### REQ-verification-badges
- **scope:** Trust signals
- **description:** Badge-based verification (Licensed, Insured, ID Verified, Background Checked). Non-verified sellers allowed but get no badges. Background check required only for high-risk categories (childcare, pet care, in-home services).
- **acceptance:**
  - Verification documents create `VerificationRequest` (pending → approved/rejected)
  - Tier recalculated from all verified badges on approval (1 → 2 ID/EIN → 3 license/insurance → 4 background check)
  - Buyers can filter sellers by badges
- **source:** ReverseMktplPRD.md §7, §8.1, docs/decisions.md (Session 1, 3, 9)

### REQ-business-account-ein
- **scope:** Business verification (PARTIAL)
- **description:** PRD requires Business account registration with EIN + sales tax certificate. Audit reports this is partial — EIN exists as a verification type but is NOT required at registration.
- **source:** ReverseMktplPRD.md §8.1, docs/BACKEND_AUDIT_REPORT.md §1.7-1.8
- **note:** See INGEST-CONFLICTS — PRD vs implementation gap

---

## Disputes

### REQ-dispute-mvp
- **scope:** Dispute resolution
- **description:** Basic dispute resolution. Buyer claims non-receipt → dispute record created, escrow frozen. Platform contacts seller; if no response, buyer gets automatic refund and seller account may be put on hold.
- **acceptance:**
  - Escrow frozen within 1 second
  - Both parties notified within 60s
  - Evidence uploadable (photos/videos/docs, max 10 files, 5MB each)
  - Evidence deadline 48h after open
  - Manual admin handling in MVP (automated dispute resolution Phase 2)
- **source:** ReverseMktplPRD.md §7, §8.7, §15.3 US-P-003

---

## Admin

### REQ-admin-dashboard
- **scope:** Platform moderation
- **description:** Basic admin dashboard with transaction monitoring, dispute management, user management (suspend/ban — admins cannot suspend/ban other admins), license/insurance verification approval, flagged content moderation.
- **acceptance:**
  - All routes protected by plugin-level `authenticate` + `requireAdmin` hooks
  - Admin actions logged to immutable AuditLog
  - Flagged content unified across reviews and messages
  - Force-logout via Redis SCAN of `auth:refresh:{userId}:*`
- **source:** ReverseMktplPRD.md §7 (MVP), docs/decisions.md (Session 9)

---

## Jobs Category (Lead Generation)

### REQ-jobs-lead-gen
- **scope:** Jobs category model
- **description:** Platform acts as lead navigator/generator (NOT staffing agency). Companies pay per lead regardless of hiring outcome. Job seekers and companies create AI-generated structured profiles. AI/ATS matches with percentage scores. Batched daily digests of top matches (90%+).
- **acceptance:**
  - Lead pricing: Entry-level $10-20, Mid-level $30-50, Specialized/Senior $100-500
  - Pricing may be dynamic based on demand and role scarcity
  - Employer verification via work-email domain (not Gmail/personal)
  - Subcategories: full-time, part-time, remote, in-office
  - Companies see ranked match list (not spammed with every applicant)
- **source:** ReverseMktplPRD.md §7 (MVP — Jobs Category), §1
- **note:** Audit reports lead-based pricing logic NOT implemented (only `job_milestone` transaction type exists). See INGEST-CONFLICTS auto-resolved.

---

## Non-Functional Requirements

### NFR-performance
- **scope:** Performance
- **description:**
  - API response time: <200ms (median), <500ms (p95)
  - Page load: <2s (web), <1.5s (mobile)
  - Search: <500ms (PostgreSQL MVP), <200ms (ES Phase 2)
  - Payment: <3s
  - Image upload: <5s for 5MB
  - DB query: <100ms p95
- **source:** ReverseMktplPRD.md §16.1

### NFR-throughput
- **scope:** Concurrency
- **description:**
  - Concurrent users: 1,000 (MVP), 10,000 (Phase 2), 50,000 (Phase 3)
  - API: 1,000 req/s peak
  - WebSocket: 5,000 concurrent (Phase 2)
  - DB connections: 100 max (pooled)
- **source:** ReverseMktplPRD.md §16.1

### NFR-data-growth
- **scope:** Data scale
- **description:**
  - Users: 10K MVP / 100K P2 / 1M P3
  - Posts: 5K/mo MVP / 50K/mo P2 / 500K/mo P3
  - Transactions: 1K/mo MVP / 10K/mo P2 / 100K/mo P3
  - Messages: 50K/mo MVP / 500K/mo P2 / 5M/mo P3
  - Images: 100GB/mo MVP / 500GB/mo P2 / 2TB/mo P3
- **source:** ReverseMktplPRD.md §16.2

### NFR-uptime
- **scope:** Availability
- **description:** 99.9% MVP (8.76h downtime/year), 99.95% Phase 2 (4.38h/year). Maintenance window Sundays 2-4 AM UTC (48h notice).
- **source:** ReverseMktplPRD.md §16.3

### NFR-disaster-recovery
- **scope:** DR
- **description:** RTO <4h, RPO <1h. Daily automated backups to separate region. 30-day retention. Point-in-time recovery for last 7 days. Quarterly restore drills.
- **source:** ReverseMktplPRD.md §16.3

### NFR-error-handling
- **scope:** Resilience
- **description:** Auto-retry failed API requests (3 attempts max, exponential backoff). Circuit breaker after 5 consecutive failures. Cached fallback for non-critical real-time data.
- **source:** ReverseMktplPRD.md §16.3

### NFR-accessibility
- **scope:** WCAG 2.1 AA
- **description:** Keyboard navigation, screen reader support (semantic HTML, ARIA), 4.5:1 color contrast minimum, descriptive alt text, visible focus indicators, 16px minimum font (scalable to 200%), 44x44 px touch targets minimum.
- **source:** ReverseMktplPRD.md §16.4

### NFR-test-coverage
- **scope:** Quality gates
- **description:** Min 70% test coverage. 70% unit / 20% integration / 10% E2E. Load testing at 1,000 concurrent. Security via OWASP ZAP and Snyk. UAT with 20 beta users before launch.
- **source:** ReverseMktplPRD.md §16.5

### NFR-cicd
- **scope:** Deployment
- **description:** Build on every commit. Auto-deploy to staging on merge to develop. Production: manual approval + canary (10% → 50% → 100%). One-click rollback.
- **source:** ReverseMktplPRD.md §16.5
- **note:** Current implementation: 3-job GitHub Actions (lint/typecheck → test → build-docker on main, no push yet). See INGEST-CONFLICTS info — partial alignment.

### NFR-monitoring
- **scope:** Observability
- **description:** Centralized logging with search/filtering. Distributed tracing for API requests (Jaeger or Datadog APM). Automated alerts (Slack, PagerDuty). Real-time dashboards (Grafana/Datadog). Sentry for error tracking. Prometheus metrics.
- **source:** ReverseMktplPRD.md §16.5, docs/decisions.md (Session 14), CLAUDE.md

### NFR-security
- **scope:** Security baseline
- **description:**
  - JWT with refresh rotation
  - AES-256 at rest, TLS 1.2+ in transit
  - Rate limiting 100-1,000 req/hour per user
  - Server-side input validation
  - Parameterized queries only (no SQL injection)
  - Output encoding + CSP headers (XSS)
  - CSRF tokens + SameSite cookies
  - PCI-DSS via Stripe
  - GDPR + CCPA compliance
- **source:** ReverseMktplPRD.md §12, §16.6

---

## Success Metrics (Year 1 — DFW MVP)

### REQ-success-metrics
- **scope:** Business goals
- **description:**
  - Users: 2,500 total (1,500 buyers / 1,000 sellers)
  - Active sellers: 200 (posted profile + made 1+ offer)
  - Active buyers: 750 (posted 1+ request)
  - Transactions: 500 completed
  - GMV: $140,000
  - Revenue: $9,800 (~7% take rate)
  - Geographic coverage: 80% of DFW (350+ zip codes)
  - North Star: Weekly Active Transactions (10 by Month 3, 30 by Month 6, 120 by Month 12)
  - Dispute rate: <8% MVP, <6% Phase 2, <5% Phase 3
  - Avg rating: >4.3 MVP, >4.5 Phase 2, >4.6 Phase 3
- **source:** ReverseMktplPRD.md §6, §7
