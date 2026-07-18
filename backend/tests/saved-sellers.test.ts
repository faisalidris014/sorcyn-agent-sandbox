import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/config/database.js';
import type { FastifyInstance } from 'fastify';

process.env.NODE_ENV = 'test';

let app: FastifyInstance;
let buyerToken: string;
let buyerUserId: string;
let sellerToken: string;
let sellerUserId: string;
let sellerProfileId: string;

const BUYER = {
  email: 'svdslr-buyer@example.com',
  password: 'TestPass123!',
  firstName: 'SavedSeller',
  lastName: 'Buyer',
  accountType: 'buyer' as const,
  agreeToTerms: true as const,
  agreeToPrivacy: true as const,
};

const SELLER = {
  email: 'svdslr-seller@example.com',
  password: 'TestPass123!',
  firstName: 'SavedSeller',
  lastName: 'Seller',
  accountType: 'buyer' as const,
  agreeToTerms: true as const,
  agreeToPrivacy: true as const,
};

function buyerHeaders() {
  return { authorization: `Bearer ${buyerToken}` };
}

function sellerHeaders() {
  return { authorization: `Bearer ${sellerToken}` };
}

beforeAll(async () => {
  const { buildApp } = await import('../src/app.js');
  app = await buildApp();
  await app.ready();

  // Clean up previous test data (FK-safe order)
  const emails = [BUYER.email, SELLER.email, 'svdslr-seller2@example.com'];
  const existingUsers = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { id: true },
  });
  const userIds = existingUsers.map((u) => u.id);

  if (userIds.length > 0) {
    const sellers = await prisma.sellerProfile.findMany({
      where: { userId: { in: userIds } },
      select: { id: true },
    });
    const sellerIds = sellers.map((s) => s.id);

    await prisma.savedSeller.deleteMany({
      where: { OR: [{ userId: { in: userIds } }, { sellerProfileId: { in: sellerIds } }] },
    });
    await prisma.sellerProfile.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }

  // Register buyer
  await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: BUYER,
  });
  await prisma.user.update({
    where: { email: BUYER.email },
    data: { emailVerified: true },
  });
  const buyerLogin = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: BUYER.email, password: BUYER.password },
  });
  buyerToken = buyerLogin.json().data.tokens.accessToken;
  buyerUserId = buyerLogin.json().data.user.id;

  // Register seller
  await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: SELLER,
  });
  await prisma.user.update({
    where: { email: SELLER.email },
    data: { emailVerified: true },
  });
  const sellerLogin = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: SELLER.email, password: SELLER.password },
  });
  sellerToken = sellerLogin.json().data.tokens.accessToken;
  sellerUserId = sellerLogin.json().data.user.id;

  // Create seller profile
  const sellerProfileRes = await app.inject({
    method: 'POST',
    url: '/api/v1/sellers',
    headers: sellerHeaders(),
    payload: {
      businessName: 'Saved Seller Test Biz',
      bio: 'Professional testing services for saved sellers feature.',
      serviceRadiusMiles: 25,
    },
  });
  sellerProfileId = sellerProfileRes.json().data.id;
});

afterAll(async () => {
  const emails = [BUYER.email, SELLER.email, 'svdslr-seller2@example.com'];
  const existingUsers = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { id: true },
  });
  const userIds = existingUsers.map((u) => u.id);

  if (userIds.length > 0) {
    const sellers = await prisma.sellerProfile.findMany({
      where: { userId: { in: userIds } },
      select: { id: true },
    });
    const sellerIds = sellers.map((s) => s.id);

    await prisma.savedSeller.deleteMany({
      where: { OR: [{ userId: { in: userIds } }, { sellerProfileId: { in: sellerIds } }] },
    });
    await prisma.sellerProfile.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }

  await prisma.$disconnect();
  await app.close();
});

// ── POST /:sellerId — Save Seller ─────────────────────────────

describe('POST /api/v1/saved-sellers/:sellerId', () => {
  it('should save a seller to favorites', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/saved-sellers/${sellerProfileId}`,
      headers: buyerHeaders(),
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.sellerProfileId).toBe(sellerProfileId);
    expect(body.data.savedAt).toBeDefined();

    // Verify in DB
    const saved = await prisma.savedSeller.findUnique({
      where: { userId_sellerProfileId: { userId: buyerUserId, sellerProfileId } },
    });
    expect(saved).not.toBeNull();
  });

  it('should reject without authentication', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/saved-sellers/${sellerProfileId}`,
    });
    expect(res.statusCode).toBe(401);
  });

  it('should reject non-existent seller', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/saved-sellers/00000000-0000-0000-0000-000000000000',
      headers: buyerHeaders(),
    });
    expect(res.statusCode).toBe(404);
  });

  it('should reject invalid UUID', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/saved-sellers/not-a-uuid',
      headers: buyerHeaders(),
    });
    expect(res.statusCode).toBe(400);
  });

  it('should reject saving own seller profile', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/saved-sellers/${sellerProfileId}`,
      headers: sellerHeaders(),
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.detail).toContain('cannot save your own');
  });

  it('should reject duplicate save', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/saved-sellers/${sellerProfileId}`,
      headers: buyerHeaders(),
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.detail).toContain('already saved');
  });
});

