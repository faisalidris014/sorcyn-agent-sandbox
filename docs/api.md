# API Reference

**Base URL:** `/api/v1/`
**Auth:** JWT Bearer tokens (access 15min + refresh 30d)
**Error Format:** RFC 7807 Problem Details
**Docs:** Swagger UI at `/docs`

## Common Headers

### Request ID Tracing (`x-request-id`)

All responses include an `x-request-id` header. If the client sends an `x-request-id` request header, the server echoes it back. If not provided, the server generates a UUID v4.

Error responses for application errors (`AppError`) and server errors (500) also include a `requestId` field in the body:

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

This enables end-to-end request tracing for debugging and log correlation.

## Implemented Endpoints

### Health Check

```
GET /health
```

No authentication required.

**Response (200 OK / 503 Degraded):**
```json
{
  "status": "ok",
  "timestamp": "2026-02-15T12:00:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "memoryMB": 128,
  "checks": {
    "database": "ok",
    "redis": "ok",
    "queues": "ok",
    "queueMetrics": {
      "notifications": { "waiting": 0, "active": 0 },
      "autoRelease": { "waiting": 0, "active": 0 }
    }
  }
}
```
Returns `503` with `"status": "degraded"` if database or Redis is unreachable. Queue failures are non-critical (service is degraded, not down).

### Auth — `POST /api/v1/auth/*` (Session 2)

| Method | Path | Auth | Rate Limit | Description |
|---|---|---|---|---|
| POST | `/api/v1/auth/register` | No | 3/hour | Create account |
| POST | `/api/v1/auth/login` | No | 10/min | Login, get tokens |
| POST | `/api/v1/auth/refresh` | No | — | Refresh access token (rotation) |
| POST | `/api/v1/auth/logout` | Yes | — | Blacklist access + delete refresh |
| GET | `/api/v1/auth/verify-email?token=xxx` | No | — | Verify email (single-use token) |
| POST | `/api/v1/auth/resend-verification` | No | 1/5min | Resend verification email |
| POST | `/api/v1/auth/forgot-password` | No | 3/hour | Request password reset (3/day limit) |
| POST | `/api/v1/auth/reset-password` | No | — | Reset password with token |

#### `POST /register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass1!",
  "firstName": "John",
  "lastName": "Doe",
  "accountType": "buyer",
  "locationZip": "75001",
  "agreeToTerms": true,
  "agreeToPrivacy": true
}
```

**Password requirements:** 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special character.

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "accountType": "buyer",
      "emailVerified": false,
      "phone": null,
      "locationZip": "75001",
      "createdAt": "2026-02-15T..."
    },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ...",
      "expiresIn": 900,
      "tokenType": "Bearer"
    }
  }
}
```

#### `POST /login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass1!",
  "rememberMe": false
}
```

**Response (200):** Same shape as register. `rememberMe: true` extends refresh token to 180 days.

**Security:** Account locks after 5 failed attempts for 15 minutes. Timing-safe comparison prevents user enumeration.

#### `POST /refresh`

**Request:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 900
  }
}
```

Token rotation: old refresh token is deleted, new one issued. Reuse detection invalidates all sessions.

#### `POST /logout` (requires Bearer token)

**Request:**
```json
{
  "refreshToken": "eyJ..."
}
```

Blacklists access token in Redis (TTL ≤15m) and deletes refresh token.

#### `GET /verify-email?token=xxx`

Single-use token, 24h expiry. Sets `emailVerified: true` on the user.

#### `POST /resend-verification`

**Request:** `{ "email": "user@example.com" }`

5-minute cooldown. Generic response prevents user enumeration.

#### `POST /forgot-password`

**Request:** `{ "email": "user@example.com" }`

Max 3 resets per day. Generic response prevents user enumeration.

#### `POST /reset-password`

**Request:**
```json
{
  "token": "hex-token",
  "newPassword": "NewSecure1!"
}
```

Must differ from current password. Invalidates all existing sessions.

### Users -- `/api/v1/users/*` (Session 3)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/users/me` | Yes | Get current user (full private profile) |
| PATCH | `/api/v1/users/me` | Yes | Update profile fields |
| PATCH | `/api/v1/users/me/photo` | Yes | Update profile photo URL |
| POST | `/api/v1/users/me/change-password` | Yes | Change password |
| PATCH | `/api/v1/users/me/account-type` | Yes | Switch buyer/seller/both |
| PUT | `/api/v1/users/me/fcm-token` | Yes | Update FCM push token |
| DELETE | `/api/v1/users/me` | Yes | Soft-delete account (password required) |
| GET | `/api/v1/users/:userId` | No | Get public user profile |

#### `GET /users/me` (requires Bearer token)

