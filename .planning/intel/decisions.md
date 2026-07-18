# Decisions (ADR Intel)

Aggregated locked architectural and product decisions extracted from classified ADR sources.

**Source:** docs/decisions.md (ADR, locked, aggregate decision log spanning 14 build sessions)
**Status:** All decisions below are LOCKED — implemented and shipped in the codebase.

---

## Framework & Runtime

### DEC-fastify-framework
- **scope:** HTTP framework
- **decision:** Fastify 5 as the HTTP framework (not Express)
- **status:** locked
- **rationale:** Built-in schema validation, pino logging, plugin system, TypeScript-first, faster than Express, official Swagger/OpenAPI plugin
- **source:** docs/decisions.md (Session 1)

### DEC-esm-modules
- **scope:** Module system
- **decision:** ESM modules (`"type": "module"` in package.json, ESNext target). All imports use `.js` extensions. `tsx` for dev, `tsc` for production build
- **status:** locked
- **source:** docs/decisions.md (Session 1)

### DEC-node-version
- **scope:** Runtime version
- **decision:** Node.js 20+ LTS, TypeScript 5+
- **status:** locked
- **source:** docs/decisions.md, CLAUDE.md

---

## Database & ORM

### DEC-prisma-7-driver-adapter
- **scope:** ORM and connection pattern
- **decision:** Prisma 7 with `@prisma/adapter-pg` (driver adapter pattern). No `url` in schema datasource. Connection URL goes in `prisma.config.ts`. PrismaClient requires `PrismaPg({ connectionString })`.
- **status:** locked
- **source:** docs/decisions.md (Session 1), docs/prisma-7-patterns.md

### DEC-postgres-5433
- **scope:** Local Postgres port
- **decision:** Docker PostgreSQL on host port 5433 (not 5432)
- **status:** locked
- **rationale:** Avoids conflict with Mac developers' local Postgres on 5432
- **source:** docs/decisions.md (Session 1)

### DEC-uuid-pks
- **scope:** Primary key strategy
- **decision:** UUID v4 for all primary keys
- **status:** locked
- **source:** docs/decisions.md (Session 1)

### DEC-soft-deletes
- **scope:** Deletion strategy
- **decision:** `deleted_at` timestamp column instead of hard deletes; service layer filters `WHERE deleted_at IS NULL`. AuditLog is exempt (immutable).
- **status:** locked
- **source:** docs/decisions.md (Session 1)

### DEC-jsonb-flexible
- **scope:** Flexible per-category data
- **decision:** PostgreSQL JSONB for category-specific data, photos, notification preferences. GIN indexes for query performance.
- **status:** locked
- **source:** docs/decisions.md (Session 1)

### DEC-fts-postgres-mvp
- **scope:** Full-text search
- **decision:** PostgreSQL `tsvector` + GIN index + auto-update trigger for MVP. Elasticsearch planned for Phase 2.
- **status:** locked
- **source:** docs/decisions.md (Session 1, Session 4)

## Migrations

### DEC-forward-compatible-migrations
- **scope:** Database migration policy during canary windows
- **decision:** Every Prisma migration must be additive-only during canary deploys: nullable new columns, new tables, no DROPs, no `NOT NULL` on existing columns, no RENAMEs, no enum value removals. Destructive migrations ship in a follow-up release after the prior version has fully drained (expand → migrate → contract).
- **status:** locked
- **rationale:** During a 10/90 canary split, both versions run simultaneously against the same database. A destructive migration would break the still-serving stable version. Forward-compatible-only is the simplest forcing function that prevents data corruption without a two-phase deploy.
- **enforcement:** CI gate via regex assertion in `backend/tests/audit/closeout-audit.test.ts` (forbids DROP / RENAME / SET NOT NULL on existing columns in latest migration).
- **source:** Phase 4 CONTEXT.md D-04, Phase 4 RESEARCH.md §2

---

## Storage & Media

### DEC-cloudflare-r2
- **scope:** File storage
- **decision:** Cloudflare R2 for object storage (NOT AWS S3). Uses `@aws-sdk/client-s3` with R2 endpoint. MinIO at `localhost:9000` for local dev fallback.
- **status:** locked
- **rationale:** $0 egress vs AWS S3 egress fees; S3-compatible API
- **source:** docs/decisions.md (Session 1, Session 3)

