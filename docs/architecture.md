# Architecture

## Pattern: Microservices-Ready Modular Monolith

The backend is structured as a modular monolith — all services run in a single process but are organized into independent modules that can be extracted into microservices later.

```
Flutter Apps (iOS / Android / Web)
    |
    |-- REST API (Dio)          WebSocket (Socket.IO)
    |          \                     /
Cloudflare CDN + Nginx API Gateway
    |
Node.js API Server (Fastify 5, TypeScript)
|-- Socket.IO Server (real-time WebSocket layer, Session 13)
|-- Auth Module
|-- User Module
|-- Seller Module
|-- Category Module
|-- Post Module
|-- Offer Module
|-- Transaction Module
|-- Payment Module (Stripe Connect)
|-- Messaging Module (REST + Socket.IO)
|-- Review Module
|-- Notification Module
|-- Search Module
|-- Admin Module
    |
PostgreSQL 15 + Redis 7
```

## Flutter Mobile App Architecture (Sessions 10-12)

### State Management: Riverpod

```
User Interaction → Screen (ConsumerStatefulWidget)
    |
    v
Provider (StateNotifier / FutureProvider)
    |-- Manages state (loading, data, error, pagination)
    |-- Calls Repository methods (REST)
    |-- Subscribes to SocketClient streams (real-time, Session 13)
    |
    v
Repository (DioClient)              SocketClient (Singleton, Session 13)
    |-- HTTP calls to backend         |-- Connects with JWT auth
    |-- Returns typed models          |-- Broadcasts events via StreamControllers
    |                                 |-- Auto-reconnect, heartbeat
    v                                 v
DioClient (interceptors)           Socket.IO Server (WebSocket)
    |-- AuthInterceptor               |-- JWT middleware (same secret)
    |-- LoggingInterceptor            |-- Room-based messaging
    |                                 |-- Presence tracking (Redis)
    v                                 v
Backend API (/api/v1/*)            Backend Socket.IO (port 3000)
```

### Navigation: GoRouter with Auth Guards

```
GoRouter
├── Auth redirect: unauthenticated → /login, needsVerification → /verify-email
├── StatefulShellRoute.indexedStack (preserves tab state)
│   ├── Branch 0: Dashboard (buyer) / Feed (seller)  ← mode-aware
│   ├── Branch 1: My Posts (buyer) / My Offers (seller)  ← mode-aware
│   ├── Branch 2: Messages (placeholder)
│   └── Branch 3: Profile
└── Standalone routes (above bottom nav):
    ├── /posts/create, /posts/create/ai, /posts/create/manual
    ├── /posts/:postId, /posts/:postId/offers, /offers/:offerId
    ├── /transactions, /transactions/:transactionId
    ├── /seller/setup, /seller/profile, /seller/verification, /seller/stripe
    └── /seller/offers/submit/:postId, /seller/transactions/:transactionId
```

### Buyer/Seller Mode Toggle

The app supports a buyer/seller mode toggle (persisted to SecureStorage):

```
AppModeProvider (StateNotifier<AppMode>)
    |
    v
BottomNavShell watches mode:
    |-- Buyer: Home | My Posts | Messages | Profile + FAB
    |-- Seller: Feed | My Offers | Messages | Profile (no FAB)
    |
GoRoute builders use Consumer to switch screens per mode
```

### Flutter Project Structure

```
mobile/lib/
├── main.dart                          # Entry point (ProviderScope → App)
├── app.dart                           # GoRouter + StatefulShellRoute + auth guards + i18n delegates
├── core/
│   ├── config/                        (env_config, app_config)
│   ├── providers/                     (app_mode_provider, socket_provider, locale_provider)
│   ├── theme/                         (app_colors, app_theme)
│   ├── network/                       (api_response, dio_client, socket_client)
│   ├── storage/                       (secure_storage)
│   └── utils/                         (validators, formatters, l10n_extension)
├── l10n/                              # Localization (10 .arb files + generated code)
├── features/
│   ├── auth/                          # 5 screens, 3 widgets, models, repo, provider
│   │   ├── data/models/               (user_model + .g.dart)
│   │   ├── data/repositories/         (auth_repository)
│   │   ├── providers/                 (auth_provider: AuthState + AuthNotifier)
│   │   └── presentation/             (login, register, verify_email, forgot_password, reset_password)
│   ├── categories/                    # Model, repo, provider (FutureProvider, cached)
│   ├── posts/                         # 7 screens, post_card widget
│   │   ├── data/                      (post_model, post_repository)
│   │   ├── providers/                 (PostsNotifier + postDetailProvider)
│   │   └── presentation/             (dashboard, create_method, ai_creation, manual_creation, post_created, my_posts, post_detail)
│   ├── feed/                          # Seller feed with filters
│   │   ├── data/repositories/         (feed_repository)
│   │   ├── providers/                 (FeedNotifier with pagination + filters)
│   │   └── presentation/             (seller_feed_screen)
│   ├── offers/                        # 4 screens, offer_card widget
│   │   ├── data/                      (offer_model + CreateOfferInput, offer_repository)
│   │   ├── providers/                 (OffersNotifier, MyOffersNotifier)
│   │   └── presentation/             (post_offers, offer_detail, submit_offer, my_offers)
│   ├── transactions/                  # 3 screens, transaction_card widget
│   │   ├── data/                      (transaction_model, transaction_repository)
│   │   ├── providers/                 (TransactionsNotifier + transactionDetailProvider)
│   │   └── presentation/             (transactions, transaction_detail, seller_transaction_detail)
│   ├── sellers/                       # 4 screens
│   │   ├── data/                      (seller_profile_model, seller_repository)
│   │   ├── providers/                 (SellerProfileNotifier)
│   │   └── presentation/             (seller_profile_setup, seller_profile, verification, stripe_onboard)
│   ├── messages/                      # 2 screens, 3 widgets, models, repo, 2 providers (Session 13)
│   │   ├── data/models/               (conversation_model + .g.dart, message_model + .g.dart)
│   │   ├── data/repositories/         (message_repository)
│   │   ├── providers/                 (conversations_provider, chat_provider)
│   │   └── presentation/
│   │       ├── screens/               (conversations_screen, chat_screen)
│   │       └── widgets/               (conversation_tile, message_bubble, message_input_bar)
│   ├── settings/                      # Language settings (Session 13)
│   │   └── presentation/screens/      (language_settings_screen)
│   └── profile/presentation/          (profile_screen with mode toggle + logout)
└── shared/widgets/                    (loading_overlay, app_logo, bottom_nav_shell, status_badge, empty_state, confirmation_dialog, category_picker, marketplace_context_selector)
```