Returns the full private profile including email, phone, notification preferences, and location coordinates.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "accountType": "buyer",
    "phone": null,
    "phoneVerified": false,
    "emailVerified": true,
    "profilePhotoUrl": null,
    "locationCity": "Dallas",
    "locationState": "TX",
    "locationZip": "75001",
    "locationCountry": "US",
    "latitude": null,
    "longitude": null,
    "bio": null,
    "notificationPreferences": {},
    "rating": null,
    "totalReviews": 0,
    "totalTransactions": 0,
    "status": "active",
    "lastLoginAt": "2026-02-15T...",
    "createdAt": "2026-02-15T...",
    "updatedAt": "2026-02-15T..."
  }
}
```

#### `PATCH /users/me` (requires Bearer token)

**Request:** All fields optional. `null` clears nullable fields.
```json
{
  "firstName": "Jane",
  "bio": "New bio text",
  "locationCity": "Fort Worth",
  "locationState": "TX",
  "locationZip": "76101",
  "notificationPreferences": {
    "email_offers": true,
    "push_messages": true
  }
}
```

#### `POST /users/me/change-password` (requires Bearer token)

**Request:**
```json
{
  "currentPassword": "OldPass1!",
  "newPassword": "NewPass1!"
}
```

Password requirements: 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special character. Must differ from current. Invalidates all sessions.

#### `PATCH /users/me/account-type` (requires Bearer token)

**Request:**
```json
{
  "accountType": "both"
}
```

When switching to `seller` or `both`, a SellerProfile is auto-created if one does not exist.

#### `DELETE /users/me` (requires Bearer token)

**Request:**
```json
{
  "password": "CurrentPass1!"
}
```

Soft-deletes the user (sets `deletedAt`, status to `deleted`, prefixes email with `deleted_{timestamp}_` to free it for reuse). Also soft-deletes any associated SellerProfile and invalidates all sessions.

#### `GET /users/:userId`

Returns a public profile with limited fields (no email, phone, or preferences).

### Sellers -- `/api/v1/sellers/*` (Session 3)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/sellers` | Yes | Create seller profile |
| GET | `/api/v1/sellers/me` | Yes | Get my seller profile (full) |
| PATCH | `/api/v1/sellers/me` | Yes | Update seller profile |
| POST | `/api/v1/sellers/me/verification` | Yes | Submit verification request |
| GET | `/api/v1/sellers/me/verification` | Yes | List my verification requests |
| GET | `/api/v1/sellers/:sellerId` | No | Get public seller profile by seller ID |
| GET | `/api/v1/sellers/user/:userId` | No | Get public seller profile by user ID |

#### `POST /sellers` (requires Bearer token)

Creates a new seller profile. Automatically switches user `accountType` to `both` if they were `buyer`.

**Request:**
```json
{
  "businessName": "John's Plumbing",
  "bio": "Licensed plumber with 10 years experience",
  "serviceRadiusMiles": 30,
  "categories": ["uuid-of-category"],
  "subcategories": ["uuid-of-subcategory"],
  "yearsExperience": 10,
  "businessWebsite": "https://example.com",
  "businessHours": {
    "mon": { "open": "08:00", "close": "17:00" },
    "sat": { "open": "09:00", "close": "12:00" },
    "sun": { "open": "09:00", "close": "12:00", "closed": true }
  }
}
```

**Response (201):** Full `SellerProfileResponse` object including `profileStrength` score.

#### `PATCH /sellers/me` (requires Bearer token)

**Request:** All fields optional. Supports `portfolioPhotos` (array of URLs, max 20) and `profilePhotoUrl`. Setting a field to `null` clears it. Profile strength is recalculated on every update.

#### `POST /sellers/me/verification` (requires Bearer token)

**Request:**
```json
{
  "verificationType": "license",
  "documents": ["https://r2-url/verification-docs/..."],
  "licenseNumber": "PLB-12345",
  "licenseState": "TX",
  "licenseExpiry": "2027-12-31T00:00:00.000Z"
}
```

Verification types: `id`, `ein`, `license`, `insurance`, `background_check`. Cannot submit duplicate pending requests of the same type. License/insurance-specific fields are saved to the seller profile.

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "pending"
  }
}
```

#### `GET /sellers/me/verification` (requires Bearer token)

Returns all verification requests for the authenticated seller, ordered by most recent.

### Categories — `/api/v1/categories/*` (Session 4)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/categories` | No | List categories (filterable) |
| GET | `/api/v1/categories/tree` | No | Full hierarchical category tree |
| GET | `/api/v1/categories/:slug` | No | Get category by slug with children |

#### `GET /categories`

**Query parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `parentId` | UUID | — | Filter by parent category |
| `activeOnly` | `"true"/"false"` | `"true"` | Only active categories |
| `mvpOnly` | `"true"/"false"` | `"false"` | Only MVP-enabled categories |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "slug": "services",
      "name": "Services",
      "description": "...",
      "icon": "wrench",
      "parentCategoryId": null,
      "sortOrder": 2,
      "isActive": true,
      "enabledInMvp": true
    }
  ]
}
```

#### `GET /categories/tree`

Returns all categories nested into a tree structure with `children` arrays.

#### `GET /categories/:slug`

Returns a single category with its direct children.

### Posts — `/api/v1/posts/*` (Session 4)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/posts` | Yes | Create post (draft or active) |
| GET | `/api/v1/posts/my-posts` | Yes | List buyer's own posts (paginated) |
| GET | `/api/v1/posts/feed` | No | Public feed for sellers (filterable) |
| GET | `/api/v1/posts/search` | No | Full-text search posts |
| GET | `/api/v1/posts/:postId` | Optional | Get post details (view count for non-owners) |
| PUT | `/api/v1/posts/:postId` | Yes | Update post (owner only, no offers received) |
| DELETE | `/api/v1/posts/:postId` | Yes | Cancel/delete post (owner only) |
| POST | `/api/v1/posts/:postId/extend` | Yes | Extend duration (+3 days, max 1 extension) |
| POST | `/api/v1/posts/:postId/mark-filled` | Yes | Mark post as filled |
| POST | `/api/v1/posts/:postId/repost` | Yes | Repost with same details (new ID) |
| POST | `/api/v1/posts/ai/parse` | Yes | AI: parse natural language → structured post |
| POST | `/api/v1/posts/ai/suggest-images` | Yes | AI: suggest product images |
| POST | `/api/v1/posts/ai/generate-job-profile` | Yes | AI: generate job seeker/employer profile |

#### `POST /posts` (requires Bearer token)

**Request:**
```json
{
  "categoryId": "uuid",
  "subcategoryId": "uuid",
  "title": "Need a plumber for kitchen sink repair",
  "description": "Kitchen faucet is leaking, need someone experienced...",
  "photos": ["https://..."],
  "budgetMin": 100,
  "budgetMax": 300,
  "budgetType": "range",
  "locationCity": "Dallas",
  "locationState": "TX",
  "locationZip": "75001",
  "urgency": "within_3_days",
  "categorySpecific": { "scope": "repair" },
  "status": "active",
  "expiresInHours": 168
}
```

**Validation rules:**
- Title: 5-200 chars
- Description: 20-5000 chars
- Photos: max 10, Videos: max 3
- `expiresInHours`: 1-720 (default 168 = 7 days)
- Active posts require email verification
- Max 10 active posts per buyer

**Response (201):** Full post object with buyer info.

#### `GET /posts/my-posts` (requires Bearer token)

**Query parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `status` | PostStatus | — | Filter by status |
| `categoryId` | UUID | — | Filter by category |
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page (max 50) |
| `sort` | string | `newest` | `newest`, `oldest`, `expiring_soon`, `most_offers` |

#### `GET /posts/feed`

Public endpoint for sellers to browse active posts.

**Query parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `categoryId` | UUID | — | Filter by category |
| `subcategoryId` | UUID | — | Filter by subcategory |
| `search` | string | — | Text search within feed |
| `minBudget` / `maxBudget` | number | — | Budget range filter |
| `urgency` | Urgency | — | Urgency filter |
| `city` / `state` | string | — | Location filter |
| `sort` | string | `newest` | `newest`, `expiring_soon`, `budget_high`, `budget_low` |
| `page` / `limit` | int | 1 / 20 | Pagination |

#### `GET /posts/search`

PostgreSQL full-text search using `search_vector @@ plainto_tsquery()` with `ts_rank` relevance scoring.

**Query parameters:**
| Param | Type | Required | Description |
|---|---|---|---|
| `q` | string | Yes | Search query (1-200 chars) |
| `categoryId` | UUID | No | Filter by category |
| `minBudget` / `maxBudget` | number | No | Budget range |
| `city` / `state` | string | No | Location filter |
| `page` / `limit` | int | No | Pagination (default 1/20) |

#### `GET /posts/:postId`

Uses optional authentication (try/catch `jwtVerify()`). If authenticated as the owner, shows draft posts and owner-specific fields. Increments `viewCount` for non-owner views.

#### `PUT /posts/:postId` (requires Bearer token)

Only allowed if: the requester is the owner AND the post has received no offers (`offerCount === 0`). Can also publish a draft by setting `status: "active"`.

#### `DELETE /posts/:postId` (requires Bearer token)

Soft-deletes the post by setting status to `cancelled`. Returns 204 No Content.

#### `POST /posts/:postId/extend` (requires Bearer token)

Extends post `expiresAt` by 3 days. Max 1 extension per post.

#### `POST /posts/:postId/repost` (requires Bearer token)

Creates a new post copying all fields from the original. Returns 201 with the new post.

### AI Post Assistance — `/api/v1/posts/ai/*` (Session 8)

All AI endpoints require authentication and are rate-limited to **20 requests/hour** per user (Redis key `ai:rate:{userId}`).

#### `POST /posts/ai/parse` (requires Bearer token)

Parses a natural language buyer request into a structured post.

**Request:**
```json
{
  "text": "I need a plumber to fix a leaking kitchen faucet in Dallas. Budget around $150-300. Need it done this week.",
  "location": {
    "city": "Dallas",
    "state": "TX",
    "zip": "75001"
  }
}
```

**Validation rules:**
- `text`: 20-2000 chars
- `location`: optional object with city (max 100), state (max 50), zip (5-digit or ZIP+4)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "title": "Kitchen Faucet Repair - Leaking Faucet",
    "description": "Looking for an experienced plumber to repair a leaking kitchen faucet...",
    "categorySlug": "services",
    "subcategorySlug": "plumbing",
    "categoryId": "uuid-of-services",
    "subcategoryId": "uuid-of-plumbing",
    "budgetMin": 150,
    "budgetMax": 300,
    "budgetType": "range",
    "urgency": "within_3_days",
    "categorySpecific": { "scope": "repair" },
    "requirements": { "licensed": true }
  }
}
```

**How it works:**
1. Loads full category tree with slugs for prompt context
2. Sends structured prompt to Gemini Flash-Lite
3. Strips markdown code blocks from AI response
4. Validates output through Zod schema (`parsedPostResponseSchema`)
5. Resolves `categorySlug`/`subcategorySlug` to database UUIDs
6. Falls back to first active top-level category if slug is unrecognized

#### `POST /posts/ai/suggest-images` (requires Bearer token)

Suggests product images from Unsplash for a given product.

**Request:**
```json
{
  "productName": "iPhone 15 Pro Max",
  "categorySlug": "electronics"
}
```

**Validation rules:**
- `productName`: 2-200 chars
- `categorySlug`: optional, max 100 chars

**Response (200):**
```json
{
  "success": true,
  "data": {
    "images": [
      {
        "url": "https://images.unsplash.com/photo-...",
        "description": "iPhone 15 Pro Max in natural titanium",
        "searchQuery": "iPhone 15 Pro Max"
      }
    ]
  }
}
```

Returns up to 3 images (max 5 per schema).

#### `POST /posts/ai/generate-job-profile` (requires Bearer token)

Generates a structured job seeker or employer profile from a text description.

**Request:**
```json
{
  "text": "I'm a senior React developer with 8 years of experience, looking for remote full-time positions. Skilled in TypeScript, Next.js, and GraphQL.",
  "profileType": "job_seeker"
}
```

**Validation rules:**
- `text`: 20-2000 chars
- `profileType`: `"job_seeker"` or `"employer"`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "title": "Senior React Developer",
    "description": "Experienced senior React developer with 8 years of full-stack...",
    "categorySpecific": {
      "skills": ["React", "TypeScript", "Next.js", "GraphQL"],
      "experienceYears": 8,
      "availability": "full_time",
      "preferredWorkType": "remote"
    },
    "suggestedBudget": {
      "min": 120000,
      "max": 160000
    }
  }
}
```

**Job seeker** `categorySpecific` fields: `skills`, `experienceYears`, `education`, `availability`, `preferredWorkType`

**Employer** `categorySpecific` fields: `responsibilities`, `requiredSkills`, `experienceRequired`, `employmentType`, `workType`, `companySize`

### Search — `/api/v1/search/*` (Session 4)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/search/posts` | No | Full-text search (delegates to PostsService) |

Same query parameters as `GET /posts/search`. This is an alternative endpoint at `/api/v1/search/posts`.

### Offers — `/api/v1/offers/*` (Session 5)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/offers` | Yes | Submit offer on a post (seller) |
| GET | `/api/v1/offers/my-offers` | Yes | List seller's own offers (paginated) |
| GET | `/api/v1/offers/post/:postId` | Yes | List offers on a post (buyer only, Best Match) |
| GET | `/api/v1/offers/:offerId` | Yes | Get offer detail (seller owner or post buyer) |
| PUT | `/api/v1/offers/:offerId` | Yes | Edit offer (seller, pending only) |
| DELETE | `/api/v1/offers/:offerId` | Yes | Withdraw offer (seller, pending only) → 204 |
| POST | `/api/v1/offers/:offerId/accept` | Yes | Accept offer (buyer) → 201 |

#### `POST /offers` (requires Bearer token)

**Request:**
```json
{
  "postId": "uuid",
  "offerType": "service",
  "quoteAmount": 250,
  "pricingType": "flat_rate",
  "estimatedHours": 3,
  "canStart": "Tomorrow",
  "completionTime": "Same day",
  "message": "I can fix your kitchen faucet. 10 years experience with plumbing...",
  "attachments": [],
  "terms": "Parts included in quote",
  "warranty": "90-day warranty on all work"
}
```

**Validation rules:**
- `quoteAmount`: $10 - $1,000,000
- `message`: 50-1000 chars
- `attachments`: max 10 URLs
- One offer per seller per post (unique constraint)
- 24h cooldown after withdrawing before re-submitting to same post
- Max 25 offers per post

**Response (201):** Full offer object with fee breakdown preview.

#### `GET /offers/my-offers` (requires Bearer token)

**Query parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `status` | OfferStatus | — | Filter: `pending`, `accepted`, `declined`, `withdrawn`, `expired` |
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page (max 50) |
| `sort` | string | `newest` | `newest`, `oldest`, `price_low`, `price_high` |

#### `GET /offers/post/:postId` (requires Bearer token, buyer only)

Returns all offers on the buyer's post, with **Best Match** scoring.

**Query parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page (max 50) |
| `sort` | string | `best_match` | `best_match`, `newest`, `price_low`, `price_high` |

**Best Match algorithm:** `rating×0.4 + priceCompetitiveness×0.3 + distance×0.15 + responseTime×0.1 + completionRate×0.05`

#### `PUT /offers/:offerId` (requires Bearer token)

Only allowed if: the requester is the seller owner AND the offer status is `pending`. If `quoteAmount` changes, the fee breakdown is recalculated.

#### `DELETE /offers/:offerId` (requires Bearer token)

Withdraws the offer (sets status to `withdrawn`). Decrements `offerCount` on the post. Returns 204 No Content.

#### `POST /offers/:offerId/accept` (requires Bearer token)

Buyer accepts an offer. This is an **atomic operation** (`prisma.$transaction`):
1. Sets this offer to `accepted`
2. Declines all other `pending` offers on the same post
3. Marks the post as `filled`
4. Creates a `Transaction` record with fee breakdown
5. Creates a `Conversation` between buyer and seller

**Note:** In production, the seller must have completed Stripe Connect onboarding (`stripeChargesEnabled: true`) for non-cash transaction types. In development/test mode (`NODE_ENV !== 'production'`), this check is bypassed.

**Response (201):**
```json
{
  "success": true,
  "data": {
    "offer": { "id": "uuid", "status": "accepted" },
    "transaction": { "id": "uuid", "status": "in_progress", "escrowStatus": "held" }
  }
}
```

### Transactions — `/api/v1/transactions/*` (Session 5)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/transactions/my-transactions` | Yes | List user's transactions (paginated) |
| GET | `/api/v1/transactions/:transactionId` | Yes | Get transaction detail (buyer or seller) |
| PUT | `/api/v1/transactions/:transactionId/status` | Yes | Update status (seller only) |
| POST | `/api/v1/transactions/:transactionId/mark-complete` | Yes | Mark complete with photos (seller) |
| POST | `/api/v1/transactions/:transactionId/approve` | Yes | Approve & release funds (buyer) |
| POST | `/api/v1/transactions/:transactionId/request-changes` | Yes | Request changes (buyer, max 2) |
| PUT | `/api/v1/transactions/:transactionId/cancel` | Yes | Cancel transaction (buyer or seller) |

#### `GET /transactions/my-transactions` (requires Bearer token)

**Query parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `role` | `buyer`/`seller` | `buyer` | View as buyer or seller |
| `status` | TransactionStatus | — | Filter by status (18 possible states) |
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page (max 50) |
| `sort` | string | `newest` | `newest`, `oldest` |

#### `PUT /transactions/:transactionId/status` (requires Bearer token, seller only)

**Request:**
```json
{
  "status": "scheduled",
  "scheduledDate": "2026-02-20",
  "scheduledTime": "10:00 AM",
  "note": "Confirmed appointment"
}
```

**Valid status transitions per transaction type:**
- **Service:** `scheduled` → `on_the_way` → `started`
- **Shipped product:** `preparing_shipment` → `shipped` → `in_transit` (with tracking number/carrier)
- **Local product:** `pending_meetup` → `meetup_scheduled` (with meetup location/date/time)

#### `POST /transactions/:transactionId/mark-complete` (requires Bearer token, seller)

**Request:**
```json
{
  "afterPhotos": ["https://r2-url/transaction-photos/..."],
  "beforePhotos": ["https://r2-url/transaction-photos/..."],
  "workSummary": "Replaced kitchen faucet cartridge and fixed leak"
}
```

At least 1 after photo is required. Sets status to `awaiting_approval` and starts a 7-day auto-release timer.

#### `POST /transactions/:transactionId/approve` (requires Bearer token, buyer)

Approves work and releases escrow funds. Sets status to `completed`, `escrowStatus` to `released`. Increments seller's `totalCompleted` counter.

#### `POST /transactions/:transactionId/request-changes` (requires Bearer token, buyer)

**Request:**
```json
{
  "reason": "The faucet is still dripping slightly, can you tighten it more?"
}
```

Max 2 change requests per transaction. Clears the auto-release timer.

#### `PUT /transactions/:transactionId/cancel` (requires Bearer token)

**Request:**
```json
{
  "reason": "Seller is not responding to messages"
}
```

Either buyer or seller can cancel. If escrow was `held`, it is refunded.

### Payments — `/api/v1/payments/*` (Session 6)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/payments/create-intent` | Yes | Create Stripe PaymentIntent for a transaction (buyer) |
| POST | `/api/v1/payments/refund` | Yes | Refund a transaction payment (buyer) |
| POST | `/api/v1/payments/seller/onboard` | Yes | Start Stripe Connect onboarding (seller) |
| GET | `/api/v1/payments/seller/status` | Yes | Check seller's Stripe account status |

Additionally, a **webhook endpoint** is registered as a separate Fastify plugin:

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/payments/webhook` | No (signature-verified) | Stripe webhook handler |

#### `POST /payments/create-intent` (requires Bearer token, buyer)

**Request:**
```json
{
  "transactionId": "uuid"
}
```

**Validation rules:**
- Only the buyer of the transaction can create a payment intent
- Cash transactions (`product_local_cash`) are rejected — no online payment needed
- Cannot create a second intent if one already exists
- Seller must have completed Stripe onboarding (`stripeChargesEnabled: true`) — bypassed in dev/test mode

**Response (201):**
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_xxx_secret_yyy",
    "paymentIntentId": "pi_xxx"
  }
}
```

The `clientSecret` is used by the Flutter SDK to complete the payment on-device.

#### `POST /payments/refund` (requires Bearer token, buyer)

**Request:**
```json
{
  "transactionId": "uuid",
  "reason": "Seller did not complete the work as described"
}
```

**Validation rules:**
- Only the buyer can request a refund
- Transaction must have a Stripe PaymentIntent (`stripePaymentIntentId` exists)
- Escrow must be in `held` status
- `reason`: optional, 10-500 chars

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "escrowStatus": "refunded",
    "stripeRefundId": "re_xxx",
    "refundAmount": 216.39
  }
}
```

Also sets the transaction status to `cancelled`.

#### `POST /payments/seller/onboard` (requires Bearer token, seller)

Initiates Stripe Connect Standard onboarding. Creates a new Stripe account if the seller doesn't have one, or re-links the existing account.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "url": "https://connect.stripe.com/setup/...",
    "accountId": "acct_xxx"
  }
}
```

The seller is redirected to the Stripe-hosted onboarding flow. After completion, Stripe sends an `account.updated` webhook to update `chargesEnabled`/`payoutsEnabled`.

#### `GET /payments/seller/status` (requires Bearer token, seller)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "onboarded": true,
    "chargesEnabled": true,
    "payoutsEnabled": true,
    "accountId": "acct_xxx"
  }
}
```

If the seller hasn't started onboarding, `onboarded` is `false` and `accountId` is `null`.

#### `POST /payments/webhook` (no auth, Stripe signature verified)

Stripe webhook handler. Registered as a separate Fastify plugin with a raw body content-type parser (scoped to this route only, no conflict with the main JSON parser).

**Handled events:**
| Event | Action |
|---|---|
| `payment_intent.succeeded` | Sets `escrowStatus = 'held'`, stores charge ID + card last4/brand |
| `payment_intent.payment_failed` | Logs failure to transaction `timeline` JSON |
| `charge.refunded` | Sets `escrowStatus = 'refunded'` |
| `account.updated` | Syncs seller `chargesEnabled` / `payoutsEnabled` flags |

**Response:** `{ "received": true }` (200)

### Messages — `/api/v1/messages/*` (Session 7, real-time via Socket.IO in Session 13)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/messages/conversations` | Yes | List conversations (paginated) |
| GET | `/api/v1/messages/conversations/:conversationId` | Yes | Get conversation with messages |
| POST | `/api/v1/messages/conversations/:conversationId/messages` | Yes | Send message |
| PUT | `/api/v1/messages/conversations/:conversationId/mark-read` | Yes | Mark conversation read |
| POST | `/api/v1/messages/conversations/:conversationId/report` | Yes | Report conversation |

**Note:** Conversations are auto-created when an offer is accepted (part of the `acceptOffer` atomic transaction).

#### `GET /messages/conversations` (requires Bearer token)

**Query parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `status` | `active`/`archived`/`closed` | — | Filter by status |
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page (max 50) |

Returns conversations where the user is participant1 or participant2, with other participant info, last message preview, and unread count.

#### `GET /messages/conversations/:conversationId` (requires Bearer token)

Paginated messages (oldest-first). Only accessible by conversation participants.

**Query parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | int | 1 | Page number |
| `limit` | int | 50 | Items per page (max 100) |

#### `POST /messages/conversations/:conversationId/messages` (requires Bearer token)

**Request:**
```json
{
  "messageText": "Hi, I'm interested in your service. When can you start?",
  "attachments": ["https://r2-url/message-attachments/..."]
}
```

**Validation rules:**
- `messageText`: 1-2000 chars
- `attachments`: max 5 URLs
- Rate limit: 50 messages/hour per user (Redis counter)
- External payment detection: messages mentioning venmo, cashapp, zelle, paypal are flagged for moderation

**Response (201):** Full message object.

#### `PUT /messages/conversations/:conversationId/mark-read` (requires Bearer token)

Resets the unread counter for the conversation and marks all messages from the other user as read.

#### `POST /messages/conversations/:conversationId/report` (requires Bearer token)

**Request:**
```json
{
  "reason": "User is requesting payment outside the platform"
}
```

`reason`: 10-500 chars. Flags all messages in the conversation for moderation.

### WebSocket Events — Socket.IO (Session 13)

Real-time messaging is delivered via Socket.IO, running on the same server as the REST API (port 3000). Messages are **sent via REST** (see POST above) and **received in real-time via Socket.IO**.

#### Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: 'JWT_ACCESS_TOKEN' },
  transports: ['websocket', 'polling'],
});
```

**Authentication:** JWT access token passed in `auth.token` during handshake. Same `JWT_ACCESS_SECRET` as REST API. Token blacklist checked against Redis. Connection rejected if token is missing, invalid, expired, or revoked.

**Auto-join:** On connection, the server automatically joins the socket to a `user:{userId}` room for receiving personal notifications.

#### Events

| Event | Direction | Payload | Description |
|---|---|---|---|
| `join_conversation` | Client → Server | `conversationId` (string) | Join a conversation room. Server verifies participant access via Prisma. Responds with `joined_conversation` on success, `error` on failure. |
| `joined_conversation` | Server → Client | `{ conversationId }` | Confirmation that the client has joined the conversation room. |
| `leave_conversation` | Client → Server | `conversationId` (string) | Leave a conversation room. |
| `typing_start` | Bidirectional | `{ conversationId, userId, firstName }` | Client emits `conversationId` (string). Server broadcasts enriched payload to other participants in the room. |
| `typing_stop` | Bidirectional | `{ conversationId, userId }` | Client emits `conversationId` (string). Server broadcasts to other participants in the room. |
| `new_message` | Server → Client | Full message object | Emitted when a message is sent via REST POST. Delivered to all sockets in the `conv:{conversationId}` room. |
| `messages_read` | Server → Client | `{ conversationId, readBy }` | Emitted when a user marks a conversation as read via REST PUT. |
| `notification` | Server → Client | `{ type, conversationId, ... }` | Emitted to the `user:{recipientId}` room. Currently used for `type: 'message_received'`. |
| `heartbeat` | Client → Server | (none) | Refreshes the user's presence TTL in Redis (5-min expiry). Client should emit every 4 minutes. |
| `error` | Server → Client | `{ message }` | Error response (e.g., "Conversation not found or access denied"). |

#### Presence

Users are tracked as online/offline via Redis keys:
- `presence:{userId}` → socketId (300s TTL)
- `presence:socket:{socketId}` → userId (300s TTL)

Presence auto-expires if the client doesn't send `heartbeat` events within 5 minutes.

#### Integration Notes

- **Messages are sent via REST, not Socket.IO.** Socket.IO is used only for real-time delivery and presence.
- **Polling fallback:** Mobile clients poll at 30s (chat) and 60s (conversations) intervals as a fallback for unreliable connections.
- **Optimistic UI:** Clients can display messages immediately on send (with a temp ID) and replace them with the server response on REST success.

### Reviews — `/api/v1/reviews/*` (Session 7)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/reviews` | Yes | Submit review (buyer only) |
| GET | `/api/v1/reviews/sellers/:sellerId` | No | List seller reviews (public) |
| PUT | `/api/v1/reviews/:reviewId/report` | Yes | Report review |

#### `POST /reviews` (requires Bearer token, buyer only)

**Request:**
```json
{
  "transactionId": "uuid",
  "overallRating": 5,
  "categoryRatings": {
    "quality": 5,
    "communication": 4,
    "timeliness": 5,
    "professionalism": 5,
    "value": 4
  },
  "writtenReview": "Excellent service! Fixed the leak quickly and cleaned up after.",
  "wouldRecommend": true,
  "completionPhotos": ["https://r2-url/transaction-photos/..."]
}
```

**Validation rules:**
- `overallRating`: 1-5 (integer)
- `categoryRatings`: all fields optional, each 1-5
- `writtenReview`: 10-2000 chars (optional)
- `completionPhotos`: max 10 URLs
- Only the buyer of a completed transaction can submit
- One review per transaction (unique constraint)

**Atomicity:** Creates review + recomputes seller stats (averageRating, totalReviews, ratingBadge) in an interactive `prisma.$transaction`.

**Response (201):** Full review object.

#### `GET /reviews/sellers/:sellerId` (public)

**Query parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page (max 50) |
| `sort` | string | `newest` | `newest`, `oldest`, `highest`, `lowest` |

**Response:** Includes `data` (reviews array), `meta` (pagination), and `summary` (averageRating, totalReviews, rating distribution).

#### `PUT /reviews/:reviewId/report` (requires Bearer token)

**Request:**
```json
{
  "reason": "This review appears to be fake"
}
```

`reason`: 10-500 chars. Flags review for moderation.

### Notifications — `/api/v1/notifications/*` (Session 7)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/notifications` | Yes | List notifications (paginated) |
| PUT | `/api/v1/notifications/read-all` | Yes | Mark all notifications read |
| PUT | `/api/v1/notifications/:notificationId/read` | Yes | Mark one notification read |
| DELETE | `/api/v1/notifications/:notificationId` | Yes | Soft-delete notification → 204 |

#### `GET /notifications` (requires Bearer token)

**Query parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page (max 50) |
| `unreadOnly` | boolean | false | Only show unread notifications |
| `type` | string | — | Filter by notification type (max 50 chars) |

**Response (200):** Array of notification objects with pagination meta.

#### `PUT /notifications/read-all` (requires Bearer token)

Marks all unread notifications for the user as read. Returns `{ count }` of updated notifications.

#### `PUT /notifications/:notificationId/read` (requires Bearer token)

Marks a single notification as read. Returns success message.

#### `DELETE /notifications/:notificationId` (requires Bearer token)

Soft-deletes a notification. Returns 204 No Content.

**Note:** Notifications are created internally by any service via `NotificationsService.createNotification()`. Delivery is async via BullMQ (push via FCM, email via SendGrid, in-app via DB).

### Admin — `/api/v1/admin/*` (Session 9)

**All admin endpoints require authentication AND admin role.** Both `app.authenticate` and `app.requireAdmin` hooks are applied at the plugin level.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/admin/stats` | Admin | Dashboard stats |
| GET | `/api/v1/admin/users` | Admin | List users (paginated, searchable) |
| GET | `/api/v1/admin/users/:userId` | Admin | User detail (full profile + transactions) |
| POST | `/api/v1/admin/users/:userId/suspend` | Admin | Suspend user |
| POST | `/api/v1/admin/users/:userId/ban` | Admin | Ban user |
| POST | `/api/v1/admin/users/:userId/reactivate` | Admin | Reactivate suspended/banned user |
| POST | `/api/v1/admin/users/:userId/force-logout` | Admin | Invalidate all user sessions |
| GET | `/api/v1/admin/verifications` | Admin | List verification requests |
| POST | `/api/v1/admin/verifications/:verificationId/review` | Admin | Approve/reject verification |
| GET | `/api/v1/admin/disputes` | Admin | List disputes |
| GET | `/api/v1/admin/disputes/:disputeId` | Admin | Dispute detail |
| POST | `/api/v1/admin/disputes/:disputeId/resolve` | Admin | Resolve dispute |
| GET | `/api/v1/admin/moderation/flagged` | Admin | List flagged content (reviews + messages) |
| POST | `/api/v1/admin/moderation/reviews/:reviewId` | Admin | Moderate review |
| POST | `/api/v1/admin/moderation/messages/:messageId` | Admin | Moderate message |
| GET | `/api/v1/admin/transactions` | Admin | List all transactions |
| GET | `/api/v1/admin/audit-logs` | Admin | List audit logs |

#### `GET /admin/stats` (requires admin)

Returns dashboard metrics.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "activeUsers": 140,
    "suspendedUsers": 5,
    "bannedUsers": 5,
    "totalRevenue": 12500.00,
    "pendingVerifications": 8,
    "openDisputes": 3,
    "flaggedContent": 12
  }
}
```

#### `GET /admin/users` (requires admin)

**Query parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page (max 100) |
| `status` | UserStatus | — | Filter by status |
| `accountType` | AccountType | — | Filter by account type |
| `search` | string | — | Search by email or name (max 100 chars) |

#### `GET /admin/users/:userId` (requires admin)

Returns full user profile including seller profile, recent transactions, and verification requests.

#### `POST /admin/users/:userId/suspend` (requires admin)

**Request:**
```json
{
  "reason": "Violation of terms of service - multiple reports of fraudulent listings"
}
```

`reason`: 10-500 chars. Admins cannot suspend other admins. Sets user status to `suspended`, invalidates all sessions, creates audit log entry.

#### `POST /admin/users/:userId/ban` (requires admin)

**Request:**
```json
{
  "reason": "Repeated violations after suspension - permanent ban required"
}
```

`reason`: 10-500 chars. Admins cannot ban other admins. Sets user status to `banned`, invalidates all sessions, creates audit log entry.

#### `POST /admin/users/:userId/reactivate` (requires admin)

Restores a suspended or banned user to `active` status. Creates audit log entry.

#### `POST /admin/users/:userId/force-logout` (requires admin)

Scans and deletes all `auth:refresh:{userId}:*` Redis keys, invalidating all active sessions. Creates audit log entry.

#### `GET /admin/verifications` (requires admin)

**Query parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page (max 50) |
| `status` | VerificationRequestStatus | — | Filter by status |
| `type` | VerificationType | — | Filter by verification type |

Returns verification requests with seller and user info.

#### `POST /admin/verifications/:verificationId/review` (requires admin)

**Request (approve):**
```json
{
  "action": "approve",
  "notes": "License verified against TX state database"
}
```

**Request (reject):**
```json
{
  "action": "reject",
  "rejectionReason": "License number does not match state records. Please resubmit with correct documentation."
}
```

`rejectionReason` is required when `action` is `reject` (Zod `.refine()` validation). On approval:
- Sets corresponding `*_verified` boolean on SellerProfile (e.g., `licenseVerified = true`)
- Adds badge to `verificationBadges` JSON array
- Recalculates `verificationTier` (1→2→3→4)
- Creates audit log entry

#### `GET /admin/disputes` (requires admin)

**Query parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page (max 50) |
| `status` | DisputeStatus | — | Filter by status |

Returns disputes with transaction, buyer, and seller info.

#### `GET /admin/disputes/:disputeId` (requires admin)

Returns full dispute detail with all relations.

#### `POST /admin/disputes/:disputeId/resolve` (requires admin)

**Request:**
```json
{
  "outcome": "partial_refund",
  "refundAmount": 75.00,
  "resolutionSummary": "Seller completed 75% of the agreed work. Partial refund issued for incomplete portion."
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `outcome` | enum | Yes | `full_refund`, `partial_refund`, `no_refund`, `custom` |
| `refundAmount` | number | No | Amount to refund (min 0) |
| `resolutionSummary` | string | Yes | 10-2000 chars |

Creates audit log entry.

#### `GET /admin/moderation/flagged` (requires admin)

**Query parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page (max 50) |
| `contentType` | `review`/`message` | — | Filter by content type |

Returns a unified list of flagged reviews and messages with pagination.

#### `POST /admin/moderation/reviews/:reviewId` (requires admin)

**Request:**
```json
{
  "action": "reject",
  "reason": "Review contains abusive language"
}
```

`action`: `approve` or `reject`. `reason`: optional, max 500 chars. Creates audit log entry.

#### `POST /admin/moderation/messages/:messageId` (requires admin)

Same schema as review moderation. Creates audit log entry.

#### `GET /admin/transactions` (requires admin)

**Query parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page (max 100) |
| `status` | string | — | Filter by transaction status |
| `escrowStatus` | EscrowStatus | — | Filter by escrow status |

Returns all transactions with buyer and seller info.

#### `GET /admin/audit-logs` (requires admin)

**Query parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | int | 1 | Page number |
| `limit` | int | 50 | Items per page (max 100) |
| `action` | string | — | Filter by action type (max 100 chars) |
| `resourceType` | string | — | Filter by resource type (max 50 chars) |
| `userId` | UUID | — | Filter by actor user ID |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "actorType": "admin",
      "actorId": "uuid",
      "action": "user_suspended",
      "resourceType": "user",
      "resourceId": "uuid",
      "details": { "reason": "Violation of terms" },
      "createdAt": "2026-02-19T..."
    }
  ],
  "meta": { "page": 1, "limit": 50, "total": 25, "totalPages": 1 }
}
```

## Response Envelope

All responses use a standard envelope:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}
```

### Error Response (RFC 7807)

```json
{
  "success": false,
  "error": {
    "type": "about:blank",
    "title": "ValidationError",
    "status": 400,
    "detail": "Request validation failed",
    "errors": {
      "email": ["Invalid email address"],
      "password": ["Must be at least 8 characters"]
    }
  }
}
```

### Pagination

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## Built In

- **Session 1:** Health check, response envelope types
- **Session 2:** Full auth module (8 endpoints, rate limiting, JWT tokens)
- **Session 3:** Users module (8 endpoints), Sellers module (7 endpoints)
- **Session 4:** Categories module (3 endpoints), Posts module (10 endpoints), Search module (1 endpoint)
- **Session 5:** Offers module (7 endpoints), Transactions module (7 endpoints)
- **Session 6:** Payments module (4 endpoints + webhook), Stripe Connect integration
- **Session 7:** Messages module (5 endpoints), Reviews module (3 endpoints), Notifications module (4 endpoints)
- **Session 8:** AI Post Creation (3 endpoints added to posts module: parse, suggest-images, generate-job-profile)
- **Session 9:** Admin module (17 endpoints: dashboard, user management, verification review, disputes, moderation, transactions, audit logs)
- **Post-Session 13:** Uploads module (2 endpoints), Disputes module (5 endpoints), Payouts module (3 endpoints), Saved Searches module (4 endpoints), geocoding utility, Stripe webhook coverage expansion

---

## Uploads

### POST /api/v1/uploads
Generate a presigned URL for direct file upload to Cloudflare R2.

**Auth:** Required (Bearer token)

**Request Body:**
```json
{
  "filename": "photo.jpg",
  "contentType": "image/jpeg",
  "category": "post-photos"
}
```

Categories: `profile-photos`, `portfolio`, `post-photos`, `post-videos`, `transaction-photos`, `verification-docs`, `message-attachments`

**Response (201):**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://r2.cloudflarestorage.com/...",
    "key": "post-photos/{userId}/{uuid}.jpg",
    "publicUrl": "https://cdn.example.com/post-photos/{userId}/{uuid}.jpg"
  }
}
```

### DELETE /api/v1/uploads?key={r2Key}
Delete an uploaded file. Only the uploader can delete their files.

**Auth:** Required (Bearer token)

**Response (200):**
```json
{ "success": true, "data": { "message": "File deleted" } }
```

---

## Disputes (User-Facing)

### POST /api/v1/disputes
File a dispute on a transaction. Only buyer or seller on the transaction can file.

**Auth:** Required

**Request Body:**
```json
{
  "transactionId": "uuid",
  "disputeType": "quality_issue",
  "description": "Detailed description (min 20 chars)",
  "requestedResolution": "partial_refund",
  "requestedAmount": 50,
  "evidence": [{ "type": "text", "description": "Evidence details" }]
}
```

**Response (201):** Dispute object with status `open`, 7-day evidence deadline.

### GET /api/v1/disputes/my-disputes
List your disputes as buyer or seller.

**Auth:** Required  
**Query:** `?page=1&limit=20&status=open`

### GET /api/v1/disputes/:disputeId
Get dispute detail (participant only).

**Auth:** Required

### POST /api/v1/disputes/:disputeId/evidence
Submit evidence for an open/under_review dispute before the evidence deadline.

**Auth:** Required  
**Body:** `{ "evidence": [{ "type": "photo", "url": "...", "description": "..." }] }`

### POST /api/v1/disputes/:disputeId/appeal
Appeal a resolved dispute. Escalates to tier 2.

**Auth:** Required  
**Body:** `{ "reason": "Appeal reason (min 20 chars)", "additionalEvidence": [] }`

---

## Payouts

### GET /api/v1/payouts
List seller's payouts.

**Auth:** Required (seller only)  
**Query:** `?page=1&limit=20&status=paid`

### GET /api/v1/payouts/summary
Get earnings summary: totalEarned, totalPending, totalInTransit, totalPlatformFees, payoutCount.

**Auth:** Required (seller only)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalEarned": 1500.00,
    "totalPending": 200.00,
    "totalInTransit": 100.00,
    "totalPlatformFees": 120.00,
    "payoutCount": 10,
    "currency": "USD"
  }
}
```

### GET /api/v1/payouts/:payoutId
Get payout detail (seller owner only).

**Auth:** Required

---

## Saved Searches

### POST /api/v1/saved-searches
Create a saved search (max 25 per user).

**Auth:** Required

**Request Body:**
```json
{
  "name": "Plumbing in Dallas",
  "searchType": "posts",
  "filters": { "category": "services", "city": "Dallas" },
  "notificationsEnabled": true
}
```

### GET /api/v1/saved-searches
List your saved searches.

**Auth:** Required  
**Query:** `?page=1&limit=20`

### PUT /api/v1/saved-searches/:searchId
Update a saved search (owner only).

**Auth:** Required  
**Body:** `{ "name": "Updated Name", "notificationsEnabled": false, "isActive": true }`

### DELETE /api/v1/saved-searches/:searchId
Soft delete a saved search (owner only).

**Auth:** Required  
**Response:** 204 No Content
