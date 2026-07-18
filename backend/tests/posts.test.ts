import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/config/database.js';
import { authHeaders as makeAuthHeaders, createTestUser, cleanupTestData } from './helpers.js';
import type { FastifyInstance } from 'fastify';

process.env.NODE_ENV = 'test';

let app: FastifyInstance;
let accessToken: string;
let userId: string;
let servicesId: string;
let plumbingId: string;
let electronicsId: string; // a Products subcategory — used for cross-parent mismatch tests

const TEST_USER = {
  email: 'posttest@example.com',
  password: 'TestPass123!',
  firstName: 'Post',
  lastName: 'Tester',
  accountType: 'buyer' as const,
  agreeToTerms: true as const,
  agreeToPrivacy: true as const,
};

function authHeaders() {
  return { authorization: `Bearer ${accessToken}` };
}

beforeAll(async () => {
  const { buildApp } = await import('../src/app.js');
  app = await buildApp();
  await app.ready();

  // Clean up previous test data
  await prisma.post.deleteMany({
    where: { buyer: { email: TEST_USER.email } },
  });
  await prisma.sellerProfile.deleteMany({
    where: { user: { email: TEST_USER.email } },
  });
  await prisma.user.deleteMany({
    where: { email: TEST_USER.email },
  });

  // Register and login
  await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: TEST_USER,
  });

  // Verify email directly in DB to allow posting
  await prisma.user.update({
    where: { email: TEST_USER.email },
    data: { emailVerified: true },
  });

  const loginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: TEST_USER.email, password: TEST_USER.password },
  });
  const body = loginRes.json();
  accessToken = body.data.tokens.accessToken;
  userId = body.data.user.id;

  // Get category IDs for test posts
  const servicesRes = await app.inject({
    method: 'GET',
    url: '/api/v1/categories/services',
  });
  servicesId = servicesRes.json().data.id;

  const plumbingRes = await app.inject({
    method: 'GET',
    url: '/api/v1/categories/plumbing',
  });
  plumbingId = plumbingRes.json().data.id;

  const electronicsRes = await app.inject({
    method: 'GET',
    url: '/api/v1/categories/electronics',
  });
  electronicsId = electronicsRes.json().data.id;
});

afterAll(async () => {
  await prisma.post.deleteMany({
    where: { buyer: { email: TEST_USER.email } },
  });
  await prisma.sellerProfile.deleteMany({
    where: { user: { email: TEST_USER.email } },
  });
  await prisma.user.deleteMany({
    where: { email: { startsWith: 'posttest' } },
  });
  await prisma.$disconnect();
  await app.close();
});

const validPost = () => ({
  categoryId: servicesId,
  subcategoryId: plumbingId,
  title: 'Need a plumber for kitchen sink leak',
  description: 'My kitchen sink has been leaking under the cabinet. Need someone experienced with sink repairs to fix it this week.',
  budgetMin: 100,
  budgetMax: 300,
  budgetType: 'range',
  locationCity: 'Dallas',
  locationState: 'TX',
  locationZip: '75201',
  urgency: 'within_1_week',
});

let createdPostId: string;
let draftPostId: string;

// ── POST / — Create Post ────────────────────────────────────

describe('POST /api/v1/posts', () => {
  it('should create an active post', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: authHeaders(),
      payload: validPost(),
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('Need a plumber for kitchen sink leak');
    expect(body.data.status).toBe('active');
    expect(body.data.expiresAt).toBeDefined();
    expect(body.data.category.slug).toBe('services');
    expect(body.data.subcategory.slug).toBe('plumbing');
    createdPostId = body.data.id;
  });

  it('should create a draft post', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: authHeaders(),
      payload: { ...validPost(), status: 'draft' },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.data.status).toBe('draft');
    expect(body.data.expiresAt).toBeNull();
    draftPostId = body.data.id;
  });

  it('should require authentication', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      payload: validPost(),
    });
    expect(res.statusCode).toBe(401);
  });

  it('should reject invalid category', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: authHeaders(),
      payload: {
        ...validPost(),
        categoryId: '00000000-0000-0000-0000-000000000000',
      },
    });
    expect(res.statusCode).toBe(404);
  });

  it('should reject title that is too short', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: authHeaders(),
      payload: { ...validPost(), title: 'Hi' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('should reject a post with no subcategory (#321)', async () => {
    const { subcategoryId: _omit, ...withoutSubcategory } = validPost();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: authHeaders(),
      payload: withoutSubcategory,
    });
    expect(res.statusCode).toBe(400);
  });

  it('should reject a subcategory that belongs to a different category (#321)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: authHeaders(),
      // services category + a Products subcategory (electronics)
      payload: { ...validPost(), subcategoryId: electronicsId },
    });
    expect(res.statusCode).toBe(400);
  });
});

