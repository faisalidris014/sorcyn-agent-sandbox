# Constraints (SPEC Intel)

System contracts, schema, NFRs, and protocol contracts extracted from classified SPEC sources.

**Sources:**
- docs/api.md (SPEC, API Reference)
- docs/database.md (SPEC, Database Schema)

---

## API Contract

### CON-base-url
- **scope:** API base
- **type:** api-contract
- **content:** Base URL `/api/v1/`. JWT Bearer auth (access 15min + refresh 30d). Errors in RFC 7807 Problem Details format. Swagger UI at `/docs`.
- **source:** docs/api.md

### CON-request-id-tracing
- **scope:** Request correlation
- **type:** api-contract
- **content:** All responses include `x-request-id` header. If client sends `x-request-id` in request, server echoes back. Otherwise server generates UUID v4. Error bodies include `requestId` field.
- **source:** docs/api.md §Common Headers

### CON-health-endpoint
- **scope:** Health check
- **type:** api-contract
- **content:** `GET /health` (no auth). Returns 200 OK or 503 Degraded. Body includes `status`, `timestamp`, `version`, `uptime`, `memoryMB`, and `checks` map for `database`, `redis`, `queues`, plus `queueMetrics` (waiting/active counts per queue).
- **source:** docs/api.md §Health Check

### CON-auth-endpoints
- **scope:** Auth API
- **type:** api-contract
- **content:** `/api/v1/auth/*` endpoints with rate limits:
  - `POST /register` — 3/hour, body: email, password (8+ chars complex), firstName, lastName, accountType, locationZip, agreeToTerms, agreeToPrivacy
  - `POST /login` — 10/min
  - `POST /refresh` — token rotation
  - `POST /logout` — auth required, blacklists access + deletes refresh
  - `GET /verify-email?token=xxx` — single-use
  - `POST /resend-verification` — 1/5min
  - `POST /forgot-password` — 3/hour, 3/day per email
  - `POST /reset-password` — token-based
- **source:** docs/api.md §Auth (Session 2)

### CON-rate-limits
- **scope:** Rate limits
- **type:** api-contract
- **content:** Documented limits:
  - Register: 3/hour per IP
  - Login: 10/min
  - Resend verification: 1 per 5 minutes
  - AI post creation: 20/hour per user (Redis `ai:rate:{userId}`)
  - Messages: 50/hour per user (Redis `msg:rate:{userId}`)
  - Forgot-password: 3/hour, 3/day per email
- **source:** docs/api.md, CLAUDE.md, docs/decisions.md

### CON-response-envelope
- **scope:** Standard response shape
- **type:** api-contract
- **content:** Success: `{ success: true, data: ..., meta?: { pagination } }`. Error (RFC 7807): `{ success: false, error: { type, title, status, detail, requestId, errors? } }`. Pagination meta: `{ page, perPage, total, totalPages }`.
- **source:** docs/api.md §Response Envelope

### CON-endpoint-modules
- **scope:** API surface
- **type:** api-contract
- **content:** 19 route groups under `/api/v1/`:
  - `auth/*`, `users/*`, `sellers/*`, `categories/*`, `posts/*` (incl. `posts/ai/*`), `search/*`
  - `offers/*`, `transactions/*`, `payments/*` (incl. webhook), `messages/*` (Socket.IO)
  - `reviews/*`, `notifications/*`, `admin/*`
  - `uploads/*` (Cloudflare R2 presigned URLs), `disputes/*`, `payouts/*`
  - `saved-searches/*`, `saved-sellers/*`
- **source:** docs/api.md, CLAUDE.md

### CON-saved-searches-cap
- **scope:** Saved searches
- **type:** api-contract
- **content:** Max 25 saved searches per user.
- **source:** docs/api.md, CLAUDE.md

### CON-uploads-presigned
- **scope:** File uploads
- **type:** api-contract
- **content:** `POST /api/v1/uploads` returns presigned URL for direct client upload to Cloudflare R2 (S3-compatible). MIME types allowed: jpeg, png, webp, heic, heif, pdf. **Video MIME types (mp4, mov, etc.) NOT currently allowed in storage.ts** — see context.md gaps.
- **source:** docs/api.md §Uploads, docs/BACKEND_AUDIT_REPORT.md §2.5

### CON-socketio-events
- **scope:** Real-time event protocol
- **type:** protocol
- **content:** Socket.IO events on `/socket.io`:
  - **Server → Client:** `new_message`, `notification`, `typing_start`, `typing_stop`, `messages_read`, `connection_change`, `presence_update`
  - **Client → Server:** `heartbeat` (every 4 minutes to refresh presence TTL), `typing_start`, `typing_stop`, `mark_read`
  - **Rooms:** `conv:{conversationId}` (per-conversation), `user:{userId}` (per-user notifications)
  - **Auth:** JWT token in `socket.handshake.auth.token`. Token blacklist checked against Redis. Decoded user attached as `socket.data.user`.
- **source:** docs/api.md §WebSocket Events, docs/decisions.md (Session 13)

---

## Database Schema Contract

