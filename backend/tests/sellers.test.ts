import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { SellersService } from '../src/modules/sellers/sellers.service.js';
import { AppError } from '../src/common/utils/errors.js';
import { prisma } from '../src/config/database.js';
import type { FastifyInstance } from 'fastify';

process.env.NODE_ENV = 'test';

// Stable reference so individual tests can override via mockRejectedValueOnce.
const mockIdentityCreate = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    id: 'vs_test_123',
    url: 'https://verify.stripe.com/start/vs_test_123',
  })
);

// Phase 4 carry-over: mock Stripe SDK so the Identity smoke test does not
// require live Stripe credentials. Per .planning/codebase/TESTING.md the
// rule is: MOCK external services (Stripe), DO NOT MOCK Prisma/Redis/Fastify.
// The Stripe config module is loaded with the .js extension (ESM), so the
// mock target must match.
vi.mock('../src/config/stripe.js', () => ({
  getStripe: () => ({
    identity: {
      verificationSessions: {
        create: mockIdentityCreate,
      },
    },
  }),
  verifyWebhookSignature: vi.fn(),
}));

let app: FastifyInstance;
let accessToken: string;
let userId: string;

const TEST_USER = {
  email: 'sellertest@example.com',
  password: 'TestPass123!',
  firstName: 'Seller',
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

  // Clean up
  await prisma.verificationRequest.deleteMany({
    where: { seller: { user: { email: TEST_USER.email } } },
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

  const loginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: TEST_USER.email, password: TEST_USER.password },
  });
  const body = loginRes.json();
  accessToken = body.data.tokens.accessToken;
  userId = body.data.user.id;
});

afterAll(async () => {
  await prisma.verificationRequest.deleteMany({
    where: { seller: { user: { email: TEST_USER.email } } },
  });
  await prisma.sellerProfile.deleteMany({
    where: { user: { email: TEST_USER.email } },
  });
  await prisma.user.deleteMany({
    where: { email: { startsWith: 'sellertest' } },
  });
  await prisma.$disconnect();
  await app.close();
});

// ── POST / — Create Seller Profile ────────────────────────────

describe('POST /api/v1/sellers', () => {
  it('should create a seller profile', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sellers',
      headers: authHeaders(),
      payload: {
        businessName: 'Test Plumbing Co',
        bio: 'We fix pipes and more with over 10 years of experience in the DFW area.',
        serviceRadiusMiles: 30,
        yearsExperience: 10,
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.businessName).toBe('Test Plumbing Co');
    expect(body.data.serviceRadiusMiles).toBe(30);
    expect(body.data.yearsExperience).toBe(10);
    expect(body.data.profileStrength).toBeGreaterThan(0);

    // User should be auto-switched to 'both'
    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user!.accountType).toBe('both');
  });

  it('should reject duplicate seller profile', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sellers',
      headers: authHeaders(),
      payload: { businessName: 'Duplicate' },
    });
    expect(res.statusCode).toBe(409);
  });

  it('should require authentication', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sellers',
      payload: { businessName: 'No Auth' },
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── #301: Products auto-grant + category gating ───────────────

describe('Seller category gating (#301)', () => {
  const CAT_USER = {
    email: 'sellertest-cat@example.com',
    password: 'TestPass123!',
    firstName: 'Cat',
    lastName: 'Seller',
    accountType: 'buyer' as const,
    agreeToTerms: true as const,
    agreeToPrivacy: true as const,
  };
  let catToken: string;
  let productsId: string;
  let servicesId: string;
  let plumbingId: string;

  beforeAll(async () => {
    await prisma.sellerProfile.deleteMany({ where: { user: { email: CAT_USER.email } } });
    await prisma.user.deleteMany({ where: { email: CAT_USER.email } });
    await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: CAT_USER });
    const login = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: CAT_USER.email, password: CAT_USER.password },
    });
    catToken = login.json().data.tokens.accessToken;

    productsId = (
      await prisma.category.findUniqueOrThrow({ where: { slug: 'products' }, select: { id: true } })
    ).id;
    servicesId = (
      await prisma.category.findUniqueOrThrow({ where: { slug: 'services' }, select: { id: true } })
    ).id;
    plumbingId = (
      await prisma.category.findUniqueOrThrow({ where: { slug: 'plumbing' }, select: { id: true } })
    ).id;
  });

  afterAll(async () => {
    await prisma.sellerProfile.deleteMany({ where: { user: { email: CAT_USER.email } } });
    await prisma.user.deleteMany({ where: { email: CAT_USER.email } });
  });

  it('auto-grants Products and ignores Services/Jobs sent at creation', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sellers',
      headers: { authorization: `Bearer ${catToken}` },
      payload: {
        businessName: 'Cat Test Co',
        serviceRadiusMiles: 25,
        categories: [servicesId],
        subcategories: [plumbingId],
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    // Products is auto-granted; any Services/Jobs sent at creation are ignored.
    expect(body.data.categories).toEqual([productsId]);
    expect(body.data.subcategories).toEqual([]);
  });

  it('ignores categories/subcategories on PATCH /sellers/me', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/sellers/me',
      headers: { authorization: `Bearer ${catToken}` },
      payload: {
        bio: 'A sufficiently long updated bio so the patch does real work here.',
        categories: [servicesId],
        subcategories: [plumbingId],
      },
    });
    expect(res.statusCode).toBe(200);
    // Categories stay Products-only — the gated category-request flow is the only
    // path to Services/Jobs.
    expect(res.json().data.categories).toEqual([productsId]);
    expect(res.json().data.subcategories).toEqual([]);
  });
});

