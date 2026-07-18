# Technology Stack

**Analysis Date:** 2026-02-27

## Languages

**Primary:**
- TypeScript 5.9.3 - Backend (Node.js), type-safe API implementation
- Dart 3.2+ - Flutter mobile and web applications

**Secondary:**
- JavaScript (ESM) - Generated code and build outputs
- SQL - PostgreSQL database queries (via Prisma ORM)
- Bash/Shell - Docker and deployment scripts

## Runtime

**Environment:**
- Node.js 20+ LTS (required, enforced via `package.json` engines field in `backend/package.json`)
- Dart/Flutter 3.16+ SDK (for mobile/web client compilation)

**Package Managers:**
- npm - Backend dependency management (with `package-lock.json` committed)
- pub - Flutter dependency management (with `pubspec.lock` committed)

## Frameworks

**Core Backend:**
- Fastify 5.7.4 - HTTP server framework, handles routing, middleware, plugin system
  - Config: `backend/src/app.ts` (plugin registration, CORS, security, JWT)
  - Used with Zod type provider for automatic validation and OpenAPI schema generation

**Core Frontend:**
- Flutter 3.16+ - Cross-platform UI framework (iOS, Android, Web)
  - Router: go_router 14.8.1 - Page routing and deep linking
  - State Management: Riverpod 2.6.1 - Reactive dependency injection and state
  - HTTP: Dio 5.7.0 - HTTP client with interceptors and request/response handling

**Testing:**
- Vitest 4.0.18 - Test runner for Node.js backend (configured in `backend/vitest.config.ts`)
  - Environment: Node
  - Coverage: v8 provider (configured to report to text and LCOV)
  - Assertion: Built-in expect, enhanced with Supertest for HTTP
- Supertest 7.2.2 - HTTP assertion library for testing Fastify endpoints
- Flutter test - Built into Flutter SDK for Dart unit and widget tests

**Build/Dev Tools:**
- tsx 4.21.0 - TypeScript execution for Node.js (watch mode via `npm run dev`)
- TypeScript 5.9.3 - Compiler (target ES2022, module ESNext, strict mode enabled)
- ESLint 9.39.2 with @typescript-eslint - Code linting (no custom ESLint config, uses ESLint flat config)
- Prisma 7.4.0 - Database ORM and migrations
  - Adapter: @prisma/adapter-pg 7.4.0 (uses PrismaPg for native PostgreSQL)
  - CLI: `db:migrate`, `db:push`, `db:seed`, `db:studio`

**Documentation & API:**
- @fastify/swagger 9.7.0 - OpenAPI 3.0 schema generation from Zod validators
- @fastify/swagger-ui 5.2.5 - Swagger UI at `/docs` route
  - Auto-generates from Fastify routes with Zod type provider

## Key Dependencies

**Critical Backend:**
- @prisma/client 7.4.0 - ORM for PostgreSQL queries and migrations
- zod 4.3.6 - Schema validation (used for env vars, request/response validation, OpenAPI generation)
- fastify-type-provider-zod 6.1.0 - Adapter to use Zod with Fastify for auto-validation
- ioredis 5.9.3 - Redis client for caching and job queue connection
- bullmq 5.69.2 - Job queue (processes notifications, review reminders via Redis backend)

**Payment & Stripe:**
- stripe 20.3.1 - Stripe API client for payment intents, refunds, Connect onboarding
  - Webhook signature verification built in
  - Escrow model via Stripe Connect (destination charges to seller accounts)

**File Storage & CDN:**
- @aws-sdk/client-s3 3.990.0 - S3-compatible client for Cloudflare R2 uploads
- @aws-sdk/s3-request-presigner 3.990.0 - Pre-signed URL generation for direct uploads

**Notifications & Messaging:**
- firebase-admin 13.6.1 - Firebase Cloud Messaging (FCM) for push notifications
- @sendgrid/mail 8.1.6 - SendGrid API for transactional email

**AI/Content Generation:**
- @google/generative-ai 0.24.1 - Google Gemini API client for post parsing, image suggestions
  - Rate limited per user (20 requests/hour in `backend/src/config/env.ts`)

**Security & Auth:**
- @fastify/jwt 10.0.0 - JWT token signing and verification
- jsonwebtoken 9.0.3 - JWT encoding/decoding (backup to Fastify JWT)
- bcrypt 6.0.0 - Password hashing
- @fastify/helmet 13.0.2 - Security headers (CSP, X-Frame-Options, etc.)
- @fastify/cors 11.2.0 - CORS middleware with origin whitelisting
- @fastify/rate-limit 10.3.0 - Rate limiting (1000 requests/hour default)
- @fastify/cookie 11.0.2 - Cookie parsing and setting

**Database:**
- pg 8.18.0 - PostgreSQL client (used by Prisma adapter)

**Utilities:**
- uuid 13.0.0 - UUID generation
- pino 10.3.1 - Structured logging framework
- pino-pretty 13.1.3 - Pretty-printed logs in development
- dotenv 17.3.1 - Environment variable loading from `.env` file

**Frontend (Flutter/Dart):**
- flutter_secure_storage 9.2.4 - Encrypted token/credential storage on device
- json_annotation 4.9.0 - JSON serialization annotations
- json_serializable 6.9.4 - Code generator for JSON serialization
- intl 0.19.0 - Date/time and number formatting
- logger 2.5.0 - Logging utility
- url_launcher 6.3.1 - Deep linking and URL handling

## Configuration

**Environment Configuration:**
- Location: `backend/.env` (not committed) and `backend/.env.example` (template)
- Validation: Zod schema in `backend/src/config/env.ts` with 32-char minimum for secrets
- All config files in `backend/src/config/`:
  - `env.ts` - Environment variable loading and validation
  - `database.ts` - Prisma client initialization with PrismaPg adapter
  - `redis.ts` - Redis connection with retry strategy (max 3 retries, 200-2000ms backoff)
  - `stripe.ts` - Stripe client singleton with webhook signature verification
  - `bullmq.ts` - Job queue configuration (notifications, review reminders)
  - `gemini.ts` - Google Gemini API client initialization

**Build Configuration:**
- `backend/tsconfig.json` - TypeScript compiler (ES2022 target, ESNext module, strict mode)
- `backend/vitest.config.ts` - Test runner (globals enabled, Node environment, coverage via v8)
- `backend/prisma/schema.prisma` - Database schema (PostgreSQL dialect)
- `backend/.env.example` - Environment variable template with all required keys

**Project Configuration:**
- `backend/package.json` - Version 0.1.0, Node 20+ required, ESM module format
- `mobile/pubspec.yaml` - Flutter SDK 3.11.0+, dependencies locked in pubspec.lock

## Platform Requirements

**Development:**
- Node.js 20+ LTS with npm
- PostgreSQL 15+ (local via Docker or Neon free tier)
- Redis 7+ (local via Docker)
- Dart 3.2+ and Flutter 3.16+ SDK for mobile/web development
- Docker & Docker Compose (optional, for postgres/redis containers)

**Production:**
- Node.js 20+ LTS runtime
- PostgreSQL 15+ managed database (Neon recommended per CLAUDE.md)
- Redis 7+ instance (ioredis compatible, any provider with AUTH support)
- Docker or equivalent container runtime for Node API
- Static hosting for Flutter web (Cloudflare Pages recommended)
- Cloudflare CDN with R2 bucket for file storage

---

*Stack analysis: 2026-02-27*