---

## AI

### DEC-gemini-flash-lite-mvp
- **scope:** AI model for MVP
- **decision:** Google Gemini Flash-Lite for AI features in MVP. Lazy SDK init.
- **status:** locked
- **rationale:** Free tier 1,000 req/day. Plan to upgrade to Claude Haiku as revenue grows ($85-112/month at 10K users).
- **source:** docs/decisions.md (Session 1, Session 8)

### DEC-ai-rate-limit
- **scope:** AI endpoint rate limit
- **decision:** 20 req/hr per user via Redis key `ai:rate:{userId}` (3600s TTL)
- **status:** locked
- **source:** docs/decisions.md (Session 8)

### DEC-ai-slug-output
- **scope:** AI output format
- **decision:** AI returns category/subcategory slugs (not UUIDs); service resolves slugs to DB IDs. Category tree injected into every prompt.
- **status:** locked
- **source:** docs/decisions.md (Session 8)

### DEC-ai-zod-validation
- **scope:** AI response validation
- **decision:** Every AI response parsed through strict Zod schema. JSON extraction strips markdown code-block wrappers.
- **status:** locked
- **source:** docs/decisions.md (Session 8)

---

## Validation & Errors

### DEC-zod-4-validation
- **scope:** Runtime validation
- **decision:** Zod 4 for env validation and request schemas. `z.record(z.string(), z.any())` (two args required in Zod 4).
- **status:** locked
- **source:** docs/decisions.md (Session 1, Session 4)

### DEC-rfc-7807-errors
- **scope:** Error format
- **decision:** All API errors follow RFC 7807 Problem Details (`type`, `title`, `status`, `detail`, `errors` for field-level)
- **status:** locked
- **source:** docs/decisions.md (Session 1)

### DEC-request-id-tracing
- **scope:** Request tracing
- **decision:** Custom Fastify middleware reads `x-request-id` header (or generates UUID v4). Echoed in response header. Included in error bodies.
- **status:** locked
- **source:** docs/decisions.md (Post-Session 13)

---

## Authentication

### DEC-jwt-access-refresh
- **scope:** Auth token model
- **decision:** Short-lived access tokens (15m, `@fastify/jwt`) + long-lived refresh tokens (30d/180d, `jsonwebtoken`). Separate secrets for independent rotation.
- **status:** locked
- **source:** docs/decisions.md (Session 2)

### DEC-refresh-rotation-reuse
- **scope:** Refresh token security
- **decision:** Refresh rotation with reuse detection. Each refresh invalidates the old token. If a previously-used token is presented, all sessions for that user are killed.
- **status:** locked
- **source:** docs/decisions.md (Session 2)

### DEC-redis-token-blacklist
- **scope:** Access token revocation
- **decision:** Revoked access tokens stored in Redis `auth:blacklist:{jti}` with TTL ≤15m
- **status:** locked
- **source:** docs/decisions.md (Session 2)

