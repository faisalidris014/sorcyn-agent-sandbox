import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/config/database.js';
import { redis } from '../src/config/redis.js';
import type { FastifyInstance } from 'fastify';

process.env.NODE_ENV = 'test';

let app: FastifyInstance;
let servicesId: string;
let plumbingId: string;

const BIZ_USER = {
  email: 'postgate-biz@example.com',
  password: 'TestPass123!',
  firstName: 'Biz',
  lastName: 'Gating',
  accountType: 'seller' as const,
  isBusiness: true as const,
  ein: '12-3456789',
  businessName: 'Post Gating LLC',
  businessType: 'llc' as const,
  salesTaxCertificateUrl: 'https://r2.example.com/cert.pdf',
  agreeToTerms: true as const,
  agreeToPrivacy: true as const,
};

async function cleanupBiz(): Promise<void> {
  await prisma.post.deleteMany({ where: { buyer: { email: BIZ_USER.email } } });
  await prisma.verificationRequest.deleteMany({
    where: { seller: { user: { email: BIZ_USER.email } } },
  });
  await prisma.sellerProfile.deleteMany({ where: { user: { email: BIZ_USER.email } } });
  await prisma.user.deleteMany({ where: { email: BIZ_USER.email } });
}

async function registerBizAndLogin(): Promise<{ token: string; userId: string }> {
  await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: BIZ_USER });
  await prisma.user.update({
    where: { email: BIZ_USER.email },
    data: { emailVerified: true },
  });
  const loginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: BIZ_USER.email, password: BIZ_USER.password },
  });
  return {
    token: loginRes.json().data.tokens.accessToken,
    userId: loginRes.json().data.user.id,
  };
}

beforeAll(async () => {
  const { buildApp } = await import('../src/app.js');
  app = await buildApp();
  await app.ready();

  await cleanupBiz();

  servicesId = (await app.inject({ method: 'GET', url: '/api/v1/categories/services' })).json().data.id;
  plumbingId = (await app.inject({ method: 'GET', url: '/api/v1/categories/plumbing' })).json().data.id;
});

afterAll(async () => {
  await cleanupBiz();
  await redis.quit();
  await prisma.$disconnect();
  await app.close();
});

function validPost(): Record<string, unknown> {
  return {
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
  };
}

describe('Business account post-creation gating', () => {
  it('blocks active post creation when EIN + sales-tax verifications have not been submitted', async () => {
    await cleanupBiz();
    const { token } = await registerBizAndLogin();

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: { authorization: `Bearer ${token}` },
      payload: { ...validPost(), status: 'active' },
    });

    expect(res.statusCode).toBe(403);
    expect(JSON.stringify(res.json())).toMatch(/BUSINESS_VERIFICATION_REQUIRED/);
  });

  it('allows active post creation once both verification requests are pending', async () => {
    await cleanupBiz();
    const { token, userId } = await registerBizAndLogin();
    const sp = await prisma.sellerProfile.findUnique({ where: { userId } });
    expect(sp).not.toBeNull();

    await prisma.verificationRequest.createMany({
      data: [
        {
          sellerId: sp!.id,
          verificationType: 'ein',
          tier: 2,
          documents: [],
          status: 'pending',
        },
        {
          sellerId: sp!.id,
          verificationType: 'sales_tax',
          tier: 2,
          documents: [],
          status: 'pending',
        },
      ],
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: { authorization: `Bearer ${token}` },
      payload: { ...validPost(), status: 'active' },
    });

    expect(res.statusCode).toBe(201);
  });

  it('allows active post creation when both verifications are approved', async () => {
    await cleanupBiz();
    const { token, userId } = await registerBizAndLogin();
    const sp = await prisma.sellerProfile.findUnique({ where: { userId } });
    await prisma.sellerProfile.update({
      where: { id: sp!.id },
      data: { einVerified: true, salesTaxVerified: true },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: { authorization: `Bearer ${token}` },
      payload: { ...validPost(), status: 'active' },
    });

    expect(res.statusCode).toBe(201);
  });

  it('allows draft creation even without verifications', async () => {
    await cleanupBiz();
    const { token } = await registerBizAndLogin();

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: { authorization: `Bearer ${token}` },
      payload: { ...validPost(), status: 'draft' },
    });

    expect(res.statusCode).toBe(201);
  });
});
