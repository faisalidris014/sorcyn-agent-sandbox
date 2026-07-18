# Context (DOC Intel)

Running notes from supporting docs (build logs, guides, meeting transcripts, in-flight execution plans, code-intel guides). Lowest-precedence content; included for traceability.

Each section is keyed by topic and attributes its source verbatim.

---

## Build Status & Sessions

**Source:** BUILD_PROGRESS.md, docs/architecture.md, docs/decisions.md, CLAUDE.md

- **Backend:** 15 sessions complete. 295+ tests across 22 test files + 18 curl-based API test scripts. All sessions delivered shipping code.
- **Frontend:** Flutter app with 40 of 51 screens built (per docs/SCREEN_HIERARCHY.md). Real-time messaging (Socket.IO), push notifications (FCM), i18n (10 languages), Sentry crash reporting, deep linking.
- **Infrastructure:** Docker multi-stage build, Nginx SSL reverse proxy, GitHub Actions CI/CD (test → build → push GHCR → deploy via SSH), Prometheus metrics, Sentry error tracking, automated DB backups.
- **Module count:** 18 backend API modules (auth, users, sellers, categories, posts + AI assist, offers, transactions, payments, messages + Socket.IO, reviews, notifications, search, uploads, disputes, payouts, saved-searches, saved-sellers, admin) — 19 route groups total.
- **Latest commit at audit:** `804c8ec` (main).

---

## Backend Audit Snapshot (Apr 18, 2026)

**Source:** docs/BACKEND_AUDIT_REPORT.md

- **Health score:** 127 / 168 items (75.6%). 104 IMPLEMENTED, 23 PARTIAL, 41 MISSING.
- **Test suite:** 309 / 309 passing (21 test files, 0 skips, 16.40s).

### Biggest Gaps (Priority Order — from audit)
1. No radius-based geolocation search — geocoding utility exists but search doesn't use it
2. No Meilisearch — uses PostgreSQL FTS (intentional per ADR for MVP, but PRD/spec mentions Meilisearch — see INGEST-CONFLICTS auto-resolved)
3. No follow/favorite sellers — `saved_sellers` exists in CLAUDE.md but audit reports no model/endpoints/logic
4. No RLS policies — all access control is application-level (audit notes spec says Supabase Auth + RLS, ADR locks custom JWT — see INGEST-CONFLICTS)
5. No Stripe Identity for ID verification — verification is manual document review only
6. No Stripe AccountSession for embedded components — uses hosted onboarding links (matches ADR `url_launcher` approach)
7. No lead-based pricing for Jobs — `job_milestone` transaction type exists but no lead pricing logic
8. No counter-offer flow — documented in CLAUDE.md API spec but not implemented
9. No address/contact blocking until payment — no enforcement logic found
10. No promotion system — zero scaffolding (intentionally deferred per CLAUDE.md / Session 2 transcript)

### Strong Areas (per audit)
The core transactional flow is complete and well-tested: auth → post creation → offer submission → acceptance → payment → escrow → completion → review. Stripe Connect, fee calculations, Socket.IO real-time, BullMQ (auto-release / post-expiry / review reminders), and admin moderation are production-quality.

---

## Architecture Overview

**Source:** docs/architecture.md, CLAUDE.md

- **Pattern:** Microservices-ready modular monolith.
- **Backend stack:** Fastify 5, Prisma 7 (driver adapter), PostgreSQL 15 (Supabase host), Redis 7, BullMQ, Socket.IO 4, Sentry, Prometheus, `@fastify/compress`.
- **Mobile stack:** Flutter 3.16+, Riverpod, Dio, GoRouter (auth guards + StatefulShellRoute), socket_io_client, Firebase FCM, Sentry, flutter_secure_storage, flutter_localizations + intl (10 languages).
- **Database:** Supabase PostgreSQL host. Cache/queue: Redis via ioredis. Search: PostgreSQL tsvector + GIN (MVP) → Elasticsearch (Phase 2).
- **File storage:** Cloudflare R2 ($0 egress, S3-compatible). MinIO at `localhost:9000` for local dev. Pre-signed URL upload pattern.
- **AI (MVP):** Google Gemini Flash-Lite (free 1K req/day, 20 req/hr per user).
- **Third-party:** Stripe Connect (escrow), Twilio (SMS — deferred Phase 2), SendGrid (transactional email), Firebase FCM (push), Google Maps (Places, Geocoding, Distance Matrix).
- **Cost projection:** $1,000-1,600/month at 10K users (without AI). AI ~$85-112/month (Claude Haiku) at 10K users; free tier sufficient for MVP.