## Project Structure

```
/
├── docker-compose.yml                 # Dev: PostgreSQL 15 (port 5433) + Redis 7
├── docker-compose.production.yml      # Prod: PostgreSQL 15 + Redis 7 + API service
├── .github/
│   └── workflows/
│       └── ci.yml                     # CI: typecheck, test (DB + Redis), Docker build
├── backend/
│   ├── Dockerfile                     # Multi-stage production build (deps → build → runner)
│   ├── .dockerignore                  # Excludes tests, scripts, source TS from image
│   ├── prisma/
│   │   ├── schema.prisma              # 15 models, 20+ enums
│   │   ├── seed.ts                    # 38 categories + 4 test users
│   │   ├── custom-migrations/
│   │   │   └── 001_search_vector_trigger.sql
│   │   └── migrations/
│   │       ├── 20260215085853_init/
│   │       └── 20260219180140_add_is_admin/
│   ├── src/
│   │   ├── server.ts                  # Entry point, graceful shutdown
│   │   ├── app.ts                     # Fastify app builder (plugins, routes)
│   │   ├── config/
│   │   │   ├── env.ts                 # Zod-validated environment variables
│   │   │   ├── database.ts            # PrismaClient with PrismaPg adapter
│   │   │   ├── redis.ts               # ioredis client
│   │   │   ├── socket.ts             # Socket.IO server + JWT auth + presence helpers (Session 13)
│   │   │   ├── stripe.ts              # Stripe SDK (lazy init) + webhook signature verify
│   │   │   ├── bullmq.ts             # BullMQ queues (5 total) + workers + scheduled job registration
│   │   │   └── gemini.ts            # Google Gemini AI client (lazy init)
│   │   ├── common/
│   │   │   ├── types/
│   │   │   │   └── api.ts             # ApiResponse, ApiError, PaginationMeta
│   │   │   ├── utils/
│   │   │   │   ├── errors.ts          # AppError class hierarchy
│   │   │   │   ├── storage.ts         # Cloudflare R2 file upload (S3-compatible)
│   │   │   │   ├── fees.ts            # Fee calculation utility (per transaction type)
│   │   │   │   ├── email.ts           # SendGrid email helper (graceful stub in dev)
│   │   │   │   └── push.ts            # FCM push notification helper (graceful stub in dev)
│   │   │   └── middleware/
│   │   │       ├── error-handler.ts   # Global Fastify error handler (includes requestId)
│   │   │       ├── authenticate.ts    # JWT verify decorator + Redis blacklist
│   │   │       └── request-id.ts      # x-request-id header tracing (UUID generation)
│   │   └── modules/
│   │       ├── auth/
│   │       │   ├── auth.routes.ts     # 8 auth endpoints with rate limits
│   │       │   ├── auth.service.ts    # Auth business logic (register, login, etc.)
│   │       │   └── auth.schemas.ts    # Zod validation + response types
│   │       ├── users/
│   │       │   ├── users.routes.ts    # 8 user endpoints (me, profile, account)
│   │       │   ├── users.service.ts   # User CRUD, password change, soft delete
│   │       │   └── users.schemas.ts   # Zod schemas + UserProfile/PublicUserProfile types
│   │       ├── sellers/
│   │       │   ├── sellers.routes.ts  # 7 seller endpoints (profile, verification)
│   │       │   ├── sellers.service.ts # Seller CRUD, verification, profile strength
│   │       │   └── sellers.schemas.ts # Zod schemas + SellerProfileResponse types
│   │       ├── categories/
│   │       │   ├── categories.routes.ts  # 3 category endpoints (list, tree, by slug)
│   │       │   ├── categories.service.ts # Category listing, tree, slug lookup
│   │       │   └── categories.schemas.ts # Zod schemas + CategoryResponse types
│   │       ├── posts/
│   │       │   ├── posts.routes.ts    # 13 post endpoints (CRUD, feed, search, extend, repost, AI)
│   │       │   ├── posts.service.ts   # Post CRUD, feed, full-text search, extension, repost
│   │       │   ├── posts.schemas.ts   # Zod schemas + CreatePostInput, FeedQuery types
│   │       │   ├── ai-assist.service.ts # AI post creation (Gemini), image suggestions, job profiles
│   │       │   └── ai-assist.schemas.ts # Zod schemas for AI request/response validation
│   │       ├── offers/
│   │       │   ├── offers.routes.ts   # 7 offer endpoints (submit, edit, withdraw, accept)
│   │       │   ├── offers.service.ts  # Offer CRUD, Best Match algorithm, fee preview
│   │       │   └── offers.schemas.ts  # Zod schemas + CreateOfferInput types
│   │       ├── transactions/
│   │       │   ├── transactions.routes.ts  # 7 transaction endpoints (status, complete, approve)
│   │       │   ├── transactions.service.ts # Transaction lifecycle, escrow, timeline tracking
│   │       │   └── transactions.schemas.ts # Zod schemas + status/action types
│   │       ├── payments/
│   │       │   ├── payments.routes.ts   # 4 payment endpoints (intent, refund, onboard, status)
│   │       │   ├── payments.service.ts  # Stripe Connect, escrow, refunds, webhook handling
│   │       │   ├── payments.schemas.ts  # Zod schemas for payment requests
│   │       │   └── payments.webhook.ts  # Stripe webhook plugin (raw body, signature verify)
│   │       ├── messages/
│   │       │   ├── messages.routes.ts   # 5 messaging endpoints (conversations, send, read, report)
│   │       │   ├── messages.service.ts  # Conversation listing, messaging, rate limiting, moderation + Socket.IO emit
│   │       │   ├── messages.gateway.ts  # Socket.IO event handlers (join, typing, heartbeat) (Session 13)
│   │       │   └── messages.schemas.ts  # Zod schemas for messages
│   │       ├── reviews/
│   │       │   ├── reviews.routes.ts    # 3 review endpoints (submit, list, report)
│   │       │   ├── reviews.service.ts   # Review submission, rating badges, auto-review (BullMQ)
│   │       │   └── reviews.schemas.ts   # Zod schemas for reviews
│   │       ├── notifications/
│   │       │   ├── notifications.routes.ts  # 4 notification endpoints (list, read, delete)
│   │       │   ├── notifications.service.ts # Create, deliver (BullMQ), list, mark read
│   │       │   └── notifications.schemas.ts # Zod schemas for notifications
│   │       ├── search/
│   │       │   ├── search.routes.ts   # 1 endpoint (delegates to PostsService)
│   │       │   └── search.schemas.ts  # Re-exports from posts module
│   │       └── admin/
│   │           ├── admin.routes.ts    # 17 admin endpoints (all require admin auth)
│   │           ├── admin.service.ts   # User mgmt, verification, disputes, moderation, audit
│   │           └── admin.schemas.ts   # Zod schemas for all admin operations
│   ├── tests/
│   │   ├── auth.test.ts               # 30 auth tests (Vitest + Supertest)
│   │   ├── users.test.ts              # 17 user tests
│   │   ├── sellers.test.ts            # 14 seller tests
│   │   ├── categories.test.ts         # 8 category tests
│   │   ├── posts.test.ts              # 24 post tests
│   │   ├── offers.test.ts             # 21 offer tests
│   │   ├── transactions.test.ts       # 20 transaction tests
│   │   ├── payments.test.ts           # 18 payment tests (Stripe SDK mocked)
│   │   ├── notifications.test.ts      # 12 notification tests
│   │   ├── messages.test.ts           # 16 message tests
│   │   ├── reviews.test.ts            # 14 review tests
│   │   ├── ai-assist.test.ts          # 13 AI assist tests (Gemini SDK mocked)
│   │   ├── admin.test.ts              # 26 admin tests
│   │   ├── socket.test.ts            # Socket.IO integration tests (Session 13)
│   │   └── helpers.ts                 # Shared test utilities (createTestUser, makeAdmin)
│   ├── prisma.config.ts               # Prisma 7 config (datasource URL, seed)
│   ├── tsconfig.json                  # ESM, strict, path aliases
│   ├── tsconfig.build.json            # Build config (excludes seed.ts)
│   ├── vitest.config.ts               # Test config with coverage
│   └── package.json
├── mobile/
│   ├── lib/                           # Flutter app source (see Flutter section above)
│   ├── pubspec.yaml                   # Flutter dependencies
│   ├── ios/                           # iOS platform files
│   ├── android/                       # Android platform files
│   └── web/                           # Web platform files
├── docker-compose.yml                 # PostgreSQL 15 (port 5433) + Redis 7
├── CLAUDE.md                          # AI assistant instructions
├── BUILD_INSTRUCTIONS.md              # 15-session build plan
└── BUILD_PROGRESS.md                  # Current build status
```