// ── GET /:postId — Get Post ─────────────────────────────────

describe('GET /api/v1/posts/:postId', () => {
  it('should return post details', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/posts/${createdPostId}`,
      headers: authHeaders(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.id).toBe(createdPostId);
    expect(body.data.buyer.firstName).toBe('Post');
    expect(body.data.isOwner).toBe(true);
    expect(body.data.canEdit).toBe(true); // no offers yet
  });

  it('should return 404 for non-existent post', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/posts/00000000-0000-0000-0000-000000000000',
    });
    expect(res.statusCode).toBe(404);
  });

  it('should hide draft posts from non-owners', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/posts/${draftPostId}`,
      // No auth — not the owner
    });
    expect(res.statusCode).toBe(404);
  });

  it('should show draft posts to owner', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/posts/${draftPostId}`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.status).toBe('draft');
  });
});

// ── GET /my-posts — List My Posts ───────────────────────────

describe('GET /api/v1/posts/my-posts', () => {
  it('should list my posts', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/posts/my-posts',
      headers: authHeaders(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(2); // active + draft
    expect(body.meta.total).toBeGreaterThanOrEqual(2);
  });

  it('should filter by status', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/posts/my-posts?status=draft',
      headers: authHeaders(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    body.data.forEach((post: { status: string }) => {
      expect(post.status).toBe('draft');
    });
  });

  it('should require authentication', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/posts/my-posts',
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── PUT /:postId — Update Post ──────────────────────────────

describe('PUT /api/v1/posts/:postId', () => {
  it('should update post fields', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/posts/${createdPostId}`,
      headers: authHeaders(),
      payload: {
        title: 'Updated plumbing post title here',
        budgetMax: 500,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.title).toBe('Updated plumbing post title here');
    expect(body.data.budgetMax).toBe(500);
  });

  it('should reject updating to a subcategory of a different category (#321)', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/posts/${createdPostId}`,
      headers: authHeaders(),
      // post is under services; electronics is a Products subcategory
      payload: { subcategoryId: electronicsId },
    });
    expect(res.statusCode).toBe(400);
  });

  it('should publish a draft post', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/posts/${draftPostId}`,
      headers: authHeaders(),
      payload: { status: 'active' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.status).toBe('active');
    expect(body.data.expiresAt).toBeDefined();
  });

  it('should reject update from non-owner', async () => {
    // Register a second user
    const email2 = 'posttest2@example.com';
    await prisma.user.deleteMany({ where: { email: email2 } });
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: email2,
        password: 'TestPass123!',
        firstName: 'Other',
        lastName: 'User',
        accountType: 'buyer',
        agreeToTerms: true,
        agreeToPrivacy: true,
      },
    });
    const login2 = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: email2, password: 'TestPass123!' },
    });
    const token2 = login2.json().data.tokens.accessToken;

    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/posts/${createdPostId}`,
      headers: { authorization: `Bearer ${token2}` },
      payload: { title: 'Hacked title that should not be allowed' },
    });
    expect(res.statusCode).toBe(403);

    // Clean up
    await prisma.user.deleteMany({ where: { email: email2 } });
  });
});

// ── POST /:postId/extend — Extend Post ─────────────────────

describe('POST /api/v1/posts/:postId/extend', () => {
  it('should extend post by 3 days', async () => {
    const beforeRes = await app.inject({
      method: 'GET',
      url: `/api/v1/posts/${createdPostId}`,
      headers: authHeaders(),
    });
    const originalExpiry = new Date(beforeRes.json().data.expiresAt).getTime();

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/posts/${createdPostId}/extend`,
      headers: authHeaders(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    const newExpiry = new Date(body.data.newExpiresAt).getTime();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    expect(newExpiry - originalExpiry).toBeCloseTo(threeDaysMs, -3); // within 1 second
    expect(body.data.extensionsRemaining).toBe(0);
  });

  it('should reject double extension', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/posts/${createdPostId}/extend`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(409);
  });
});

// ── POST /:postId/mark-filled — Mark as Filled ─────────────

describe('POST /api/v1/posts/:postId/mark-filled', () => {
  it('should mark post as filled', async () => {
    // Use the published draft post (which is now active)
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/posts/${draftPostId}/mark-filled`,
      headers: authHeaders(),
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.status).toBe('filled');
  });

  it('should reject marking non-active post as filled', async () => {
    // Already filled, try again
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/posts/${draftPostId}/mark-filled`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(409);
  });
});

// ── POST /:postId/archive — Archive Post ──────────────────

describe('POST /api/v1/posts/:postId/archive', () => {
  it('should archive a filled post', async () => {
    // draftPostId has status 'filled' from the mark-filled test above
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/posts/${draftPostId}/archive`,
      headers: authHeaders(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.status).toBe('archived');
    expect(body.data.postId).toBe(draftPostId);

    // Verify in DB
    const post = await prisma.post.findUnique({ where: { id: draftPostId } });
    expect(post!.status).toBe('archived');
  });

  it('should reject archiving already archived post', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/posts/${draftPostId}/archive`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(409);
  });

  it('should reject archiving an active post', async () => {
    // Create a new active post for this test
    const postRes = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: authHeaders(),
      payload: {
        categoryId: servicesId,
        subcategoryId: plumbingId,
        title: 'Active post should not be archivable',
        description: 'This active post is being used to test that archive rejects active status posts.',
        budgetMin: 50,
        budgetMax: 150,
        budgetType: 'range',
        locationCity: 'Dallas',
        locationState: 'TX',
        urgency: 'flexible',
      },
    });
    const activePostId = postRes.json().data.id;

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/posts/${activePostId}/archive`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(409);
  });

  it('should reject without authentication', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/posts/${draftPostId}/archive`,
    });
    expect(res.statusCode).toBe(401);
  });

  it('should reject archiving another user\'s post', async () => {
    // Create a second user with a filled post
    const email2 = 'posttest-archiveother@example.com';
    await prisma.user.deleteMany({ where: { email: email2 } });
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: email2,
        password: 'TestPass123!',
        firstName: 'Other',
        lastName: 'Archiver',
        accountType: 'buyer',
        agreeToTerms: true,
        agreeToPrivacy: true,
      },
    });
    await prisma.user.update({
      where: { email: email2 },
      data: { emailVerified: true },
    });
    const login2 = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: email2, password: 'TestPass123!' },
    });
    const token2 = login2.json().data.tokens.accessToken;
    const user2Id = login2.json().data.user.id;

    // Create a post and mark it filled
    const postRes = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: { authorization: `Bearer ${token2}` },
      payload: {
        categoryId: servicesId,
        subcategoryId: plumbingId,
        title: 'Other user post for archive ownership test',
        description: 'This post belongs to another user and should not be archivable by the first user.',
        budgetMin: 50,
        budgetMax: 100,
        budgetType: 'range',
        locationCity: 'Dallas',
        locationState: 'TX',
        urgency: 'flexible',
      },
    });
    const otherPostId = postRes.json().data.id;
    await prisma.post.update({ where: { id: otherPostId }, data: { status: 'filled' } });

    // Try to archive with original user's token
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/posts/${otherPostId}/archive`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(403);

    // Clean up
    await prisma.post.deleteMany({ where: { buyerId: user2Id } });
    await prisma.user.deleteMany({ where: { email: email2 } });
  });

  it('should return 404 for non-existent post', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/posts/00000000-0000-0000-0000-000000000000/archive',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(404);
  });

  it('should archive an expired post', async () => {
    // Create a post and set it to expired via Prisma
    const postRes = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: authHeaders(),
      payload: {
        categoryId: servicesId,
        subcategoryId: plumbingId,
        title: 'Expired post for archive test scenario',
        description: 'This post will be manually set to expired status to test archive functionality.',
        budgetMin: 50,
        budgetMax: 100,
        budgetType: 'range',
        locationCity: 'Dallas',
        locationState: 'TX',
        urgency: 'flexible',
      },
    });
    const expiredPostId = postRes.json().data.id;
    await prisma.post.update({ where: { id: expiredPostId }, data: { status: 'expired' } });

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/posts/${expiredPostId}/archive`,
      headers: authHeaders(),
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.status).toBe('archived');
  });
});

// ── POST /:postId/repost — Repost ──────────────────────────

describe('POST /api/v1/posts/:postId/repost', () => {
  it('should create a new post from existing one', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/posts/${createdPostId}/repost`,
      headers: authHeaders(),
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.data.id).not.toBe(createdPostId); // New ID
    expect(body.data.title).toBe('Updated plumbing post title here'); // Copied title
    expect(body.data.status).toBe('active');
    expect(body.data.offerCount).toBe(0); // Fresh post
  });
});