---

## Mobile UI — Screen Hierarchy

**Source:** docs/SCREEN_HIERARCHY.md

51 total screens mapped. 40 built. Coverage areas: authentication, post creation, offers, messaging, transactions, profile, admin. See source doc for per-screen elements, navigation, and build status.

---

## In-Flight Mobile Restyling Plans (CANDIDATE PHASES)

These execution plans describe in-progress UI restyling work mapping Flutter screens to Figma/TSX design references in `designs/src/app/components/`. Functionality (Riverpod state, GoRouter, API calls) preserved — only widget trees / styling change. **Surface as candidate phases for downstream roadmapping.**

### FRONTEND_RESTYLING_PLAN.md (Master Plan)

**Source:** FRONTEND_RESTYLING_PLAN.md

- 38 Flutter screens → 25 TSX design references
- Six batches total (this is the umbrella plan)
- Inter font (400/500/600/700) needs adding to Flutter
- Design tokens defined: primary `#7C3AED`, secondary `#A855F7`, gradient `linear-gradient(135deg, #7C3AED, #A855F7)`, button shadow `0 8px 20px rgba(124,58,237,0.35)`, input height 52px, button height 56px, border radius — inputs 12px / buttons 24px / cards 16px / welcome card 24px
- Visual patterns: gradient buttons, custom 52px input fields, welcome card with gradient + radial overlay + stats, post cards with chips/badges, custom bottom nav with active gradient indicator dot, gradient FAB with shadow, spring page transitions (stiffness 320, damping 32), `active:scale-[0.97]` tap animations, social auth outlined buttons, status badges (colored dot + text in tinted pill)

### Per-Batch Execution Plans

**Source:** BATCH_2_PLAN.md through BATCH_8_PLAN.md (no BATCH_1 plan file ingested)

- **Batch 2 — Buyer Dashboard + Posts:** 7 buyer-facing screens + 6 shared widgets. Screens: BuyerDashboard, MyPosts, PostDetail, CreatePostMethod, AIPostCreation, ManualPostCreation, PostCreated. Widgets: gradient_fab, bottom_nav_bar, welcome_card, post_card, status_badge, urgency_chip.
- **Batch 3 — Offers:** 5 offer screens + 2 modals. Screens: post_offers, offer_detail, submit_offer. Modals: compare_offers, accept_offer, counter_offer.
- **Batch 4 — Messages:** conversations_screen + chat_screen. Targets MessagesScreen.tsx + ChatScreen.tsx.
- **Batch 5 — Transactions:** 4 screens. transactions_screen, transaction_detail_screen, seller_transaction_detail_screen, dispute_detail_screen. Includes milestone timeline, escrow indicator, before/after photo grid, dispute flow.
- **Batch 6 — Seller Flows:** 6 screens. seller_feed, seller_post_detail, my_offers, seller_profile_setup, seller_profile, seller_earnings.
- **Batch 7 — Profile & Settings:** 8 screens. profile, edit_profile, public_profile, settings, language_settings, help_support, payment_methods, change_password modal.
- **Batch 8 — Misc:** 5 screens. notifications, submit_review, verification, stripe_onboard, splash.

**Total batched scope:** ~37 screens across 7 batch plans (Batches 2-8).

---

## Documentation Index

**Source:** CLAUDE.md, docs/README.md (referenced in classifications)

### Technical Docs (canonical)
- `docs/README.md` — Project overview and quick-start
- `docs/architecture.md` — Modular monolith, Flutter structure, request/response flows, infra
- `docs/database.md` — Prisma schema reference (15+ models, 20+ enums)
- `docs/api.md` — REST API reference, all endpoints
- `docs/setup.md` — Local dev setup (Docker, env, Prisma, Flutter)
- `docs/decisions.md` — Aggregated locked technical decisions across all sessions
- `docs/prisma-7-patterns.md` — Prisma 7 migration guide and breaking changes
- `docs/API_TESTING_GUIDE.md` — Swagger UI testing walkthrough
- `docs/SCREEN_HIERARCHY.md` — Mobile UI screen map (51 screens, 40 built)
- `docs/DEPLOYMENT.md` — Production deployment runbook (VPS, SSL, CI/CD, monitoring, rollback)
- `docs/FCM_SETUP.md` — Firebase Cloud Messaging setup
- `docs/TESTING.md` — Vitest + curl-based API test guide