## Module Pattern

Each module (when built) follows:

```
modules/{name}/
├── {name}.routes.ts    # Fastify route definitions (prefix: /api/v1/{name})
├── {name}.service.ts   # Business logic (Prisma queries, validation)
└── {name}.schemas.ts   # Zod schemas for request/response validation
```

Routes are registered in `app.ts`:

```typescript
await app.register(authRoutes, { prefix: '/api/v1/auth' });
```

## Request/Response Flow

```
Client Request
    |
    v
Fastify Plugins (helmet, cors, rate-limit)
    |
    v
Request ID Middleware (x-request-id)
    |-- Reads x-request-id from request header (or generates UUID v4)
    |-- Sets request.requestId for downstream use
    |-- Echoes x-request-id in response header
    |
    v
JWT Authentication (@fastify/jwt)
    |
    v
Route Handler (validates with Zod schema)
    |
    v
Service Layer (business logic, Prisma queries)
    |
    v
Prisma ORM --> PostgreSQL
    |
    v
ApiResponse<T> envelope --> Client
```

## Error Handling

All errors flow through a centralized error handler (`error-handler.ts`) that produces RFC 7807 Problem Details responses:

```json
{
  "success": false,
  "error": {
    "type": "about:blank",
    "title": "NotFoundError",
    "status": 404,
    "detail": "Post with id 'abc' not found",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

Error responses for `AppError` and 500 errors include `requestId` for end-to-end request tracing.

Error classes:
- `AppError` — base class (any status code)
- `NotFoundError` — 404
- `UnauthorizedError` — 401
- `ForbiddenError` — 403
- `ValidationError` — 400 (with field-level errors)
- `ConflictError` — 409

Zod validation errors are automatically converted to the same format with per-field error arrays.

**Sentry Integration (Session 14):** Unknown 500-level errors are reported to Sentry via `captureException()` with context (requestId, method, url, userId). BullMQ worker errors are also captured with worker name tags. Sentry is initialized lazily — graceful no-op when `SENTRY_DSN` is absent. Auth headers are stripped before sending to Sentry.

## Response Compression

`@fastify/compress` compresses responses larger than 1KB (threshold: 1024 bytes). Registered after helmet but before routes. Reduces payload sizes for list endpoints (feed, notifications, conversations) by 60-80%.

## Infrastructure

| Service | Container | Port |
|---|---|---|
| PostgreSQL 15 | `rm-postgres` | 5433 (host) → 5432 (container) |
| Redis 7 | `rm-redis` | 6379 |

**Note:** PostgreSQL is on port 5433 because local Mac PostgreSQL occupies 5432.

## Deployment Architecture (Post-Session 13)

### Docker Production Build

Multi-stage `Dockerfile` in `backend/`:

| Stage | Base | Purpose |
|---|---|---|
| `deps` | `node:20-alpine` | Production dependencies (`npm ci --omit=dev`) + Prisma client generation |
| `build` | `node:20-alpine` | Full dev dependencies + TypeScript compilation (`tsc`) |
| `runner` | `node:20-alpine` | Minimal production image — compiled JS + prod `node_modules` only |

- Runs as non-root `appuser` (UID 1001) for security
- Includes Prisma schema + migrations for runtime use
- Entrypoint: `node dist/server.js`

### Production Services (`docker-compose.production.yml`)

```
┌──────────────────┐     ┌──────────────────┐
│  PostgreSQL 15   │     │    Redis 7       │
│  (alpine)        │     │    (alpine)      │
│  Health: pg_isready    │  Health: redis-cli ping │
│  Volume: pgdata  │     │  Volume: redisdata│
└────────┬─────────┘     └────────┬─────────┘
         │                        │
         └──────────┬─────────────┘
                    │
           ┌────────▼────────┐
           │   API Service   │
           │  (backend/      │
           │   Dockerfile)   │
           │  Port: 3000     │
           │  Health: /health│
           │  every 30s      │
           └─────────────────┘
