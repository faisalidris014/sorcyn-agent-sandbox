# Testing Guide

## Overview

The Reverse Marketplace backend has two complementary testing systems:

- **Vitest** (unit/integration) — 233+ tests across 14 test files, running against Fastify's `inject()` method and a real PostgreSQL/Redis stack
- **curl-based API scripts** — 14 bash suites that test a running server end-to-end via HTTP

Both share the same 4 seeded test accounts and Docker infrastructure.

## Running Tests

### Vitest (Unit & Integration)

```bash
cd backend

# Watch mode (re-runs on file changes)
npm test

# Run once
npm run test:run

# Single file
npx vitest run tests/auth.test.ts

# Coverage report (v8 provider)
npm run test:coverage
```

### curl-based API Scripts

Requires a running server (`npm run dev`), Docker (PostgreSQL), `curl`, and `jq`.

```bash
cd backend/scripts/api-tests

# Run all 14 suites in dependency order
./run-all.sh

# Run a single suite
./run-all.sh 06-posts.sh

# Run all + clean up test data afterward
./run-all.sh --clean
```

Override the server URL:
```bash
API_TEST_BASE_URL=http://localhost:4000 ./run-all.sh
```

---

## Vitest Architecture

### Stack

| Component | Purpose |
|-----------|---------|
| Vitest | Test runner |
| Supertest (via `app.inject()`) | HTTP request simulation (no real server needed) |
| Prisma | Direct DB access for setup/teardown/assertions |
| ioredis | Direct Redis access for auth key management |
| `vi.mock` | SDK mocking (Stripe, Gemini) |

### Configuration (`vitest.config.ts`)

- **Globals:** `true` — `describe`, `it`, `expect` available without imports
- **Environment:** `node`
- **Coverage:** v8 provider, excludes `server.ts` and `config/`

### Test Environment Behavior

When `NODE_ENV=test`:
- **Rate limiting** is disabled to prevent flaky tests
- **BullMQ workers** are disabled (jobs are enqueued but not processed)
- **Email/push** stubs log instead of sending
- **Stripe SDK** is mocked via `vi.mock` (no real Stripe calls)
- **Gemini SDK** is mocked via `vi.mock` (no real AI calls)

---

## Test File Conventions

### Location & Naming

```
backend/tests/
├── helpers.ts          # Shared utilities (createTestUser, cleanup, etc.)
├── auth.test.ts        # One test file per module
├── users.test.ts
├── sellers.test.ts
├── categories.test.ts
├── posts.test.ts
├── offers.test.ts
├── transactions.test.ts
├── payments.test.ts
├── notifications.test.ts
├── messages.test.ts
├── reviews.test.ts
├── ai-assist.test.ts
├── admin.test.ts
└── socket.test.ts      # Socket.IO integration tests
```

### Structure Pattern

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { createTestUser, cleanupTestData, authHeaders } from './helpers.js';

let app: FastifyInstance;
let buyer: TestUser;

beforeAll(async () => {
  app = await buildApp();
  buyer = await createTestUser(app, { accountType: 'buyer' });
});

afterAll(async () => {
  await cleanupTestData(['testuser']);
  await app.close();
});

