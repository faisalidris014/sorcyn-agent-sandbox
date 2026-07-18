import type { FastifyInstance } from 'fastify';
import { prisma } from '../src/config/database.js';
import { redis } from '../src/config/redis.js';
import { assertTestDatabase } from './db-guard.js';

export interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  accountType: string;
  token: string;
  userId: string;
}

let userCounter = 0;

/**
 * Register a user, verify email, login, and return token + userId.
 */
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

  const registerBody = registerRes.json();
  const userId = registerBody.data.user.id;

  // Auto-verify email in DB
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true },
  });

  // Login to get a fresh token with emailVerified=true
  const loginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email, password },
  });

  const loginBody = loginRes.json();

  return {
    email,
    password,
    firstName: overrides?.firstName ?? 'Test',
    lastName: overrides?.lastName ?? `User${userCounter}`,
    accountType: overrides?.accountType ?? 'buyer',
    token: loginBody.data.tokens.accessToken,
    userId,
  };
}

/**
 * Promote a user to admin via direct DB update, then re-login to get an admin token.
 */
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

/**
 * Return authorization headers for a token.
 */
export function authHeaders(token: string) {
  return { authorization: `Bearer ${token}` };
}

/**
 * Clean up test users by email patterns.
 */
export async function cleanupTestData(emailPatterns: string[]): Promise<void> {
  // Issue #133: defense in depth — never run these deletes against a non-test DB.
  assertTestDatabase(process.env.DATABASE_URL);
  for (const pattern of emailPatterns) {
    const users = await prisma.user.findMany({
      where: { email: { contains: pattern } },
      select: { id: true },
    });

    const userIds = users.map((u) => u.id);
    if (userIds.length === 0) continue;

    // Delete in FK-safe order
    await prisma.auditLog.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.message.deleteMany({ where: { senderId: { in: userIds } } });
    await prisma.review.deleteMany({ where: { buyerId: { in: userIds } } });

    // Find seller profiles
    const sellers = await prisma.sellerProfile.findMany({
      where: { userId: { in: userIds } },
      select: { id: true },
    });
    const sellerIds = sellers.map((s) => s.id);

    if (sellerIds.length > 0) {
      await prisma.payout.deleteMany({ where: { sellerId: { in: sellerIds } } });
      await prisma.dispute.deleteMany({ where: { sellerId: { in: sellerIds } } });
      await prisma.verificationRequest.deleteMany({
        where: { sellerId: { in: sellerIds } },
      });
      await prisma.sellerCategoryRequest.deleteMany({
        where: { sellerId: { in: sellerIds } },
      });
      await prisma.transaction.deleteMany({ where: { sellerId: { in: sellerIds } } });
      await prisma.offer.deleteMany({ where: { sellerId: { in: sellerIds } } });
    }

    await prisma.transaction.deleteMany({ where: { buyerId: { in: userIds } } });
    await prisma.dispute.deleteMany({ where: { buyerId: { in: userIds } } });
    await prisma.savedSearch.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.savedSeller.deleteMany({ where: { userId: { in: userIds } } });
    if (sellerIds.length > 0) {
      await prisma.savedSeller.deleteMany({ where: { sellerProfileId: { in: sellerIds } } });
    }
    await prisma.post.deleteMany({ where: { buyerId: { in: userIds } } });
    await prisma.sellerProfile.deleteMany({ where: { userId: { in: userIds } } });

    // Delete conversations where user is participant
    await prisma.conversation.deleteMany({
      where: {
        OR: [
          { participant1Id: { in: userIds } },
          { participant2Id: { in: userIds } },
        ],
      },
    });

    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
}

/**
 * Clear Redis auth keys for test isolation.
 */
export async function clearAuthRedisKeys(): Promise<void> {
  let cursor = '0';
  do {
    const [nextCursor, keys] = await redis.scan(
      cursor,
      'MATCH',
      'auth:*',
      'COUNT',
      100,
    );
    cursor = nextCursor;
    if (keys.length > 0) await redis.del(...keys);
  } while (cursor !== '0');
}