```

### CI/CD Pipeline (`.github/workflows/ci.yml`)

Triggers on push to `main` and pull requests to `main`.

| Job | Runs | Services | Condition |
|---|---|---|---|
| **Typecheck** | `npm ci` → `prisma generate` → `tsc --noEmit` | None | Always |
| **Test** | `prisma db push` → seed → `vitest run` | PostgreSQL 15 + Redis 7 | Always |
| **Docker Build** | Multi-stage image build (no push) | None | `main` branch only |

Docker build uses GitHub Actions cache (`type=gha`) for layer caching. Image is built but not pushed — container registry deployment is deferred.

**Note:** The `lint-and-typecheck` job name references lint, but no ESLint config exists yet. Only typecheck runs. Lint setup is planned for a future session.

## Authentication Flow (Session 2)

```
Register/Login Request
    |
    v
Zod Schema Validation (auth.schemas.ts)
    |
    v
AuthService (auth.service.ts)
    |-- bcrypt verify (timing-safe)
    |-- Login lockout check (Redis)
    |-- Generate JWT access token (@fastify/jwt, 15m)
    |-- Generate JWT refresh token (jsonwebtoken, 30d/180d)
    |-- Store refresh token hash in Redis
    |
    v
{ user, tokens } --> Client
```

**Protected route flow:**

```
Request with Bearer token
    |
    v
app.authenticate decorator (authenticate.ts)
    |-- Verify JWT signature + expiry
    |-- Check Redis blacklist (auth:blacklist:{jti})
    |
    v
Route Handler (has request.user with sub, email, accountType, emailVerified, jti)
```

## User & Seller Profile Flow (Session 3)

```
Authenticated Request
    |
    v
app.authenticate decorator
    |
    v
UsersService / SellersService
    |-- getMe() → full private profile (email, phone, prefs)
    |-- getUserById() → public profile only (no sensitive data)
    |-- switchAccountType() → auto-creates SellerProfile if needed
    |-- deleteAccount() → soft delete (email prefixed for reuse)
    |
SellersService
    |-- createSellerProfile() → auto-switches user to 'both'
    |-- submitVerification() → creates VerificationRequest (pending)
    |-- calculateProfileStrength() → weighted 0-100 score
    |
    v
Prisma ORM --> PostgreSQL
```

**Profile strength weights (0-100):**
| Field | Weight |
|---|---|
| businessName | 10 |
| bio (50+ chars) | 15 |
| profilePhoto | 10 |
| categories (1+) | 10 |
| yearsExperience | 5 |
| portfolioPhotos (3+) | 15 |
| businessWebsite | 5 |
| businessHours | 5 |
| emailVerified | 10 |
| idVerified | 10 |
| licenseVerified | 5 |

## File Storage (Cloudflare R2)

The storage utility (`backend/src/common/utils/storage.ts`) provides S3-compatible file operations using Cloudflare R2:

```typescript
import { uploadFile, generatePresignedUploadUrl, deleteFile } from './storage.js';

// Server-side upload (buffer)
const result = await uploadFile(buffer, 'photo.jpg', 'image/jpeg', 'profile-photos', userId);
// result: { key, url, size, contentType }

// Client-side direct upload (pre-signed URL)
const { uploadUrl, key, publicUrl } = await generatePresignedUploadUrl(
  'photo.jpg', 'image/jpeg', 'profile-photos', userId
);
```

**Upload categories:** `profile-photos`, `portfolio`, `post-photos`, `post-videos`, `transaction-photos`, `verification-docs`, `message-attachments`

**Size limits:** Images 10MB, Documents 25MB

**Allowed types:** Images (jpeg, png, webp, heic, heif), Docs (pdf, jpeg, png)

## Post & Category Flow (Session 4)

```
GET /categories/tree → CategoriesService.getCategoryTree() → Hierarchical category list
    |
POST /posts → PostsService.createPost()
    |-- Validates email verified (for active posts)
    |-- Enforces max 10 active posts per buyer
    |-- Sets expiresAt from expiresInHours
    |-- Returns created post with buyer info
    |
GET /posts/feed → PostsService.getFeed()
    |-- Filters: category, subcategory, budget range, urgency, city, state
    |-- Sorts: newest, expiring_soon, budget_high, budget_low
    |-- Returns paginated active posts
    |
