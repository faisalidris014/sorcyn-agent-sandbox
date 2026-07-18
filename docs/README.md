# Reverse Marketplace

A marketplace where **buyers post their needs** and **sellers compete to fulfill them** — the reverse of traditional marketplaces.

**MVP Scope:** Three categories (Products, Services, Jobs) in DFW Metroplex (Dallas-Fort Worth), targeting Q3 2026 launch.

## Core Flow

1. Buyer posts a request (AI-assisted)
2. Sellers submit competing offers
3. Buyer accepts an offer
4. Payment held in escrow (Stripe Connect)
5. Work completed with before/after photos
6. Funds released to seller + review submitted

## Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js 20+ LTS, TypeScript 5+ (ESM) |
| **Framework** | Fastify 5 |
| **ORM** | Prisma 7 (with `@prisma/adapter-pg` driver adapter) |
| **Validation** | Zod 4 |
| **Database** | PostgreSQL 15+ |
| **Cache/Queue** | Redis 7+ (ioredis + BullMQ) |
| **Payments** | Stripe Connect (destination charges, escrow) |
| **File Storage** | Cloudflare R2 (S3-compatible, $0 egress) |
| **AI (MVP)** | Google Gemini Flash-Lite |
| **Email** | SendGrid |
| **Push** | Firebase Cloud Messaging |
| **Maps** | Google Maps API |
| **Real-time** | Socket.IO 4 (WebSocket + polling fallback) |
| **Frontend** | Flutter 3.16+ (Dart 3.2+), Riverpod, Dio, Socket.IO client |
| **i18n** | flutter_localizations + intl (10 languages) |
| **Error Tracking** | Sentry (`@sentry/node` + `sentry_flutter`) |
| **Compression** | `@fastify/compress` (threshold 1KB) |
| **Testing** | Vitest + Supertest + curl-based API test scripts |
| **Container** | Docker (multi-stage production build) |
| **CI/CD** | GitHub Actions (typecheck, test, Docker build) |
| **API Docs** | Swagger UI (`@fastify/swagger`) |

## Quick Start

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Install dependencies
cd backend && npm install

# 3. Copy environment file
cp .env.example .env
# Edit .env with your values (DATABASE_URL uses port 5433)

# 4. Generate Prisma client
npx prisma generate

# 5. Run migrations
npx prisma migrate dev

# 6. Seed the database
npx prisma db seed

# 7. Start dev server
npm run dev
# Server: http://localhost:3000
# Swagger: http://localhost:3000/docs
```

### Flutter Mobile App

```bash
# 1. Install Flutter dependencies
cd mobile && flutter pub get

# 2. Generate JSON serialization code
dart run build_runner build --delete-conflicting-outputs

# 3. Run on web (for quick testing)
flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:3000/api/v1

# 4. Run on iOS simulator
flutter run -d ios

# 5. Run on Android emulator
flutter run -d android

# 5b. Run on a PHYSICAL iOS device (sim uses Mac localhost; device cannot)
MAC_IP=$(ipconfig getifaddr en0)
flutter run -d <device-udid> --dart-define=API_BASE_URL=http://${MAC_IP}:3000/api/v1
# `flutter devices` lists UDIDs. Use UDID not name (apostrophe quoting).

# 6. Build for web
flutter build web

# 7. Analyze code
flutter analyze
```

See [setup.md](setup.md) for detailed instructions.

## Build Progress

**Current Status:** All 15 sessions complete. 295+ backend tests across 22 test files, 18 API modules (19 route groups), 40 Flutter screens built (of 51 mapped). Production-ready with Docker, Nginx, CI/CD, Sentry, Prometheus metrics.

| Session | Status | Scope |
|---|---|---|
| 1 - Foundation & Schema | Complete | Project scaffold, Prisma schema (15 models), Docker, config, seed |
| 2 - Auth Module | Complete | Register, login, refresh, logout, email verify, password reset (30 tests) |
| 3 - User & Seller Profiles | Complete | User CRUD, seller profiles, verification badges, R2 storage utility (31 tests) |
| 4 - Posts & Categories | Complete | Categories tree, post CRUD, feed, full-text search (32 tests) |
| 5 - Offers & Transactions | Complete | Offers CRUD, accept/withdraw, fee calculation, transaction lifecycle, Best Match (41 tests) |
| 6 - Payments (Stripe) | Complete | Stripe Connect, PaymentIntent, escrow, webhooks, seller onboarding (18 tests) |
| 7 - Messaging & Reviews | Complete | Conversations, reviews, notifications, BullMQ workers, SendGrid, FCM (42 tests) |
| 8 - AI Post Creation | Complete | Gemini integration, NL-to-post, image suggestions, job profile generation (13 tests) |
| 9 - Admin Module | Complete | Admin dashboard, user management, verification review, disputes, moderation, audit logs (26 tests) |
| 10 - Flutter App Scaffold | Complete | Flutter project, auth screens, Dio client, Riverpod, GoRouter, theme |
| 11 - Flutter Buyer Screens | Complete | Dashboard, post CRUD, AI creation, offers, transactions, navigation shell |
| 12 - Flutter Seller Screens | Complete | Seller profile, feed, offer submission, transaction management, mode toggle |
| 13 - Real-time Messaging & i18n | Complete | Socket.IO backend + Flutter client, real-time chat UI, i18n (10 languages), API test scripts |
| Post-13 - Backend Hardening | Complete | Scheduled jobs (BullMQ sweeps), Docker production build, CI/CD pipeline, request-id tracing |
| Post-13 - Backend Gaps | Complete | Uploads (2 endpoints), Disputes (5), Payouts (3), Saved Searches (4), Stripe webhooks (+4 events), geocoding utility (43 new tests) |
| 14 - Polish & Production Prep | Complete | Sentry crash reporting, FCM push notifications, compression, notifications screen, edit profile, submit review, settings, deep links, app store config |
| 15 - Production Deployment | Not started | Production deployment, monitoring, app store submission (Docker/CI already done) |

## Documentation

- [Architecture](architecture.md) — System design, module structure, data flow
- [Database](database.md) — Schema, tables, enums, relationships, Redis keys
- [Database Config](DATABASE_CONFIG.md) — DB wiring (dev/test/seed), fresh-clone setup, test isolation, seed-account troubleshooting
- [Operator Sync](OPERATOR_SYNC.md) — How Faisal & Mohamed stay in sync (env, branching, migrations)
- [API](api.md) — All REST endpoints + WebSocket events documented
- [API Testing Guide](API_TESTING_GUIDE.md) — Step-by-step Swagger UI testing walkthrough
- [Testing](TESTING.md) — Testing guide, patterns, and per-file breakdown (Vitest + API scripts)
- [Setup](setup.md) — Local development setup guide
- [Prisma 7 Patterns](prisma-7-patterns.md) — Prisma 7 driver adapter patterns
- [Decisions](decisions.md) — Key technical decisions and rationale (Sessions 1-14)
- [Screen Hierarchy](SCREEN_HIERARCHY.md) — Complete screen map (43 screens, 33 built)
- [FCM Setup](FCM_SETUP.md) — Firebase Cloud Messaging setup guide
