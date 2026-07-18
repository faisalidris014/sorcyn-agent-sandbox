# STRUCTURE — Directory Layout & Organization

## Root Layout

```
ReverseMarketplace/
├── backend/              # Node.js/Fastify API server
├── mobile/               # Flutter mobile + web app
├── docs/                 # Documentation assets
├── docker-compose.yml    # Local dev (PostgreSQL, Redis)
├── CLAUDE.md             # AI assistant instructions
├── BUILD_INSTRUCTIONS.md # Session-by-session build plan
├── BUILD_PROGRESS.md     # Current build status tracker
└── ReverseMktplPRD.md    # Full PRD (14,500+ lines)
```

## Backend Structure

```
backend/
├── src/
│   ├── server.ts                    # Entry point — starts Fastify, graceful shutdown
│   ├── app.ts                       # App builder — registers plugins, routes, middleware
│   ├── config/
│   │   ├── env.ts                   # Zod-validated environment config
│   │   ├── database.ts              # Prisma client singleton
│   │   ├── redis.ts                 # ioredis client singleton
│   │   ├── stripe.ts                # Stripe SDK init + webhook verification
│   │   ├── gemini.ts                # Google Gemini AI client
│   │   └── bullmq.ts               # BullMQ queues + workers (notifications, review-reminders)
│   ├── common/
│   │   ├── middleware/
│   │   │   ├── authenticate.ts      # JWT auth middleware (@fastify/jwt)
│   │   │   └── error-handler.ts     # Global error handler (RFC 7807)
│   │   ├── types/
│   │   │   └── api.ts               # ApiResponse, ApiError, PaginationMeta types
│   │   └── utils/
│   │       ├── errors.ts            # AppError class hierarchy
│   │       ├── email.ts             # SendGrid email wrapper (with stub fallback)
│   │       ├── push.ts              # Firebase Cloud Messaging wrapper (with stub)
│   │       ├── storage.ts           # Cloudflare R2 file upload/download (S3-compatible)
│   │       └── fees.ts              # Platform fee calculation
│   └── modules/                     # Feature modules (13 total)
│       ├── auth/                    # Authentication (register, login, JWT, password reset)
│       ├── users/                   # User CRUD, profile management
│       ├── sellers/                 # Seller profiles, Stripe Connect onboarding
│       ├── categories/              # Hierarchical category management
│       ├── posts/                   # Buyer requests (CRUD, AI-assisted creation)
│       │   ├── posts.routes.ts
│       │   ├── posts.service.ts
│       │   ├── posts.schemas.ts
│       │   ├── ai-assist.service.ts # Gemini-powered post creation
│       │   └── ai-assist.schemas.ts
│       ├── offers/                  # Seller offers on posts
│       ├── transactions/            # Payment lifecycle, escrow tracking
│       ├── payments/                # Stripe Connect, webhook handler
│       │   ├── payments.routes.ts
│       │   ├── payments.service.ts
│       │   ├── payments.schemas.ts
│       │   └── payments.webhook.ts  # Stripe webhook signature verification
│       ├── messages/                # In-app messaging (conversations, messages)
│       ├── reviews/                 # Post-transaction reviews + reminders
│       ├── notifications/           # Push + email notification delivery
│       ├── search/                  # Post search (schemas + routes only)
│       └── admin/                   # Admin dashboard, user/post management
├── tests/                           # Integration tests (one file per module)
│   ├── helpers.ts                   # Test utilities, Fastify test instance builder
│   ├── auth.test.ts
│   ├── users.test.ts
│   ├── sellers.test.ts
│   ├── categories.test.ts
│   ├── posts.test.ts
│   ├── ai-assist.test.ts
│   ├── offers.test.ts
│   ├── transactions.test.ts
│   ├── payments.test.ts
│   ├── messages.test.ts
│   ├── reviews.test.ts
│   ├── notifications.test.ts
│   └── admin.test.ts
├── prisma/
│   ├── schema.prisma                # Database schema (all models)
│   ├── seed.ts                      # Database seeder
│   ├── migrations/                  # Prisma migrations
│   └── custom-migrations/           # Manual SQL migrations
├── dist/                            # Compiled output (TypeScript → JS)
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Mobile (Flutter) Structure

```
mobile/
├── lib/
│   ├── main.dart                     # App entry point
│   ├── app.dart                      # MaterialApp, routing, theme setup
│   ├── core/                         # Shared infrastructure
│   │   ├── config/
│   │   │   ├── app_config.dart       # App-wide constants
│   │   │   └── env_config.dart       # Environment configuration
│   │   ├── network/
│   │   │   ├── dio_client.dart       # Dio HTTP client (interceptors, auth headers)
│   │   │   └── api_response.dart     # Generic API response wrapper
│   │   ├── providers/
│   │   │   └── app_mode_provider.dart # Buyer/Seller mode toggle (Riverpod)
│   │   ├── storage/
│   │   │   └── secure_storage.dart   # flutter_secure_storage wrapper
│   │   ├── theme/
│   │   │   ├── app_theme.dart        # Material theme definition
│   │   │   └── app_colors.dart       # Purple/white brand colors
│   │   └── utils/
│   │       ├── formatters.dart       # Currency, date formatting
│   │       └── validators.dart       # Form input validators
│   ├── features/                     # Feature modules (9 total)
│   │   ├── auth/                     # Login, register, verify email, forgot/reset password
│   │   ├── posts/                    # Buyer dashboard, create post (AI + manual), post detail
│   │   ├── offers/                   # Submit/view/manage offers
│   │   ├── transactions/             # Transaction list + detail (buyer & seller views)
│   │   ├── messages/                 # Conversations list + chat screen
│   │   ├── sellers/                  # Seller profile setup, Stripe onboarding
│   │   ├── categories/              # Category picker, models
│   │   ├── feed/                    # Seller feed (browse posts)
│   │   └── profile/                 # User profile screen
│   └── shared/
│       └── widgets/                  # Reusable UI components
│           ├── app_logo.dart
│           ├── bottom_nav_shell.dart # Bottom navigation (buyer/seller modes)
│           ├── category_picker.dart
│           ├── confirmation_dialog.dart
│           ├── empty_state.dart
│           ├── loading_overlay.dart
│           └── status_badge.dart
├── test/
│   └── widget_test.dart
├── pubspec.yaml
└── (platform dirs: android/, ios/, web/, linux/, macos/, windows/)
```

## Module Pattern — Backend

Every backend module follows the same 3-file pattern:

| File | Purpose |
|------|---------|
| `{name}.routes.ts` | Fastify route definitions, request/response handling |
| `{name}.service.ts` | Business logic, Prisma queries, external API calls |
| `{name}.schemas.ts` | Zod validation schemas for request bodies/params/queries |

Exceptions:
- `posts/` has extra `ai-assist.service.ts` + `ai-assist.schemas.ts`
- `payments/` has extra `payments.webhook.ts`
- `search/` has no service file (routes + schemas only)

## Module Pattern — Mobile (Flutter)

Every Flutter feature module follows:

```
features/{name}/
├── data/
│   ├── models/          # Data classes with json_serializable (.dart + .g.dart)
│   └── repositories/    # API calls via Dio
├── providers/           # Riverpod state management
└── presentation/
    ├── screens/         # Full-page widgets
    └── widgets/         # Feature-specific reusable widgets