GET /posts/search → PostsService.searchPosts()
    |-- PostgreSQL full-text search via search_vector @@ plainto_tsquery()
    |-- Ranked by ts_rank for relevance scoring
    |-- Additional filters: category, budget, location
    |
GET /posts/:postId → PostsService.getPostById()
    |-- Optional auth (try/catch jwtVerify)
    |-- Increments viewCount for non-owners
    |-- Draft visibility restricted to owner only
```

## Offer & Transaction Flow (Session 5)

```
Seller browses feed → Finds post → Submits offer
    |
    v
OffersService.submitOffer()
    |-- Validates post (active, not expired, not own post)
    |-- Checks 25-offer cap per post
    |-- Unique constraint: 1 offer per seller per post
    |-- 24h cooldown after withdrawal before re-submitting
    |-- Calculates fee preview via calculateFees()
    |
    v
Buyer reviews offers → Sorts by Best Match
    |-- Best Match scoring:
    |     rating × 0.4 + priceCompetitiveness × 0.3 +
    |     distance × 0.15 + responseTime × 0.1 + completionRate × 0.05
    |
    v
Buyer accepts offer → OffersService.acceptOffer()
    |-- prisma.$transaction (atomic):
    |   1. Accept this offer
    |   2. Decline all other pending offers
    |   3. Mark post as filled
    |   4. Create Transaction record
    |
    v
TransactionsService lifecycle:
    |-- Seller: updateStatus (scheduled → on_the_way → started)
    |-- Seller: markComplete (after photos required, 7-day auto-release)
    |-- Buyer: approveAndRelease (funds released, seller stats updated)
    |-- Buyer: requestChanges (max 2 per transaction)
    |-- Either: cancelTransaction (refund if escrow held)
```

## Fee Calculation (`common/utils/fees.ts`)

Pure utility function used by both offers (preview) and transactions (actual charges).

| Transaction Type | Buyer Fee | Seller Fee | Stripe | Platform Total |
|---|---|---|---|---|
| `service` / `job_milestone` | +5% | -8% | 2.9% + $0.30 | ~13% |
| `product_shipped` | +5% | -6% | 2.9% + $0.30 | ~11% |
| `product_local_cash` | $0 | $0 | $0 | $0 |
| `product_local_platform` / `inventory` | +3% | -3% | 2.9% + $0.30 | ~6% |

```typescript
import { calculateFees } from './common/utils/fees.js';

const fees = calculateFees('service', 200);
// { quoteAmount: 200, buyerFee: 10, stripeFee: 6.39,
//   totalCharged: 216.39, platformFee: 25.39,
//   sellerPayoutAmount: 184, platformFeePercentage: 8 }
```

## Stripe Connect & Escrow Flow (Session 6)

```
Seller completes Stripe Connect onboarding
    |
    v
POST /payments/seller/onboard → PaymentsService.startSellerOnboarding()
    |-- Creates Stripe Connect Standard account (or links existing)
    |-- Returns Stripe-hosted onboarding URL
    |-- Webhook: account.updated → updates chargesEnabled/payoutsEnabled
    |
    v
Buyer accepts offer → Transaction created
    |
    v
POST /payments/create-intent → PaymentsService.createPaymentIntent()
    |-- Validates: buyer owns transaction, seller onboarded, not cash, no existing intent
    |-- Creates Stripe PaymentIntent (amount = totalCharged cents)
    |-- Uses transfer_group = transactionId for escrow tracking
    |-- Returns clientSecret for Flutter SDK
    |
    v
Client completes payment → Stripe fires payment_intent.succeeded webhook
    |
    v
POST /payments/webhook → verifyWebhookSignature() → handleWebhookEvent()
    |-- payment_intent.succeeded: sets escrowStatus = 'held', stores charge/card info
    |-- payment_intent.payment_failed: logs to transaction timeline
    |-- charge.refunded: sets escrowStatus = 'refunded'
    |-- account.updated: syncs seller charges/payouts enabled flags
    |
    v
Seller completes work → Buyer approves
    |
    v
TransactionsService.approveAndRelease()
    |-- Calls PaymentsService.releaseEscrow() internally
    |-- Creates Stripe Transfer to seller's connected account
    |-- Sets escrowStatus = 'released'
    |
    v
OR: Buyer/Seller cancels
    |
    v
TransactionsService.cancelTransaction()
    |-- Calls PaymentsService.refundPaymentIntent() internally
    |-- Creates Stripe Refund
    |-- Sets escrowStatus = 'refunded'
```

**Pattern:** Separate charges and transfers — platform collects full amount via PaymentIntent, holds funds, then creates a Transfer to the seller on approval. `transfer_group` links the charge and transfer for reconciliation.

**Dev-mode bypass:** Stripe onboarding checks in `acceptOffer()` and `createPaymentIntent()` are skipped when `NODE_ENV !== 'production'`, allowing full flow testing without a real Stripe account.

## Messaging Flow (Session 7)

```
Offer accepted → Conversation auto-created (prisma.$transaction)
    |
    v
GET /messages/conversations → MessagesService.listConversations()
    |-- Lists conversations where user is participant1 or participant2
    |-- Includes other participant info, last message preview, unread count
    |
GET /messages/conversations/:id → MessagesService.getConversation()
    |-- Participant access check
    |-- Paginated messages (oldest-first)
    |
POST /messages/conversations/:id/messages → MessagesService.sendMessage()
    |-- Rate limit: 50 messages/hour per user (Redis counter)
    |-- External payment detection regex (venmo, cashapp, zelle, paypal)
    |-- Flagged messages set moderationStatus='pending'
    |-- Atomic: insert message + increment unread counter
    |-- Async notification to recipient (via BullMQ)
    |
PUT /messages/conversations/:id/mark-read → MessagesService.markRead()
    |-- Resets unread counter, marks messages from other user as read
```

## Real-time Messaging Architecture (Session 13)

### Socket.IO Server Setup

```
Fastify HTTP Server (app.listen)
    |
    v
