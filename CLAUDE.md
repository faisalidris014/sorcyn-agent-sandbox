# AUTONOMOUS AGENT RULES (sandbox — read first)

You are running unattended in a throwaway sandbox. These rules override anything below.

- Never commit or push to `main`. Always branch, always open a PR.
- Only work the one ticket you were given. Do not fix unrelated things.
- Stay inside the files the ticket's Scope declares. If the work needs a file
  outside Scope, stop and say so in the PR body instead of editing it.
- Never modify Prisma schema/migrations, `.env`, secrets, CI config, or
  anything under `scripts/devsync/` or `.claude/`.
- GitNexus MCP tools (impact, detect_changes, query, rename) are not available
  here. Skip any instruction to run them and proceed without them.
- Run `npm test` if the environment is configured. If required env vars are
  missing (this sandbox has none of the backend secrets), do NOT abandon —
  note "tests not run: sandbox env" in the PR body and proceed.
- PR body must include: what changed, why, files touched, and any dependency
  on another PR in this batch.

---

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Reverse Marketplace Platform** — A marketplace where buyers post what they need and sellers compete to fulfill them. Combines local + shipped products + services on one platform, with an AI chatbot as the primary interface and escrow with delayed payouts.

- **Name:** Sorcyn
- **Core Flow:** Buyer posts request (AI-assisted) → Sellers submit offers → Buyer accepts → Payment/Escrow → Work completed → Before/after photos → Payout & Review
- **Categories:** Products (local + shipped), Services, Jobs
- **Geography:** MVP in DFW Metroplex (Dallas-Fort Worth), then Texas, then national
- **Branding:** White background, purple accent color scheme
- **Target:** Q3 2026 launch, 2,500 users year 1 (1,500 buyers / 1,000 sellers)

## Core Product Decisions

Reference `docs/` for full detail — these are the confirmed decisions:

- **Pricing:** Buyers pay $0 on local transactions, 3-5% fee on shipped/service/online. Sellers pay commission on completed transactions: 8% services, 6% shipped, 3% local platform, 0% local cash (to drive adoption vs FB Marketplace/OfferUp)
- **Exclusivity:** 2-hour window where buyer gets private seller offers, then offers go public (`EXCLUSIVITY_WINDOW_MS` in `backend/src/modules/posts/posts.service.ts`). Resubmitting after a decline restarts this window.
- **Offer cap:** Maximum 25 offers per post; sellers capped at 25 active offers across all posts (`MAX_OFFERS_PER_POST` / `MAX_ACTIVE_OFFERS` in `backend/src/modules/offers/offers.service.ts`); sellers can pay for additional batches
- **Account model:** Single login with buyer/seller mode switching (like Uber driver/rider)
- **Escrow:** Stripe Connect holds funds → seller completes work → before/after photo evidence required → buyer approves → payout (minus fees). 7-day auto-release if buyer doesn't respond. Max 2 change requests.
- **Verification tiers:** Simple services = email/phone only, complex = license verification, high-risk = background checks. Badge-based system (Licensed, Insured, ID Verified, Background Checked). Non-verified sellers allowed but don't get badges.
- **Seller promotions:** Planned feature (paid visibility boost, early access tiers) but deferred until user base is established
- **AI integration:** Starting with Google Gemini Flash-Lite (cheapest, free 1K req/day), upgrading to Claude as revenue grows. AI chatbot is the primary interface for listing generation.
- **Jobs:** Companies pay per lead ($10-500 depending on role level)
- **Reviews:** Before/after photos tied directly to reviews for legitimacy. Auto 5-star review on day 73 if buyer doesn't respond. Reminders at days 7, 30, 60, 73.

## Tech Stack & Architecture

### Backend (Built)
- **Runtime:** Node.js 20+ LTS with TypeScript 5+ (ESM)
- **Framework:** Fastify 5
- **ORM:** Prisma 7 (driver adapter pattern)
- **Validation:** Zod 4
- **Job Queue:** BullMQ (Redis-backed)
- **Real-time:** Socket.IO 4 (WebSocket + polling fallback, Redis adapter)
- **Error Tracking:** Sentry (`@sentry/node`)
- **Compression:** `@fastify/compress` (threshold 1KB)
- **Metrics:** Prometheus (`prom-client`)
- **Testing:** Vitest + Supertest (295+ tests across 22 test files) + 18 curl-based API test scripts