### DEC-timing-safe-login
- **scope:** Login enumeration defense
- **decision:** Always run bcrypt compare (use pre-computed dummy hash when user doesn't exist)
- **status:** locked
- **source:** docs/decisions.md (Session 2)

### DEC-login-lockout
- **scope:** Brute-force protection
- **decision:** 5 failed login attempts → 15-minute Redis-backed lockout
- **status:** locked
- **source:** docs/decisions.md (Session 2)

### DEC-bcrypt-12-rounds
- **scope:** Password hashing
- **decision:** bcrypt with 12+ rounds
- **status:** locked
- **source:** docs/decisions.md (Session 2), CLAUDE.md

### DEC-session-invalidate-on-password
- **scope:** Session security
- **decision:** Both `changePassword` and `deleteAccount` invalidate all refresh tokens via Redis SCAN of `auth:refresh:{userId}:*`
- **status:** locked
- **source:** docs/decisions.md (Session 3, Session 9)

---

## Authorization & Admin

### DEC-isadmin-boolean
- **scope:** Admin RBAC model
- **decision:** Admin access via simple `isAdmin` boolean on User model, included in JWT payload. No full RBAC for MVP.
- **status:** locked
- **source:** docs/decisions.md (Session 9)

### DEC-plugin-level-admin-auth
- **scope:** Admin route protection
- **decision:** Admin routes use `app.addHook('onRequest', app.authenticate/requireAdmin)` at the Fastify plugin level
- **status:** locked
- **source:** docs/decisions.md (Session 9)

### DEC-admin-cant-suspend-admin
- **scope:** Admin lockout protection
- **decision:** `suspendUser` / `banUser` reject if target is admin
- **status:** locked
- **source:** docs/decisions.md (Session 9)

### DEC-audit-log-mutating-actions
- **scope:** Admin accountability
- **decision:** Every mutating admin action creates an immutable AuditLog entry (`actorType: 'admin'`, action, resource type/ID, details)
- **status:** locked
- **source:** docs/decisions.md (Session 9)

---

## Account Model

### DEC-single-account-toggle
- **scope:** Buyer/Seller account model
- **decision:** Single `users` table with `account_type` enum (`buyer`, `seller`, `both`). Single login + UI toggle (Uber driver/rider style). `SellerProfile` is a separate one-to-one model.
- **status:** locked
- **source:** docs/decisions.md (Session 1), CLAUDE.md

### DEC-public-private-profile-separation
- **scope:** Privacy
- **decision:** `getMe()` returns full profile; `getUserById()` returns only public fields. Same pattern for sellers (`getMySellerProfile` vs `getSellerById`).
- **status:** locked
- **source:** docs/decisions.md (Session 3)

### DEC-soft-delete-email-prefix
- **scope:** Account deletion
- **decision:** On delete, email prefixed with `deleted_{timestamp}_` so the unique constraint stays valid and the original email is freed for reuse
- **status:** locked
- **source:** docs/decisions.md (Session 3)

### DEC-auto-create-seller-profile
- **scope:** Friction reduction
- **decision:** Switching `accountType` to `seller`/`both` auto-creates a `SellerProfile` if missing
- **status:** locked
- **source:** docs/decisions.md (Session 3)

### DEC-profile-strength-score
- **scope:** Seller completeness
- **decision:** `profileStrength` field 0-100 calculated from weighted criteria (business name, bio, photos, verification status)
- **status:** locked
- **source:** docs/decisions.md (Session 3)

### DEC-seller-id-not-user-id
- **scope:** Seller identifier resolution
- **decision:** All offer and transaction operations resolve `SellerProfile.id` from `userId` (NOT use `userId` directly). `offers` and `transactions` tables FK to `seller_profiles.seller_id`.
- **status:** locked
- **source:** docs/decisions.md (Session 5), CLAUDE.md

---

## Verification

### DEC-badge-based-verification
- **scope:** Seller verification
- **decision:** Badge-based (Licensed, Insured, ID Verified, Background Checked) — NOT mandatory verification. Background check required ONLY for high-risk categories (childcare, pet care, in-home services). Non-verified sellers allowed without badges.
- **status:** locked
- **source:** docs/decisions.md (Session 1), CLAUDE.md

### DEC-verification-request-model
- **scope:** Verification approval pipeline
- **decision:** Verification document submissions create `VerificationRequest` with `pending` status. Approval handled in admin module.
- **status:** locked
- **source:** docs/decisions.md (Session 3)

### DEC-verification-tier-recalc
- **scope:** Tier progression
- **decision:** On verification approval, `verificationTier` is recalculated from all verified badges. Tier 1 → 2 (ID/EIN) → 3 (license/insurance) → 4 (background check).
- **status:** locked
- **source:** docs/decisions.md (Session 9)

---

## Posts

### DEC-post-edit-before-offers
- **scope:** Post mutability
- **decision:** Posts editable only if `offerCount === 0`. Otherwise buyer must cancel and create a new post.
- **status:** locked
- **source:** docs/decisions.md (Session 4)

### DEC-max-active-posts
- **scope:** Spam protection
- **decision:** Max 10 active posts per buyer (drafts don't count)
- **status:** locked
- **source:** docs/decisions.md (Session 4)

### DEC-single-extension-3-days
- **scope:** Post lifecycle
- **decision:** Posts can be extended exactly once, adding 3 days to `expiresAt`
- **status:** locked
- **source:** docs/decisions.md (Session 4)

### DEC-repost-as-copy
- **scope:** Repost semantics
- **decision:** Reposting copies all fields but creates a new record with fresh ID, timestamps, and zero counters. Original is preserved.
- **status:** locked
- **source:** docs/decisions.md (Session 4)

### DEC-post-detail-optional-auth
- **scope:** Public/private hybrid endpoint
- **decision:** `GET /posts/:postId` uses try/catch `jwtVerify()` (not the `app.authenticate` decorator). Public endpoint that returns extra fields if requester is the post owner.
- **status:** locked
- **source:** docs/decisions.md (Session 4)

### DEC-route-ordering
- **scope:** Fastify routing
- **decision:** Static routes (`/me`, `/my-offers`) registered BEFORE parameterized routes (`/:id`)
- **status:** locked
- **source:** docs/decisions.md (Session 5), CLAUDE.md

---

## Offers

### DEC-max-offers-per-post
- **scope:** Offer cap
- **decision:** Max 25 offers per post
- **status:** locked
- **rationale:** Prevents overwhelming buyers; limits per-post DB growth; generous enough for competitive pricing without analysis paralysis
- **source:** docs/decisions.md (Session 5)
- **note:** Code constant currently `MAX_OFFERS_PER_POST = 10` per docs/BACKEND_AUDIT_REPORT.md §4.2 — see INGEST-CONFLICTS.md for AUTO-RESOLVED entry. CLAUDE.md mention of "10 offers per seller listing" describes a different cap (per-seller, not per-post) and is informational/separate.

### DEC-atomic-offer-acceptance
- **scope:** Offer acceptance integrity
- **decision:** `prisma.$transaction([...])` array form for 4 simultaneous writes on offer accept. Prevents race conditions.
- **status:** locked
- **source:** docs/decisions.md (Session 5)

### DEC-best-match-in-memory
- **scope:** Best Match scoring
- **decision:** In-memory scoring after fetching offers (NOT SQL). Scoring formula combines seller rating, location, response time, completion rate with dynamic weights. At MVP scale, fast enough.
- **status:** locked
- **source:** docs/decisions.md (Session 5)

### DEC-withdraw-cooldown-24h
- **scope:** Anti-gaming
- **decision:** 24-hour wait between withdrawing an offer and re-submitting to the same post
- **status:** locked
- **source:** docs/decisions.md (Session 5)

---

## Fees & Payments (Stripe Connect)

### DEC-stripe-connect-standard
- **scope:** Stripe Connect account type
- **decision:** Stripe Connect Standard accounts for sellers (not Express, not Custom)
- **status:** locked
- **rationale:** Sellers get their own Stripe dashboard; less platform liability; Stripe handles KYC/tax forms
- **source:** docs/decisions.md (Session 6)

### DEC-separate-charges-and-transfers
- **scope:** Escrow flow
- **decision:** Separate charges + transfers (NOT destination charges). Platform collects full amount via PaymentIntent → holds funds → creates Transfer to seller's connected account on approval. `transfer_group` field links charge and transfer.
- **status:** locked
- **rationale:** Full platform control over escrow timing; more flexible than destination charges for complex marketplace rules
- **source:** docs/decisions.md (Session 6)
- **note:** PRD §8.5 (FR-PAY-001) describes "Destination Charges" — superseded by this ADR. See INGEST-CONFLICTS.md for AUTO-RESOLVED entry.

### DEC-tiered-fee-structure
- **scope:** Marketplace fees
- **decision:** Tiered fees by transaction type:
  - Services: buyer +5%, seller -8% + Stripe fees
  - Shipped products: buyer +5%, seller -6% + Stripe fees
  - Local platform: buyer +3%, seller -3% + Stripe fees
  - Local cash: $0 (free)
  - Jobs: per-lead pricing $10-500 depending on role level
- **status:** locked
- **source:** docs/decisions.md (Session 5), CLAUDE.md

### DEC-fee-calc-pure-utility
- **scope:** Fee calculation code shape
- **decision:** `calculateFees()` is a pure function in `common/utils/fees.ts` (not a service class)
- **status:** locked
- **source:** docs/decisions.md (Session 5)

### DEC-stripe-gate-on-accept
- **scope:** Acceptance preconditions
- **decision:** `acceptOffer` requires `stripeChargesEnabled === true` for all non-cash transaction types (production only)
- **status:** locked
- **source:** docs/decisions.md (Session 6)

### DEC-stripe-dev-bypass
- **scope:** Local dev usability
- **decision:** Stripe onboarding checks in `acceptOffer()` and `createPaymentIntent()` skipped when `NODE_ENV !== 'production'`
- **status:** locked
- **source:** docs/decisions.md (Post-Session)

### DEC-lazy-stripe-init
- **scope:** SDK initialization
- **decision:** `getStripe()` initializes Stripe SDK on first call, not at import time. Same lazy pattern for Gemini and Sentry.
- **status:** locked
- **source:** docs/decisions.md (Session 6, 8, 14)

### DEC-webhook-raw-body-plugin
- **scope:** Stripe webhook handling
- **decision:** Stripe webhook handler is a separate Fastify plugin with `addContentTypeParser('application/json', { parseAs: 'buffer' })` scoped to it
- **status:** locked
- **source:** docs/decisions.md (Session 6)

### DEC-graceful-stripe-failure
- **scope:** Resilience
- **decision:** Transaction approve/cancel ops catch and log Stripe errors without failing the DB op. Manual admin retry possible.
- **status:** locked
- **source:** docs/decisions.md (Session 6)

---

## Transactions & Escrow

### DEC-7-day-auto-release
- **scope:** Escrow release
- **decision:** When seller marks transaction complete, 7-day countdown. If buyer doesn't respond, funds auto-release. Implementation via `autoReleaseAt` timestamp + BullMQ sweep job.
- **status:** locked
- **source:** docs/decisions.md (Session 5, Post-Session 13)

### DEC-max-2-change-requests
- **scope:** Change request cap
- **decision:** Max 2 buyer change requests per transaction (counted from `timeline` JSON). Then buyer must approve or open dispute.
- **status:** locked
- **source:** docs/decisions.md (Session 5)

### DEC-status-transitions-by-type
- **scope:** Transaction state machine
- **decision:** Valid transitions validated per `transactionType` (services / shipped / local each have distinct progressions)
- **status:** locked
- **source:** docs/decisions.md (Session 5)

### DEC-bullmq-sweep-pattern
- **scope:** Scheduled jobs
- **decision:** Use BullMQ v5 `upsertJobScheduler()` with stable string key. Sweep pattern: cron-like job fires, worker queries DB for ALL records needing processing, processes each individually with per-record try/catch.
- **status:** locked
- **rationale:** Simpler than per-record delayed jobs. Sweep WHERE clause is naturally idempotent.
- **source:** docs/decisions.md (Post-Session 13)

### DEC-release-escrow-before-status-update
- **scope:** Auto-release ordering
- **decision:** Auto-release worker calls `paymentsService.releaseEscrow()` BEFORE updating transaction status to `completed` (because `releaseEscrow()` guards on `escrowStatus === 'held'`)
- **status:** locked
- **source:** docs/decisions.md (Post-Session 13)

### DEC-release-escrow-reason-param
- **scope:** Reason tracking
- **decision:** `releaseEscrow(transactionId, reason = 'buyer_approved')`. Auto-release passes `'auto_release'`.
- **status:** locked
- **source:** docs/decisions.md (Post-Session 13)

---

## Messaging & Real-time

### DEC-socketio-over-websocket
- **scope:** Real-time transport
- **decision:** Socket.IO 4 (NOT native WebSocket) for real-time messaging. Auto-reconnect, room broadcasting, HTTP long-polling fallback, heartbeat, structured events.
- **status:** locked
- **source:** docs/decisions.md (Session 13)

### DEC-jwt-auth-websocket
- **scope:** WebSocket auth
- **decision:** Reuse `JWT_ACCESS_SECRET` via Socket.IO middleware. Token in `socket.handshake.auth.token`. Blacklist checked against Redis. Decoded user on `socket.data.user`.
- **status:** locked
- **source:** docs/decisions.md (Session 13)

### DEC-redis-presence
- **scope:** Online presence
- **decision:** Two Redis keys per connected user (`presence:{userId}` and `presence:socket:{socketId}`) with 300s TTL. Client `heartbeat` event every 4 minutes refreshes TTL.
- **status:** locked
- **source:** docs/decisions.md (Session 13)

### DEC-hybrid-realtime-polling
- **scope:** Delivery strategy
- **decision:** Socket.IO primary + polling fallback (30s active chat, 60s conversations list). Silent polling, no UI flicker.
- **status:** locked
- **source:** docs/decisions.md (Session 13)

### DEC-dual-delivery-rest-socket
- **scope:** Send pipeline
- **decision:** Messages sent via REST (persistence + validation + rate limit + moderation) → service emits `new_message` to `conv:{id}` room and `notification` to `user:{recipientId}` room. `getIO()` returns null gracefully if Socket.IO not initialized.
- **status:** locked
- **source:** docs/decisions.md (Session 13)

### DEC-msg-rate-50-per-hour
- **scope:** Message rate limit
- **decision:** Max 50 messages/hour per user via Redis `msg:rate:{userId}` (3600s TTL)
- **status:** locked
- **source:** docs/decisions.md (Session 7)

### DEC-external-payment-detection
- **scope:** Anti-bypass moderation
- **decision:** Messages mentioning venmo/cashapp/zelle/paypal (regex match) are flagged with `moderationStatus='pending'` (not blocked outright)
- **status:** locked
- **source:** docs/decisions.md (Session 7)

### DEC-conv-auto-create-on-accept
- **scope:** Conversation lifecycle
- **decision:** Conversation record created atomically as part of the `acceptOffer` `prisma.$transaction`
- **status:** locked
- **source:** docs/decisions.md (Session 7)

### DEC-stream-based-socket-events
- **scope:** Mobile event architecture
- **decision:** `SocketClient` uses `StreamController.broadcast()` per event type. Providers subscribe via `StreamSubscription`, cancel in `dispose()`.
- **status:** locked
- **source:** docs/decisions.md (Session 13)

### DEC-socket-auto-lifecycle
- **scope:** Socket lifecycle (mobile)
- **decision:** `SocketNotifier` listens to `authProvider` — auto-connect on auth true, disconnect on auth false
- **status:** locked
- **source:** docs/decisions.md (Session 13)

---

## Reviews

### DEC-review-interactive-transaction
- **scope:** Review atomicity
- **decision:** `submitReview` uses interactive `prisma.$transaction(async (tx) => {...})` to read current stats, compute new average, write back atomically
- **status:** locked
- **source:** docs/decisions.md (Session 7)

### DEC-auto-review-day-73
- **scope:** Auto-review timing
- **decision:** If buyer hasn't reviewed 73 days after transaction completion, auto 5-star review is generated. Reminders at days 7, 30, 60. `isAutoGenerated: true` flag for transparency. BullMQ `jobId` for dedup.
- **status:** locked
- **source:** docs/decisions.md (Session 7), CLAUDE.md
- **note:** PRD US-B-007 mentions a "60-day window" for review submission — superseded; ADR is canonical. See INGEST-CONFLICTS.md.

### DEC-review-reminders-bullmq-jobid
- **scope:** Reminder dedup
- **decision:** Reminders use BullMQ `jobId` (e.g., `review-remind-{transactionId}-day7`) to silently ignore duplicates
- **status:** locked
- **source:** docs/decisions.md (Session 7)

---

## Notifications & Async

### DEC-bullmq-notifications
- **scope:** Notification delivery
- **decision:** BullMQ for async notification delivery (push + email). Two queues: `notifications` (immediate), `review-reminders` (scheduled). Workers disabled in `NODE_ENV=test`.
- **status:** locked
- **source:** docs/decisions.md (Session 7)

### DEC-notifications-internal-only
- **scope:** Notification API surface
- **decision:** `NotificationsService.createNotification()` is internal only — no public POST endpoint. User-facing API only reads/marks-read/deletes.
- **status:** locked
- **source:** docs/decisions.md (Session 7)

### DEC-graceful-external-stubs
- **scope:** External service resilience
- **decision:** `sendEmail()` and `sendPush()` never throw. Log to console when API keys absent; actually send when keys present. Fire-and-forget pattern.
- **status:** locked
- **source:** docs/decisions.md (Session 7)

### DEC-fcm-invalid-token-cleanup
- **scope:** FCM token hygiene
- **decision:** `sendPush()` returns `{ sent: boolean; invalidToken?: boolean }`. Notification service auto-clears `fcmToken` when `invalidToken: true`.
- **status:** locked
- **source:** docs/decisions.md (Session 14)

---

## Frontend (Flutter)

### DEC-flutter-riverpod
- **scope:** Mobile state management
- **decision:** Flutter with Riverpod (StateNotifier + StateNotifierProvider, no code generation). Compile-safe, supports `ref.listen` for reactive navigation, no BuildContext required.
- **status:** locked
- **source:** docs/decisions.md (Session 10)

### DEC-gorouter-auth-guards
- **scope:** Mobile navigation
- **decision:** GoRouter with `redirect` callback checking `authProvider`. `_AuthRefreshNotifier` bridges Riverpod → GoRouter.
- **status:** locked
- **source:** docs/decisions.md (Session 10)

### DEC-dio-singleton-interceptors
- **scope:** Mobile HTTP client
- **decision:** Single Dio instance with `AuthInterceptor` (token injection + 401 refresh) and `LoggingInterceptor`. Refresh uses fresh Dio instance to avoid loops. `_isRefreshing` flag for concurrent refresh.
- **status:** locked
- **source:** docs/decisions.md (Session 10)

### DEC-compile-time-env
- **scope:** Mobile config
- **decision:** API base URL via `--dart-define=API_BASE_URL=...` at compile time. Same pattern for `SENTRY_DSN`. Empty string disables.
- **status:** locked
- **source:** docs/decisions.md (Session 10, 14)

### DEC-secure-storage-tokens
- **scope:** Mobile token storage
- **decision:** `flutter_secure_storage` with `encryptedSharedPreferences: true` on Android. iOS Keychain / Android EncryptedSharedPreferences.
- **status:** locked
- **source:** docs/decisions.md (Session 10)

### DEC-material3-purple
- **scope:** Mobile theme
- **decision:** Material 3 light theme; primary `#7C3AED` (purple); 12px border radius; filled inputs. Brand colors purple + white.
- **status:** locked
- **source:** docs/decisions.md (Session 10), CLAUDE.md

### DEC-feature-first-structure
- **scope:** Flutter directory structure
- **decision:** `lib/features/{name}/{data,providers,presentation/screens,presentation/widgets}/`. Shared in `lib/core/` and `lib/shared/`.
- **status:** locked
- **source:** docs/decisions.md (Session 10)

### DEC-stateful-shell-route
- **scope:** Navigation shell
- **decision:** GoRouter `StatefulShellRoute.indexedStack` for bottom nav (4 tabs). `IndexedStack` preserves tab state.
- **status:** locked
- **source:** docs/decisions.md (Session 11)

### DEC-mode-toggle-persisted
- **scope:** Buyer/Seller mode
- **decision:** `AppModeNotifier` with `AppMode` enum (buyer/seller), persisted to SecureStorage. Watched by `BottomNavShell` and GoRoute builders.
- **status:** locked
- **source:** docs/decisions.md (Session 12)

### DEC-mode-aware-nav-single-shell
- **scope:** Mode switching in nav
- **decision:** Single `StatefulShellRoute` with `Consumer` widgets in builders that swap screens based on `appModeProvider` (rather than separate shell routes per mode)
- **status:** locked
- **source:** docs/decisions.md (Session 12)

### DEC-client-fee-preview
- **scope:** Submit-offer UX
- **decision:** Client-side 8% platform fee preview only (informational); actual fee computed server-side
- **status:** locked
- **source:** docs/decisions.md (Session 12)

### DEC-url-launcher-stripe
- **scope:** Stripe Connect onboarding UX
- **decision:** `url_launcher` opens Stripe Connect onboarding in external browser (not WebView)
- **status:** locked
- **source:** docs/decisions.md (Session 12)

### DEC-i18n-flutter-localizations
- **scope:** i18n
- **decision:** ARB-file-based localization via `flutter_localizations` + `intl` (NOT third-party packages). Type-safe generated `AppLocalizations` class. ICU plurals/select.
- **status:** locked
- **source:** docs/decisions.md (Session 13)

### DEC-10-target-languages
- **scope:** i18n languages
- **decision:** English (default), Spanish, Chinese, Arabic, French, Portuguese, Hindi, Vietnamese, Korean, Japanese
- **status:** locked
- **rationale:** DFW demographics (es/vi/zh/ko); ar adds RTL support; hi/ja/fr/pt for expansion
- **source:** docs/decisions.md (Session 13)

### DEC-firebase-graceful-init
- **scope:** Mobile resilience
- **decision:** `Firebase.initializeApp()` wrapped in try/catch in `main.dart`. App works without `google-services.json` in dev.
- **status:** locked
- **source:** docs/decisions.md (Session 14)

### DEC-push-notification-auth-lifecycle
- **scope:** FCM token registration timing
- **decision:** `PushNotificationNotifier` listens to `authProvider` — auto-init on login, cleanup on logout (same pattern as `SocketNotifier`)
- **status:** locked
- **source:** docs/decisions.md (Session 14)

### DEC-deep-linking-scheme-universal
- **scope:** Mobile deep links
- **decision:** Custom scheme `reversemarket://` (both platforms) + universal links `https://app.reversemarket.com` (Android). GoRouter handles all routes.
- **status:** locked
- **source:** docs/decisions.md (Session 14)

---

## Observability & Ops

### DEC-sentry-lazy-init
- **scope:** Error tracking
- **decision:** `@sentry/node` (backend) + `sentry_flutter` + `sentry_dio` (mobile). Lazy init pattern. Backend captures only 500-level errors (4xx are expected). Auth headers stripped.
- **status:** locked
- **source:** docs/decisions.md (Session 14)

### DEC-fastify-compress
- **scope:** Response payload size
- **decision:** `@fastify/compress` with `threshold: 1024` bytes. Registered after helmet, before routes.
- **status:** locked
- **source:** docs/decisions.md (Session 14)

### DEC-prometheus-metrics
- **scope:** Backend metrics
- **decision:** Prometheus via `prom-client`
- **status:** locked
- **source:** CLAUDE.md, BUILD_PROGRESS.md

---

## Build, Deploy, CI/CD

### DEC-docker-multi-stage
- **scope:** Container build
- **decision:** Three-stage Dockerfile (`deps` → `build` → `runner`). Non-root user `appuser` (UID 1001), `node:20-alpine`. Production image excludes dev deps and source TypeScript.
- **status:** locked
- **source:** docs/decisions.md (Post-Session 13)

### DEC-github-actions-ci
- **scope:** CI/CD
- **decision:** GitHub Actions with 3 jobs: `lint-and-typecheck`, `test` (PostgreSQL 15 + Redis 7 service containers), `build-docker` (only on `main`, build but don't push)
- **status:** locked
- **source:** docs/decisions.md (Post-Session 13)

### DEC-bash-curl-test-scripts
- **scope:** API E2E testing
- **decision:** 14+ numbered bash scripts using `curl` + `jq` for end-to-end API testing. Shared state in `_state.sh`. Configurable `BASE_URL` in `_config.sh`. `run-all.sh` for orchestration.
- **status:** locked
- **source:** docs/decisions.md (Session 13)

---

## Pre-Build Product Decisions (from PRD)

### DEC-dfw-only-mvp
- **scope:** Geographic launch
- **decision:** DFW Metroplex only for MVP. Phase 2: Texas-wide. Phase 3: Houston, Austin, San Antonio, then national.
- **status:** locked
- **source:** docs/decisions.md (Pre-Build / from PRD)

### DEC-local-products-free
- **scope:** Pricing
- **decision:** Local cash transactions $0 platform fee. Local platform-processed: 3-5%. Shipped: 5-8%. Drives adoption vs Facebook Marketplace and OfferUp.
- **status:** locked
- **source:** docs/decisions.md (Pre-Build / from PRD)

### DEC-before-after-photos-required
- **scope:** Quality assurance
- **decision:** Before AND after photos required for ALL services as evidence of work completion
- **status:** locked
- **source:** docs/decisions.md (Pre-Build / from PRD)

### DEC-milestone-payments
- **scope:** Multi-stage projects
- **decision:** Milestone-based payments supported with no minimum threshold per milestone
- **status:** locked
- **source:** docs/decisions.md (Pre-Build / from PRD)
