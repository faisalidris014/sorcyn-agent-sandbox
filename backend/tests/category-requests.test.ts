import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { prisma } from '../src/config/database.js';
import {
  createTestUser,
  makeAdmin,
  authHeaders,
  cleanupTestData,
  type TestUser,
} from './helpers.js';
import {
  deriveRequiredDocTypes,
  deriveOptionalDocTypes,
  findMissingDocTypes,
  effectiveMode,
  routeCategoryRequest,
  type CategoryConfig,
  type LicenseVerificationProvider,
} from '../src/modules/sellers/category-verification.js';

process.env.NODE_ENV = 'test';

// Stripe is lazy-init; mock so building the app / seller profile never hits the network.
vi.mock('../src/config/stripe.js', () => ({
  getStripe: () => ({
    identity: { verificationSessions: { create: vi.fn() } },
  }),
  verifyWebhookSignature: vi.fn(),
}));

const CLEANUP_PATTERN = 'catreqtest';
const POST_CITY = 'CatReqCity';

// ── Pure router unit tests (no DB) ──────────────────────────────

const cfg = (over: Partial<CategoryConfig>): CategoryConfig => ({
  subcategoryId: over.subcategoryId ?? 'sub-1',
  mode: over.mode ?? 'instant',
  isLicensed: over.isLicensed ?? false,
  licenseAuthority: over.licenseAuthority ?? null,
  requiresBackgroundCheck: over.requiresBackgroundCheck ?? false,
  recommendsInsurance: over.recommendsInsurance ?? false,
});

describe('category verification router (unit)', () => {
  it('always requires an id document; adds license / background_check per config', () => {
    expect(deriveRequiredDocTypes([cfg({})])).toEqual(['id']);
    expect(deriveRequiredDocTypes([cfg({ isLicensed: true })])).toEqual(['id', 'license']);
    expect(deriveRequiredDocTypes([cfg({ requiresBackgroundCheck: true })])).toEqual([
      'id',
      'background_check',
    ]);
  });

  // #381: insurance is an OPTIONAL doc — surfaced by deriveOptionalDocTypes,
  // never by deriveRequiredDocTypes (so it can't gate access).
  it('deriveOptionalDocTypes surfaces insurance only when recommended', () => {
    expect(deriveOptionalDocTypes([cfg({})])).toEqual([]);
    expect(deriveOptionalDocTypes([cfg({ recommendsInsurance: true })])).toEqual([
      'insurance',
    ]);
    // de-duped across multiple recommending subs
    expect(
      deriveOptionalDocTypes([
        cfg({ recommendsInsurance: true }),
        cfg({ recommendsInsurance: true }),
      ]),
    ).toEqual(['insurance']);
    // never leaks into required docs
    expect(deriveRequiredDocTypes([cfg({ recommendsInsurance: true })])).toEqual(['id']);
  });

  it('findMissingDocTypes reports uncovered required types', () => {
    expect(findMissingDocTypes([{ type: 'id', url: 'u' }], ['id', 'license'])).toEqual([
      'license',
    ]);
    expect(
      findMissingDocTypes([{ type: 'id', url: 'u' }, { type: 'license', url: 'u' }], ['id', 'license']),
    ).toEqual([]);
  });

  it('effectiveMode picks the most restrictive mode', () => {
    expect(effectiveMode([cfg({ mode: 'instant' }), cfg({ mode: 'manual_only' })])).toBe(
      'manual_only',
    );
    expect(effectiveMode([cfg({ mode: 'instant' }), cfg({ mode: 'verify' })])).toBe('verify');
  });

  it('instant → auto_approve', async () => {
    const d = await routeCategoryRequest(
      { majorCategoryId: 'm', subcategoryIds: ['s'], documents: [{ type: 'id', url: 'u' }] },
      [cfg({ mode: 'instant' })],
      new Map(),
    );
    expect(d.outcome).toBe('auto_approve');
    expect(d.status).toBe('approved');
  });

  it('manual_only → queue', async () => {
    const d = await routeCategoryRequest(
      { majorCategoryId: 'm', subcategoryIds: ['s'], documents: [{ type: 'id', url: 'u' }] },
      [cfg({ mode: 'manual_only', isLicensed: true, licenseAuthority: 'TX_TSBPE' })],
      new Map(),
    );
    expect(d.outcome).toBe('queue');
    expect(d.status).toBe('pending');
    expect(d.reason).toBe('manual_review');
  });

  it('verify with empty registry → queue (no_provider, never optimistic unlock)', async () => {
    const d = await routeCategoryRequest(
      { majorCategoryId: 'm', subcategoryIds: ['s'], documents: [{ type: 'id', url: 'u' }] },
      [cfg({ mode: 'verify', isLicensed: true, licenseAuthority: 'TX_TDLR' })],
      new Map(),
    );
    expect(d.outcome).toBe('queue');
    expect(d.reason).toBe('no_provider');
    expect(d.authority).toBe('TX_TDLR');
  });

  it('verify with a provider routes to approve/reject', async () => {
    const approving: LicenseVerificationProvider = {
      authority: 'TX_TDLR',
      verify: async () => ({ approved: true, reason: 'match' }),
    };
    const rejecting: LicenseVerificationProvider = {
      authority: 'TX_TDLR',
      verify: async () => ({ approved: false, reason: 'not_found' }),
    };
    const submission = {
      majorCategoryId: 'm',
      subcategoryIds: ['s'],
      documents: [{ type: 'id', url: 'u' }, { type: 'license', url: 'u' }],
    };
    const cfgs = [cfg({ mode: 'verify', isLicensed: true, licenseAuthority: 'TX_TDLR' })];

    const ok = await routeCategoryRequest(submission, cfgs, new Map([['TX_TDLR', approving]]));
    expect(ok.outcome).toBe('auto_approve');

    const no = await routeCategoryRequest(submission, cfgs, new Map([['TX_TDLR', rejecting]]));
    expect(no.outcome).toBe('auto_reject');
    expect(no.reason).toBe('not_found');
  });
});