initSocketIO(httpServer)
    |-- Creates Socket.IO server (WebSocket + polling transports)
    |-- CORS: production = FRONTEND_URL only, dev = open
    |
    v
JWT Authentication Middleware (_io.use)
    |-- Extracts token from socket.handshake.auth.token
    |-- Verifies with JWT_ACCESS_SECRET (same as REST)
    |-- Checks Redis blacklist (auth:blacklist:{jti})
    |-- Sets socket.data.user = decoded token payload
    |
    v
registerMessagesGateway(io)
    |-- Registers event handlers on 'connection'
    |-- Auto-joins user:{userId} room
    |-- Tracks presence in Redis
```

### Room Architecture

| Room Pattern | Purpose | Joined When |
|---|---|---|
| `user:{userId}` | Personal notifications, unread updates | On connection (automatic) |
| `conv:{conversationId}` | Chat messages, typing indicators, read receipts | On `join_conversation` event (participant verified) |

### Dual Delivery Flow

```
Client sends message → REST POST /messages/conversations/:id/messages
    |
    v
MessagesService.sendMessage()
    |-- Validate (rate limit, payment detection, moderation)
    |-- Insert message to DB (Prisma)
    |-- Increment unread counter (atomic)
    |-- Queue BullMQ notification (push/email)
    |
    |-- Socket.IO real-time delivery (via getIO()):
    |   |-- Emit 'new_message' → conv:{conversationId} room
    |   |-- Emit 'notification' → user:{recipientId} room
    |   (graceful no-op if Socket.IO not initialized)
    |
    v
Recipient receives via:
    1. Socket.IO event (instant, if connected + in room)
    2. Polling fallback (30s chat, 60s conversations)
    3. Push notification (async, via BullMQ worker)
```

### Presence Tracking

```
Client connects → setUserOnline(userId, socketId)
    |-- Redis SET presence:{userId} = socketId (TTL 300s)
    |-- Redis SET presence:socket:{socketId} = userId (TTL 300s)
    |
Client heartbeat (every 4 min) → refreshPresence(userId, socketId)
    |-- Redis EXPIRE both keys (reset to 300s)
    |
Client disconnects → setUserOffline(socketId)
    |-- Redis GET presence:socket:{socketId} → userId
    |-- Redis DEL both keys
    |
Client crashes (no disconnect) → keys auto-expire after 5 min
```

### WebSocket Events Reference

| Event | Direction | Payload | Description |
|---|---|---|---|
| `join_conversation` | Client → Server | `conversationId` (string) | Join conversation room (participant access verified via Prisma) |
| `joined_conversation` | Server → Client | `{ conversationId }` | Confirmation of successful room join |
| `leave_conversation` | Client → Server | `conversationId` (string) | Leave conversation room |
| `typing_start` | Bidirectional | `{ conversationId, userId, firstName }` | User started typing (broadcast to room, excludes sender) |
| `typing_stop` | Bidirectional | `{ conversationId, userId }` | User stopped typing (broadcast to room, excludes sender) |
| `new_message` | Server → Client | Full message object | New message in conversation (emitted by REST handler) |
| `messages_read` | Server → Client | `{ conversationId, readBy }` | Read receipt (emitted by REST mark-read handler) |
| `notification` | Server → Client | `{ type, conversationId, ... }` | User-level notification (e.g., `type: 'message_received'`) |
| `heartbeat` | Client → Server | (none) | Refresh presence TTL |
| `error` | Server → Client | `{ message }` | Error (e.g., "Conversation not found or access denied") |

### Mobile Hybrid Strategy

```
SocketClient (Singleton)
    |-- Auto-connect on login (via SocketNotifier → authProvider listener)
    |-- StreamControllers broadcast events to providers
    |
ChatNotifier (per conversation)              ConversationsNotifier
    |-- Subscribes: new_message,               |-- Subscribes: notification
    |   typing_start/stop, messages_read       |   (type: message_received → refresh)
    |-- Optimistic sends (temp ID)             |
    |-- Polling fallback: 30s                  |-- Polling fallback: 60s
    |-- Auto-join/leave conv room              |-- Updates unread count
```

### Adding a New Real-time Event (End-to-End)

**1. Backend — emit from service:**
```typescript
// In the service that produces the event (e.g., messages.service.ts)
import { getIO } from '../../config/socket.js';

const io = getIO();
if (io) {
  io.to(`conv:${conversationId}`).emit('my_new_event', payload);
}
// The `if (io)` guard ensures tests without Socket.IO work without errors.
```

**2. Backend — receive from client (gateway):**
```typescript
// In messages.gateway.ts, inside the io.on('connection') callback
socket.on('my_new_event', async (data: string) => {
  // validate, then broadcast to room (excluding sender)
  socket.to(`conv:${data}`).emit('my_new_event', { userId, timestamp: new Date() });
});
```

**3. Flutter — add stream in SocketClient:**
```dart
// In socket_client.dart
final _myNewEventController = StreamController<Map<String, dynamic>>.broadcast();
Stream<Map<String, dynamic>> get onMyNewEvent => _myNewEventController.stream;

// In connect(), register the listener:
_socket!.on('my_new_event', (data) {
  _myNewEventController.add(Map<String, dynamic>.from(data));
});
```

**4. Flutter — subscribe in provider:**
```dart
// In the relevant StateNotifier
_socketClient.onMyNewEvent.listen((data) {
  // Update state based on event
});
```

**5. Test:**
```typescript
// In socket.test.ts, using waitForEvent() helper
const eventPromise = waitForEvent(receiverSocket, 'my_new_event');
senderSocket.emit('my_new_event', conversationId);
const data = await eventPromise;
expect(data).toHaveProperty('userId');
```

---

## i18n Architecture (Session 13)

```
ARB Source Files (mobile/lib/l10n/app_*.arb)
    |-- 10 languages: en, es, zh, ar, fr, pt, hi, vi, ko, ja
    |-- ICU message format (supports plurals, gender, select)
    |
    v (flutter gen-l10n / build_runner)
