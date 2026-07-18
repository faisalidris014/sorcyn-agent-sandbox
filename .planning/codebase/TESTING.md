# Testing Patterns

**Analysis Date:** 2026-02-27

## Test Framework

**Runner:**
- Vitest 4.0.18
- Config: `vitest.config.ts`
- Environment: Node.js (`environment: 'node'`)
- Global test functions enabled (`globals: true`)

**Assertion Library:**
- Vitest built-in expect API

**Run Commands:**
```bash
npm test              # Run tests in watch mode
npm run test:run      # Run tests once (CI mode)
npm run lint          # ESLint check
npm run lint:fix      # Fix ESLint issues
```

**Coverage:**
- Provider: V8 (`provider: 'v8'`)
- Reporters: text + LCOV
- Include: `src/**/*.ts`
- Exclude: `src/server.ts`, `src/config/**`

## Test File Organization

**Location:**
- Co-located tests in `/backend/tests/` directory (not alongside source files)
- Test files found by pattern: `tests/**/*.test.ts`

**Naming:**
- Pattern: `{module}.test.ts` (e.g., `auth.test.ts`, `posts.test.ts`)
- One test file per module

**Structure:**
```
tests/
├── helpers.ts              # Shared test utilities
├── auth.test.ts
├── users.test.ts
├── posts.test.ts
├── offers.test.ts
├── payments.test.ts
├── transactions.test.ts
├── messages.test.ts
├── reviews.test.ts
├── sellers.test.ts
├── notifications.test.ts
├── categories.test.ts
├── admin.test.ts
├── ai-assist.test.ts
└── manual-test.sh          # Manual testing script
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';

// Set NODE_ENV BEFORE importing app (which loads env config)
process.env.NODE_ENV = 'test';

let app: FastifyInstance;
let accessToken: string;
let userId: string;

const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPass123!',
  firstName: 'Test',
  lastName: 'User',
  accountType: 'buyer' as const,
  agreeToTerms: true as const,
  agreeToPrivacy: true as const,
};

function authHeaders() {
  return { authorization: `Bearer ${accessToken}` };
}

beforeAll(async () => {
  // 1. Build app (dynamic import after env set)
  const { buildApp } = await import('../src/app.js');
  app = await buildApp();
  await app.ready();

  // 2. Clean up previous test data (in FK dependency order)
  await prisma.user.deleteMany({ where: { email: TEST_USER.email } });

  // 3. Set up test users/data
  const registerRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: TEST_USER,
  });
  userId = registerRes.json().data.user.id;
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true },
  });

  const loginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: TEST_USER.email, password: TEST_USER.password },
  });
  accessToken = loginRes.json().data.tokens.accessToken;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: TEST_USER.email } });
  await redis.quit();
  await prisma.$disconnect();
  await app.close();
});

beforeEach(async () => {
  // Clear auth Redis keys between tests for isolation
  let cursor = '0';
  do {
    const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'auth:*', 'COUNT', 100);
    cursor = nextCursor;
    if (keys.length > 0) await redis.del(...keys);
  } while (cursor !== '0');
});

describe('POST /api/v1/auth/register', () => {
  it('should register a new user and return tokens', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: TEST_USER,
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe(TEST_USER.email);
    expect(body.data.tokens.accessToken).toBeDefined();
  });

  it('should reject duplicate email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: TEST_USER,
    });

    expect(res.statusCode).toBe(409);
    expect(res.json().error.detail).toContain('already registered');
  });
});
```

**Patterns:**
- `beforeAll`: Set NODE_ENV, build app, create test users, do one-time setup
- `afterAll`: Delete test users, disconnect Prisma/Redis, close app
- `beforeEach`: Clear Redis auth keys to prevent cross-test contamination
- Each test is isolated and can run independently

## Mocking

**Framework:** Vitest `vi` mock API