// ── Integration tests ───────────────────────────────────────────

let app: FastifyInstance;
let sellerUser: TestUser;
let adminToken: string;

let servicesId: string;
let cleaningId: string;
let electricalId: string;
let plumbingId: string;
let movingId: string;
let childcareId: string;
let petCareId: string;
let irrigationId: string;
let pesticideId: string;
let tutoringId: string;
let cleaningPostId: string;
let electricalPostId: string;

async function feedPostIds(token: string): Promise<string[]> {
  const res = await app.inject({
    method: 'GET',
    url: `/api/v1/posts/feed?city=${POST_CITY}&limit=50`,
    headers: authHeaders(token),
  });
  return (res.json().data as Array<{ id: string }>).map((p) => p.id);
}

beforeAll(async () => {
  const { buildApp } = await import('../src/app.js');
  app = await buildApp();
  await app.ready();

  await cleanupTestData([CLEANUP_PATTERN]);

  const slug = async (s: string) => {
    const c = await prisma.category.findUnique({ where: { slug: s }, select: { id: true } });
    return c!.id;
  };
  servicesId = await slug('services');
  cleaningId = await slug('cleaning');
  electricalId = await slug('electrical');
  plumbingId = await slug('plumbing');
  movingId = await slug('moving');
  childcareId = await slug('childcare');
  petCareId = await slug('pet_care');
  irrigationId = await slug('landscape_irrigation');
  pesticideId = await slug('pesticide_application');
  tutoringId = await slug('tutoring');

  // Admin
  const adminUser = await createTestUser(app, {
    email: 'catreqtest_admin@example.com',
    accountType: 'both',
  });
  adminToken = await makeAdmin(app, adminUser);

  // Buyer who owns the test posts
  const buyer = await createTestUser(app, {
    email: 'catreqtest_buyer@example.com',
    accountType: 'buyer',
  });

  // Seller (Products auto-granted at profile creation)
  sellerUser = await createTestUser(app, {
    email: 'catreqtest_seller@example.com',
    accountType: 'seller',
  });
  await app.inject({
    method: 'POST',
    url: '/api/v1/sellers',
    headers: authHeaders(sellerUser.token),
    payload: { businessName: 'CatReq Test Biz' },
  });

  // Posts in cleaning + electrical subcategories, tagged with a unique city so the
  // feed assertions are deterministic regardless of other rows.
  const mk = async (subId: string, title: string) =>
    prisma.post.create({
      data: {
        buyerId: buyer.userId,
        categoryId: servicesId,
        subcategoryId: subId,
        title,
        description: 'Test post for category-access feed scoping',
        locationCity: POST_CITY,
        marketplaceContext: 'b2c',
        status: 'active',
      },
      select: { id: true },
    });
  cleaningPostId = (await mk(cleaningId, 'Need a cleaner')).id;
  electricalPostId = (await mk(electricalId, 'Need an electrician')).id;
});