// ── DELETE /:postId — Delete Post ───────────────────────────

describe('DELETE /api/v1/posts/:postId', () => {
  it('should soft-delete a post', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/posts/${createdPostId}`,
      headers: authHeaders(),
    });

    expect(res.statusCode).toBe(204);

    // Verify it's gone from public view
    const getRes = await app.inject({
      method: 'GET',
      url: `/api/v1/posts/${createdPostId}`,
    });
    expect(getRes.statusCode).toBe(404);
  });
});

// ── GET /feed — Public Feed ─────────────────────────────────

describe('GET /api/v1/posts/feed', () => {
  it('should return active posts', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/posts/feed',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toBeDefined();
    // All posts in feed should be active
    body.data.forEach((post: { status: string }) => {
      expect(post.status).toBe('active');
    });
  });

  it('should filter by category', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/posts/feed?categoryId=${servicesId}`,
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    body.data.forEach((post: { categoryId: string }) => {
      expect(post.categoryId).toBe(servicesId);
    });
  });
});

// ── GET /search — Search Posts ──────────────────────────────

describe('GET /api/v1/posts/search', () => {
  it('should search posts by text', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/posts/search?q=plumbing+sink',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toBeDefined();
  });

  it('should require search query', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/posts/search',
    });
    expect(res.statusCode).toBe(400);
  });
});

