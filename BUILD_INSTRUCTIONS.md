# Build Instructions — Reverse Marketplace

> These files guide Claude Code through building the app session-by-session.
> After compacting context, say: "Continue building from BUILD_PROGRESS.md"

## Confirmed Tech Decisions

| Decision | Choice |
|---|---|
| Backend Framework | **Fastify** (not Express) |
| Language | TypeScript 5+ (ESM modules) |
| ORM | Prisma |
| Validation | Zod |
| Database | PostgreSQL 15+ (Neon free tier for dev) |
| Cache/Queue | Redis 7+ via ioredis + BullMQ |
| File Storage | **Cloudflare R2** (not AWS S3) — S3-compatible SDK |
| AI Provider (MVP) | **Google Gemini Flash-Lite** (free 1K req/day) |
| Testing | Vitest + Supertest |
| Email | SendGrid |
| Push Notifications | Firebase Cloud Messaging |
| Payments | Stripe Connect (destination charges, escrow) |
| Maps | Google Maps API |
| Frontend | Flutter 3.16+ (Dart 3.2+), Riverpod, Dio |
| CI/CD | GitHub Actions |
| API Docs | Swagger UI (@fastify/swagger) |
| Error Format | RFC 7807 Problem Details |
| Auth | JWT (access 15min + refresh 30d), bcrypt 12+ rounds |

## Build Order (Sessions)

### Session 1: Prisma Schema ← CURRENT
- Create full `backend/prisma/schema.prisma` from PRD database spec
- Create `backend/prisma/seed.ts` with categories + test users
- Run `npx prisma generate` to verify schema compiles
- Run `npx prisma migrate dev --name init` (requires Docker postgres running)

### Session 2: Auth Module
- `backend/src/modules/auth/auth.routes.ts` — register, login, refresh, logout, verify-email, forgot-password, reset-password
- `backend/src/modules/auth/auth.service.ts` — business logic
- `backend/src/modules/auth/auth.schemas.ts` — Zod validation schemas
- `backend/src/common/middleware/authenticate.ts` — JWT verify middleware
- Register auth routes in `app.ts`
- Write tests in `backend/tests/auth.test.ts`

### Session 3: User & Seller Profile Modules
- `backend/src/modules/users/` — CRUD, get me, update profile, delete account
- `backend/src/modules/sellers/` — create/update seller profile, get seller, verification badge logic
- File upload utility for Cloudflare R2 (`backend/src/common/utils/storage.ts`)
- Register routes in `app.ts`

### Session 4: Post & Category Modules
- `backend/src/modules/categories/` — list categories, get by slug
- `backend/src/modules/posts/` — CRUD, drafts, extend, repost, search (PostgreSQL full-text)
- `backend/src/modules/search/` — search posts by category, location, text
- Register routes in `app.ts`

### Session 5: Offer & Transaction Modules
- `backend/src/modules/offers/` — submit, edit, withdraw, accept/decline
- `backend/src/modules/transactions/` — status tracking, before/after photos, complete, approve
- Best Match algorithm (rating 40%, price 30%, distance 15%, response time 10%, completion rate 5%)
- Register routes in `app.ts`

### Session 6: Stripe Connect & Payments
- `backend/src/modules/payments/` — payment intent, refund, seller onboarding, seller status
- `backend/src/config/stripe.ts` — Stripe client setup
- Webhook handler for Stripe events
- Escrow flow: hold → release → refund logic
- Fee calculation (services 5%/8%, shipped 5%/8%, local platform 3%/5%, local cash 0%)

### Session 7: Messaging, Reviews, Notifications
- `backend/src/modules/messages/` — send, list conversations, get conversation (HTTP polling)
- `backend/src/modules/reviews/` — submit, list by seller, auto-review job (BullMQ)
- `backend/src/modules/notifications/` — push (FCM), email (SendGrid), in-app
- `backend/src/common/utils/email.ts` — SendGrid helper
- `backend/src/common/utils/push.ts` — FCM helper

### Session 8: AI Post Creation
- `backend/src/modules/posts/ai-assist.service.ts` — Gemini Flash-Lite integration
- Natural language → structured post (title, description, category, budget, timeline)
- AI product image pull for product requests
- AI job seeker/employer profile generation

### Session 9: Admin Module & Testing
- `backend/src/modules/admin/` — transaction monitoring, dispute management, user management
- Write comprehensive tests for all modules
- Target 70% coverage

### Session 10: Flutter App Scaffold
- Create Flutter project in `mobile/`
- Core: theme (purple/white), routing (go_router), Riverpod setup, Dio API client
- Auth screens: login, register, email verification, forgot password

### Session 11-14: Flutter Feature Screens
- Buyer: post creation, AI-assisted flow, browse offers, accept, track transaction
- Seller: profile setup, browse posts, submit offer, complete work, upload photos
- Shared: messaging, reviews, notifications, settings, account management

### Session 15: Polish & Deploy
- Docker production build
- GitHub Actions CI/CD pipeline
- Security hardening checklist
- E2E tests with Playwright
