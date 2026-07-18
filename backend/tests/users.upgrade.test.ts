import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/config/database.js';
import { redis } from '../src/config/redis.js';
import type { FastifyInstance } from 'fastify';

process.env.NODE_ENV = 'test';

let app: FastifyInstance;

const CLASSIC_USER = {
  email: 'upgrade-classic@example.com',
  password: 'TestPass123!',
  firstName: 'Classic',
  lastName: 'ToBiz',
  accountType: 'seller' as const,
  agreeToTerms: true as const,
  agreeToPrivacy: true as const,
};

const VALID_PAYLOAD = {
  ein: '12-3456789',
  businessName: 'Upgrade Test LLC',
  businessType: 'llc' as const,
  salesTaxCertificateUrl: 'https://r2.example.com/uploads/upgrade-cert.pdf',
};

async function registerAndLogin(payload: typeof CLASSIC_USER): Promise<string> {
  await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload });
  const loginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: payload.email, password: payload.password },
  });
  return loginRes.json().data.tokens.accessToken;
}

async function cleanupByEmail(email: string): Promise<void> {
  await prisma.sellerProfile.deleteMany({ where: { user: { email } } });
  await prisma.user.deleteMany({ where: { email } });
}

beforeAll(async () => {
  const { buildApp } = await import('../src/app.js');
  app = await buildApp();
  await app.ready();
  await cleanupByEmail(CLASSIC_USER.email);
});

afterAll(async () => {
  await cleanupByEmail(CLASSIC_USER.email);
  await redis.quit();
  await prisma.$disconnect();
  await app.close();
});