describe('POST /api/v1/resource', () => {
  it('should create a resource', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/resource',
      headers: authHeaders(buyer.token),
      payload: { /* ... */ },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data).toHaveProperty('id');
  });
});
```

### Key Conventions

- **FK-safe cleanup:** Delete in reverse dependency order (audit logs -> notifications -> messages -> reviews -> disputes -> transactions -> offers -> posts -> seller profiles -> conversations -> users)
- **Email verification:** Done via direct DB update (`prisma.user.update({ emailVerified: true })`), not real email
- **Admin promotion:** Via `makeAdmin()` helper which does a DB update + re-login for admin-scoped JWT
- **No real external calls:** Stripe and Gemini are fully mocked; email/push are stubs

---

## Helper Functions (`tests/helpers.ts`)

### `createTestUser(app, overrides?)`

Registers a user, auto-verifies email in DB, logs in, and returns `{ token, userId, email, password, firstName, lastName, accountType }`.

```typescript
const buyer = await createTestUser(app);
const seller = await createTestUser(app, { accountType: 'seller' });
```

### `makeAdmin(app, user)`

Promotes a user to admin via direct DB update, re-logs in to get an admin-scoped JWT. Returns the new token.

```typescript
const adminToken = await makeAdmin(app, buyer);
```

### `authHeaders(token)`

Returns `{ authorization: 'Bearer <token>' }` for use in `app.inject()`.

### `cleanupTestData(emailPatterns)`

Deletes all users whose emails contain any of the given patterns, plus all their related data in FK-safe order.

```typescript
await cleanupTestData(['testuser', 'sockettest']);
```

### `clearAuthRedisKeys()`

Scans Redis for all `auth:*` keys and deletes them. Used for test isolation between auth test runs.

---

## Socket.IO Test Patterns

Socket.IO tests use a different setup than REST tests because they need a real HTTP server (not Fastify's `inject()`).

### Setup Pattern

```typescript
let httpServer: HttpServer;
let port: number;
const clientSockets: ClientSocket[] = [];

beforeAll(async () => {
  // Create a raw HTTP server on a random port
  httpServer = createServer();
  await new Promise<void>(resolve => httpServer.listen(0, resolve));
  port = (httpServer.address() as AddressInfo).port;

  // Attach Socket.IO to it
  const io = initSocketIO(httpServer);
  registerMessagesGateway(io);
});

afterAll(async () => {
  // Clean up all client sockets
  clientSockets.forEach(s => s.connected && s.disconnect());
  resetIO();
  httpServer.close();
});
```

### Key Helpers

**`createClientSocket(token)`** — Creates a socket.io-client instance pointed at the test server with JWT auth:
```typescript
function createClientSocket(token: string): ClientSocket {
  const socket = ioClient(`http://localhost:${port}`, {
    transports: ['websocket'],
    auth: { token },
    autoConnect: false,
  });
  clientSockets.push(socket);  // tracked for cleanup
  return socket;
}
```

**`waitForEvent(socket, event, timeoutMs?)`** — Returns a promise that resolves when the event fires or rejects on timeout (default 3s):
```typescript
const data = await waitForEvent<{ userId: string }>(socket, 'typing_start');
```

**`generateToken(userId, email)`** — Creates a valid JWT for test users without going through the login flow.

### Important Notes

- Always call `resetIO()` in `afterAll` to prevent cross-contamination between test files
- Track all client sockets in an array and disconnect them in `afterAll`
- The HTTP server runs on port `0` (OS-assigned random port) to avoid conflicts

---

## curl-based API Test Scripts

### Architecture

```
backend/scripts/api-tests/
├── _config.sh          # Server URL, test credentials, colors, counters
├── _helpers.sh         # HTTP helpers, assertions, state management
├── _state.sh           # Auto-generated key-value store (created by run-all.sh)
├── run-all.sh          # Orchestrator: prerequisites, ordering, cleanup, summary
├── 01-health.sh        # Health check
├── 02-auth.sh          # Login all 4 accounts, register new user
├── 03-categories.sh    # List, tree, by-slug
├── 04-users.sh         # Profile, update, public profile
├── 05-sellers.sh       # Profile CRUD, verification
├── 06-posts.sh         # Create, list, feed, detail
├── 07-offers.sh        # Submit, list, accept
├── 08-transactions.sh  # Status transitions, complete
├── 09-messages.sh      # Conversations, send, read
├── 10-payments.sh      # Intent, onboard, status
├── 11-reviews.sh       # Submit, list
├── 12-notifications.sh # List, read, delete
├── 13-admin.sh         # Stats, users, moderation
└── 14-search.sh        # Full-text search
```

### Helper Functions (`_helpers.sh`)

#### HTTP Helpers

All HTTP helpers set two global variables: `BODY` (response JSON) and `CODE` (HTTP status).

| Function | Signature | Purpose |
|----------|-----------|---------|
| `api_get` | `api_get path [token]` | GET request |
| `api_post` | `api_post path [data] [token]` | POST with JSON body |
| `api_put` | `api_put path [data] [token]` | PUT with JSON body |
| `api_patch` | `api_patch path [data] [token]` | PATCH with JSON body |
| `api_delete` | `api_delete path [data] [token]` | DELETE with optional body |
| `api_raw` | `api_raw method url [curl_args...]` | Raw curl for non-JSON endpoints |

#### Assertions

| Function | Signature | Purpose |
|----------|-----------|---------|
| `check` | `check label expected_code actual_code [body]` | Assert HTTP status code |
| `check_json` | `check_json label body jq_expr expected` | Assert JSON value equals expected |
| `check_json_exists` | `check_json_exists label body jq_expr` | Assert JSON field exists and is non-null |
| `check_json_array_min` | `check_json_array_min label body jq_expr min_len` | Assert array has at least N items |
| `skip` | `skip label [reason]` | Mark a test as skipped |

#### State & Utilities

| Function | Signature | Purpose |
|----------|-----------|---------|
| `save_state` | `save_state key value` | Persist a value to `_state.sh` for later suites |
| `extract` | `extract body jq_expr` | Extract a value from JSON using jq |
| `section` | `section title` | Print a section header |
| `db_query` | `db_query sql` | Run SQL directly against the Docker PostgreSQL container |
| `summary` | `summary [suite_name]` | Print pass/fail/skip counts, return exit code 1 if any failures |

### State Flow Between Suites

Suites run in order (01 through 14). Each suite saves IDs and tokens to `_state.sh` using `save_state`. Later suites source `_state.sh` to use resources created by earlier suites.

```
02-auth.sh    → saves BUYER_TOKEN, SELLER_TOKEN, BOTH_TOKEN, ADMIN_TOKEN, NEW_USER_ID
05-sellers.sh → saves SELLER_PROFILE_ID, VERIFICATION_REQUEST_ID
06-posts.sh   → saves TEST_POST_ID, TEST_CATEGORY_ID
07-offers.sh  → saves TEST_OFFER_ID
08-transactions.sh → saves TEST_TRANSACTION_ID
09-messages.sh → saves TEST_CONVERSATION_ID
```

This means **suites must run in order** when run together — skipping `02-auth.sh` will cause all later suites to fail (no tokens).

### Writing a New Suite

```bash
#!/usr/bin/env bash
source "$(cd "$(dirname "$0")" && pwd)/_helpers.sh"