// ── businessHours partial week (regression: Zod 4 exhaustive enum-record) ──
// A seller closed on some days (e.g. weekends) omits those day keys from the
// businessHours payload. Zod 4's z.record(enum, …) is EXHAUSTIVE and rejected
// the partial map with "expected object, received undefined" on the missing
// day; partialRecord accepts the subset. Reproduces the seller-onboarding
// submit failure caught in the iOS sim.
describe('POST /api/v1/sellers — partial-week businessHours (Zod 4 regression)', () => {
  const HOURS_USER = {
    email: 'sellertest-hours@example.com',
    password: 'TestPass123!',
    firstName: 'Hours',
    lastName: 'Tester',
    accountType: 'buyer' as const,
    agreeToTerms: true as const,
    agreeToPrivacy: true as const,
  };
  let hoursToken: string;

  beforeAll(async () => {
    await prisma.sellerProfile.deleteMany({ where: { user: { email: HOURS_USER.email } } });
    await prisma.user.deleteMany({ where: { email: HOURS_USER.email } });
    await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: HOURS_USER });
    const login = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: HOURS_USER.email, password: HOURS_USER.password },
    });
    hoursToken = login.json().data.tokens.accessToken;
  });

  afterAll(async () => {
    await prisma.sellerProfile.deleteMany({ where: { user: { email: HOURS_USER.email } } });
    await prisma.user.deleteMany({ where: { email: HOURS_USER.email } });
  });

  it('accepts a Mon–Fri payload with weekend days absent', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sellers',
      headers: { authorization: `Bearer ${hoursToken}` },
      payload: {
        businessName: 'Weekday Plumbing',
        businessHours: {
          mon: { open: '09:00', close: '17:00' },
          tue: { open: '09:00', close: '17:00' },
          wed: { open: '09:00', close: '17:00' },
          thu: { open: '09:00', close: '17:00' },
          fri: { open: '09:00', close: '17:00' },
          // sat & sun intentionally absent == closed
        },
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().success).toBe(true);

    // Persisted hours read back with the closed days still absent.
    const me = await app.inject({
      method: 'GET',
      url: '/api/v1/sellers/me',
      headers: { authorization: `Bearer ${hoursToken}` },
    });
    const hours = me.json().data.businessHours;
    expect(hours.mon.open).toBe('09:00');
    expect(hours.mon.close).toBe('17:00');
    expect(hours.sat).toBeUndefined();
  });
});

// ── GET /me — Get My Seller Profile ───────────────────────────

