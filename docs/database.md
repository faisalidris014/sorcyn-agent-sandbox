# Database Schema

> **Connection wiring** (dev vs test vs migrate/seed paths, fresh-clone setup,
> test isolation, and the "seed accounts missing / login fails" troubleshooting
> guide) lives in [DATABASE_CONFIG.md](DATABASE_CONFIG.md). This file covers the
> schema itself.

**ORM:** Prisma 7 with PostgreSQL 15
**Schema file:** `backend/prisma/schema.prisma`
**Migrations:** `20260215085853_init`, `20260219180140_add_is_admin`

## Conventions

- **Primary keys:** UUID (`@default(uuid())`, mapped to `@db.Uuid`)
- **Soft deletes:** `deleted_at` column on all models (except AuditLog)
- **Audit columns:** `created_at`, `updated_at` on all models
- **Column mapping:** camelCase in code → snake_case in DB (`@map()`)
- **Table mapping:** PascalCase model → snake_case table (`@@map()`)
- **JSONB fields:** Used for flexible data (categories, photos, notification preferences, category-specific data)
- **Full-text search:** `tsvector` column on `posts` with GIN index and auto-update trigger

## Models (15 total)

### User (`users`)

Core user account. Single account supports buyer/seller/both roles via `account_type`.

| Column | Type | Notes |
|---|---|---|
| user_id | UUID | PK |
| email | VARCHAR(255) | Unique |
| password_hash | VARCHAR(255) | bcrypt 12+ rounds |
| account_type | AccountType | `buyer`, `seller`, `both` |
| first_name, last_name | VARCHAR | Required |
| phone | VARCHAR(20) | Optional |
| email_verified | Boolean | Default false |
| location_* | Various | City, state, zip, country, lat/lng |
| notification_preferences | JSONB | Email, SMS, push toggles |
| rating | DECIMAL(3,2) | Aggregate rating |
| stripe_customer_id | VARCHAR(100) | Stripe customer |
| is_admin | Boolean | Default false (added Session 9) |
| status | UserStatus | `active`, `suspended`, `banned`, `deleted` |

### SellerProfile (`seller_profiles`)

Extended profile for users who sell. One-to-one with User.

| Column | Type | Notes |
|---|---|---|
| seller_id | UUID | PK |
| user_id | UUID | FK → users, unique |
| business_name | VARCHAR(255) | Optional |
| service_radius_miles | INT | Default 25 |
| categories, subcategories | JSONB | Arrays of category slugs |
| verification_tier | INT | Default 1 |
| *_verified | Boolean | Email, phone, ID, EIN, license, insurance, background check |
| verification_badges | JSONB | Array of badge objects |
| license_*, insurance_* | Various | License/insurance details |
| stripe_account_id | VARCHAR(100) | Stripe Connect account |
| stripe_onboarding_status | VARCHAR(50) | `not_started`, etc. |
| rating | DECIMAL(3,2) | Seller-specific rating |

### Category (`categories`)

Hierarchical categories with self-referencing parent. MVP has 3 top-level + 33 subcategories.

| Column | Type | Notes |
|---|---|---|
| category_id | UUID | PK |
| slug | VARCHAR(100) | Unique |
| name | VARCHAR(100) | Display name |
| parent_category_id | UUID | FK → categories (self-ref) |
| enabled_in_mvp | Boolean | MVP scope filter |

**Seeded categories:**
- **Products** (8 subs): Electronics, Furniture, Vehicles, Appliances, Clothing, Sports, Tools, Other
- **Services** (18 subs): Plumbing, Electrical, HVAC, Cleaning, Landscaping, Painting, Roofing, Moving, Pest Control, Handyman, Auto Repair, Childcare, Pet Care, Tutoring, Personal Training, Photography, Event Planning, Other
- **Jobs** (7 subs): Entry Level, Skilled Trade, Professional, Management, Part Time, Contract, Other
- **Inventory/Wholesale** (Phase 2, disabled)
- **Real Estate** (Phase 3, disabled)

