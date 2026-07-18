import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { prisma } from '../src/config/database.js';
import type { FastifyInstance } from 'fastify';

// Mock Stripe
vi.mock('../src/config/stripe.js', () => ({
  getStripe: vi.fn(() => ({
    transfers: {
      create: vi.fn().mockResolvedValue({ id: 'tr_test123' }),
    },
    refunds: { create: vi.fn().mockResolvedValue({ id: 're_test' }) },
    paymentIntents: { create: vi.fn().mockResolvedValue({ id: 'pi_test', client_secret: 'cs_test' }) },
    accounts: { create: vi.fn().mockResolvedValue({ id: 'acct_test' }) },
    accountLinks: { create: vi.fn().mockResolvedValue({ url: 'https://stripe.com/onboard' }) },
  })),
  verifyWebhookSignature: vi.fn(),
}));

process.env.NODE_ENV = 'test';

let app: FastifyInstance;
let sellerToken: string;
let sellerUserId: string;
let sellerId: string;
let buyerToken: string;
let buyerUserId: string;
let payoutId: string;

const BUYER = {
  email: 'payout-buyer@example.com',
  password: 'TestPass123!',
  firstName: 'Payout',
  lastName: 'Buyer',
  accountType: 'buyer' as const,
  agreeToTerms: true as const,
  agreeToPrivacy: true as const,
};

const SELLER = {
  email: 'payout-seller@example.com',
  password: 'TestPass123!',
  firstName: 'Payout',
  lastName: 'Seller',
  accountType: 'buyer' as const,
  agreeToTerms: true as const,
  agreeToPrivacy: true as const,
};

function sellerHeaders() {
  return { authorization: `Bearer ${sellerToken}` };
}

function buyerHeaders() {
  return { authorization: `Bearer ${buyerToken}` };
}

beforeAll(async () => {
  const { buildApp } = await import('../src/app.js');
  app = await buildApp();
  await app.ready();

  // Clean up
  const emails = [BUYER.email, SELLER.email];
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
    if (sellerIds.length > 0) {
      await prisma.payout.deleteMany({ where: { sellerId: { in: sellerIds } } });
      await prisma.dispute.deleteMany({ where: { sellerId: { in: sellerIds } } });
      await prisma.transaction.deleteMany({ where: { sellerId: { in: sellerIds } } });
      await prisma.offer.deleteMany({ where: { sellerId: { in: sellerIds } } });
    }
    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.transaction.deleteMany({ where: { buyerId: { in: userIds } } });
    await prisma.post.deleteMany({ where: { buyerId: { in: userIds } } });
    await prisma.conversation.deleteMany({
      where: { OR: [{ participant1Id: { in: userIds } }, { participant2Id: { in: userIds } }] },
    });
    await prisma.sellerProfile.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }

  // Register buyer
  const buyerReg = await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: BUYER });
  buyerUserId = buyerReg.json().data.user.id;
  await prisma.user.update({ where: { id: buyerUserId }, data: { emailVerified: true } });
  const buyerLogin = await app.inject({
    method: 'POST', url: '/api/v1/auth/login',
    payload: { email: BUYER.email, password: BUYER.password },
  });
  buyerToken = buyerLogin.json().data.tokens.accessToken;

  // Register seller
  const sellerReg = await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: SELLER });
  sellerUserId = sellerReg.json().data.user.id;
  await prisma.user.update({ where: { id: sellerUserId }, data: { emailVerified: true } });
  const sellerLogin = await app.inject({
    method: 'POST', url: '/api/v1/auth/login',
    payload: { email: SELLER.email, password: SELLER.password },
  });
  sellerToken = sellerLogin.json().data.tokens.accessToken;

  // Create seller profile (switch to 'both' auto-creates it)
  await app.inject({
    method: 'PATCH', url: '/api/v1/users/me/account-type',
    headers: sellerHeaders(),
    payload: { accountType: 'both' },
  });
  const spRes = await app.inject({
    method: 'GET', url: '/api/v1/sellers/me',
    headers: sellerHeaders(),
  });
  sellerId = spRes.json().data.id;
  await app.inject({
    method: 'PATCH', url: '/api/v1/sellers/me',
    headers: sellerHeaders(),
    payload: { businessName: 'Payout Test Biz', bio: 'Professional payout testing services for over 5 years.', serviceRadius: 25 },
  });

  await prisma.sellerProfile.update({
    where: { id: sellerId },
    data: { stripeAccountId: 'acct_payout_test', stripeChargesEnabled: true, stripePayoutsEnabled: true },
  });

  // Create a post and offer so we can create a real transaction
  const servicesRes = await app.inject({ method: 'GET', url: '/api/v1/categories/services' });
  const categoryId = servicesRes.json().data.id;
  const plumbingRes = await app.inject({ method: 'GET', url: '/api/v1/categories/plumbing' });
  const subcategoryId = plumbingRes.json().data.id;

  const postRes = await app.inject({
    method: 'POST', url: '/api/v1/posts',
    headers: buyerHeaders(),
    payload: {
      title: 'Payout test post - need plumbing service',
      description: 'Need someone to fix a leaky pipe for payout testing purposes.',
      categoryId, subcategoryId,
      budgetType: 'fixed', budgetMin: 150, budgetMax: 250,
      city: 'Dallas', state: 'TX', urgency: 'within_1_week',
    },
  });
  const testPostId = postRes.json().data.id;

  const offerRes = await app.inject({
    method: 'POST', url: '/api/v1/offers',
    headers: sellerHeaders(),
    payload: {
      postId: testPostId, offerType: 'service', quoteAmount: 200,
      estimatedDuration: '2 days',
      availableDate: new Date(Date.now() + 86400000).toISOString(),
      message: 'I can handle this plumbing job efficiently with my 10 years of experience.',
    },
  });
  const testOfferId = offerRes.json().data.id;

  // Accept offer to create transaction
  const acceptRes = await app.inject({
    method: 'POST', url: `/api/v1/offers/${testOfferId}/accept`,
    headers: buyerHeaders(),
  });
  const tx = acceptRes.json().data.transaction;

  // Update transaction to completed status for payout testing
  await prisma.transaction.update({
    where: { id: tx.id },
    data: { status: 'completed', escrowStatus: 'released' },
  });

  const txRecord = await prisma.transaction.findUnique({ where: { id: tx.id } });
  const payout = await prisma.payout.create({
    data: {
      transactionId: tx.id,
      sellerId,
      grossAmount: txRecord!.quoteAmount!,
      platformFee: txRecord!.platformFee ?? 16,
      platformFeePercentage: txRecord!.platformFeePercentage ?? 8,
      netPayout: txRecord!.sellerPayoutAmount ?? 184,
      currency: 'USD',
      stripeTransferId: 'tr_test_payout',
      status: 'paid',
      paidAt: new Date(),
    },
  });
  payoutId = payout.id;
});

