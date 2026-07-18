import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import bcrypt from 'bcrypt';
import { prisma } from '../src/config/database.js';
import type { FastifyInstance } from 'fastify';

process.env.NODE_ENV = 'test';

/**
 * Regression test for issue #179 (Jobs post notification never fires).
 *
 * Root cause: SellerProfile.categories was seeded with category SLUGS, but
 * `notifyTopMatchedJobSellers` matches the post's `categoryId` — a UUID — via
 * `array_contains`. A slug can never equal a UUID, so the query returned 0
 * sellers and no `job_match` notification was ever created.
 *
 * This test pins the contract: a seller whose `categories` array holds the
 * jobs-category UUID receives a `job_match` notification, while a seller whose
 * array holds the bare slug (the old, broken shape) receives nothing.
 */

let app: FastifyInstance;
let jobsCategoryId: string;
let entryLevelSubId: string;

// Company email — Jobs posts reject free email domains (gmail, etc.).
const POSTER_EMAIL = 'jobsposter179@acmecorp.com';
const POSTER_PASSWORD = 'TestPass123!';

const UUID_SELLER_EMAIL = 'seller179_uuid@example.com';
const SLUG_SELLER_EMAIL = 'seller179_slug@example.com';

let posterToken: string;
let uuidSellerUserId: string;
let slugSellerUserId: string;

async function cleanup(): Promise<void> {
  const emails = [POSTER_EMAIL, UUID_SELLER_EMAIL, SLUG_SELLER_EMAIL];
  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);
  if (ids.length === 0) return;
  // Cascades from users → posts, seller_profiles, notifications.
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}

/** Poll for a job_match notification (the notify call is fire-and-forget). */
async function waitForJobMatch(userId: string, postId: string, ms = 3000): Promise<boolean> {
  const deadline = Date.now() + ms;
  do {
    const n = await prisma.notification.findFirst({
      where: { userId, type: 'job_match' },
    });
    if (n) {
      const data = (n.data ?? {}) as Record<string, unknown>;
      return data.postId === postId;
    }
    await new Promise((r) => setTimeout(r, 100));
  } while (Date.now() < deadline);
  return false;
}

beforeAll(async () => {
  const { buildApp } = await import('../src/app.js');
  app = await buildApp();
  await app.ready();

  await cleanup();

  jobsCategoryId = (await app.inject({ method: 'GET', url: '/api/v1/categories/jobs' }))
    .json().data.id;
  entryLevelSubId = (await app.inject({ method: 'GET', url: '/api/v1/categories/entry_level' }))
    .json().data.id;

  // Poster with a company email so the Jobs-post company-email gate passes.
  const passwordHash = await bcrypt.hash(POSTER_PASSWORD, 12);
  await prisma.user.create({
    data: {
      email: POSTER_EMAIL,
      passwordHash,
      accountType: 'buyer',
      firstName: 'Jobs',
      lastName: 'Poster',
      emailVerified: true,
      status: 'active',
    },
  });
  posterToken = (
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: POSTER_EMAIL, password: POSTER_PASSWORD },
    })
  ).json().data.tokens.accessToken;

  // Seller storing the jobs UUID (correct shape — should be notified).
  const uuidSeller = await prisma.user.create({
    data: {
      email: UUID_SELLER_EMAIL,
      passwordHash,
      accountType: 'seller',
      firstName: 'Uuid',
      lastName: 'Seller',
      emailVerified: true,
      status: 'active',
    },
  });
  uuidSellerUserId = uuidSeller.id;
  await prisma.sellerProfile.create({
    data: {
      userId: uuidSellerUserId,
      businessName: 'UUID Jobs Seller',
      // Real array (Prisma Json), matching the seller-registration path. A
      // JSON.stringify'd string would persist as a JSON string and never match.
      categories: [jobsCategoryId],
    },
  });

  // Seller storing the bare slug (the old, broken shape — should NOT be notified).
  const slugSeller = await prisma.user.create({
    data: {
      email: SLUG_SELLER_EMAIL,
      passwordHash,
      accountType: 'seller',
      firstName: 'Slug',
      lastName: 'Seller',
      emailVerified: true,
      status: 'active',
    },
  });
  slugSellerUserId = slugSeller.id;
  await prisma.sellerProfile.create({
    data: {
      userId: slugSellerUserId,
      businessName: 'Slug Jobs Seller',
      // Bare slug in a real array — the old broken seed shape. A slug can never
      // equal the post's categoryId (a UUID), so this seller must NOT be matched.
      categories: ['jobs'],
    },
  });
}, 30000);

afterAll(async () => {
  await cleanup();
  await app.close();
});

describe('Jobs post notification (issue #179)', () => {
  it('notifies a seller whose categories hold the jobs UUID, not the slug', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: { authorization: `Bearer ${posterToken}` },
      payload: {
        categoryId: jobsCategoryId,
        subcategoryId: entryLevelSubId,
        title: 'Hiring an entry-level warehouse associate',
        description:
          'We are hiring an entry-level warehouse associate for our Dallas facility. Reliable schedule and competitive pay.',
        budgetType: 'fixed',
        budgetMin: 200,
        budgetMax: 200,
        locationCity: 'Dallas',
        locationState: 'TX',
        locationZip: '75201',
        status: 'active',
        categorySpecific: { roleTier: 'entry' },
      },
    });

    expect(res.statusCode).toBe(201);
    const postId = res.json().data.id;

    // The seller storing the UUID is matched and notified.
    expect(await waitForJobMatch(uuidSellerUserId, postId)).toBe(true);

    // The seller storing the bare slug is NOT matched (this is the bug #179 fixed).
    const slugNotif = await prisma.notification.findFirst({
      where: { userId: slugSellerUserId, type: 'job_match' },
    });
    expect(slugNotif).toBeNull();
  });
});