### Post (`posts`)

Buyer requests. The core entity of the marketplace.

| Column | Type | Notes |
|---|---|---|
| post_id | UUID | PK |
| buyer_id | UUID | FK → users |
| category_id, subcategory_id | UUID | FK → categories |
| title | VARCHAR(200) | Required |
| description | TEXT | Required |
| budget_min, budget_max | DECIMAL(10,2) | Budget range |
| budget_type | BudgetType | `range`, `open`, `fixed` |
| location_* | Various | Address, city, state, zip, lat/lng |
| urgency | Urgency | `asap`, `within_24_hours`, etc. |
| category_specific | JSONB | Flexible per-category data |
| status | PostStatus | `draft`, `active`, `filled`, `expired`, `cancelled` |
| search_vector | tsvector | Full-text search (auto-updated via trigger) |
| expires_at | TIMESTAMP | Auto-expiration |

### Offer (`offers`)

Seller submissions on posts. One offer per seller per post (unique constraint).

| Column | Type | Notes |
|---|---|---|
| offer_id | UUID | PK |
| post_id | UUID | FK → posts |
| seller_id | UUID | FK → seller_profiles |
| offer_type | OfferType | `service`, `product`, `job_application`, `inventory` |
| quote_amount | DECIMAL(10,2) | Required |
| pricing_type | PricingType | `flat_rate`, `hourly`, `quote`, `fixed` |
| platform_fee | DECIMAL(10,2) | Calculated fee preview |
| status | OfferStatus | `pending`, `accepted`, `declined`, `withdrawn`, `expired` |

**Unique constraint:** `(post_id, seller_id)` — one offer per seller per post.

### Transaction (`transactions`)

Tracks the lifecycle after an offer is accepted: payment, escrow, completion, shipping/meetup.

| Column | Type | Notes |
|---|---|---|
| transaction_id | UUID | PK |
| post_id, offer_id, buyer_id, seller_id | UUID | FKs |
| transaction_type | TransactionType | `service`, `product_shipped`, `product_local_cash`, etc. |
| quote_amount, buyer_fee, stripe_fee, total_charged | DECIMAL | Financial amounts |
| platform_fee, platform_fee_percentage | DECIMAL | Platform commission |
| escrow_status | EscrowStatus | `held`, `released`, `refunded`, `frozen` |
| status | TransactionStatus | 18 possible states |
| before_photos, progress_photos, after_photos | JSONB | Evidence arrays |
| tracking_number, carrier | Various | Shipping info |
| meetup_* | Various | Local meetup details |
| timeline | JSONB | Status change log |

### Review (`reviews`)

One review per transaction (unique on `transaction_id`).

| Column | Type | Notes |
|---|---|---|
| overall_rating | INT | 1-5 |
| category_ratings | JSONB | Per-aspect ratings |
| written_review | TEXT | Optional |
| would_recommend | Boolean | Required |
| moderation_status | ModerationStatus | `approved`, `pending`, `rejected` |

### Conversation (`conversations`) + Message (`messages`)

In-app messaging between users, linked to posts/offers/transactions.

### Dispute (`disputes`)

Dispute resolution with tiered escalation, evidence collection, and AI analysis (Phase 2).

### Payout (`payouts`)

Tracks seller payouts via Stripe transfers. One payout per transaction.

### Notification (`notifications`)

Multi-channel notifications (push, email, SMS) with delivery tracking.

### VerificationRequest (`verification_requests`)

Seller verification document submissions (ID, license, insurance, background check).

### SavedSearch (`saved_searches`)

User-saved search criteria with optional notification alerts.

### AuditLog (`audit_logs`)

Immutable action log. No `updated_at` or `deleted_at` — records are never modified.

## Enums (20 total)