### CON-orm-conventions
- **scope:** Schema conventions
- **type:** schema
- **content:**
  - Primary keys: UUID v4 (`@default(uuid())`, `@db.Uuid`)
  - Soft deletes: `deleted_at` on every model (except AuditLog)
  - Audit columns: `created_at`, `updated_at`
  - Mapping: camelCase code → snake_case DB (`@map()`); PascalCase model → snake_case table (`@@map()`)
  - JSONB for flexible data (categories, photos, prefs, category-specific data)
  - Full-text search: `tsvector` column on posts with GIN index + auto-update trigger
- **source:** docs/database.md §Conventions

### CON-models-15
- **scope:** Schema models
- **type:** schema
- **content:** 15 models (CLAUDE.md says 16 — counts both User and SellerProfile separately): User, SellerProfile, Category, Post, Offer, Transaction, Review, Conversation, Message, Dispute, Payout, Notification, VerificationRequest, SavedSearch, AuditLog. SavedSeller is also documented in CLAUDE.md (likely added post-database.md doc).
- **source:** docs/database.md §Models, CLAUDE.md

### CON-enums-20
- **scope:** Schema enums
- **type:** schema
- **content:** 20+ enums (CLAUDE.md says 24): AccountType, UserStatus, BudgetType, Urgency, PostStatus, OfferType, PricingType, OfferStatus, TransactionType, EscrowStatus, TransactionStatus (18 states), CancelledBy, ModerationStatus, ConversationStatus, RequestedResolution, DisputeStatus, DisputeOutcome, PayoutStatus, VerificationType, VerificationRequestStatus, SearchType, ActorType.
- **source:** docs/database.md §Enums

### CON-user-model
- **scope:** User schema
- **type:** schema
- **content:** Fields: user_id (UUID PK), email (unique, varchar 255), password_hash (bcrypt 12+), account_type (buyer/seller/both), first_name, last_name, phone (optional), email_verified (default false), location fields (city/state/zip/country/lat/lng), notification_preferences (JSONB), rating (decimal 3,2), stripe_customer_id, is_admin (default false), status (active/suspended/banned/deleted).
- **source:** docs/database.md §User

### CON-seller-profile-model
- **scope:** SellerProfile schema
- **type:** schema
- **content:** Fields: seller_id (UUID PK), user_id (FK unique), business_name (optional), service_radius_miles (default 25), categories/subcategories (JSONB arrays of slugs), verification_tier (default 1), various `_verified` booleans (email/phone/ID/EIN/license/insurance/background_check), verification_badges (JSONB), license/insurance details, stripe_account_id, stripe_onboarding_status, rating.
- **source:** docs/database.md §SellerProfile

### CON-post-model
- **scope:** Post schema
- **type:** schema
- **content:** Fields: post_id (UUID PK), buyer_id (FK), category_id/subcategory_id (FK), title (varchar 200), description (text), budget_min/max (decimal 10,2), budget_type (range/open/fixed), location fields, urgency, category_specific (JSONB), status (draft/active/filled/expired/cancelled), search_vector (tsvector, auto-updated trigger), expires_at, photos (JSONB), videos (JSONB), publicAfter (3-day exclusivity).
- **source:** docs/database.md §Post

### CON-offer-uniqueness
- **scope:** Offer constraint
- **type:** schema
- **content:** Unique constraint `@@unique([postId, sellerId])` on Offer model — one offer per seller per post. Enforced both in DB and in service layer.
- **source:** docs/database.md §Offer

### CON-transaction-model
- **scope:** Transaction schema
- **type:** schema
- **content:** 18-state TransactionStatus enum. Financial fields: quote_amount, buyer_fee, stripe_fee, total_charged, platform_fee, platform_fee_percentage. Escrow status: held/released/refunded/frozen. Photos: before_photos, progress_photos, after_photos (all JSONB arrays). Shipping: tracking_number, carrier. Local meetup fields. `timeline` JSONB for status change log.
- **source:** docs/database.md §Transaction

### CON-review-uniqueness
- **scope:** Review constraint
- **type:** schema
- **content:** One review per transaction (unique on `transaction_id`). Fields: overall_rating (1-5), category_ratings (JSONB), written_review (optional), would_recommend (required), moderation_status, isAutoGenerated flag for day-73 auto-reviews.
- **source:** docs/database.md §Review

### CON-audit-log-immutable
- **scope:** AuditLog
- **type:** schema
- **content:** Immutable. NO `updated_at` or `deleted_at` columns. Records never modified. Every mutating admin action creates an entry with `actorType` (user/admin/system), action, resource type/ID, details (JSONB).
- **source:** docs/database.md §AuditLog, docs/decisions.md (Session 9)

### CON-fulltext-search
- **scope:** FTS implementation
- **type:** schema
- **content:** `Unsupported("tsvector")` column on posts. GIN index. Custom SQL trigger for auto-update (`prisma/custom-migrations/001_search_vector_trigger.sql`). Weighted: title=A, description=B. Query via `$queryRawUnsafe` with `plainto_tsquery()` + `ts_rank()`.
- **source:** docs/database.md §Full-Text Search, docs/prisma-7-patterns.md