Generated AppLocalizations class + locale-specific subclasses
    |-- Type-safe: AppLocalizations.of(context).myPosts
    |-- Compile-time validation
    |
    v
l10n_extension.dart → context.l10n shortcut
    |
LocaleNotifier (StateNotifier<Locale>)
    |-- Persists to SecureStorage ('preferred_language' key)
    |-- Loaded on app start, updated via language settings screen
    |-- Watched by MaterialApp's locale property
```

**Supported languages:**

| Code | Language | Native Name | Rationale |
|---|---|---|---|
| en | English | English | Default, template locale |
| es | Spanish | Español | Large DFW Hispanic community |
| zh | Chinese | 中文 | DFW Chinese community |
| ar | Arabic | العربية | RTL support, DFW community |
| fr | French | Français | International expansion |
| pt | Portuguese | Português | International expansion |
| hi | Hindi | हिन्दी | Growing DFW community |
| vi | Vietnamese | Tiếng Việt | Large DFW Vietnamese community |
| ko | Korean | 한국어 | DFW Korean community |
| ja | Japanese | 日本語 | International expansion |

### Adding a New Language

1. Create the ARB file: `mobile/lib/l10n/app_{code}.arb`
   - Copy `app_en.arb` as template
   - Translate all values (keys stay the same)
   - Set `"@@locale": "{code}"` at the top

2. Register in `locale_provider.dart`:
   - Add entry to `AppLanguage` enum: `xx('xx', 'NativeName', 'EnglishName')`

3. Add to the `supportedLocales` list in `app.dart`

4. Regenerate:
   ```bash
   cd mobile && flutter gen-l10n
   ```

### Adding New Strings

1. Add the key to `app_en.arb` (English is the template locale):
   ```json
   "newFeatureTitle": "My Feature",
   "@newFeatureTitle": { "description": "Title for the new feature screen" }
   ```

2. Add translations to all other 9 `.arb` files

3. Regenerate: `cd mobile && flutter gen-l10n`

4. Use in code:
   ```dart
   // Via extension (preferred)
   context.l10n.newFeatureTitle

   // Via direct access
   AppLocalizations.of(context)!.newFeatureTitle
   ```

### ICU Message Format (Plurals, Select)

ARB files support ICU format for complex strings:
```json
"itemCount": "{count, plural, =0{No items} =1{1 item} other{{count} items}}",
"@itemCount": { "placeholders": { "count": { "type": "int" } } }
```

---

## Review Flow (Session 7)

```
Transaction completed → Review reminders scheduled (BullMQ)
    |
    v
POST /reviews → ReviewsService.submitReview()
    |-- Verify buyer owns completed transaction
    |-- Unique constraint (1 review per transaction)
    |-- Atomic (interactive $transaction):
    |   1. Create review
    |   2. Recompute seller stats (averageRating, totalReviews)
    |   3. Update ratingBadge (top_rated/highly_rated/good/null)
    |
GET /reviews/sellers/:sellerId → ReviewsService.listSellerReviews()
    |-- Public, paginated
    |-- Sort: newest, oldest, highest, lowest
    |-- Includes summary (averageRating, totalReviews, distribution)
    |
Review Reminders (BullMQ scheduled jobs):
    |-- Day 7: Push notification reminder
    |-- Day 30: Email reminder
    |-- Day 60: Email reminder
    |-- Day 73: Auto-generate 5-star review if none exists
```

**Rating badge thresholds:**
| Badge | Criteria |
|---|---|
| `top_rated` | Average >= 4.8 AND 5+ reviews |
| `highly_rated` | Average >= 4.5 AND 3+ reviews |
| `good` | Average >= 4.0 AND 2+ reviews |

## Notification System (Session 7)

```
Any service → NotificationsService.createNotification()
    |
    v
Insert notification to DB
    |
    v
Queue BullMQ job (notifications queue)
    |
    v
Worker: deliverNotification()
    |-- Channel 'push': send via FCM (firebase-admin)
    |-- Channel 'email': send via SendGrid (@sendgrid/mail)
    |-- Channel 'in_app': already stored in DB
    |-- Update delivery status (sent_at, delivery_channel)
```

**Graceful external services:** `sendEmail()` and `sendPush()` never throw. They log to console when API keys are absent (dev mode) and actually send in production. Fire-and-forget pattern.

**BullMQ queues:**
| Queue | Interval | Purpose |
|---|---|---|
| `notifications` | On-demand | Async push/email delivery |
| `review-reminders` | Delayed (day 7/30/60/73) | Scheduled review reminders + auto-review |
| `auto-release` | Every 15 min | Release escrow for unresponsive buyers (7-day window) |
| `post-expiry` | Every 1 hour | Auto-expire stale posts past `expiresAt` |
| `offer-expiry` | Every 1 hour | Auto-expire pending offers past 72h |

Workers are disabled in `NODE_ENV=test` and started via `startWorkers()` in `server.ts`. Scheduled jobs are registered via `registerScheduledJobs()` using BullMQ v5's `upsertJobScheduler()` (idempotent across restarts).

## AI Post Creation Flow (Session 8)

```
Buyer opens post creation screen → Enters natural language description
    |
    v
POST /posts/ai/parse → AIAssistService.parsePostRequest()
    |-- Rate limit: 20 req/hour per user (Redis key ai:rate:{userId})
    |-- Loads full category tree with slugs (CategoriesService.getCategoryTree())
    |-- Sends structured prompt to Gemini Flash-Lite (gemini-2.5-flash-lite)
    |-- Strips markdown code blocks from response
    |-- Validates AI output through Zod schema
    |-- Resolves category/subcategory slugs → DB UUIDs
    |
    v
Returns structured post: { title, description, categoryId, subcategoryId,
    budgetMin, budgetMax, budgetType, urgency, categorySpecific, requirements }
    |
    v