| Enum | Values |
|---|---|
| AccountType | `buyer`, `seller`, `both` |
| UserStatus | `active`, `suspended`, `banned`, `deleted` |
| BudgetType | `range`, `open`, `fixed` |
| Urgency | `asap`, `within_24_hours`, `within_3_days`, `within_1_week`, `flexible`, `specific_date` |
| PostStatus | `draft`, `active`, `filled`, `expired`, `cancelled` |
| OfferType | `service`, `product`, `job_application`, `inventory` |
| PricingType | `flat_rate`, `hourly`, `quote`, `fixed` |
| OfferStatus | `pending`, `accepted`, `declined`, `withdrawn`, `expired` |
| TransactionType | `service`, `product_shipped`, `product_local_cash`, `product_local_platform`, `job_milestone`, `inventory` |
| EscrowStatus | `held`, `released`, `refunded`, `frozen` |
| TransactionStatus | 18 states (see schema) |
| CancelledBy | `buyer`, `seller`, `admin`, `system` |
| ModerationStatus | `approved`, `pending`, `rejected` |
| ConversationStatus | `active`, `archived`, `closed` |
| RequestedResolution | `full_refund`, `partial_refund`, `no_refund`, `other` |
| DisputeStatus | `open`, `under_review`, `resolved`, `appealed`, `closed` |
| DisputeOutcome | `full_refund`, `partial_refund`, `no_refund`, `custom` |
| PayoutStatus | `pending`, `in_transit`, `paid`, `failed`, `cancelled` |
| VerificationType | `id`, `ein`, `license`, `insurance`, `background_check` |
| VerificationRequestStatus | `pending`, `under_review`, `approved`, `rejected`, `expired` |
| SearchType | `posts`, `sellers` |
| ActorType | `user`, `admin`, `system` |

## Full-Text Search

Posts have a `search_vector` column (`tsvector`) with a GIN index. A PostgreSQL trigger auto-updates it on INSERT/UPDATE:

- Title: weight `A` (highest relevance)
- Description: weight `B`

Custom SQL in `prisma/custom-migrations/001_search_vector_trigger.sql`.

## Seed Data

Run `npx prisma db seed` to populate:
- 5 top-level categories (3 MVP-enabled)
- 33 subcategories (all MVP-enabled)
- 4 test users:
  - `buyer@test.com` (buyer, Dallas)
  - `seller@test.com` (seller, Fort Worth, has SellerProfile)
  - `both@test.com` (both roles, Arlington, has SellerProfile)
  - `admin@reversemarketplace.com` (admin, `isAdmin: true`)
- All passwords: `TestPassword123!` (except admin: `AdminSecure456!`)

## Redis Keys

### Auth (Session 2)

| Key Pattern | TTL | Purpose |
|---|---|---|
| `auth:refresh:{userId}:{jti}` | 30d / 180d | Refresh token (SHA-256 hash) |
| `auth:blacklist:{jti}` | ≤15m | Revoked access token |
| `auth:email_verify:{token}` | 24h | Email verification token |
| `auth:password_reset:{token}` | 1h | Password reset token |
| `auth:login_attempts:{email}` | 15m | Failed login attempt counter |
| `auth:login_lockout:{email}` | 15m | Account lockout flag |
| `auth:resend_cooldown:{userId}` | 5m | Resend verification throttle |
| `auth:password_reset_count:{email}` | 24h | Daily password reset limit |

### Messaging (Session 7)

| Key Pattern | TTL | Purpose |
|---|---|---|
| `msg:rate:{userId}` | 3600s (1hr) | Message rate limit counter (max 50/hr) |

### AI Assist (Session 8)

| Key Pattern | TTL | Purpose |
|---|---|---|
| `ai:rate:{userId}` | 3600s (1hr) | AI endpoint rate limit counter (max 20/hr) |

## Prisma JSON Null Handling (Session 3)