### Frontend (Built)
- **Framework:** Flutter 3.16+ (Dart 3.2+) for iOS, Android, and Web
- **State Management:** Riverpod
- **HTTP Client:** Dio
- **Real-time:** socket_io_client (WebSocket + polling fallback)
- **Navigation:** GoRouter with auth guards
- **Storage:** flutter_secure_storage for tokens
- **Push Notifications:** Firebase Cloud Messaging
- **Error Tracking:** Sentry (`sentry_flutter`)
- **i18n:** flutter_localizations + intl (10 languages)

### Database & Infrastructure
- **Primary DB:** Supabase
- **Cache/Queue:** Redis 7+ via ioredis
- **Search (MVP):** PostgreSQL full-text search (tsvector + GIN index)
- **Search (Phase 2 upgrade):** Elasticsearch 8+
- **File Storage:** Cloudflare R2 (NOT AWS S3 — $0 egress, S3-compatible)
- **CDN:** Cloudflare
- **AI (MVP):** Google Gemini Flash-Lite (free 1K req/day, 20 req/hr rate limit)

### Third-Party Integrations
- **Payments:** Stripe Connect (escrow model, separate charges + transfers)
- **SMS:** Twilio (phone verification — deferred to Phase 2 to save costs)
- **Email:** Resend (transactional)
- **Push Notifications:** Firebase Cloud Messaging
- **Maps:** Google Maps API (Places, Geocoding, Distance Matrix)
- **Secrets:** Doppler (runtime env-var injection for backend; shared `dev` config across operators) — see below

### Secrets Management — Doppler

Doppler is the system of record for runtime secrets. The Doppler config is bound at the **repo root** (`doppler.yaml` → `path: .`), matching how `scripts/sorcyn` runs Doppler.

```sh
# One-time install (each dev machine)
brew install dopplerhq/cli/doppler         # macOS
# OR: curl -Ls https://cli.doppler.com/install.sh | sh

# One-time auth (per user)
doppler login

# First-machine setup (installs CLI if missing, logs in, binds repo, verifies secrets):
bash scripts/bootstrap-doppler.sh
# OR bind manually from the repo root (picks up doppler.yaml):
doppler setup

# Day-to-day: inject secrets at runtime instead of loading .env.
# `sorcyn dev` already wraps this. Raw equivalent (run from repo root):
doppler run -- bash -c 'cd backend && npm run dev'
doppler run -- bash -c 'cd backend && npm run test:run'

# Read / write secrets from CLI
doppler secrets                            # list
doppler secrets get STRIPE_SECRET_KEY      # show one
doppler secrets set STRIPE_SECRET_KEY=sk_test_...
```

`.env` files are still supported for local dev — the Zod schema in `backend/src/config/env.ts` reads from `process.env` whether sourced from Doppler or `.env`. `scripts/sorcyn` wraps `npm run dev` in `doppler run --` when Doppler is configured and falls back to `backend/.env` otherwise (`npm run doctor` / `check-prereqs.sh` validates the `backend/.env` path). Production must use Doppler — no `.env` files on the VPS nodes.

- Inventory of every secret (names only, no values): `docs/SECRETS_INVENTORY.md`
- Vendor decisions + the May 2026 audit: `docs/VENDOR_STACK_AUDIT_2026-05.md` (authoritative). **Note:** that audit *recommends* swaps that are not all implemented yet (the SendGrid → Resend swap has landed; others have not). Treat audit rows as recommendations, not completed work, unless the code confirms otherwise.
- Incident/on-call process + vendor status legend (LIVE / CODE-READY / PLANNED): `docs/RUNBOOK_OPS.md`

### Architecture

**Pattern:** Microservices-ready modular monolith