// ── GET / — List Saved Sellers ─────────────────────────────────

describe('GET /api/v1/saved-sellers', () => {
  it('should list saved sellers with pagination meta', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/saved-sellers',
      headers: buyerHeaders(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.meta.total).toBeGreaterThanOrEqual(1);
    expect(body.meta.page).toBe(1);
    expect(body.meta.totalPages).toBeGreaterThanOrEqual(1);

    // Verify seller data structure
    const saved = body.data[0];
    expect(saved.savedAt).toBeDefined();
    expect(saved.seller.id).toBe(sellerProfileId);
    expect(saved.seller.businessName).toBe('Saved Seller Test Biz');
    expect(saved.seller.user.firstName).toBe('SavedSeller');
  });

  it('should return empty list for user with no saved sellers', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/saved-sellers',
      headers: sellerHeaders(),
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.length).toBe(0);
    expect(res.json().meta.total).toBe(0);
  });

  it('should respect pagination params', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/saved-sellers?page=1&limit=1',
      headers: buyerHeaders(),
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.length).toBeLessThanOrEqual(1);
    expect(res.json().meta.limit).toBe(1);
  });

  it('should reject without authentication', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/saved-sellers',
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── DELETE /:sellerId — Unsave Seller ──────────────────────────

describe('DELETE /api/v1/saved-sellers/:sellerId', () => {
  it('should unsave a seller', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/saved-sellers/${sellerProfileId}`,
      headers: buyerHeaders(),
    });

    expect(res.statusCode).toBe(204);

    // Verify removed from DB
    const saved = await prisma.savedSeller.findUnique({
      where: { userId_sellerProfileId: { userId: buyerUserId, sellerProfileId } },
    });
    expect(saved).toBeNull();
  });

  it('should reject without authentication', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/saved-sellers/${sellerProfileId}`,
    });
    expect(res.statusCode).toBe(401);
  });

  it('should return 404 when unsaving non-saved seller', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/saved-sellers/${sellerProfileId}`,
      headers: buyerHeaders(),
    });
    expect(res.statusCode).toBe(404);
  });
});

// ── Workflow Tests ─────────────────────────────────────────────

describe('Save-unsave-resave cycle', () => {
  it('should allow re-saving after unsaving', async () => {
    // Save
    const saveRes = await app.inject({
      method: 'POST',
      url: `/api/v1/saved-sellers/${sellerProfileId}`,
      headers: buyerHeaders(),
    });
    expect(saveRes.statusCode).toBe(201);

    // Unsave
    const unsaveRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/saved-sellers/${sellerProfileId}`,
      headers: buyerHeaders(),
    });
    expect(unsaveRes.statusCode).toBe(204);

    // Re-save
    const resaveRes = await app.inject({
      method: 'POST',
      url: `/api/v1/saved-sellers/${sellerProfileId}`,
      headers: buyerHeaders(),
    });
    expect(resaveRes.statusCode).toBe(201);
  });
});

describe('Multiple saved sellers', () => {
  let seller2ProfileId: string;

  beforeAll(async () => {
    // Create a second seller
    const seller2 = {
      email: 'svdslr-seller2@example.com',
      password: 'TestPass123!',
      firstName: 'Second',
      lastName: 'Seller',
      accountType: 'buyer' as const,
      agreeToTerms: true as const,
      agreeToPrivacy: true as const,
    };
    await prisma.user.deleteMany({ where: { email: seller2.email } });
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: seller2,
    });
    await prisma.user.update({
      where: { email: seller2.email },
      data: { emailVerified: true },
    });
    const login2 = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: seller2.email, password: seller2.password },
    });
    const token2 = login2.json().data.tokens.accessToken;

    const spRes = await app.inject({
      method: 'POST',
      url: '/api/v1/sellers',
      headers: { authorization: `Bearer ${token2}` },
      payload: {
        businessName: 'Second Test Biz',
        bio: 'Another seller for testing multiple saved sellers.',
        serviceRadiusMiles: 20,
      },
    });
    seller2ProfileId = spRes.json().data.id;
  });

  it('should handle multiple saved sellers with correct ordering', async () => {
    // Save second seller (first is already saved from the resave cycle test)
    const saveRes = await app.inject({
      method: 'POST',
      url: `/api/v1/saved-sellers/${seller2ProfileId}`,
      headers: buyerHeaders(),
    });
    expect(saveRes.statusCode).toBe(201);

    // List should have both, ordered by createdAt desc (most recent first)
    const listRes = await app.inject({
      method: 'GET',
      url: '/api/v1/saved-sellers',
      headers: buyerHeaders(),
    });

    expect(listRes.statusCode).toBe(200);
    const body = listRes.json();
    expect(body.data.length).toBe(2);
    expect(body.meta.total).toBe(2);

    // Most recently saved should be first (seller2)
    expect(body.data[0].seller.id).toBe(seller2ProfileId);
    expect(body.data[1].seller.id).toBe(sellerProfileId);
  });
});