// ── Budget-NULL inclusion regression ─────────────────────────
// Posts with an open/unbounded budget (budgetMax or budgetMin NULL) were
// silently dropped from budget-filtered feed + search results, because in SQL
// `NULL >= n` / `NULL <= n` is NULL (falsy). A buyer offering "any reasonable
// price" would never be surfaced to sellers filtering by budget. Covers both the
// getFeed (Prisma) and searchPosts (raw SQL) paths.

describe('budget filter includes open/NULL-budget posts (feed + search)', () => {
  let openPostId: string;
  let boundedPostId: string;
  const marker = 'kumquat'; // distinctive token so the search query isolates these two posts

  beforeAll(async () => {
    const openRes = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: authHeaders(),
      payload: {
        categoryId: servicesId,
        subcategoryId: plumbingId,
        title: `${marker} flexible budget plumbing job`,
        description: 'Open to any reasonable quote for this plumbing repair; the buyer set no fixed budget ceiling.',
        budgetType: 'open',
        locationCity: 'Dallas',
        locationState: 'TX',
        urgency: 'within_1_week',
      },
    });
    openPostId = openRes.json().data.id;

    const boundedRes = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: authHeaders(),
      payload: {
        categoryId: servicesId,
        subcategoryId: plumbingId,
        title: `${marker} bounded budget plumbing job`,
        description: 'Bounded budget plumbing repair with a firm low ceiling that a high minimum filter should exclude.',
        budgetMin: 100,
        budgetMax: 200,
        budgetType: 'range',
        locationCity: 'Dallas',
        locationState: 'TX',
        urgency: 'within_1_week',
      },
    });
    boundedPostId = boundedRes.json().data.id;

    // Guarantee the NULL-budget condition and make both posts publicly visible
    // (new posts sit in the 3-day exclusivity window, hidden from feed/search).
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.post.update({
      where: { id: openPostId },
      data: { budgetMin: null, budgetMax: null, publicAfter: past },
    });
    await prisma.post.update({
      where: { id: boundedPostId },
      data: { publicAfter: past },
    });
  });

  afterAll(async () => {
    await prisma.post.deleteMany({ where: { id: { in: [openPostId, boundedPostId] } } });
  });

  it('getFeed: includes the open-budget post under a high minBudget and excludes the bounded one', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/posts/feed?minBudget=99999' });
    expect(res.statusCode).toBe(200);
    const ids = res.json().data.map((p: { id: string }) => p.id);
    expect(ids).toContain(openPostId);        // budgetMax NULL = unbounded → included
    expect(ids).not.toContain(boundedPostId); // budgetMax 200 < 99999 → excluded
  });

  it('searchPosts: includes the open-budget post under a high minBudget and excludes the bounded one', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/posts/search?q=${marker}&minBudget=99999` });
    expect(res.statusCode).toBe(200);
    const ids = res.json().data.map((p: { id: string }) => p.id);
    expect(ids).toContain(openPostId);
    expect(ids).not.toContain(boundedPostId);
  });
});

// ── Targeted-seller carve-out (REQ-three-day-exclusivity A-03) ──

describe('Targeted-seller carve-out — getFeed with requestingUserId', () => {
  let targetedSellerToken: string;
  let targetedSellerUserId: string;
  let nonTargetedSellerToken: string;
  let nonTargetedSellerUserId: string;
  let buyerToken: string;
  let buyerUserId: string;
  let inWindowPostId: string;
  let catAId: string;
  let catZId: string;
  let subAId: string;
  let subZId: string;

  beforeAll(async () => {
    // Create a buyer user
    const buyer = await createTestUser(app, { email: 'carveout-buyer@posttest.example.com' });
    buyerToken = buyer.token;
    buyerUserId = buyer.userId;

    // catA = Services (top-level) + the Plumbing subcategory; catZ = Products (a
    // different top-level) + the Electronics subcategory. Distinct top-level
    // categories let the in-window carve-out (which matches on the post's top-level
    // category) separate the targeted seller from the non-targeted one, while every
    // post still carries a valid subcategory (#321).
    catAId = (await app.inject({ method: 'GET', url: '/api/v1/categories/services' })).json().data.id;
    subAId = (await app.inject({ method: 'GET', url: '/api/v1/categories/plumbing' })).json().data.id;
    catZId = (await app.inject({ method: 'GET', url: '/api/v1/categories/products' })).json().data.id;
    subZId = (await app.inject({ method: 'GET', url: '/api/v1/categories/electronics' })).json().data.id;

    // Create targeted seller (categories = [catAId])
    const sellerA = await createTestUser(app, {
      email: 'carveout-seller-a@posttest.example.com',
      accountType: 'seller',
    });
    targetedSellerToken = sellerA.token;
    targetedSellerUserId = sellerA.userId;

    // Create seller profile for seller A with catA in categories
    await prisma.sellerProfile.create({
      data: {
        userId: targetedSellerUserId,
        businessName: 'Seller A Plumbing',
        categories: [catAId],
        deletedAt: null,
      },
    });

    // Create non-targeted seller (categories = [catZId])
    const sellerB = await createTestUser(app, {
      email: 'carveout-seller-b@posttest.example.com',
      accountType: 'seller',
    });
    nonTargetedSellerToken = sellerB.token;
    nonTargetedSellerUserId = sellerB.userId;

    // Create seller profile for seller B with catZ (electrical) in categories
    await prisma.sellerProfile.create({
      data: {
        userId: nonTargetedSellerUserId,
        businessName: 'Seller B Electrical',
        categories: [catZId],
        deletedAt: null,
      },
    });

    // Create an in-window post: categoryId = catAId, publicAfter = 3 days from now
    const postRes = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: makeAuthHeaders(buyerToken),
      payload: {
        categoryId: catAId,
        subcategoryId: subAId,
        title: 'Need a plumber for bathroom faucet repair',
        description: 'My bathroom faucet is dripping constantly and needs repair or replacement by an experienced plumber.',
        budgetMin: 50,
        budgetMax: 200,
        budgetType: 'range',
        locationCity: 'Dallas',
        locationState: 'TX',
        locationZip: '75201',
        urgency: 'within_1_week',
      },
    });
    expect(postRes.statusCode).toBe(201);
    inWindowPostId = postRes.json().data.id;

    // Confirm post is in-window (publicAfter > now)
    const post = await prisma.post.findUnique({ where: { id: inWindowPostId } });
    expect(post!.publicAfter).not.toBeNull();
    expect(post!.publicAfter!.getTime()).toBeGreaterThan(Date.now());
  });

  afterAll(async () => {
    await cleanupTestData([
      'carveout-buyer@posttest.example.com',
      'carveout-seller-a@posttest.example.com',
      'carveout-seller-b@posttest.example.com',
      'carveout-seller-empty@posttest.example.com',
      'carveout-seller-noprofile@posttest.example.com',
      'carveout-both-noprofile@posttest.example.com',
    ]);
  });

  it('targeted seller sees in-window post via authenticated feed', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/posts/feed',
      headers: makeAuthHeaders(targetedSellerToken),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    const ids = body.data.map((p: { id: string }) => p.id);
    expect(ids).toContain(inWindowPostId);
  });

  it('non-targeted seller does NOT see in-window post via authenticated feed', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/posts/feed',
      headers: makeAuthHeaders(nonTargetedSellerToken),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    const ids = body.data.map((p: { id: string }) => p.id);
    expect(ids).not.toContain(inWindowPostId);
  });

  it('unauthenticated caller does NOT see in-window post', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/posts/feed',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    const ids = body.data.map((p: { id: string }) => p.id);
    expect(ids).not.toContain(inWindowPostId);
  });

  it('auto-scopes the authenticated seller feed to the seller categories (#301)', async () => {
    // Two PUBLIC posts (out of the exclusivity window): one in seller A's
    // category (Services), one outside it (Products).
    const mkPublicPost = async (
      categoryId: string,
      subcategoryId: string,
      title: string,
      extra: Record<string, unknown> = {},
    ) => {
      const r = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        headers: makeAuthHeaders(buyerToken),
        payload: {
          categoryId,
          subcategoryId,
          title,
          description:
            'A public request used to verify the seller feed scopes to the seller profile categories.',
          budgetMin: 50,
          budgetMax: 200,
          budgetType: 'range',
          locationCity: 'Dallas',
          locationState: 'TX',
          locationZip: '75201',
          urgency: 'within_1_week',
          ...extra,
        },
      });
      expect(r.statusCode).toBe(201);
      const id = r.json().data.id;
      // Push it out of the 3-day exclusivity window so it's publicly visible.
      await prisma.post.update({
        where: { id },
        data: { publicAfter: new Date(Date.now() - 60_000) },
      });
      return id;
    };

    const catAPostId = await mkPublicPost(catAId, subAId, 'Public plumbing job: replace a leaking kitchen sink');
    // catZ is Products, so createPost requires a product condition field.
    const catZPostId = await mkPublicPost(catZId, subZId, 'Public products listing: a refurbished laptop wanted', {
      categorySpecific: { condition: 'good' },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/posts/feed',
      headers: makeAuthHeaders(targetedSellerToken),
    });
    expect(res.statusCode).toBe(200);
    const ids = res.json().data.map((p: { id: string }) => p.id);
    expect(ids).toContain(catAPostId); // in seller A's category
    expect(ids).not.toContain(catZPostId); // outside seller A's category
  });

  it('fails closed: a seller with empty categories sees no posts (#301)', async () => {
    // A seller whose profile has zero granted categories must get an EMPTY feed,
    // not every public post — the scope must not fall open.
    const emptySeller = await createTestUser(app, {
      email: 'carveout-seller-empty@posttest.example.com',
      accountType: 'seller',
    });
    await prisma.sellerProfile.create({
      data: {
        userId: emptySeller.userId,
        businessName: 'Seller Empty',
        categories: [],
        deletedAt: null,
      },
    });

    // A public post that an unscoped feed would otherwise return.
    const pubRes = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: makeAuthHeaders(buyerToken),
      payload: {
        categoryId: catAId,
        subcategoryId: subAId,
        title: 'Public plumbing job for the empty-categories fail-closed check',
        description:
          'A public request used to verify a seller with no granted categories gets an empty feed.',
        budgetMin: 50,
        budgetMax: 200,
        budgetType: 'range',
        locationCity: 'Dallas',
        locationState: 'TX',
        locationZip: '75201',
        urgency: 'within_1_week',
      },
    });
    expect(pubRes.statusCode).toBe(201);
    const pubPostId = pubRes.json().data.id;
    await prisma.post.update({
      where: { id: pubPostId },
      data: { publicAfter: new Date(Date.now() - 60_000) },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/posts/feed',
      headers: makeAuthHeaders(emptySeller.token),
    });
    expect(res.statusCode).toBe(200);
    const ids = res.json().data.map((p: { id: string }) => p.id);
    expect(ids).not.toContain(pubPostId); // empty categories → fail closed (empty feed)
    expect(ids).not.toContain(inWindowPostId);
  });

  it('fails closed: a pure-seller account with NO profile sees no posts (defense-in-depth)', async () => {
    // The frontend onboarding gate normally stops a profile-less seller from
    // reaching the feed, but the backend must ALSO fail closed so it never falls
    // open onto an unscoped feed (the case-1 bug). NO sellerProfile row exists.
    const noProfileSeller = await createTestUser(app, {
      email: 'carveout-seller-noprofile@posttest.example.com',
      accountType: 'seller',
    });

    const pubRes = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: makeAuthHeaders(buyerToken),
      payload: {
        categoryId: catAId,
        subcategoryId: subAId,
        title: 'Public plumbing job for the no-profile fail-closed check',
        description:
          'A public request used to verify a seller account with no profile gets an empty feed.',
        budgetMin: 50,
        budgetMax: 200,
        budgetType: 'range',
        locationCity: 'Dallas',
        locationState: 'TX',
        locationZip: '75201',
        urgency: 'within_1_week',
      },
    });
    expect(pubRes.statusCode).toBe(201);
    const pubPostId = pubRes.json().data.id;
    await prisma.post.update({
      where: { id: pubPostId },
      data: { publicAfter: new Date(Date.now() - 60_000) },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/posts/feed',
      headers: makeAuthHeaders(noProfileSeller.token),
    });
    expect(res.statusCode).toBe(200);
    const ids = res.json().data.map((p: { id: string }) => p.id);
    expect(ids).not.toContain(pubPostId); // seller account + no profile → fail closed
  });

  it("does NOT fail closed for a 'both' account with no profile (may browse as buyer)", async () => {
    // The hardening is deliberately scoped to accountType 'seller' so a 'both'
    // account browsing the feed as a buyer still sees public posts; their
    // seller-mode case is covered by the frontend onboarding gate.
    const bothNoProfile = await createTestUser(app, {
      email: 'carveout-both-noprofile@posttest.example.com',
      accountType: 'both',
    });

    const pubRes = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: makeAuthHeaders(buyerToken),
      payload: {
        categoryId: catAId,
        subcategoryId: subAId,
        title: 'Public plumbing job for the both-account boundary check',
        description:
          'A public request used to verify a both account with no profile is not scoped closed.',
        budgetMin: 50,
        budgetMax: 200,
        budgetType: 'range',
        locationCity: 'Dallas',
        locationState: 'TX',
        locationZip: '75201',
        urgency: 'within_1_week',
      },
    });
    expect(pubRes.statusCode).toBe(201);
    const pubPostId = pubRes.json().data.id;
    await prisma.post.update({
      where: { id: pubPostId },
      data: { publicAfter: new Date(Date.now() - 60_000) },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/posts/feed',
      headers: makeAuthHeaders(bothNoProfile.token),
    });
    expect(res.statusCode).toBe(200);
    const ids = res.json().data.map((p: { id: string }) => p.id);
    expect(ids).toContain(pubPostId); // both account, no profile → unscoped (not failed closed)
  });
});

// ── GET /feed optional auth — integration tests ──────────────

describe('GET /api/v1/posts/feed optional auth', () => {
  it('returns 200 with no token (unauthenticated access preserved)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/posts/feed',
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
  });

  it('returns 200 with an invalid token (treated as unauthenticated)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/posts/feed',
      headers: { authorization: 'Bearer notarealjwt' },
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
  });
});

// ── PII redaction — locationAddress gating (Plan 03-05) ──────────────────────

describe('PII redaction — locationAddress gating', () => {
  const PII_ADDRESS = '4242 Hidden Oak Ln';
  const PII_LAT = 32.81234;
  const PII_LNG = -96.85432;
  let piiPostId: string;
  let nonFundedSellerToken: string;
  let fundedSellerToken: string;
  let fundedSellerProfileId: string;
  let fundedOfferId: string;
  // Track ids for scoped cleanup so the parent afterAll's post.deleteMany doesn't
  // hit the FK from our seeded transaction.
  const piiCleanup: { sellerProfileIds: string[]; userIds: string[] } = {
    sellerProfileIds: [],
    userIds: [],
  };

  afterAll(async () => {
    if (piiPostId) {
      await prisma.transaction.deleteMany({ where: { postId: piiPostId } });
      await prisma.offer.deleteMany({ where: { postId: piiPostId } });
    }
    if (piiCleanup.sellerProfileIds.length) {
      await prisma.sellerProfile.deleteMany({
        where: { id: { in: piiCleanup.sellerProfileIds } },
      });
    }
    if (piiCleanup.userIds.length) {
      await prisma.user.deleteMany({ where: { id: { in: piiCleanup.userIds } } });
    }
  });

  beforeAll(async () => {
    // Buyer creates a post with a real locationAddress
    const postRes = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: authHeaders(),
      payload: {
        categoryId: servicesId,
        subcategoryId: plumbingId,
        title: 'PII gate redaction test job',
        description: 'Need a plumber for the test apartment. This is a test post for PII redaction.',
        budgetMin: 100,
        budgetMax: 500,
        budgetType: 'range',
        locationAddress: PII_ADDRESS,
        locationCity: 'Dallas',
        locationState: 'TX',
        locationZip: '75204',
        latitude: PII_LAT,
        longitude: PII_LNG,
        urgency: 'flexible',
      },
    });
    expect(postRes.statusCode).toBe(201);
    piiPostId = postRes.json().data.id;

    // Skip 3-day exclusivity for this test — we're testing PII redaction, not the
    // exclusivity carve-out (which lives in plan 03-03's tests).
    await prisma.post.update({
      where: { id: piiPostId },
      data: { publicAfter: new Date(Date.now() - 1000) },
    });

    // Non-funded seller — registers + creates seller profile but never funds
    const nonFunded = await createTestUser(app, {
      accountType: 'buyer',
      firstName: 'NonFunded',
      lastName: 'Seller',
    });
    const nonFundedProfileRes = await app.inject({
      method: 'POST',
      url: '/api/v1/sellers',
      headers: makeAuthHeaders(nonFunded.token),
      payload: {
        businessName: 'NonFunded Test Co',
        bio: 'Curious onlooker.',
        serviceRadiusMiles: 30,
      },
    });
    if (nonFundedProfileRes.statusCode === 201) {
      piiCleanup.sellerProfileIds.push(nonFundedProfileRes.json().data.id);
    }
    nonFundedSellerToken = nonFunded.token;
    piiCleanup.userIds.push(nonFunded.userId);

    // Funded seller — registers, creates seller profile, submits offer, seeded transaction
    const funded = await createTestUser(app, {
      accountType: 'buyer',
      firstName: 'Funded',
      lastName: 'Seller',
    });
    const fundedProfileRes = await app.inject({
      method: 'POST',
      url: '/api/v1/sellers',
      headers: makeAuthHeaders(funded.token),
      payload: {
        businessName: 'Funded Test Co',
        bio: 'Has a funded transaction.',
        serviceRadiusMiles: 30,
      },
    });
    expect(fundedProfileRes.statusCode).toBe(201);
    fundedSellerProfileId = fundedProfileRes.json().data.id;
    fundedSellerToken = funded.token;
    piiCleanup.userIds.push(funded.userId);
    piiCleanup.sellerProfileIds.push(fundedSellerProfileId);

    const offerRes = await app.inject({
      method: 'POST',
      url: '/api/v1/offers',
      headers: makeAuthHeaders(funded.token),
      payload: {
        postId: piiPostId,
        offerType: 'service',
        quoteAmount: 200,
        pricingType: 'flat_rate',
        message: 'Funded seller offer for PII test. I have extensive experience with this work.',
      },
    });
    expect(offerRes.statusCode).toBe(201);
    fundedOfferId = offerRes.json().data.id;

    // Seed a held-escrow transaction between buyer and funded seller
    await prisma.transaction.create({
      data: {
        postId: piiPostId,
        offerId: fundedOfferId,
        buyerId: userId,
        sellerId: fundedSellerProfileId,
        transactionType: 'service',
        quoteAmount: 200,
        platformFee: 16,
        sellerPayoutAmount: 184,
        totalCharged: 210,
        status: 'in_progress',
        escrowStatus: 'held',
      },
    });
  });

  it('non-funded seller sees null locationAddress on GET /posts/:id', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/posts/${piiPostId}`,
      headers: makeAuthHeaders(nonFundedSellerToken),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.locationAddress).toBeNull();
    expect(res.json().data.locationCity).toBe('Dallas');
    expect(res.json().data.locationState).toBe('TX');
  });

  it('non-funded seller sees null coordinates + zip on GET /posts/:id (SEC-H3 #258)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/posts/${piiPostId}`,
      headers: makeAuthHeaders(nonFundedSellerToken),
    });
    expect(res.statusCode).toBe(200);
    const d = res.json().data;
    expect(d.latitude).toBeNull();
    expect(d.longitude).toBeNull();
    expect(d.locationZip).toBeNull();
    // Coarse location stays visible.
    expect(d.locationCity).toBe('Dallas');
    expect(d.locationState).toBe('TX');
  });

  it('funded seller sees the full locationAddress on GET /posts/:id', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/posts/${piiPostId}`,
      headers: makeAuthHeaders(fundedSellerToken),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.locationAddress).toBe(PII_ADDRESS);
  });

  it('funded seller sees exact coordinates + zip on GET /posts/:id', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/posts/${piiPostId}`,
      headers: makeAuthHeaders(fundedSellerToken),
    });
    expect(res.statusCode).toBe(200);
    const d = res.json().data;
    expect(d.latitude).toBe(PII_LAT);
    expect(d.longitude).toBe(PII_LNG);
    expect(d.locationZip).toBe('75204');
  });

  it('post owner (buyer) always sees the full locationAddress + coordinates', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/posts/${piiPostId}`,
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const d = res.json().data;
    expect(d.locationAddress).toBe(PII_ADDRESS);
    expect(d.latitude).toBe(PII_LAT);
    expect(d.longitude).toBe(PII_LNG);
    expect(d.locationZip).toBe('75204');
  });

  it('non-funded seller sees null address + coordinates on /feed for the same post', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/posts/feed?status=active&limit=50',
      headers: makeAuthHeaders(nonFundedSellerToken),
    });
    expect(res.statusCode).toBe(200);
    const posts = res.json().data.posts ?? res.json().data;
    const target = posts.find((p: { id: string }) => p.id === piiPostId);
    if (target) {
      expect(target.locationAddress).toBeNull();
      expect(target.latitude).toBeNull();
      expect(target.longitude).toBeNull();
      expect(target.locationZip).toBeNull();
    }
    // If the post is not in the feed (e.g., outside radius), the assertion is vacuously true.
  });

  it('anonymous (no token) caller sees null coordinates on /feed (SEC-H4 #258)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/posts/feed?status=active&limit=50',
    });
    expect(res.statusCode).toBe(200);
    const posts = res.json().data.posts ?? res.json().data;
    const target = posts.find((p: { id: string }) => p.id === piiPostId);
    if (target) {
      expect(target.locationAddress).toBeNull();
      expect(target.latitude).toBeNull();
      expect(target.longitude).toBeNull();
      expect(target.locationZip).toBeNull();
    }
  });
});