### Other Key Files
- `ReverseMktplPRD.md` — Full PRD (14,724 lines) v2.1 — canonical product spec
- `BUILD_PROGRESS.md` — Session-by-session build log
- `BUILD_INSTRUCTIONS.md` — Original session plan
- `docs/BACKEND_AUDIT_REPORT.md` — Apr 18, 2026 automated audit (75.6% health)

---

## Granola Meeting Transcripts (LOWEST PRECEDENCE)

These are speech-to-text exports of brainstorming/planning meetings. They show evolving thinking; the canonical capture lives in the PRD. **Where transcripts conflict with the PRD, treat transcripts as superseded — surface as competing-variant warnings, not blockers.**

### Feb 6 — App Idea (initial concept)

**Source:** `docs/Reverse Marketplace App Idea Feb 6th.md`

- Original brainstorm of reverse marketplace concept
- Categories: products, services, jobs (B2B/B2C/C2C account types — note: superseded; ADR locks `buyer/seller/both`)
- AI chat-assisted post creation
- In-app messaging
- Transaction fees + monetization
- Escrow / authorization hold payment flow
- Dispute resolution
- Reviews and ratings (both sides)
- Seller verification (EIN, licenses, insurance)
- Geographic launch strategy (DFW first)
- Competitive analysis: Thumbtack, Upwork, Facebook Marketplace, eBay, Mercari, OfferUp, JingleBid, Procurex
- Single-offer-per-seller anti-spam rule
- Time-limited posts
- Saved sellers / repeat-customer relationships
- Color scheme (white + purple)
- iOS + Android + web platforms

### Feb 8 — Escrow + Verification deep-dive

**Source:** `docs/Reverse Marketplace Feb 8th.md`

- Escrow flow with before/after photo evidence
- Dispute resolution
- Fee structure
- Complex multi-contractor projects (split into milestones)
- AI-assisted posting
- Seller verification — license + insurance requirements
- Jobs/staffing module
- Messaging UX
- Launch strategy
- Competitive analysis: Craigslist, Mercari, Thumbtack, Facebook Marketplace

### Feb 11 — PRD Review

**Source:** `docs/Reverse Marketplace PRD Review Feb 11th.md`

- PRD readiness checklist
- Debate on fee structure: local free vs. service fee — outcome captured in ADR (DEC-local-products-free / DEC-tiered-fee-structure)
- AI cost tradeoffs
- Phase 1 MVP breakdown
- DFW launch timeline
- Section 6 (fees), 7 (phasing), 8 (functional requirements)

### Feb 11 — Session brainstorm

**Source:** `docs/Reverse Marketplace Session Feb 11th.md`

- App naming and domain ideas
- Color scheme (purple/white)
- Account model (single login, buyer/seller mode switching)
- AI-assisted buyer post creation
- Marketplace UI inspiration: Facebook Marketplace, OfferUp
- Reverse marketplace concept

### Feb 11 — Session 1 implementation kickoff

**Source:** `docs/Reverse Marketplace Session 1 Feb 11th.md`

- App naming search
- Branding (purple/white)
- Account model decisions
- Buyer post UX (AI-assisted text-to-listing)
- Marketplace UI inspiration (Facebook Marketplace, OfferUp, "Afrro")
- Seller listing fees / pay-to-list patterns explored
- AI image attachment for posts

### Feb 12 — Session 2 (promotion mechanics)

**Source:** `docs/Reverse Marketplace Session 2 Feb 12th.md`

- Seller promotions: pay-per-buyer-reach, time-window boosts, post-renewal patterns
- Promotion tab concept
- Pay-per-lead model
- Advertising tiers
- **Decision: Promotions DEFERRED until user base established** (per CLAUDE.md). Audit confirms "No promotion system — zero scaffolding."

### April 14 — Session 3 (resume + mobile design)

**Source:** `docs/Reverse Marketplace Session 3 April 14th.md`

- Project resumption planning (after gap)
- Mobile design phase kickoff
- Marks transition into Figma + Flutter restyling work captured in BATCH plans

### April 15 — Session (Figma AI + cold start)

**Source:** `docs/Reverse Marketplace Session April 15th.md`

- Figma AI screen design workflow
- Cold-start strategy: seed FAKE BUYER POSTS only (no fake sellers)
- Branding/logo ideas
- Future reverse-Uber/ride-share expansion brainstorming
- 3-day public window mechanic discussed
- Marketing on TikTok/Instagram
- App naming / logo concepts
- API test scripts work
- Docker container startup notes
- Claude plan-mode usage

---