When setting a nullable `Json` column to `null`, use `Prisma.JsonNull` instead of JavaScript `null`:

```typescript
import { Prisma } from '@prisma/client';

// Setting a JSONB column to null:
await prisma.sellerProfile.update({
  where: { id: profile.id },
  data: {
    businessHours: input.businessHours === null ? Prisma.JsonNull : input.businessHours,
  },
});
```

JavaScript `null` in Prisma means "do not update this field." `Prisma.JsonNull` means "set the database value to SQL NULL."

## Verification Request Flow (Session 3)

Verification requests track seller document submissions. The flow is:

1. Seller calls `POST /sellers/me/verification` with `verificationType` and `documents` (URLs)
2. A `VerificationRequest` record is created with status `pending`
3. Admin reviews the request (Session 9) and updates status to `approved` or `rejected`
4. On approval, the corresponding `*_verified` boolean on `SellerProfile` is set to `true`

**Verification tiers:**
| Type | Tier |
|---|---|
| id, ein | 2 |
| license, insurance | 3 |
| background_check | 4 |

**Unique constraint:** Only one `pending` or `under_review` request per seller per verification type.

## Post Query Patterns (Session 4)

### Full-Text Search

Posts support full-text search using raw SQL via `$queryRawUnsafe`:

```typescript
const posts = await prisma.$queryRawUnsafe(`
  SELECT p.*, ts_rank(p.search_vector, plainto_tsquery('english', $1)) AS rank
  FROM posts p
  WHERE p.search_vector @@ plainto_tsquery('english', $1)
    AND p.status = 'active'
    AND p.deleted_at IS NULL
  ORDER BY rank DESC
  LIMIT $2 OFFSET $3
`, query, limit, offset);
```

### Feed Filtering

The feed endpoint builds dynamic WHERE clauses for:
- `categoryId` / `subcategoryId` — exact match
- `minBudget` / `maxBudget` — range filter on `budget_max`
- `urgency` — exact match
- `city` / `state` — case-insensitive match on location fields

Sort options: `newest` (created_at DESC), `expiring_soon` (expires_at ASC), `budget_high` (budget_max DESC), `budget_low` (budget_max ASC).

### View Count

`getPostById()` increments `viewCount` atomically for non-owner views:

```typescript
await prisma.post.update({
  where: { id: postId },
  data: { viewCount: { increment: 1 } },
});
```

## Offer Query Patterns (Session 5)

### Unique Constraint on Offers

Each seller can only submit one offer per post, enforced by `@@unique([postId, sellerId])`:

```typescript
const existing = await prisma.offer.findUnique({
  where: { postId_sellerId: { postId, sellerId } },
});
```

### Atomic Offer Acceptance

When a buyer accepts an offer, four writes happen in a single Prisma transaction:

```typescript
await prisma.$transaction([
  prisma.offer.update({ where: { id: offerId }, data: { status: 'accepted' } }),
  prisma.offer.updateMany({
    where: { postId, status: 'pending', id: { not: offerId } },
    data: { status: 'declined' },
  }),
  prisma.post.update({ where: { id: postId }, data: { status: 'filled' } }),
  prisma.transaction.create({ data: { ...transactionData } }),
]);
```

### Best Match Scoring (In-Memory)

Offers are fetched from the DB, then scored in-memory using haversine distance:

```typescript
const score =
  (rating / 5) * 0.4 +
  priceCompetitiveness * 0.3 +
  distanceScore * 0.15 +
  responseTimeScore * 0.1 +
  completionRateScore * 0.05;
```

## Transaction Timeline Tracking (Session 5)

The `timeline` JSONB column stores an array of status change events:

```typescript
interface TimelineEntry {
  event: string;       // e.g. "status_update", "mark_complete", "request_changes"
  timestamp: string;   // ISO 8601
  actorId: string;     // User ID who triggered the event
  note?: string;       // Optional note
}
```