```

## Naming Conventions

### Backend (TypeScript)
- **Files:** kebab-case (`error-handler.ts`, `ai-assist.service.ts`)
- **Modules:** kebab-case plural (`posts/`, `offers/`)
- **Classes:** PascalCase (`PostsService`, `AppError`)
- **Functions:** camelCase (`sendEmail`, `getStripe`)
- **Types/Interfaces:** PascalCase (`ApiResponse`, `EmailOptions`)
- **Constants:** SCREAMING_SNAKE for sizes/limits, camelCase for others

### Mobile (Dart/Flutter)
- **Files:** snake_case (`dio_client.dart`, `auth_provider.dart`)
- **Directories:** snake_case (`secure_storage/`)
- **Classes:** PascalCase (`DioClient`, `AuthProvider`)
- **Generated files:** `{name}.g.dart` (json_serializable output)

## Key Locations Quick Reference

| Looking for... | Location |
|----------------|----------|
| API entry point | `backend/src/server.ts` |
| Route registration | `backend/src/app.ts` |
| Environment config | `backend/src/config/env.ts` |
| Database schema | `backend/prisma/schema.prisma` |
| Database client | `backend/src/config/database.ts` |
| Error classes | `backend/src/common/utils/errors.ts` |
| Auth middleware | `backend/src/common/middleware/authenticate.ts` |
| Test helpers | `backend/tests/helpers.ts` |
| Mobile entry | `mobile/lib/main.dart` |
| Mobile routing | `mobile/lib/app.dart` |
| API client | `mobile/lib/core/network/dio_client.dart` |
| Theme/colors | `mobile/lib/core/theme/` |
| Shared widgets | `mobile/lib/shared/widgets/` |
| Full PRD | `ReverseMktplPRD.md` |
