import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/config/database.js';
import type { FastifyInstance } from 'fastify';

process.env.NODE_ENV = 'test';

let app: FastifyInstance;
let buyerToken: string;
let buyerUserId: string;
let sellerToken: string;
let sellerUserId: string;
let sellerId: string;
let postId: string;
let offerId: string;
let transactionId: string;
let disputeId: string;

const BUYER = {
  email: 'dispute-buyer@example.com',
  password: 'TestPass123!',
  firstName: 'Dispute',
  lastName: 'Buyer',
  accountType: 'buyer' as const,
  agreeToTerms: true as const,
  agreeToPrivacy: true as const,
};

const SELLER = {
  email: 'dispute-seller@example.com',
  password: 'TestPass123!',
  firstName: 'Dispute',
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

  // Clean up in FK-safe order
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
    await prisma.dispute.deleteMany({ where: { buyerId: { in: userIds } } });
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

  // Switch seller to 'both' (auto-creates seller profile)
  await app.inject({
    method: 'PATCH', url: '/api/v1/users/me/account-type',
    headers: sellerHeaders(),
    payload: { accountType: 'both' },
  });
  // Get the auto-created seller profile
  const sellerProfileRes = await app.inject({
    method: 'GET', url: '/api/v1/sellers/me',
    headers: sellerHeaders(),
  });
  sellerId = sellerProfileRes.json().data.id;
  // Update with business details
  await app.inject({
    method: 'PATCH', url: '/api/v1/sellers/me',
    headers: sellerHeaders(),
    payload: { businessName: 'Dispute Test Biz', bio: 'Test bio for dispute testing purposes, very professional.', serviceRadius: 25 },
  });

  // Enable Stripe for seller
  await prisma.sellerProfile.update({
    where: { id: sellerId },
    data: { stripeAccountId: 'acct_test', stripeChargesEnabled: true, stripePayoutsEnabled: true },
  });

  // Get category IDs via slug endpoints
  const servicesRes = await app.inject({ method: 'GET', url: '/api/v1/categories/services' });
  const categoryId = servicesRes.json().data.id;
  const plumbingRes = await app.inject({ method: 'GET', url: '/api/v1/categories/plumbing' });
  const subcategoryId = plumbingRes.json().data.id;

  // Create a post
  const postRes = await app.inject({
    method: 'POST', url: '/api/v1/posts',
    headers: buyerHeaders(),
    payload: {
      title: 'Dispute Test Post - Need a plumber for kitchen sink leak',
      description: 'I need help testing the dispute system. My kitchen sink has been leaking and needs repair.',
      categoryId,
      subcategoryId,
      budgetType: 'fixed',
      budgetMin: 100,
      budgetMax: 200,
      city: 'Dallas',
      state: 'TX',
      urgency: 'within_1_week',
    },
  });
  postId = postRes.json().data.id;

  // Submit offer
  const offerRes = await app.inject({
    method: 'POST', url: '/api/v1/offers',
    headers: sellerHeaders(),
    payload: {
      postId,
      offerType: 'service',
      quoteAmount: 150,
      estimatedDuration: '3 days',
      availableDate: new Date(Date.now() + 86400000).toISOString(),
      message: 'I can help with this test project. I have 10 years of experience in dispute resolution testing.',
    },
  });
  offerId = offerRes.json().data.id;

  // Accept offer (creates transaction)
  const acceptRes = await app.inject({
    method: 'POST', url: `/api/v1/offers/${offerId}/accept`,
    headers: buyerHeaders(),
  });
  transactionId = acceptRes.json().data.transaction.id;
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
    await prisma.dispute.deleteMany({ where: { buyerId: { in: userIds } } });
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

describe('Disputes Module', () => {
  describe('POST /api/v1/disputes', () => {
    it('should create a dispute as buyer', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/disputes',
        headers: buyerHeaders(),
        payload: {
          transactionId,
          disputeType: 'quality_issue',
          description: 'The work was not completed as described in the original agreement.',
          requestedResolution: 'partial_refund',
          requestedAmount: 50,
          evidence: [
            { type: 'text', description: 'Work was incomplete and missing several key components.' },
          ],
        },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.disputeType).toBe('quality_issue');
      expect(body.data.status).toBe('open');
      expect(body.data.requestedAmount).toBe(50);
      disputeId = body.data.id;
    });

    it('should reject duplicate dispute for same transaction', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/disputes',
        headers: buyerHeaders(),
        payload: {
          transactionId,
          disputeType: 'non_delivery',
          description: 'Trying to file a second dispute on the same transaction.',
        },
      });

      expect(res.statusCode).toBe(409);
    });

    it('should require authentication', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/disputes',
        payload: {
          transactionId,
          disputeType: 'quality_issue',
          description: 'Anonymous dispute attempt should be rejected.',
        },
      });

      expect(res.statusCode).toBe(401);
    });

    it('should reject non-participant', async () => {
      // Create a new user who is not a participant
      const reg = await app.inject({
        method: 'POST', url: '/api/v1/auth/register',
        payload: {
          email: 'dispute-outsider@example.com',
          password: 'TestPass123!',
          firstName: 'Outsider',
          lastName: 'User',
          accountType: 'buyer',
          agreeToTerms: true,
          agreeToPrivacy: true,
        },
      });
      const outsiderId = reg.json().data.user.id;
      await prisma.user.update({ where: { id: outsiderId }, data: { emailVerified: true } });
      const login = await app.inject({
        method: 'POST', url: '/api/v1/auth/login',
        payload: { email: 'dispute-outsider@example.com', password: 'TestPass123!' },
      });
      const outsiderToken = login.json().data.tokens.accessToken;

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/disputes',
        headers: { authorization: `Bearer ${outsiderToken}` },
        payload: {
          transactionId,
          disputeType: 'quality_issue',
          description: 'Outsider trying to file dispute on a transaction they are not part of.',
        },
      });

      expect(res.statusCode).toBe(403);

      // Clean up outsider
      await prisma.user.deleteMany({ where: { email: 'dispute-outsider@example.com' } });
    });
  });

  describe('GET /api/v1/disputes/my-disputes', () => {
    it('should list buyer disputes', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/disputes/my-disputes',
        headers: buyerHeaders(),
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      expect(body.data[0].disputeType).toBe('quality_issue');
    });

    it('should list seller disputes', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/disputes/my-disputes',
        headers: sellerHeaders(),
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter by status', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/disputes/my-disputes?status=resolved',
        headers: buyerHeaders(),
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.length).toBe(0);
    });
  });

  describe('GET /api/v1/disputes/:disputeId', () => {
    it('should return dispute detail for buyer', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/disputes/${disputeId}`,
        headers: buyerHeaders(),
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.id).toBe(disputeId);
      expect(body.data.buyerEvidence).toBeDefined();
      expect(body.data.sellerEvidence).toBeDefined();
      expect(body.data.buyer).toBeDefined();
      expect(body.data.seller).toBeDefined();
    });

    it('should return 404 for non-existent dispute', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/disputes/00000000-0000-0000-0000-000000000000',
        headers: buyerHeaders(),
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/v1/disputes/:disputeId/evidence', () => {
    it('should submit evidence as buyer', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/disputes/${disputeId}/evidence`,
        headers: buyerHeaders(),
        payload: {
          evidence: [
            { type: 'photo', url: 'https://example.com/photo1.jpg', description: 'Photo showing the issue' },
          ],
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.message).toBe('Evidence submitted successfully');
    });

    it('should submit evidence as seller', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/disputes/${disputeId}/evidence`,
        headers: sellerHeaders(),
        payload: {
          evidence: [
            { type: 'text', description: 'Work was completed as per the agreed scope.' },
          ],
        },
      });

      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /api/v1/disputes/:disputeId/appeal', () => {
    it('should reject appeal on non-resolved dispute', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/disputes/${disputeId}/appeal`,
        headers: buyerHeaders(),
        payload: {
          reason: 'I want to appeal this dispute that is not yet resolved.',
        },
      });

      expect(res.statusCode).toBe(409);
    });

    it('should appeal a resolved dispute', async () => {
      // Manually resolve the dispute first
      await prisma.dispute.update({
        where: { id: disputeId },
        data: { status: 'resolved', outcome: 'no_refund', resolvedAt: new Date() },
      });

      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/disputes/${disputeId}/appeal`,
        headers: buyerHeaders(),
        payload: {
          reason: 'I disagree with the resolution and have additional evidence to present.',
          additionalEvidence: [
            { type: 'document', url: 'https://example.com/contract.pdf', description: 'Original contract' },
          ],
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.status).toBe('appealed');
      expect(body.data.tier).toBe(2);
    });
  });
});