Change requests are counted by filtering timeline entries (max 2 per transaction).

## Seller ID Resolution Pattern (Session 5)

**Important:** `sellerId` in offers and transactions refers to `SellerProfile.id`, NOT `User.id`. Every seller-side method resolves the seller profile first:

```typescript
const profile = await prisma.sellerProfile.findUnique({ where: { userId } });
if (!profile) throw new ForbiddenError('Seller profile required');
```

## Stripe Integration Fields (Session 6)

Session 6 uses existing schema columns (no migration needed):

**On `transactions` table:**
| Column | Type | Set By |
|---|---|---|
| `stripe_payment_intent_id` | VARCHAR(100) | `PaymentsService.createPaymentIntent()` |
| `stripe_charge_id` | VARCHAR(100) | Webhook: `payment_intent.succeeded` |
| `payment_method_last4` | VARCHAR(4) | Webhook: `payment_intent.succeeded` |
| `payment_method_brand` | VARCHAR(50) | Webhook: `payment_intent.succeeded` |
| `stripe_refund_id` | VARCHAR(100) | `PaymentsService.processRefund()` / `refundPaymentIntent()` |
| `escrow_status` | EscrowStatus | Various (held/released/refunded) |
| `escrow_released_at` | TIMESTAMP | `PaymentsService.releaseEscrow()` |
| `refund_amount` | DECIMAL | On refund |
| `refunded_at` | TIMESTAMP | On refund |

**On `seller_profiles` table:**
| Column | Type | Set By |
|---|---|---|
| `stripe_account_id` | VARCHAR(100) | `PaymentsService.startSellerOnboarding()` |
| `stripe_charges_enabled` | Boolean | Webhook: `account.updated` |
| `stripe_payouts_enabled` | Boolean | Webhook: `account.updated` |

**Escrow state machine:**
```
(no payment) → held → released   (buyer approves)
                   → refunded   (buyer/seller cancels)
```

## Review Rating Badges (Session 7)

When a review is submitted, seller stats are atomically recomputed and a rating badge is assigned:

```typescript
// Thresholds (checked in order):
if (averageRating >= 4.8 && totalReviews >= 5) → 'top_rated'
if (averageRating >= 4.5 && totalReviews >= 3) → 'highly_rated'
if (averageRating >= 4.0 && totalReviews >= 2) → 'good'
else → null
```

Fields updated on `seller_profiles`: `average_rating`, `total_reviews`, `rating_badge`, `total_completed`.

## Auto-Review (Session 7)

BullMQ schedules 4 jobs per completed transaction:
- **Day 7:** Push notification reminder to buyer
- **Day 30:** Email reminder
- **Day 60:** Email reminder
- **Day 73:** Auto-generate 5-star review if buyer hasn't reviewed

Uses `jobId` for deduplication (prevents duplicate reminders if `scheduleReviewReminders` is called multiple times).

## Built In

- **Session 1:** Full schema (15 models, 20 enums), seed data, full-text search trigger
- **Session 2:** Redis key patterns for auth (no schema changes)
- **Session 3:** No schema changes. Documented Prisma JSON null patterns and verification request flow.
- **Session 4:** No schema changes. Documented full-text search queries, feed filtering, and view count patterns.
- **Session 5:** No schema changes. Documented offer uniqueness, atomic acceptance, Best Match scoring, timeline tracking, and seller ID resolution.
- **Session 6:** No schema changes. Documented Stripe integration fields on transactions and seller_profiles tables.
- **Session 7:** No schema changes. Added messaging Redis keys, review rating badge logic, auto-review BullMQ jobs.
- **Session 8:** No schema changes. Added AI rate limiting Redis key (`ai:rate:{userId}`).
- **Session 9:** Added `isAdmin` boolean to User model (migration `20260219180140_add_is_admin`). Admin seed user now has `isAdmin: true`. JWT payload includes `isAdmin` field.