describe('GET /api/v1/sellers/me', () => {
  it('should return my seller profile', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/sellers/me',
      headers: authHeaders(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.userId).toBe(userId);
    expect(body.data.businessName).toBe('Test Plumbing Co');
    expect(body.data.stripeOnboardingStatus).toBe('not_started');
  });

  it('should expose sales-tax cert url, verified flag, and current status (#228)', async () => {
    // Seed a cert URL + the latest sales_tax verification request directly.
    const profile = await prisma.sellerProfile.findFirstOrThrow({
      where: { userId },
    });
    await prisma.sellerProfile.update({
      where: { id: profile.id },
      data: {
        salesTaxCertificateUrl: 'https://r2.example.com/cert.pdf',
        salesTaxVerified: false,
      },
    });
    await prisma.verificationRequest.create({
      data: {
        sellerId: profile.id,
        verificationType: 'sales_tax',
        tier: 2,
        documents: ['https://r2.example.com/cert.pdf'],
        status: 'rejected',
        rejectionReason: 'Certificate is expired',
      },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/sellers/me',
      headers: authHeaders(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.salesTaxCertificateUrl).toBe('https://r2.example.com/cert.pdf');
    expect(body.data.salesTaxVerified).toBe(false);
    expect(body.data.salesTaxStatus).toBe('rejected');
    expect(body.data.salesTaxRejectionReason).toBe('Certificate is expired');
  });

  it('should reflect the latest sales_tax request when multiple exist (#228)', async () => {
    const profile = await prisma.sellerProfile.findFirstOrThrow({
      where: { userId },
    });
    // A newer request supersedes the earlier rejected one.
    await prisma.verificationRequest.create({
      data: {
        sellerId: profile.id,
        verificationType: 'sales_tax',
        tier: 2,
        documents: ['https://r2.example.com/cert-v2.pdf'],
        status: 'under_review',
      },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/sellers/me',
      headers: authHeaders(),
    });

    const body = res.json();
    expect(body.data.salesTaxStatus).toBe('under_review');
    expect(body.data.salesTaxRejectionReason).toBeNull();
  });
});

// ── PATCH /me — Update Seller Profile ─────────────────────────

describe('PATCH /api/v1/sellers/me', () => {
  it('should update seller profile fields', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/sellers/me',
      headers: authHeaders(),
      payload: {
        businessName: 'Updated Plumbing Co',
        serviceRadiusMiles: 50,
        businessWebsite: 'https://plumbing.example.com',
        portfolioPhotos: [
          'https://r2.example.com/photo1.jpg',
          'https://r2.example.com/photo2.jpg',
          'https://r2.example.com/photo3.jpg',
        ],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.businessName).toBe('Updated Plumbing Co');
    expect(body.data.serviceRadiusMiles).toBe(50);
    expect(body.data.businessWebsite).toBe('https://plumbing.example.com');
    // Profile strength should increase with portfolio photos
    expect(body.data.profileStrength).toBeGreaterThan(0);
  });

  it('should allow setting nullable fields to null', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/sellers/me',
      headers: authHeaders(),
      payload: { businessHours: null },
    });
    expect(res.statusCode).toBe(200);
  });
});

// ── GET /:sellerId — Public Seller Profile ────────────────────

describe('GET /api/v1/sellers/:sellerId', () => {
  it('should return public seller profile', async () => {
    // First get seller ID
    const meRes = await app.inject({
      method: 'GET',
      url: '/api/v1/sellers/me',
      headers: authHeaders(),
    });
    const sellerId = meRes.json().data.id;

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/sellers/${sellerId}`,
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.businessName).toBe('Updated Plumbing Co');
    expect(body.data.user.firstName).toBe('Seller');
    // Should not expose stripe info
    expect(body.data.stripeAccountId).toBeUndefined();
    expect(body.data.stripeOnboardingStatus).toBeUndefined();
    // Sales-tax cert URL is owner-only — never leaked on public profiles (#228)
    expect(body.data.salesTaxCertificateUrl).toBeUndefined();
  });

  it('should return 404 for non-existent seller', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/sellers/00000000-0000-0000-0000-000000000000',
    });
    expect(res.statusCode).toBe(404);
  });
});

// ── GET /user/:userId — Public Seller Profile by User ID ──────

describe('GET /api/v1/sellers/user/:userId', () => {
  it('should return seller profile by user ID', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/sellers/user/${userId}`,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.userId).toBe(userId);
  });
});