**Patterns:**
```typescript
import { describe, it, expect, vi } from 'vitest';

// Top-level mock (before imports that use the module)
vi.mock('../src/config/stripe.js', () => {
  const mockPaymentIntents = {
    create: vi.fn().mockResolvedValue({
      id: 'pi_test_123',
      client_secret: 'pi_test_123_secret_abc',
      status: 'requires_payment_method',
    }),
  };
  const mockRefunds = {
    create: vi.fn().mockResolvedValue({
      id: 're_test_123',
      status: 'succeeded',
    }),
  };
  return {
    getStripe: () => ({
      paymentIntents: mockPaymentIntents,
      refunds: mockRefunds,
    }),
  };
});
```

**What to mock:**
- External services: Stripe, SendGrid, Google Maps, Firebase
- Config modules that require API keys in test
- Use `.mockResolvedValue()` for async functions

**What NOT to mock:**
- Prisma (run against test database)
- Redis (run against test Redis instance)
- Fastify app itself
- Routes (test via `app.inject()`)
- Core business logic in services

**Example of NOT mocking Prisma:**
```typescript
// Real database call during tests
const user = await prisma.user.findFirst({
  where: { email: TEST_USER.email },
});
```

## Fixtures and Factories

**Test Data:**
```typescript
// helpers.ts exports factory functions
export interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  accountType: string;
  token: string;
  userId: string;
}

export async function createTestUser(
  app: FastifyInstance,
  overrides?: Partial<{
    email: string;
    firstName: string;
    lastName: string;
    accountType: string;
  }>,
): Promise<TestUser> {
  userCounter++;
  const email = overrides?.email ?? `testuser${userCounter}_${Date.now()}@example.com`;
  const password = 'TestPass123!';

  // Register
  const registerRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: {
      email,
      password,
      firstName: overrides?.firstName ?? 'Test',
      lastName: overrides?.lastName ?? `User${userCounter}`,
      accountType: overrides?.accountType ?? 'buyer',
      agreeToTerms: true,
      agreeToPrivacy: true,
    },
  });

  const userId = registerRes.json().data.user.id;

  // Auto-verify email in DB
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true },
  });

  // Login to get fresh token
  const loginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email, password },
  });

  return {
    email,
    password,
    firstName: overrides?.firstName ?? 'Test',
    lastName: overrides?.lastName ?? `User${userCounter}`,
    accountType: overrides?.accountType ?? 'buyer',
    token: loginRes.json().data.tokens.accessToken,
    userId,
  };
}

export function authHeaders(token: string) {
  return { authorization: `Bearer ${token}` };
}

export async function makeAdmin(
  app: FastifyInstance,
  user: TestUser,
): Promise<string> {
  await prisma.user.update({
    where: { id: user.userId },
    data: { isAdmin: true },
  });

  const loginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: user.email, password: user.password },
  });

  return loginRes.json().data.tokens.accessToken;
}

export async function cleanupTestData(emailPatterns: string[]): Promise<void> {
  for (const pattern of emailPatterns) {
    const users = await prisma.user.findMany({
      where: { email: { contains: pattern } },
      select: { id: true },
    });

    const userIds = users.map((u) => u.id);
    if (userIds.length === 0) continue;

    // Delete in FK-safe order (depth-first through relationships)
    await prisma.auditLog.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.message.deleteMany({ where: { senderId: { in: userIds } } });
    await prisma.review.deleteMany({ where: { buyerId: { in: userIds } } });

    // ... more deletions in dependency order ...

    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
}

export async function clearAuthRedisKeys(): Promise<void> {
  let cursor = '0';
  do {
    const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'auth:*', 'COUNT', 100);
    cursor = nextCursor;
    if (keys.length > 0) await redis.del(...keys);
  } while (cursor !== '0');
}
```

**Location:**
- `tests/helpers.ts` - Reusable test utilities and factories

## Coverage

**Requirements:** Not enforced; coverage reports generated but no minimum threshold

**View Coverage:**
```bash
npm run test:run  # Generates coverage report in text + LCOV format
```

**Current coverage:** Not tracked; coverage files generated to default vitest location

## Test Types