describe('POST /api/v1/users/me/upgrade-to-business', () => {
  it('flips isBusiness=true, persists EIN, and upserts SellerProfile with business fields', async () => {
    const token = await registerAndLogin(CLASSIC_USER);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/users/me/upgrade-to-business',
      headers: { authorization: `Bearer ${token}` },
      payload: VALID_PAYLOAD,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.isBusiness).toBe(true);
    expect(res.json().data.ein).toBe(VALID_PAYLOAD.ein);

    const user = await prisma.user.findUnique({
      where: { email: CLASSIC_USER.email },
    });
    expect(user?.isBusiness).toBe(true);
    expect(user?.ein).toBe(VALID_PAYLOAD.ein);

    const sp = await prisma.sellerProfile.findUnique({
      where: { userId: user!.id },
    });
    expect(sp?.businessName).toBe(VALID_PAYLOAD.businessName);
    expect(sp?.businessType).toBe(VALID_PAYLOAD.businessType);
    expect(sp?.salesTaxCertificateUrl).toBe(VALID_PAYLOAD.salesTaxCertificateUrl);
    expect(sp?.einVerified).toBe(false);
    expect(sp?.salesTaxVerified).toBe(false);

    // #227: a pending sales_tax verification request is queued for admin review.
    const vreqs = await prisma.verificationRequest.findMany({
      where: { sellerId: sp!.id, verificationType: 'sales_tax', deletedAt: null },
    });
    expect(vreqs).toHaveLength(1);
    expect(vreqs[0].status).toBe('pending');
    expect(vreqs[0].documents).toEqual([VALID_PAYLOAD.salesTaxCertificateUrl]);

    // Cleanup: prepare for next test, which re-registers the same email
    await cleanupByEmail(CLASSIC_USER.email);
  });

  it('rejects upgrade when account is already business', async () => {
    // Register directly as business
    const email = 'upgrade-already-biz@example.com';
    await cleanupByEmail(email);
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        ...CLASSIC_USER,
        email,
        isBusiness: true,
        ein: '11-2222222',
        businessName: 'Already Biz LLC',
        businessType: 'llc',
        salesTaxCertificateUrl: 'https://r2.example.com/cert.pdf',
      },
    });
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email, password: CLASSIC_USER.password },
    });
    const token = loginRes.json().data.tokens.accessToken;

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/users/me/upgrade-to-business',
      headers: { authorization: `Bearer ${token}` },
      payload: VALID_PAYLOAD,
    });
    expect(res.statusCode).toBe(409);

    await cleanupByEmail(email);
  });

  it('rejects upgrade with malformed EIN', async () => {
    const token = await registerAndLogin(CLASSIC_USER);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/users/me/upgrade-to-business',
      headers: { authorization: `Bearer ${token}` },
      payload: { ...VALID_PAYLOAD, ein: '1234' },
    });
    expect(res.statusCode).toBe(400);

    await cleanupByEmail(CLASSIC_USER.email);
  });

  it('rejects unauthenticated request', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/users/me/upgrade-to-business',
      payload: VALID_PAYLOAD,
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('PATCH /api/v1/users/me/business-profile (issue #3 cert completion)', () => {
  const BIZ_NO_CERT = 'biz-complete-cert@example.com';

  afterAll(async () => {
    await cleanupByEmail(BIZ_NO_CERT);
  });

  it('attaches the sales-tax cert for a business account that registered without one', async () => {
    await cleanupByEmail(BIZ_NO_CERT);
    // Register as business WITHOUT a cert (the issue #3 flow — /uploads needs auth).
    const regRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        ...CLASSIC_USER,
        email: BIZ_NO_CERT,
        isBusiness: true,
        ein: '12-3456789',
        businessName: 'Cert Pending LLC',
        businessType: 'llc',
        // salesTaxCertificateUrl omitted
      },
    });
    expect(regRes.statusCode).toBe(201);

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: BIZ_NO_CERT, password: CLASSIC_USER.password },
    });
    const token = loginRes.json().data.tokens.accessToken;

    const certUrl = 'https://r2.example.com/uploads/late-cert.pdf';
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/me/business-profile',
      headers: { authorization: `Bearer ${token}` },
      payload: { salesTaxCertificateUrl: certUrl },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.isBusiness).toBe(true);

    const user = await prisma.user.findUnique({ where: { email: BIZ_NO_CERT } });
    const sp = await prisma.sellerProfile.findUnique({ where: { userId: user!.id } });
    expect(sp?.salesTaxCertificateUrl).toBe(certUrl);
    // Existing business fields are preserved when only the cert is sent.
    expect(sp?.businessName).toBe('Cert Pending LLC');
    expect(sp?.businessType).toBe('llc');
    expect(sp?.salesTaxVerified).toBe(false);

    // #227: attaching the cert queues a pending sales_tax verification request.
    const vreqs = await prisma.verificationRequest.findMany({
      where: { sellerId: sp!.id, verificationType: 'sales_tax', deletedAt: null },
    });
    expect(vreqs).toHaveLength(1);
    expect(vreqs[0].status).toBe('pending');
    expect(vreqs[0].documents).toEqual([certUrl]);
  });

  it('supersedes the prior pending request and re-verifies when the cert is replaced (#227)', async () => {
    const email = 'biz-replace-cert@example.com';
    await cleanupByEmail(email);
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        ...CLASSIC_USER,
        email,
        isBusiness: true,
        ein: '12-3456789',
        businessName: 'Replace Cert LLC',
        businessType: 'llc',
      },
    });
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email, password: CLASSIC_USER.password },
    });
    const token = loginRes.json().data.tokens.accessToken;

    const firstUrl = 'https://r2.example.com/uploads/cert-v1.pdf';
    const secondUrl = 'https://r2.example.com/uploads/cert-v2.pdf';
    const patch = (url: string) =>
      app.inject({
        method: 'PATCH',
        url: '/api/v1/users/me/business-profile',
        headers: { authorization: `Bearer ${token}` },
        payload: { salesTaxCertificateUrl: url },
      });

    await patch(firstUrl);
    const second = await patch(secondUrl);
    expect(second.statusCode).toBe(200);

    const user = await prisma.user.findUnique({ where: { email } });
    const sp = await prisma.sellerProfile.findUnique({ where: { userId: user!.id } });
    expect(sp?.salesTaxCertificateUrl).toBe(secondUrl);
    expect(sp?.salesTaxVerified).toBe(false);

    // Exactly one OPEN request remains (the latest); the first was superseded.
    const open = await prisma.verificationRequest.findMany({
      where: { sellerId: sp!.id, verificationType: 'sales_tax', deletedAt: null },
    });
    expect(open).toHaveLength(1);
    expect(open[0].documents).toEqual([secondUrl]);

    const superseded = await prisma.verificationRequest.findMany({
      where: {
        sellerId: sp!.id,
        verificationType: 'sales_tax',
        deletedAt: { not: null },
      },
    });
    expect(superseded).toHaveLength(1);
    expect(superseded[0].documents).toEqual([firstUrl]);

    await cleanupByEmail(email);
  });

  it('rejects when the account is not a business account', async () => {
    const token = await registerAndLogin(CLASSIC_USER);
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/me/business-profile',
      headers: { authorization: `Bearer ${token}` },
      payload: { salesTaxCertificateUrl: 'https://r2.example.com/uploads/x.pdf' },
    });
    expect(res.statusCode).toBe(409);
    await cleanupByEmail(CLASSIC_USER.email);
  });

  it('rejects unauthenticated request', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/me/business-profile',
      payload: { salesTaxCertificateUrl: 'https://r2.example.com/uploads/x.pdf' },
    });
    expect(res.statusCode).toBe(401);
  });
});