afterAll(async () => {
  const userIds = [buyerUserId, sellerUserId].filter(Boolean);
  if (userIds.length > 0) {
    const sellers = await prisma.sellerProfile.findMany({
      where: { userId: { in: userIds } },
      select: { id: true },
    });
    const sellerIds = sellers.map((s) => s.id);
    if (sellerIds.length > 0) {
      await prisma.payout.deleteMany({ where: { sellerId: { in: sellerIds } } });
      await prisma.dispute.deleteMany({ where: { sellerId: { in: sellerIds } } });
      await prisma.transaction.deleteMany({ where: { sellerId: { in: sellerIds } } });
      await prisma.offer.deleteMany({ where: { sellerId: { in: sellerIds } } });
    }
    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.transaction.deleteMany({ where: { buyerId: { in: userIds } } });
    await prisma.post.deleteMany({ where: { buyerId: { in: userIds } } });
    await prisma.conversation.deleteMany({
      where: { OR: [{ participant1Id: { in: userIds } }, { participant2Id: { in: userIds } }] },
    });
    await prisma.sellerProfile.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
  await app.close();
});

describe('Payouts Module', () => {
  describe('GET /api/v1/payouts', () => {
    it('should list seller payouts', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/payouts',
        headers: sellerHeaders(),
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      expect(body.data[0].netPayout).toBeGreaterThan(0);
      expect(body.meta.total).toBeGreaterThanOrEqual(1);
    });

    it('should filter by status', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/payouts?status=pending',
        headers: sellerHeaders(),
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.length).toBe(0); // our test payout is 'paid'
    });

    it('should reject non-seller users', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/payouts',
        headers: buyerHeaders(),
      });

      expect(res.statusCode).toBe(404); // buyer has no seller profile
    });

    it('should require authentication', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/payouts',
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/payouts/summary', () => {
    it('should return earnings summary', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/payouts/summary',
        headers: sellerHeaders(),
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.totalEarned).toBeGreaterThan(0);
      expect(body.data.totalPending).toBe(0);
      expect(body.data.totalPlatformFees).toBeGreaterThanOrEqual(0);
      expect(body.data.payoutCount).toBe(1);
      expect(body.data.currency).toBe('USD');
    });
  });

  describe('GET /api/v1/payouts/:payoutId', () => {
    it('should return payout detail', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/payouts/${payoutId}`,
        headers: sellerHeaders(),
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.id).toBe(payoutId);
      expect(body.data.grossAmount).toBeGreaterThan(0);
      expect(body.data.netPayout).toBeGreaterThan(0);
      expect(body.data.status).toBe('paid');
      expect(body.data.stripeTransferId).toBe('tr_test_payout');
    });

    it('should return 404 for non-existent payout', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/payouts/00000000-0000-0000-0000-000000000000',
        headers: sellerHeaders(),
      });

      expect(res.statusCode).toBe(404);
    });
  });
});