```
Flutter Apps (iOS/Android/Web)
    ↓
Cloudflare CDN + Nginx API Gateway
    ↓
Node.js API Server (TypeScript)
├── Auth Module
├── User Module
├── Seller Module
├── Category Module
├── Post Module (+ AI Assist)
├── Offer Module
├── Transaction Module
├── Payment Module (Stripe Connect)
├── Messaging Module (+ Socket.IO Gateway)
├── Review Module
├── Notification Module (BullMQ)
├── Search Module
├── Uploads Module (R2 presigned URLs)
├── Disputes Module
├── Payouts Module
├── Saved Searches Module
├── Saved Sellers Module
└── Admin Module
    ↓
Supabase (PostgreSQL) + Redis
```

### Cost Projections
- **Infrastructure:** $1,000-1,600/month at 10,000 users (without AI)
- **AI costs:** $85-112/month for Claude Haiku at 10,000 users; Gemini Flash-Lite free tier for MVP

## Development Status

- **Sessions completed:** 15 of 15 (ALL COMPLETE)
- **Tests:** 295+ passing across 22 test files + 18 curl-based API test scripts
- **Backend:** 18 API modules built and tested — auth, users, sellers, categories, posts (+ AI assist), offers, transactions, payments, messages (+ Socket.IO), reviews, notifications, search, uploads, disputes, payouts, saved-searches, saved-sellers, admin (19 route groups total)
- **Frontend:** Flutter app with 40 screens — full buyer + seller flows, real-time messaging (Socket.IO), push notifications (FCM), i18n (10 languages), crash reporting (Sentry), deep linking
- **Screens:** 51 total screens mapped, 40 built (see `docs/SCREEN_HIERARCHY.md`)
- **Infrastructure:** Docker multi-stage build, Nginx SSL reverse proxy, GitHub Actions CI/CD (test → build → push GHCR → deploy via SSH), Prometheus metrics, Sentry error tracking, database backup automation
- **Design:** Figma for design, Claude integration for screen generation
- **Post-v1.0 in flight (PR #78, 2026-05-24):** v2.2 business-accounts (User.isBusiness, sales-tax certificate verification, business-gated post creation — 478 backend tests, 59 mobile tests); v1.1-E4-01 (Help & Support routing); v1.1-E4-08 (iOS LSApplicationQueriesSchemes + canLaunchUrl fallback for contact buttons, verified on physical iPhone). See `BUILD_PROGRESS.md` "Post-v1.0 Iteration Log" section.

## Database Schema

16 Prisma models, 24 enums. Key tables:

- **users** — All users with account_type (buyer/seller/both), location, verification status
- **seller_profiles** — Business info, service_radius, categories, Stripe Connect ID, ratings
- **categories** — Hierarchical categories (40 seeded: Products 8 subs, Services 20 subs, Jobs 7 subs)
- **posts** — Buyer requests with budget, location, urgency, category-specific JSONB data
- **offers** — Seller submissions with price, timeline, status
- **transactions** — Payment tracking, escrow status via Stripe Connect
- **conversations / messages** — In-app messaging between users
- **reviews** — Post-transaction ratings with before/after photos
- **notifications** — Multi-channel delivery (in-app, email, push)
- **disputes** — Transaction disputes with evidence, appeals, resolution
- **payouts** — Seller payout tracking (auto-created on escrow release)
- **saved_searches** — Buyer saved search filters (max 25 per user)
- **saved_sellers** — Buyer saved/favorited sellers
- **audit_logs** — Admin action tracking

**Key patterns:** UUID primary keys, soft deletes (deleted_at), audit columns (created_by, updated_by), JSONB for flexible category data, `Unsupported("tsvector")` for PostgreSQL full-text search with GIN index + trigger.

## API Design

- **Base:** `/api/v1/`
- **Auth:** JWT Bearer tokens (15min access + 30d refresh, rotation with reuse detection)
- **Format:** REST/JSON
- **Errors:** RFC 7807 Problem Details format
- **Docs:** Swagger UI at `/docs`

Key endpoint groups:
- `/auth/*` — register, login, refresh, logout, verify-email, resend-verification, password-reset, password-reset-confirm
- `/users/*` — profile CRUD, avatar upload, preferences, location
- `/sellers/*` — profile CRUD, verification requests, stats
- `/categories/*` — list, tree, by-slug
- `/posts/*` — CRUD, extend, repost, archive, drafts, feed with sorting/filtering, geo radius search
- `/offers/*` — submit, accept, decline, withdraw, counter-offer
- `/saved-sellers/*` — save, unsave, list saved sellers
- `/transactions/*` — list, complete, upload photos, disputes
- `/payments/*` — intent, refund, seller onboarding, webhooks
- `/reviews/*` — submit, list by seller, list by post
- `/messages/*` — send, get conversation, list conversations
- `/notifications/*` — list, mark read, preferences
- `/uploads/*` — presigned URL generation, file deletion
- `/disputes/*` — create, list, detail, add evidence, appeal
- `/payouts/*` — list, summary, detail
- `/saved-searches/*` — CRUD (max 25 per user)
- `/admin/*` — user management, verification review, disputes, flagged content, audit logs, stats

**Rate limits:** 3/hr register, 10/min login, 1/5min resend verification, 20/hr AI post creation, 50/hr messages

## Payment Flow (Stripe Connect)

1. Seller completes Stripe Connect onboarding
2. Buyer accepts offer → Payment intent created (separate charges and transfers, `transfer_group` for escrow linkage)
3. Platform holds funds in escrow
4. Seller completes work → uploads after photos → Buyer confirms completion
5. Platform releases funds to seller (minus platform fees)
6. 7-day auto-release if buyer doesn't confirm
7. **Fee structure:** Services: buyer +5%, seller -8% + Stripe. Shipped: buyer +5%, seller -6% + Stripe. Local platform: buyer +3%, seller -3% + Stripe. Local cash: $0.
8. Jobs: Companies pay per lead ($10-500 depending on role level)
9. Milestone-based payments supported (no minimum threshold)

## Verification System (Badge-Based)

- **Base:** Email verified (serves as MFA in MVP), phone collected (SMS deferred to Phase 2)
- **"Licensed" badge:** License uploaded and verified against state databases
- **"Insured" badge:** Insurance certificate uploaded and verified
- **"ID Verified" badge:** Government ID verified
- **"Background Checked" badge:** Required ONLY for high-risk categories (childcare, pet care, in-home services)
- Non-verified sellers allowed but don't get badges

## Critical Design Patterns

These patterns cause bugs when violated — read before making changes:

- **sellerId is SellerProfile.id, NOT User.id** — every seller-side method resolves via `getSellerProfile()` helper
- **Prisma 7 driver adapter** — no `url` in schema.prisma datasource block, connection URL goes in `prisma.config.ts`, PrismaClient requires `@prisma/adapter-pg` with `PrismaPg`
- **Atomic transactions** — `prisma.$transaction([...])` array form for multi-step ops (offer acceptance), interactive `prisma.$transaction(async (tx) => {...})` for complex flows (reviews)
- **Redis key naming** — `auth:refresh:{userId}:{jti}`, `auth:blacklist:{jti}`, `msg:rate:{userId}`, `ai:rate:{userId}`
- **Graceful external service stubs** — `sendEmail()` and `sendPush()` never throw; log stubs in dev, fire-and-forget in production
- **Role-based access** — `app.authenticate` decorator, `app.requireAdmin` decorator, seller profile resolution via userId
- **Lazy SDK init** — Stripe, Gemini, and Sentry initialized on first call, not on import (prevents test crashes)
- **Zod 4 records** — `z.record(z.string(), z.any())` requires two args (not one)
- **Prisma JSON null** — use `Prisma.JsonNull` for nullable JSON columns, not `null`
- **Route ordering** — static routes before parameterized routes in Fastify (`/me` before `/:id`)
- **Forward-compatible-only migrations during canary** — Every Prisma migration must be additive (nullable columns, new tables). No DROP / RENAME / SET NOT NULL on existing columns. Destructive changes ship in a follow-up release after the prior version drains. See `DEC-forward-compatible-migrations` in `.planning/intel/decisions.md`. CI-enforced via `backend/tests/audit/closeout-audit.test.ts`.
- **Seed data** — 4 test accounts (buyer@test.com, seller@test.com, both@test.com, admin@reversemarketplace.com), 40 categories
- **iOS native intent launches** — every `url_launcher` call to a native iOS app (Mail, Phone, SMS) must (a) have its scheme listed in `mobile/ios/Runner/Info.plist` under `LSApplicationQueriesSchemes`, and (b) be gated by `canLaunchUrl(uri)` with a snackbar fallback when false — otherwise iOS 9+ silently no-ops. Reference helper: `_launchExternal` in `mobile/lib/features/settings/presentation/screens/help_support_screen.dart`. See v1.1-E4-08 for context.
- **Backend CI npm pin** — CI installs with npm 10 (node 20). Local dev usually runs npm 11+. When `backend/package-lock.json` changes, regenerate with `npx -p npm@10 -y npm install --package-lock-only` from `backend/` to avoid `npm ci` strictness drift.
- **API contract artifact** — `contracts/openapi.json` is the committed source of truth for the HTTP API (the backend↔Flutter seam). Whenever you change a route, Zod schema, or response shape, regenerate it in the SAME PR: `cd backend && npm run contract:generate`. CI job `contract-drift` (`npm run contract:check`) fails any PR where the committed contract no longer matches the live routes. See `contracts/README.md`.
- **Realtime work-claim sync** — `.claude/settings.json` wires hooks (`scripts/devsync/claim.mjs`) that auto-register what each operator's AI agent is editing into the shared Supabase and check for collisions before every edit. As of 2026-06-15 the backend/mobile layer split is retired — both operators own the full stack, so out-of-lane warnings are disabled (`isOutOfLane` in `scripts/devsync/lanes.mjs` is a no-op) and same-file collision-blocking is the active safety net. Ownership model: `.planning/WORK_SPLIT.md`. It FAILS OPEN (never blocks coding if the store is down). `node scripts/devsync/claim.mjs list` shows live claims. See `docs/REALTIME_SYNC.md`. `SYNC_DATABASE_URL` points at shared Supabase, NOT the local dev DB.

## Project Structure

```
/backend/src/
├── app.ts              # Fastify app builder (plugins, routes)
├── server.ts           # Entry point (start, graceful shutdown)
├── config/             # env.ts (Zod-validated), database.ts (Prisma), redis.ts
├── common/
│   ├── middleware/      # error-handler.ts, authenticate.ts
│   ├── types/          # api.ts (ApiResponse, ApiError, PaginationMeta)
│   └── utils/          # errors.ts (AppError classes), storage.ts, email.ts, fees.ts
└── modules/
    ├── auth/           # routes, service, schemas
    ├── users/
    ├── sellers/
    ├── categories/
    ├── posts/          # includes ai-assist service/schemas
    ├── offers/
    ├── transactions/
    ├── payments/       # includes webhook handler
    ├── messages/       # includes Socket.IO gateway
    ├── reviews/
    ├── notifications/
    ├── search/
    ├── uploads/
    ├── disputes/
    ├── payouts/
    ├── saved-searches/
    ├── saved-sellers/
    └── admin/
```

Each module follows the pattern: `{name}.routes.ts`, `{name}.service.ts`, `{name}.schemas.ts`

## Development Phases

1. **Phase 1 (MVP) — BUILT:** Products + Services + Jobs in DFW, AI-assisted posts, escrow, before/after photos, real-time messaging (Socket.IO), push notifications (FCM), i18n (10 languages), Docker + Nginx + CI/CD production stack
2. **Phase 2:** Advanced search (Elasticsearch upgrade), OAuth, shipping integration, SMS verification (Twilio), B2B/wholesale
3. **Phase 3:** Geographic expansion (Houston, Austin, San Antonio), real estate (lead gen), financing options, enterprise features

## Key Constraints

- **AI costs:** Must stay manageable — $85-112/month for Claude Haiku at 10,000 users. Gemini Flash-Lite free tier for MVP.
- **Local free:** Local transactions must remain free to compete with Facebook Marketplace and OfferUp
- **Geographic rollout:** DFW-local first → Texas-wide → National
- **Year 1 target:** 2,500 users (1,500 buyers, 1,000 sellers)
- **Infrastructure budget:** $1,000-1,600/month at 10,000 users

## Build Workflow

All 15 build sessions are complete. `BUILD_PROGRESS.md` contains detailed session-by-session implementation notes and design patterns. `BUILD_INSTRUCTIONS.md` has the original session plan for reference.

## Documentation Reference

### Technical Docs
| File | Description |
|------|-------------|
| `docs/README.md` | Project overview and quick-start guide |
| `docs/architecture.md` | System design: modular monolith, module organization, Flutter structure |
| `docs/database.md` | Prisma schema reference (16 models, 24 enums, UUIDs, soft deletes, JSONB, full-text search) |
| `docs/DATABASE_CONFIG.md` | Authoritative DB wiring: dev/test/seed connection paths, fresh-clone setup, test isolation guarantee, seed-account/login troubleshooting |
| `docs/OPERATOR_SYNC.md` | Operator sync playbook (Faisal & Mohamed): branching, env/secrets, migrations workflow, before-you-start checklist |
| `docs/api.md` | REST API reference — all endpoints with request/response examples |
| `docs/setup.md` | Local dev setup: Docker, env vars, Prisma workflow, Flutter config |
| `docs/decisions.md` | Technical decision rationale across all build sessions |
| `docs/prisma-7-patterns.md` | Prisma 7 migration guide and breaking changes from Prisma 6 |
| `docs/API_TESTING_GUIDE.md` | Swagger UI testing walkthrough with test accounts and category slugs |
| `docs/SCREEN_HIERARCHY.md` | Mobile UI screen map — 51 screens (40 built), navigation, components |
| `docs/DEPLOYMENT.md` | Production deployment guide — VPS, SSL, CI/CD, monitoring, rollback |
| `docs/FCM_SETUP.md` | Firebase Cloud Messaging setup guide for push notifications |

### Meeting Notes & Product Discussions
| File | Description |
|------|-------------|
| `docs/Reverse Marketplace App Idea Feb 6th.md` | Initial concept brainstorm — core flow, categories, competitive analysis, AI differentiation |
| `docs/Reverse Marketplace Feb 8th.md` | Payment and transaction flow refinement — escrow, before/after photos, fee structure |
| `docs/Reverse Marketplace PRD Review Feb 11th.md` | PRD requirements review — fee necessity, monetization strategy, growth approach |
| `docs/Reverse Marketplace Session Feb 11th.md` | Extended planning session — detailed implementation notes |
| `docs/Reverse Marketplace Session 1 Feb 11th.md` | Session 1 implementation — foundation decisions and build kickoff |
| `docs/Reverse Marketplace Session 2 Feb 12th.md` | Promotion mechanics deep dive — visibility tiers, lead caps, renewal model |
| `docs/Reverse Marketplace Session 3 April 14th.md` | Latest session (April 14th) — resume planning, mobile design phase |

### Other Key Files
| File | Description |
|------|-------------|
| `ReverseMktplPRD.md` | Full PRD (14,500+ lines) — complete spec with schemas, APIs, user stories |
| `BUILD_PROGRESS.md` | Current build status — session completion, test counts, patterns learned |
| `BUILD_INSTRUCTIONS.md` | Session-by-session build plan (15 sessions total) |

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **ReverseMarketplace** (34422 symbols, 1055988 relationships, 218 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/ReverseMarketplace/context` | Codebase overview, check index freshness |
| `gitnexus://repo/ReverseMarketplace/clusters` | All functional areas |
| `gitnexus://repo/ReverseMarketplace/processes` | All execution flows |
| `gitnexus://repo/ReverseMarketplace/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