**Unit Tests:**
- Scope: Individual service methods and utilities
- Approach: Direct function calls, mock external dependencies
- Example: Testing `AuthService.hashToken()`, validation logic
- NOT heavily used; integration tests preferred for this codebase

**Integration Tests:**
- Scope: Full request → service → database flow
- Approach: Use `app.inject()` to make real HTTP requests through Fastify
- Database: Real test database (not mocked)
- Redis: Real test Redis instance (not mocked)
- External services: Mocked (Stripe, SendGrid, etc.)
- Example: `POST /api/v1/auth/register` → creates user in DB → returns tokens

**E2E Tests:**
- Framework/Approach: Not used; integration tests serve this purpose
- Manual testing: `tests/manual-test.sh` script for exploratory testing

## Common Patterns

**Async Testing:**
```typescript
it('should create a payment intent', async () => {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/payments/intent',
    headers: authHeaders(buyerToken),
    payload: { transactionId },
  });

  expect(res.statusCode).toBe(200);
  const body = res.json();
  expect(body.success).toBe(true);
  expect(body.data.clientSecret).toBeDefined();
});
```

**Error Testing:**
```typescript
it('should reject weak passwords', async () => {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: {
      ...TEST_USER,
      password: 'weak', // Invalid
    },
  });

  expect(res.statusCode).toBe(400);
  const body = res.json();
  expect(body.success).toBe(false);
  expect(body.error.type).toBeDefined();
});

it('should not find deleted user', async () => {
  // Create, delete, then verify not found
  const res = await app.inject({
    method: 'GET',
    url: `/api/v1/users/${deletedUserId}`,
  });

  expect(res.statusCode).toBe(404);
  expect(res.json().error.detail).toContain('not found');
});
```

**Two-user scenarios (buyer/seller):**
```typescript
const BUYER = { ...TEST_USER, email: 'buyer@example.com' };
const SELLER = { ...TEST_USER, email: 'seller@example.com' };

let buyerToken: string;
let sellerToken: string;

beforeAll(async () => {
  // Register both users
  const buyerRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: BUYER,
  });
  buyerToken = buyerRes.json().data.tokens.accessToken;

  const sellerRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: SELLER,
  });
  sellerToken = sellerRes.json().data.tokens.accessToken;
});

function buyerHeaders() {
  return { authorization: `Bearer ${buyerToken}` };
}

function sellerHeaders() {
  return { authorization: `Bearer ${sellerToken}` };
}

it('buyer can accept seller offer', async () => {
  // Buyer creates post
  const postRes = await app.inject({
    method: 'POST',
    url: '/api/v1/posts',
    headers: buyerHeaders(),
    payload: postPayload,
  });

  // Seller submits offer
  const offerRes = await app.inject({
    method: 'POST',
    url: '/api/v1/offers',
    headers: sellerHeaders(),
    payload: { postId: postRes.json().data.id, message: '...' },
  });

  // Buyer accepts
  const acceptRes = await app.inject({
    method: 'POST',
    url: `/api/v1/offers/${offerRes.json().data.id}/accept`,
    headers: buyerHeaders(),
  });

  expect(acceptRes.statusCode).toBe(200);
});
```

## Test Database Setup

**Connection:**
- Uses `DATABASE_URL` from test environment (separate test DB)
- Prisma Client connects via `src/config/database.ts`

**Cleanup Strategy:**
- `beforeAll`: Delete test users to start clean
- `afterAll`: Delete all test users to prevent pollution
- `cleanupTestData()`: Helper to delete in FK dependency order
- `beforeEach`: Clear Redis auth keys to prevent token reuse across tests

**Important:** Always delete in correct order to respect foreign keys:
```typescript
// Wrong order (will fail FK constraints)
await prisma.user.deleteMany({ ... });
await prisma.post.deleteMany({ ... }); // FK post.buyerId → user.id

// Correct order
await prisma.post.deleteMany({ ... });
await prisma.user.deleteMany({ ... });
```

---

*Testing analysis: 2026-02-27*
