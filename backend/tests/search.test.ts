import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/config/database.js';
import type { FastifyInstance } from 'fastify';

process.env.NODE_ENV = 'test';

let app: FastifyInstance;
let accessToken: string;
let servicesId: string;
let plumbingId: string;
let productsId: string;
let electronicsId: string;

const TEST_USER = {
  email: 'searchtest@example.com',
  password: 'TestPass123!',
  firstName: 'Search',
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

  // Get category IDs
  const servicesRes = await app.inject({ method: 'GET', url: '/api/v1/categories/services' });
  servicesId = servicesRes.json().data.id;

  const plumbingRes = await app.inject({ method: 'GET', url: '/api/v1/categories/plumbing' });
  plumbingId = plumbingRes.json().data.id;

  const productsRes = await app.inject({ method: 'GET', url: '/api/v1/categories/products' });
  productsId = productsRes.json().data.id;

  const electronicsRes = await app.inject({ method: 'GET', url: '/api/v1/categories/electronics' });
  electronicsId = electronicsRes.json().data.id;

  // Create searchable posts (assert creation succeeds)
  const post1 = await app.inject({
    method: 'POST',
    url: '/api/v1/posts',
    headers: authHeaders(),
    payload: {
      categoryId: servicesId,
      subcategoryId: plumbingId,
      title: 'Need emergency plumber for burst pipe',
      description: 'Pipe burst in basement flooding everything. Need urgent plumbing repair immediately.',
      budgetType: 'range',
      budgetMin: 200,
      budgetMax: 500,
      urgency: 'asap',
      locationCity: 'Dallas',
      locationState: 'TX',
    },
  });
  expect(post1.statusCode).toBe(201);

  const post2 = await app.inject({
    method: 'POST',
    url: '/api/v1/posts',
    headers: authHeaders(),
    payload: {
      categoryId: productsId,
      subcategoryId: electronicsId,
      title: 'Looking for vintage gaming laptop',
      description: 'Want a retro gaming laptop from the 2010s era, preferably Dell or Lenovo with dedicated GPU.',
      budgetType: 'range',
      budgetMin: 100,
      budgetMax: 300,
      urgency: 'flexible',
      locationCity: 'Fort Worth',
      locationState: 'TX',
      categorySpecific: { condition: 'good', brand: 'Dell' },
    },
  });
  expect(post2.statusCode).toBe(201);

  const post3 = await app.inject({
    method: 'POST',
    url: '/api/v1/posts',
    headers: authHeaders(),
    payload: {
      categoryId: servicesId,
      subcategoryId: plumbingId,
      title: 'Bathroom faucet installation needed',
      description: 'Need someone to install a new bathroom faucet. Already purchased the faucet, just need installation.',
      budgetType: 'fixed',
      budgetMin: 75,
      budgetMax: 75,
      urgency: 'within_1_week',
      locationCity: 'Dallas',
      locationState: 'TX',
    },
  });
  expect(post3.statusCode).toBe(201);

  // Clear the 3-day exclusivity window so posts appear in search results immediately
  await prisma.post.updateMany({
    where: { buyer: { email: TEST_USER.email } },
    data: { publicAfter: null },
  });
});

afterAll(async () => {
  await prisma.post.deleteMany({
    where: { buyer: { email: TEST_USER.email } },
  });
  await prisma.sellerProfile.deleteMany({
    where: { user: { email: TEST_USER.email } },
  });
  await prisma.user.deleteMany({
    where: { email: TEST_USER.email },
  });
  await prisma.$disconnect();
  await app.close();
});

// ── GET /api/v1/search/posts — Full-text Search ─────────────

describe('GET /api/v1/search/posts', () => {
  it('should find posts matching search query', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/search/posts?q=plumber',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('should return 400 when q parameter is missing', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/search/posts',
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return empty array for non-matching query', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/search/posts?q=xyznonexistent999',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data).toEqual([]);
  });

  it('should filter by categoryId', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/search/posts?q=plumber&categoryId=${servicesId}`,
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('should filter by budget range', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/search/posts?q=laptop&minBudget=50&maxBudget=400',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('should return pagination metadata', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/search/posts?q=plumber&page=1&limit=1',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.meta).toBeDefined();
    expect(body.meta.page).toBe(1);
    expect(body.meta.limit).toBe(1);
    expect(typeof body.meta.total).toBe('number');
  });
});

// ── Geo radius search (Haversine + bounding-box pre-filter, SEC-M4 #264) ──

describe('GET /api/v1/search/posts (geo radius)', () => {
  // Dallas, TX
  const DALLAS = { lat: 32.7767, lng: -96.797 };
  // Houston, TX — ~225 miles south of Dallas, well outside any sane radius
  const HOUSTON = { lat: 29.7604, lng: -95.3698 };

  beforeAll(async () => {
    // The plumbing posts are created in Dallas but without coordinates; set them
    // explicitly so the Haversine/bounding-box path has rows to match.
    await prisma.post.updateMany({
      where: { buyer: { email: TEST_USER.email }, locationCity: 'Dallas' },
      data: { latitude: DALLAS.lat, longitude: DALLAS.lng },
    });
  });

  it('returns in-radius posts with a distanceMiles field (bounding box keeps them)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/search/posts?q=plumber&latitude=${DALLAS.lat}&longitude=${DALLAS.lng}&radiusMiles=25`,
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(typeof body.data[0].distanceMiles).toBe('number');
    expect(body.data[0].distanceMiles).toBeLessThanOrEqual(25);
  });

  it('excludes posts outside the radius', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/search/posts?q=plumber&latitude=${HOUSTON.lat}&longitude=${HOUSTON.lng}&radiusMiles=25`,
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data).toEqual([]);
  });
});