// ── POST /me/verification — Submit Verification ───────────────

describe('POST /api/v1/sellers/me/verification', () => {
  it('should submit an ID verification request', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sellers/me/verification',
      headers: authHeaders(),
      payload: {
        verificationType: 'id',
        documents: ['https://r2.example.com/id-front.jpg'],
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.data.id).toBeDefined();
    expect(body.data.status).toBe('pending');
  });

  it('should reject duplicate pending verification of same type', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sellers/me/verification',
      headers: authHeaders(),
      payload: {
        verificationType: 'id',
        documents: ['https://r2.example.com/id-front2.jpg'],
      },
    });
    expect(res.statusCode).toBe(409);
  });

  it('should allow different verification type and persist expiry (#382)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sellers/me/verification',
      headers: authHeaders(),
      payload: {
        verificationType: 'license',
        documents: ['https://r2.example.com/license.pdf'],
        licenseNumber: 'TX-PLB-12345',
        licenseState: 'TX',
        licenseExpiry: '2028-06-01T00:00:00.000Z',
      },
    });

    expect(res.statusCode).toBe(201);

    // Verify license info was saved on seller profile
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
    });
    expect(profile!.licenseNumber).toBe('TX-PLB-12345');
    expect(profile!.licenseState).toBe('TX');
    // #382: expiry synced onto the profile column…
    expect(profile!.licenseExpiry?.toISOString().slice(0, 10)).toBe('2028-06-01');

    // …and written onto the VerificationRequest row (was always null before).
    const request = await prisma.verificationRequest.findFirst({
      where: { sellerId: profile!.id, verificationType: 'license' },
      orderBy: { createdAt: 'desc' },
    });
    expect(request!.expiresAt?.toISOString().slice(0, 10)).toBe('2028-06-01');
  });

  it('should require at least one document', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sellers/me/verification',
      headers: authHeaders(),
      payload: {
        verificationType: 'insurance',
        documents: [],
      },
    });
    expect(res.statusCode).toBe(400);
  });
});

// ── GET /me/verification — List My Verification Requests ──────

describe('GET /api/v1/sellers/me/verification', () => {
  it('should list my verification requests', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/sellers/me/verification',
      headers: authHeaders(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(2);
    expect(body.data[0].verificationType).toBeDefined();
    expect(body.data[0].status).toBe('pending');
  });
});

// ── POST /identity/verify (Phase 4 carry-over) ────────────────

describe('POST /api/v1/sellers/identity/verify (Phase 4 carry-over)', () => {
  it('returns Stripe Identity URL for authenticated seller', async () => {
    // The seller profile was created earlier in this file's test suite
    // (POST /api/v1/sellers); this exercise hits the real Fastify route +
    // mocked Stripe SDK to verify the wiring end-to-end.
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sellers/identity/verify',
      headers: authHeaders(),
    });

    // Route returns 201 (resource created — a new Stripe Identity
    // VerificationSession) per sellers.routes.ts.
    expect([200, 201]).toContain(res.statusCode);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.url).toContain('verify.stripe.com');
    expect(body.data.sessionId).toBe('vs_test_123');
  });

  it('rejects unauthenticated requests', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sellers/identity/verify',
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 429 with friendly message when Stripe rate-limits the request', async () => {
    const spy = vi.spyOn(SellersService.prototype, 'createIdentitySession')
      .mockRejectedValueOnce(new AppError(429, 'Identity verification is temporarily unavailable. Please wait a few minutes and try again.'));

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sellers/identity/verify',
      headers: authHeaders(),
    });

    spy.mockRestore();

    expect(res.statusCode).toBe(429);
    const body = res.json();
    expect(body.error.detail).toContain('temporarily unavailable');
  });
});