afterAll(async () => {
  await cleanupTestData([CLEANUP_PATTERN]);
  await app.close();
});

describe('seller category-access requests (integration)', () => {
  it('GET /sellers/category-requirements returns mode + required docs', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/sellers/category-requirements?subcategoryIds=${cleaningId}`,
      headers: authHeaders(sellerUser.token),
    });
    expect(res.statusCode).toBe(200);
    const data = res.json().data;
    expect(data.requiredDocTypes).toEqual(['id']);
    expect(data.subcategories[0].mode).toBe('instant');
  });

  // #369: movers legally need a TxDMV motor-carrier registration, so `moving`
  // is manual_only + licensed (TX_TXDMV), not instant.
  it('moving requires a license (TxDMV) and is manual_only', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/sellers/category-requirements?subcategoryIds=${movingId}`,
      headers: authHeaders(sellerUser.token),
    });
    expect(res.statusCode).toBe(200);
    const data = res.json().data;
    expect(data.requiredDocTypes).toEqual(['id', 'license']);
    expect(data.subcategories[0].mode).toBe('manual_only');
    expect(data.subcategories[0].isLicensed).toBe(true);
    expect(data.subcategories[0].licenseAuthority).toBe('TX_TXDMV');
  });

  // #383: landscaping sub-split — irrigation (TCEQ) and pesticide application (TDA)
  // are their own manual_only + licensed subs; general `landscaping` stays instant.
  it('landscape_irrigation is manual_only + licensed (TX_TCEQ)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/sellers/category-requirements?subcategoryIds=${irrigationId}`,
      headers: authHeaders(sellerUser.token),
    });
    expect(res.statusCode).toBe(200);
    const data = res.json().data;
    expect(data.requiredDocTypes).toEqual(['id', 'license']);
    expect(data.subcategories[0].mode).toBe('manual_only');
    expect(data.subcategories[0].isLicensed).toBe(true);
    expect(data.subcategories[0].licenseAuthority).toBe('TX_TCEQ');
  });

  it('pesticide_application is manual_only + licensed (TX_TDA)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/sellers/category-requirements?subcategoryIds=${pesticideId}`,
      headers: authHeaders(sellerUser.token),
    });
    expect(res.statusCode).toBe(200);
    const data = res.json().data;
    expect(data.requiredDocTypes).toEqual(['id', 'license']);
    expect(data.subcategories[0].mode).toBe('manual_only');
    expect(data.subcategories[0].isLicensed).toBe(true);
    expect(data.subcategories[0].licenseAuthority).toBe('TX_TDA');
  });

  // #381: cleaning (a physical/in-home trade) recommends optional insurance;
  // tutoring (low-touch) does not.
  it('category-requirements surfaces optional insurance for recommending subs only', async () => {
    const cleaning = await app.inject({
      method: 'GET',
      url: `/api/v1/sellers/category-requirements?subcategoryIds=${cleaningId}`,
      headers: authHeaders(sellerUser.token),
    });
    const cData = cleaning.json().data;
    expect(cData.optionalDocTypes).toEqual(['insurance']);
    expect(cData.subcategories[0].recommendsInsurance).toBe(true);
    // Insurance is optional — it must NOT be a required doc.
    expect(cData.requiredDocTypes).toEqual(['id']);

    const tutoring = await app.inject({
      method: 'GET',
      url: `/api/v1/sellers/category-requirements?subcategoryIds=${tutoringId}`,
      headers: authHeaders(sellerUser.token),
    });
    const tData = tutoring.json().data;
    expect(tData.optionalDocTypes).toEqual([]);
    expect(tData.subcategories[0].recommendsInsurance).toBe(false);
  });

  // #381: attaching an optional insurance cert opens an insurance
  // VerificationRequest (admin queue → approval flips the "Insured" badge) but
  // never changes the category-access routing outcome.
  it('optional insurance doc → auto-approve unaffected + pending insurance request created', async () => {
    const insuranceSeller = await createTestUser(app, {
      email: 'catreqtest_insurance_seller@example.com',
      accountType: 'seller',
    });
    await app.inject({
      method: 'POST',
      url: '/api/v1/sellers',
      headers: authHeaders(insuranceSeller.token),
      payload: { businessName: 'CatReq Insurance Biz' },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sellers/me/category-requests',
      headers: authHeaders(insuranceSeller.token),
      payload: {
        majorCategoryId: servicesId,
        subcategoryIds: [cleaningId],
        documents: [
          { type: 'id', url: 'https://r2.example.com/id.png' },
          { type: 'insurance', url: 'https://r2.example.com/coi.pdf' },
        ],
      },
    });
    expect(res.statusCode).toBe(201);
    // Cleaning is instant — the optional insurance doc must not change routing.
    expect(res.json().data.outcome).toBe('auto_approve');

    const profile = await prisma.sellerProfile.findFirst({
      where: { userId: insuranceSeller.userId },
      select: { id: true },
    });
    const insuranceReq = await prisma.verificationRequest.findFirst({
      where: {
        sellerId: profile!.id,
        verificationType: 'insurance',
        status: { in: ['pending', 'under_review'] },
        deletedAt: null,
      },
    });
    expect(insuranceReq).not.toBeNull();
  });

  it('seller feed excludes cleaning posts before any grant (only Products granted)', async () => {
    const ids = await feedPostIds(sellerUser.token);
    expect(ids).not.toContain(cleaningPostId);
  });

  it('instant submit → auto-approved, granted, and feed unlocks', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sellers/me/category-requests',
      headers: authHeaders(sellerUser.token),
      payload: {
        majorCategoryId: servicesId,
        subcategoryIds: [cleaningId],
        documents: [{ type: 'id', url: 'https://example.com/id.png' }],
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.status).toBe('approved');
    expect(res.json().data.outcome).toBe('auto_approve');

    // Granted onto the profile
    const me = await app.inject({
      method: 'GET',
      url: '/api/v1/sellers/me',
      headers: authHeaders(sellerUser.token),
    });
    expect(me.json().data.categories).toContain(cleaningId);

    // Feed now unlocks the cleaning post
    const ids = await feedPostIds(sellerUser.token);
    expect(ids).toContain(cleaningPostId);
  });

  it('manual_only submit → queued, not granted', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sellers/me/category-requests',
      headers: authHeaders(sellerUser.token),
      payload: {
        majorCategoryId: servicesId,
        subcategoryIds: [plumbingId],
        documents: [
          { type: 'id', url: 'https://example.com/id.png' },
          { type: 'license', url: 'https://example.com/license.png' },
        ],
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.status).toBe('pending');
    expect(res.json().data.outcome).toBe('queue');

    const me = await app.inject({
      method: 'GET',
      url: '/api/v1/sellers/me',
      headers: authHeaders(sellerUser.token),
    });
    expect(me.json().data.categories).not.toContain(plumbingId);
  });

  it('duplicate pending request for the same subcategory → 409', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sellers/me/category-requests',
      headers: authHeaders(sellerUser.token),
      payload: {
        majorCategoryId: servicesId,
        subcategoryIds: [plumbingId],
        documents: [
          { type: 'id', url: 'https://example.com/id.png' },
          { type: 'license', url: 'https://example.com/license.png' },
        ],
      },
    });
    expect(res.statusCode).toBe(409);
  });

  it('childcare missing background_check document → 422', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sellers/me/category-requests',
      headers: authHeaders(sellerUser.token),
      payload: {
        majorCategoryId: servicesId,
        subcategoryIds: [childcareId],
        documents: [{ type: 'id', url: 'https://example.com/id.png' }],
      },
    });
    expect(res.statusCode).toBe(422);
  });

  it('moving missing license document → 422 (#369)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sellers/me/category-requests',
      headers: authHeaders(sellerUser.token),
      payload: {
        majorCategoryId: servicesId,
        subcategoryIds: [movingId],
        documents: [{ type: 'id', url: 'https://example.com/id.png' }],
      },
    });
    expect(res.statusCode).toBe(422);
  });

  it('moving submit with license → queued, not granted (#369)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sellers/me/category-requests',
      headers: authHeaders(sellerUser.token),
      payload: {
        majorCategoryId: servicesId,
        subcategoryIds: [movingId],
        documents: [
          { type: 'id', url: 'https://example.com/id.png' },
          { type: 'license', url: 'https://example.com/txdmv.png' },
        ],
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.status).toBe('pending');
    expect(res.json().data.outcome).toBe('queue');

    const me = await app.inject({
      method: 'GET',
      url: '/api/v1/sellers/me',
      headers: authHeaders(sellerUser.token),
    });
    expect(me.json().data.categories).not.toContain(movingId);
  });

  it('verify subcategory queues (no provider), then admin approve grants + flips license badge + unlocks feed', async () => {
    const submit = await app.inject({
      method: 'POST',
      url: '/api/v1/sellers/me/category-requests',
      headers: authHeaders(sellerUser.token),
      payload: {
        majorCategoryId: servicesId,
        subcategoryIds: [electricalId],
        documents: [
          { type: 'id', url: 'https://example.com/id.png' },
          { type: 'license', url: 'https://example.com/license.png' },
        ],
      },
    });
    expect(submit.statusCode).toBe(201);
    expect(submit.json().data.outcome).toBe('queue');
    const requestId = submit.json().data.id;

    // Appears in the admin queue
    const queue = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/category-requests?status=pending',
      headers: authHeaders(adminToken),
    });
    expect(queue.statusCode).toBe(200);
    expect((queue.json().data as Array<{ id: string }>).map((r) => r.id)).toContain(requestId);

    // Admin approves
    const review = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/category-requests/${requestId}/review`,
      headers: authHeaders(adminToken),
      payload: { action: 'approve' },
    });
    expect(review.statusCode).toBe(200);

    const me = await app.inject({
      method: 'GET',
      url: '/api/v1/sellers/me',
      headers: authHeaders(sellerUser.token),
    });
    const body = me.json().data;
    expect(body.categories).toContain(electricalId);
    expect(body.licenseVerified).toBe(true);
    expect(body.verificationTier).toBeGreaterThanOrEqual(3);

    const ids = await feedPostIds(sellerUser.token);
    expect(ids).toContain(electricalPostId);
  });

  it('admin reject → rejected, no grant', async () => {
    const submit = await app.inject({
      method: 'POST',
      url: '/api/v1/sellers/me/category-requests',
      headers: authHeaders(sellerUser.token),
      payload: {
        majorCategoryId: servicesId,
        subcategoryIds: [petCareId],
        documents: [
          { type: 'id', url: 'https://example.com/id.png' },
          { type: 'background_check', url: 'https://example.com/bg.png' },
        ],
      },
    });
    expect(submit.statusCode).toBe(201);
    const requestId = submit.json().data.id;

    const review = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/category-requests/${requestId}/review`,
      headers: authHeaders(adminToken),
      payload: { action: 'reject', rejectionReason: 'Insufficient documentation provided' },
    });
    expect(review.statusCode).toBe(200);

    const me = await app.inject({
      method: 'GET',
      url: '/api/v1/sellers/me',
      headers: authHeaders(sellerUser.token),
    });
    expect(me.json().data.categories).not.toContain(petCareId);
  });

  it('records category-request outcomes to Prometheus', async () => {
    // /metrics is bearer-protected only when METRICS_TOKEN is set (unset in test).
    const headers = process.env.METRICS_TOKEN
      ? { authorization: `Bearer ${process.env.METRICS_TOKEN}` }
      : {};
    const res = await app.inject({ method: 'GET', url: '/metrics', headers });
    expect(res.statusCode).toBe(200);

    // Earlier tests produced auto_approve + queue + admin decisions, so the
    // counter family must exist with at least one positive labeled sample.
    const lines = res.body
      .split('\n')
      .filter((l) => l.startsWith('rm_category_request_outcome_total{'));
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.some((l) => l.includes('outcome="auto_approve"'))).toBe(true);
    expect(
      lines.some((l) => {
        const value = Number(l.trim().split(/\s+/).pop());
        return Number.isFinite(value) && value > 0;
      }),
    ).toBe(true);
  });
});