section "My New Module"

# Use tokens from state
api_get "/my-resource" "$BUYER_TOKEN"
check "List resources" 200 "$CODE"

# Create and save for later suites
api_post "/my-resource" '{"name":"test"}' "$BUYER_TOKEN"
check "Create resource" 201 "$CODE"
save_state "MY_RESOURCE_ID" "$(extract "$BODY" '.data.id')"

summary "My New Module"
```

---

## Test Accounts

Four seeded accounts are available in both Vitest and API test scripts:

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| `buyer@test.com` | `TestPassword123!` | buyer | Buyer-side testing |
| `seller@test.com` | `TestPassword123!` | seller | Seller-side testing (has seller profile) |
| `both@test.com` | `TestPassword123!` | both | Dual-role testing |
| `admin@reversemarketplace.com` | `AdminSecure456!` | admin | Admin endpoint testing |

Vitest `createTestUser()` generates unique accounts (`testuser{n}_{timestamp}@example.com`) to avoid conflicts.

---

## Per-File Test Breakdown

### `auth.test.ts` (30 tests)
- Registration (validation, duplicate email, success)
- Login (invalid credentials, lockout after 5 failures, suspended/banned accounts, success)
- Token refresh (rotation, reuse detection)
- Logout (access token blacklist, refresh token invalidation)
- Email verification (valid/invalid/expired tokens)
- Password reset (forgot, reset, same-password check, session invalidation)

### `users.test.ts` (17 tests)
- Get current user profile (getMe)
- Update profile fields (partial updates, nullable fields)
- Update profile photo
- Change password (validation, same-password check, session invalidation)
- Switch account type (auto-creates seller profile)
- Update FCM token
- Soft-delete account (password confirmation)
- Get public user profile by ID

### `sellers.test.ts` (14 tests)
- Create seller profile (auto-switch to 'both')
- Get my seller profile
- Update seller profile (partial updates, profile strength recalculation)
- Submit verification request (duplicate check)
- Get verification requests
- Get public seller profile by seller ID and user ID

### `categories.test.ts` (8 tests)
- List all categories
- Filter by parentId, activeOnly, mvpOnly
- Get category tree (hierarchical)
- Get category by slug with children

### `posts.test.ts` (24 tests)
- Create post (draft and active, validation, email verified required)
- Get post by ID (view count increment, draft visibility)
- List my posts (pagination, status/category filter, sort)
- Update post (owner only, no offers check, publish draft)
- Delete post (soft delete to cancelled)
- Extend post (+3 days, max 1 extension)
- Mark post as filled
- Repost with same details
- Feed (public, filterable, sortable)
- Full-text search (PostgreSQL search_vector)

### `offers.test.ts` (21 tests)
- Submit offer (validation, unique constraint, 24h cooldown, fee preview)
- Get my offers (paginated, status filter, sort)
- Get offer by ID (access check: seller owner or post buyer)
- Update offer (pending only, fee recalculation)
- Withdraw offer (pending only, counter decrement)
- Accept offer (atomic: accept + decline others + fill post + create transaction)
- Get post offers (buyer only, Best Match scoring)

### `transactions.test.ts` (20 tests)
- List my transactions (paginated, role-based, status filter)
- Get transaction by ID (access check: buyer or seller)
- Update status (seller only, valid transitions per type)
- Mark complete (after photos required, 7-day auto-release)
- Approve and release (buyer, escrow released, seller stats updated)
- Request changes (buyer, max 2 per transaction)
- Cancel transaction (refund if escrow held)

### `payments.test.ts` (18 tests)
- Create payment intent (buyer validation, cash rejection, duplicate prevention, seller onboarding check)
- Process refund (buyer only, escrow held check)
- Release escrow (internal, creates Stripe Transfer)
- Refund payment intent (internal, used by cancel)
- Seller onboarding (create Stripe Connect account, return onboarding URL)
- Seller Stripe status (onboarded/not onboarded)
- Webhook handling (payment succeeded, failed, refunded, account updated)
- Stripe SDK fully mocked via `vi.mock`

### `notifications.test.ts` (12 tests)
- Create notification (DB insert + BullMQ job queue)
- List notifications (paginated, unreadOnly filter, type filter)
- Mark single notification read
- Mark all notifications read
- Delete notification (soft delete)

### `messages.test.ts` (16 tests)
- List conversations (with participant info, last message, unread count)
- Get conversation with messages (participant access check, pagination)
- Send message (rate limit 50/hr, external payment detection, unread counter)
- Mark conversation read
- Report conversation (flags all messages for moderation)

### `reviews.test.ts` (14 tests)
- Submit review (buyer only, completed transaction, unique constraint)
- Atomic seller stats update (averageRating, totalReviews, ratingBadge)
- List seller reviews (public, paginated, sort, summary)
- Report review (flag for moderation)

### `ai-assist.test.ts` (13 tests)
- Parse post request (natural language to structured post with category resolution)
- Suggest product images (Unsplash URL generation)
- Generate job profile (job seeker and employer variants)
- Rate limiting (20/hour per user)
- Error handling (missing API key -> 503, invalid response -> 500)
- JSON extraction from markdown code blocks
- Category slug fallback (unknown slug -> first active category)
- Gemini SDK fully mocked via `vi.mock`

### `admin.test.ts` (26 tests)
- Auth gate: unauthenticated rejected, non-admin rejected, admin access granted
- Dashboard stats: all metrics returned
- User management: list, search, detail, suspend (with reason validation), reactivate, ban
- Force logout: session invalidation via Redis SCAN
- Verification: list pending, reject (requires reason), approve (updates badges/tier)
- Disputes: list, detail, resolve with outcome
- Moderation: list flagged, filter by type, approve review, reject message
- Transactions: list all with buyer/seller info
- Audit logs: list all, filter by action

### `socket.test.ts` (19 tests)
- Socket.IO connection with JWT auth
- Token blacklist rejection
- Join/leave conversation rooms (participant access check)
- Typing indicators (broadcast to room, excludes sender)
- Heartbeat presence refresh
- Disconnect presence cleanup
