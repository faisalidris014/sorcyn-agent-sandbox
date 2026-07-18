# INTEGRATIONS — External Services & APIs

## Overview

| Integration | SDK/Library | Config File | Status |
|------------|-------------|-------------|--------|
| PostgreSQL | Prisma 7 | `backend/src/config/database.ts` | Active |
| Redis | ioredis | `backend/src/config/redis.ts` | Active |
| Stripe Connect | stripe | `backend/src/config/stripe.ts` | Active |
| Cloudflare R2 | @aws-sdk/client-s3 | `backend/src/common/utils/storage.ts` | Active |
| SendGrid | @sendgrid/mail | `backend/src/common/utils/email.ts` | Active (stub fallback) |
| Firebase FCM | firebase-admin | `backend/src/common/utils/push.ts` | Active (stub fallback) |
| Google Gemini | @google/generative-ai | `backend/src/config/gemini.ts` | Active |
| BullMQ | bullmq | `backend/src/config/bullmq.ts` | Active |
| Google Maps | (configured, not yet used) | env only | Deferred |

## Database — PostgreSQL (Prisma)

- **Config:** `backend/src/config/database.ts`
- **Schema:** `backend/prisma/schema.prisma`
- **Env var:** `DATABASE_URL` (connection string)
- **Provider:** Neon free tier (dev)
- **Pattern:** Singleton Prisma client, imported across all services
- **Migrations:** `backend/prisma/migrations/` + `backend/prisma/custom-migrations/`
- **Seeding:** `backend/prisma/seed.ts`

## Cache/Queue — Redis (ioredis)

- **Config:** `backend/src/config/redis.ts`
- **Env var:** `REDIS_URL` (default: `redis://localhost:6379`)
- **Used by:**
  - BullMQ job queues (notifications, review-reminders)
  - Token blacklisting (refresh token revocation)
  - Rate limiting

## Payments — Stripe Connect

- **Config:** `backend/src/config/stripe.ts`
- **Module:** `backend/src/modules/payments/`
- **Webhook:** `backend/src/modules/payments/payments.webhook.ts`

**Env vars:**
- `STRIPE_SECRET_KEY` — API key
- `STRIPE_WEBHOOK_SECRET` — Webhook signature verification
- `STRIPE_CONNECT_CLIENT_ID` — Connect app ID
- `STRIPE_CONNECT_RETURN_URL` — OAuth return URL
- `STRIPE_CONNECT_REFRESH_URL` — OAuth refresh URL

**Pattern:** Lazy singleton via `getStripe()`. Webhook route has custom content type parser to preserve raw body for signature verification.

**Flow:**
1. Seller onboards via Stripe Connect (`sellers.service.ts`)
2. Buyer accepts offer → Payment intent created (`payments.service.ts`)
3. Webhook events processed → transaction status updated (`payments.webhook.ts`)
4. Platform releases funds on completion (minus fees)

**Webhook events handled:** `payment_intent.succeeded`, `payment_intent.payment_failed`, `account.updated` (Connect)

## File Storage — Cloudflare R2

- **Config:** `backend/src/common/utils/storage.ts`
- **SDK:** `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (S3-compatible API)

**Env vars:**
- `R2_ACCOUNT_ID` — Cloudflare account
- `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` — R2 credentials
- `R2_BUCKET_NAME` — Bucket name (default: `reverse-marketplace`)
- `R2_PUBLIC_URL` — CDN URL for public access

**Features:**
- Upload with content type validation (images: 10MB max, docs: 25MB max)
- Pre-signed upload URLs for direct client uploads
- Pre-signed download URLs for private files
- Upload categories: `profile-photos`, `portfolio`, `post-photos`, `post-videos`, `transaction-photos`, `verification-docs`, `message-attachments`
- Falls back to `localhost:9000` (MinIO) for local dev

## Email — SendGrid

- **Config:** `backend/src/common/utils/email.ts`
- **SDK:** `@sendgrid/mail`

**Env vars:**
- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL` (default: `noreply@reversemarket.com`)
- `SENDGRID_FROM_NAME` (default: `Reverse Marketplace`)

**Pattern:** Lazy init. Falls back to console stub logging when `SENDGRID_API_KEY` is not set. Errors are caught and logged (non-throwing).

**Used for:** Email verification, password reset, transaction notifications.

## Push Notifications — Firebase Cloud Messaging

- **Config:** `backend/src/common/utils/push.ts`
- **SDK:** `firebase-admin`

**Env vars:**
- `FCM_PROJECT_ID`
- `FCM_CLIENT_EMAIL`
- `FCM_PRIVATE_KEY` (service account key, `\n` escaped)

**Pattern:** Lazy init via `firebase-admin.credential.cert()`. Falls back to console stub when not configured. Returns `boolean` success indicator. Errors caught and logged.

**Delivered via:** BullMQ notification queue → `NotificationsService.deliverNotification()`

## AI — Google Gemini

- **Config:** `backend/src/config/gemini.ts`
- **SDK:** `@google/generative-ai`
- **Model:** `gemini-2.5-flash-lite` (default)
- **Module:** `backend/src/modules/posts/ai-assist.service.ts`

**Env var:** `GEMINI_API_KEY`

**Pattern:** Lazy singleton via `getGemini()`. Model obtained via `getGeminiModel()`.

**Used for:** AI-assisted post creation — user describes need in natural language, Gemini generates structured post fields (title, description, category, budget suggestions).

**Limit:** Free tier = 1,000 requests/day.

## Job Queue — BullMQ

- **Config:** `backend/src/config/bullmq.ts`
- **Connection:** Uses `REDIS_URL`

**Queues:**
| Queue | Concurrency | Purpose |
|-------|-------------|---------|
| `notifications` | 5 | Email + push notification delivery |
| `review-reminders` | 2 | Review reminder scheduling (day 7, 30, 60 + auto-review) |

**Pattern:** Workers started via `startWorkers()` in server startup. Dynamic imports for service classes. Workers skip in test environment.

## Authentication — JWT (@fastify/jwt)

- **Middleware:** `backend/src/common/middleware/authenticate.ts`
- **Module:** `backend/src/modules/auth/`

**Env vars:**
- `JWT_ACCESS_SECRET` (min 32 chars)
- `JWT_REFRESH_SECRET` (min 32 chars)
- `JWT_ACCESS_EXPIRY` (default: `15m`)
- `JWT_REFRESH_EXPIRY` (default: `30d`)

**Flow:** Access token (short-lived) + Refresh token (long-lived). Refresh tokens stored in DB, can be revoked. Token blacklisting via Redis.

## Google Maps (Deferred)

- **Env var:** `GOOGLE_MAPS_API_KEY` (configured but not yet used in code)
- **Planned for:** Places autocomplete, geocoding, distance matrix for service radius

## Environment Variables Summary

All env vars are validated at startup via Zod in `backend/src/config/env.ts`. Required vars cause process exit on failure. Optional vars (most third-party services) fall back to stubs/defaults.

| Category | Required | Optional |
|----------|----------|----------|
| Core | `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | `PORT`, `HOST`, `NODE_ENV`, `LOG_LEVEL` |
| Redis | — | `REDIS_URL` (defaults to localhost) |
| Stripe | — | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CONNECT_CLIENT_ID`, `STRIPE_CONNECT_RETURN_URL`, `STRIPE_CONNECT_REFRESH_URL` |
| R2 | — | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` |
| SendGrid | — | `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME` |
| FCM | — | `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY` |
| AI | — | `GEMINI_API_KEY` |
| Maps | — | `GOOGLE_MAPS_API_KEY` |
| URLs | — | `APP_URL`, `FRONTEND_URL` |