### CON-redis-keys
- **scope:** Redis key conventions
- **type:** protocol
- **content:** Established Redis key patterns:
  - Auth: `auth:refresh:{userId}:{jti}` (TTL 30d/180d), `auth:blacklist:{jti}` (TTL ≤15m), `auth:email_verify:{token}` (24h), `auth:password_reset:{token}` (1h), `auth:login_attempts:{email}` (15m), `auth:login_lockout:{email}` (15m), `auth:resend_cooldown:{userId}` (5m), `auth:password_reset_count:{email}` (24h)
  - Messaging: `msg:rate:{userId}` (3600s, 50/hour cap)
  - AI: `ai:rate:{userId}` (3600s, 20/hour cap)
  - Presence: `presence:{userId}` (300s), `presence:socket:{socketId}` (300s)
- **source:** docs/database.md §Redis Keys, docs/decisions.md, BUILD_PROGRESS.md

### CON-prisma-json-null
- **scope:** Prisma JSON null
- **type:** schema
- **content:** Use `Prisma.JsonNull` for nullable JSON columns, NOT `null`. Cast `Record<string, any>` to `Prisma.InputJsonValue` for JSONB inputs.
- **source:** docs/database.md, docs/prisma-7-patterns.md, docs/decisions.md (Session 4)

### CON-zod-record-two-args
- **scope:** Zod 4 breaking change
- **type:** schema
- **content:** `z.record(z.string(), z.any())` — TWO args required (Zod 4 breaking change from Zod 3 single-arg form).
- **source:** docs/decisions.md (Session 4), docs/prisma-7-patterns.md

### CON-stripe-fields
- **scope:** Stripe integration fields
- **type:** schema
- **content:** Stripe-related fields:
  - User: `stripe_customer_id`
  - SellerProfile: `stripe_account_id`, `stripe_onboarding_status`, `stripe_charges_enabled`, `stripe_payouts_enabled`
  - Transaction: `stripe_payment_intent_id`, `stripe_charge_id`, `stripe_transfer_id`, `transfer_group`
  - Payout: `stripe_transfer_id`, `arrival_date`
  - Escrow state machine: held → released | refunded | frozen
- **source:** docs/database.md §Stripe Integration Fields

### CON-seed-data
- **scope:** Seeded data
- **type:** schema
- **content:**
  - 4 test accounts: `buyer@test.com`, `seller@test.com`, `both@test.com`, `admin@reversemarketplace.com` (all password `Password123!`)
  - 38 categories: Products (8 subs), Services (18 subs), Jobs (7 subs), plus disabled umbrellas Inventory/Wholesale (Phase 2) and Real Estate (Phase 3)
- **source:** docs/database.md §Seed Data, CLAUDE.md

---

## Implementation Patterns (Prisma 7)

### CON-no-url-in-schema
- **scope:** Prisma 7 datasource
- **type:** schema
- **content:** Schema datasource block has NO `url` field — connection URL goes in `prisma.config.ts`. PrismaClient must use `@prisma/adapter-pg` with `PrismaPg({ connectionString })`.
- **source:** docs/prisma-7-patterns.md, docs/decisions.md

### CON-prisma-config
- **scope:** Prisma 7 config
- **type:** schema
- **content:** `prisma.config.ts` exports `defineConfig` with: `schema` path, `datasource.url` (env-resolved), `migrations.seed` command. Replaces `package.json` `prisma.seed` and CLI `--url`.
- **source:** docs/prisma-7-patterns.md

### CON-transaction-forms
- **scope:** Prisma transactions
- **type:** schema
- **content:**
  - Array form `prisma.$transaction([...])` — multiple writes that must succeed atomically (e.g., offer acceptance: 4 writes)
  - Interactive form `prisma.$transaction(async (tx) => {...})` — read → compute → write within one tx (e.g., review submit reads current stats, computes new average, writes back)
- **source:** docs/decisions.md (Session 5, 7), docs/prisma-7-patterns.md

---

## Non-Functional Constraints (from PRD §16, restated for spec consumers)

### CON-nfr-response-times
- **scope:** Performance targets
- **type:** nfr
- **content:** API <200ms median / <500ms p95. Page load <2s web / <1.5s mobile. Search <500ms (PostgreSQL) / <200ms (ES Phase 2). Payment <3s. Image upload <5s for 5MB. DB query <100ms p95.
- **source:** ReverseMktplPRD.md §16.1

### CON-nfr-uptime
- **scope:** Availability targets
- **type:** nfr
- **content:** 99.9% MVP / 99.95% Phase 2. Maintenance Sundays 2-4 AM UTC, 48h notice. RTO <4h, RPO <1h.
- **source:** ReverseMktplPRD.md §16.3

### CON-nfr-security
- **scope:** Security baseline
- **type:** nfr
- **content:** TLS 1.2+ in transit, AES-256 at rest. JWT refresh rotation. PCI-DSS via Stripe. GDPR + CCPA. CSP + CSRF + SameSite cookies. Server-side input validation. Parameterized queries only.
- **source:** ReverseMktplPRD.md §12, §16.6