Buyer reviews/edits → Submits via POST /posts (standard create flow)
```

**Image suggestions (products):**
```
POST /posts/ai/suggest-images → AIAssistService.suggestProductImages()
    |-- Input: { productName, categorySlug? }
    |-- Returns up to 3 Unsplash image URLs with descriptions
```

**Job profile generation:**
```
POST /posts/ai/generate-job-profile → AIAssistService.generateJobProfile()
    |-- Input: { text, profileType: "job_seeker" | "employer" }
    |-- Returns: { title, description, categorySpecific, suggestedBudget }
```

**Error handling:**
- Missing API key → 503 ("AI service is not configured")
- Invalid AI response → 500 ("AI returned an invalid response")
- Rate limit exceeded → 429 ("AI rate limit exceeded")
- All errors suggest manual form fallback

## Admin Module Flow (Session 9)

```
Admin authenticates → JWT includes isAdmin: true
    |
    v
Request hits admin route → app.authenticate + app.requireAdmin hooks
    |
    v
AdminService methods:
    |-- Dashboard: getStats() → user counts, revenue, pending verifications, flagged content
    |-- User Management: listUsers, getUserDetail, suspendUser, banUser, reactivateUser, forceLogout
    |-- Verification: listPendingVerifications, reviewVerification (approve → update badges/tier)
    |-- Disputes: listDisputes, getDisputeDetail, resolveDispute
    |-- Moderation: listFlaggedContent (reviews + messages), moderateReview, moderateMessage
    |-- Transactions: listAllTransactions (admin view)
    |-- Audit: listAuditLogs (filter by action/resourceType/userId)
    |
    v
Every mutating action → AuditLog entry (actorType: 'admin')
```

**Admin auth pattern:**
- `isAdmin` boolean field on User model, included in JWT payload
- `requireAdmin` Fastify decorator checks `request.user.isAdmin`
- All admin routes use plugin-level hooks: `app.addHook('onRequest', app.authenticate)` + `app.addHook('onRequest', app.requireAdmin)`
- Admins cannot suspend/ban other admins

**Verification approval flow:**
```
Admin approves verification → SellerProfile updated:
    |-- Set *_verified boolean (e.g., licenseVerified = true)
    |-- Add badge to verificationBadges JSON array (e.g., "license_verified")
    |-- Recalculate verificationTier: 1 (base) → 2 (ID/EIN) → 3 (license/insurance) → 4 (background)
```

**Shared test helpers** (`tests/helpers.ts`):
- `createTestUser()` — register, verify email, login, return token + userId
- `makeAdmin()` — promote user to admin, re-login for admin-scoped JWT
- `authHeaders()`, `cleanupTestData()`, `clearAuthRedisKeys()`

## Built In

- **Session 1:** Project scaffold, config, Prisma schema, middleware, error handling
- **Session 2:** Auth module (8 endpoints, 30 tests), JWT authenticate decorator
- **Session 3:** Users module (8 endpoints, 17 tests), Sellers module (7 endpoints, 14 tests), R2 storage utility
- **Session 4:** Categories module (3 endpoints, 8 tests), Posts module (10 endpoints, 24 tests), Search module (1 endpoint)
- **Session 5:** Offers module (7 endpoints, 21 tests), Transactions module (7 endpoints, 20 tests), Fee calculation utility
- **Session 6:** Payments module (4 endpoints + webhook, 18 tests), Stripe Connect, escrow flow, seller onboarding
- **Session 7:** Messages module (5 endpoints, 16 tests), Reviews module (3 endpoints, 14 tests), Notifications module (4 endpoints, 12 tests), BullMQ workers, SendGrid email, FCM push
- **Session 8:** AI Post Creation (3 endpoints added to posts module, 13 tests), Gemini config, slug-to-UUID resolution
- **Session 9:** Admin module (17 endpoints, 26 tests), `requireAdmin` decorator, `isAdmin` migration, shared test helpers, audit logging
- **Session 10:** Flutter project scaffold, core layer (theme, Dio client, Riverpod, GoRouter), auth screens (login, register, verify email, forgot/reset password), secure storage
- **Session 11:** Buyer screens (dashboard, post creation with AI + manual, my posts, post detail, offers, transactions), navigation shell with bottom nav, shared widgets (status badge, empty state, category picker, confirmation dialog)
- **Session 12:** Seller screens (profile setup, profile view, verification, Stripe onboarding, feed, offer submission, my offers, seller transaction detail), buyer/seller mode toggle, full profile screen (replaced placeholder)
- **Session 13:** Socket.IO real-time messaging (backend server + gateway + Flutter client), Redis presence tracking, real-time chat UI (conversations + chat screens with typing indicators, optimistic sends, read receipts), i18n/localization (10 languages), API test scripts (14 curl-based test suites)
- **Post-Session 13:** Scheduled jobs system — BullMQ repeatable jobs for auto-release escrow (15min), post expiry (1hr), offer expiry (1hr); `releaseEscrow()` reason param. Docker multi-stage production build, `docker-compose.production.yml`, CI/CD pipeline (GitHub Actions: typecheck + test + Docker build), request-id tracing middleware (`x-request-id`)
- **Session 14:** Backend hardening — Sentry error tracking (`@sentry/node` with lazy init), `@fastify/compress` (1KB threshold), enhanced `/health` (queue metrics, uptime, memory), FCM invalid token auto-cleanup, version 1.0.0. Mobile — Firebase Cloud Messaging (push notification service, token registration on login, clear on logout), Sentry crash reporting (`sentry_flutter` + `sentry_dio` breadcrumbs), custom error widget for production. 4 new Flutter screens: Notifications (full feature with bell badge), Edit Profile, Submit Review (star ratings + category ratings), Settings (notification toggles, account management, privacy/terms). App store prep: deep linking (`reversemarket://` + `https://app.reversemarket.com`), splash screen config, app icon config, privacy/terms URLs.