## Setup, Testing, Deployment

**Sources:** docs/setup.md, docs/TESTING.md, docs/DEPLOYMENT.md, docs/FCM_SETUP.md, docs/API_TESTING_GUIDE.md

### Local Setup
- Docker Compose: PostgreSQL 15 on port 5433 + Redis 7 on 6379
- Backend: Node.js + Prisma + env vars (`.env` in `backend/`)
- Flutter mobile setup
- Database seeding (38 categories + 4 test users)
- API testing via Swagger UI + curl scripts

### Testing
- Two systems: Vitest unit/integration + curl-based API scripts
- Test helpers: `tests/helpers.ts` (`createTestUser`, `makeAdmin`, `authHeaders`, `cleanupTestData`)
- Socket.IO test patterns
- Rate limiting disabled in `NODE_ENV=test`
- Stripe / Gemini / BullMQ mocking patterns
- 14 numbered bash scripts with shared `_state.sh` for cross-suite state preservation; `_config.sh` for `BASE_URL`
- `run-all.sh` runner with `--clean` flag

### Deployment
- VPS provisioning, Docker Compose production stack
- Nginx SSL with Let's Encrypt
- PostgreSQL automated backups, Redis, BullMQ workers
- Environment variables (`.env.production.example`)
- Prometheus metrics + Sentry monitoring
- GitHub Actions CI/CD (`.github/workflows/ci.yml`)
- Rollback procedures documented
- Scaling plan documented

### FCM Setup
- Step-by-step guide for Android, iOS, backend
- Optional Sentry DSN configuration
- Firebase platform-specific credential files (gitignored)

---

## Code Intelligence (GitNexus)

**Source:** AGENTS.md, CLAUDE.md (GitNexus section)

- Project indexed by GitNexus as `ReverseMarketplace`: 2,907 symbols, 6,614 relationships, 160 execution flows
- MCP tooling for impact analysis, change detection, refactoring, debugging
- Stale index → run `npx gitnexus analyze` (preserve embeddings with `--embeddings`)
- PostToolUse hook auto-refreshes after `git commit` / `git merge`

---

## Color Scheme & Design Tokens

**Source:** FRONTEND_RESTYLING_PLAN.md, BATCH plans, docs/decisions.md (Session 10)

| Token | Value | Notes |
|---|---|---|
| Primary | `#7C3AED` | Material 3 primary |
| Secondary | `#A855F7` | Lighter purple |
| Background | `#FFFFFF` | White |
| Card BG | `#F9FAFB` | Off-white |
| Foreground/Text | `#1F2937` | Near-black |
| Muted text | `#6B7280` | Mid-grey |
| Grey medium | `#9CA3AF` | Light grey |
| Border | `#E5E7EB` | Very light grey |
| Input BG (unfocused) | `#F9FAFB` | Same as card |
| Input BG (focused) | `rgba(124,58,237,0.03)` | Subtle purple tint |
| Destructive | `#d4183d` | Red |
| Success | `#10B981` | Green |
| Warning | `#F59E0B` / `#D97706` | Amber/Orange |
| Gradient | `linear-gradient(135deg, #7C3AED, #A855F7)` | Diagonal purple |
| Button shadow | `0 8px 20px rgba(124,58,237,0.35)` | Strong purple shadow |

---

## Pricing & Cost Notes

**Source:** CLAUDE.md, docs/decisions.md, ReverseMktplPRD.md §13

- **Infrastructure:** $1,000-1,600/month at 10K users
- **AI:** Free Gemini Flash-Lite tier for MVP (1K/day). Plan migrate to Claude Haiku ($85-112/month at 10K users) as revenue grows.
- **Stripe Connect:** 2.9% + $0.30 buyer-side; platform absorbs Stripe fees
- **Twilio (SMS):** Deferred Phase 2 to save costs

---

## Open Questions Tracked in PRD

**Source:** ReverseMktplPRD.md §19 (Open Questions & Decisions)

- §19.1 Branding & Marketing: app name, logo, marketing channels
- §19.2 Business Model: pricing tweaks, promotion model timing
- §19.3 Technical Architecture: open architecture choices (most resolved by ADRs)
- §19.4 User Experience: UX decisions
- §19.5 Dispute Resolution: tier-2/tier-3 escalation policy
- §19.6 AI Integration (Phase 2): model upgrade plan, prompt versioning
- §19.7 Legal & Compliance: ToS, Privacy Policy, real estate broker review

These are explicitly TBD per the PRD and should be revisited during phase planning.
