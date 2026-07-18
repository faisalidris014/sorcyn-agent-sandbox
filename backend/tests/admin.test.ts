import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { prisma } from '../src/config/database.js';
import type { FastifyInstance } from 'fastify';
import {
  createTestUser,
  makeAdmin,
  authHeaders,
  cleanupTestData,
  clearAuthRedisKeys,
  type TestUser,
} from './helpers.js';

process.env.NODE_ENV = 'test';

// Stripe is mocked so dispute-resolution refunds/releases (SEC-H1 #256) exercise the real escrow
// state machine without hitting the network. Every getStripe() call returns the same object, so
// tests can re-import and assert on these spies.
vi.mock('../src/config/stripe.js', () => {
  const refunds = {
    create: vi.fn().mockResolvedValue({ id: 're_dispute_test', status: 'succeeded' }),
  };
  const transfers = {
    create: vi.fn().mockResolvedValue({ id: 'tr_dispute_test' }),
  };
  return {
    getStripe: () => ({ refunds, transfers }),
    verifyWebhookSignature: vi.fn(),
  };
});

let app: FastifyInstance;
let adminUser: TestUser;
let adminToken: string;
let regularUser: TestUser;
let sellerUser: TestUser;
let sellerId: string;
let verificationRequestId: string;
let flaggedReviewId: string;
let flaggedMessageId: string;
let disputeId: string;

const CLEANUP_PATTERN = 'admintest';

beforeAll(async () => {
  const { buildApp } = await import('../src/app.js');
  app = await buildApp();
  await app.ready();

  // Clean up from previous runs
  await cleanupTestData([CLEANUP_PATTERN]);

  // Create admin user
  adminUser = await createTestUser(app, {
    email: 'admintest_admin@example.com',
    firstName: 'Admin',
    lastName: 'Tester',
    accountType: 'both',
  });
  adminToken = await makeAdmin(app, adminUser);

  // Create regular buyer
  regularUser = await createTestUser(app, {
    email: 'admintest_buyer@example.com',
    firstName: 'Regular',
    lastName: 'Buyer',
    accountType: 'buyer',
  });

  // Create seller user
  sellerUser = await createTestUser(app, {
    email: 'admintest_seller@example.com',
    firstName: 'Seller',
    lastName: 'User',
    accountType: 'seller',
  });

  // Create seller profile
  const sellerProfileRes = await app.inject({
    method: 'POST',
    url: '/api/v1/sellers',
    headers: authHeaders(sellerUser.token),
    payload: {
      businessName: 'Admin Test Biz',
      bio: 'Test seller for admin tests',
    },
  });
  sellerId = sellerProfileRes.json().data.id;

  // Submit verification request for admin to review
  const verifyRes = await app.inject({
    method: 'POST',
    url: '/api/v1/sellers/me/verification',
    headers: authHeaders(sellerUser.token),
    payload: {
      verificationType: 'license',
      documents: ['https://example.com/license.pdf'],
      licenseNumber: 'TX-12345',
      licenseState: 'TX',
    },
  });
  verificationRequestId = verifyRes.json().data.id;

  // Create a flagged review via direct DB insert
  // First, need a transaction for the review
  const category = await prisma.category.findFirst({ where: { parentCategoryId: { not: null } } });

  const post = await prisma.post.create({
    data: {
      buyerId: regularUser.userId,
      categoryId: category!.parentCategoryId!,
      subcategoryId: category!.id,
      title: 'Admin test post',
      description: 'Test post for admin test reviews',
      budgetType: 'fixed',
      budgetMin: 100,
      budgetMax: 100,
      urgency: 'flexible',
      locationCity: 'Dallas',
      locationState: 'TX',
      status: 'filled',
    },
  });

  // Create an offer (required FK for transaction)
  const offer = await prisma.offer.create({
    data: {
      postId: post.id,
      sellerId: sellerId,
      offerType: 'service',
      pricingType: 'flat_rate',
      quoteAmount: 100,
      message: 'I can help with this',
      status: 'accepted',
      acceptedAt: new Date(),
    },
  });

  const transaction = await prisma.transaction.create({
    data: {
      postId: post.id,
      offerId: offer.id,
      buyerId: regularUser.userId,
      sellerId: sellerId,
      transactionType: 'service',
      quoteAmount: 100,
      buyerFee: 5,
      platformFee: 13,
      sellerPayoutAmount: 92,
      totalCharged: 105,
      status: 'completed',
      escrowStatus: 'released',
    },
  });

  const review = await prisma.review.create({
    data: {
      transactionId: transaction.id,
      sellerId: sellerId,
      buyerId: regularUser.userId,
      overallRating: 1,
      writtenReview: 'This is a terrible fake review',
      wouldRecommend: false,
      flagged: true,
      flagReason: 'abusive_content',
      flaggedAt: new Date(),
      moderationStatus: 'pending',
    },
  });
  flaggedReviewId = review.id;

  // Create a conversation and flagged message
  const conversation = await prisma.conversation.create({
    data: {
      participant1Id: regularUser.userId,
      participant2Id: sellerUser.userId,
      postId: post.id,
    },
  });

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: regularUser.userId,
      messageText: 'Pay me on venmo instead',
      flagged: true,
      flagReason: 'external_payment',
      moderationStatus: 'pending',
    },
  });
  flaggedMessageId = message.id;

  // Create a dispute
  const dispute = await prisma.dispute.create({
    data: {
      transactionId: transaction.id,
      postId: post.id,
      openedById: regularUser.userId,
      buyerId: regularUser.userId,
      sellerId: sellerId,
      disputeType: 'quality',
      description: 'Work was not completed as described',
      requestedResolution: 'full_refund',
      requestedAmount: 100,
      status: 'open',
      tier: 2,
    },
  });
  disputeId = dispute.id;
});

afterAll(async () => {
  await cleanupTestData([CLEANUP_PATTERN]);
  await prisma.$disconnect();
  await app.close();
});

beforeEach(async () => {
  // Re-login admin to get fresh token (needed because tokens may expire)
  const loginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: adminUser.email, password: adminUser.password },
  });
  adminToken = loginRes.json().data.tokens.accessToken;
});

// ── Auth Gate ───────────────────────────────────────────────

describe('Admin Authentication', () => {
  it('should reject unauthenticated request', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/stats',
    });
    expect(res.statusCode).toBe(401);
  });

  it('should reject non-admin user', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/stats',
      headers: authHeaders(regularUser.token),
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.detail).toBe('Admin access required');
  });

  it('should allow admin user access', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/stats',
      headers: authHeaders(adminToken),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().success).toBe(true);
  });
});

// ── Dashboard ───────────────────────────────────────────────

describe('GET /api/v1/admin/stats', () => {
  it('should return dashboard stats', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/stats',
      headers: authHeaders(adminToken),
    });

    expect(res.statusCode).toBe(200);
    const { data } = res.json();
    expect(data).toHaveProperty('totalUsers');
    expect(data).toHaveProperty('activeUsers');
    expect(data).toHaveProperty('totalSellers');
    expect(data).toHaveProperty('totalTransactions');
    expect(data).toHaveProperty('totalRevenue');
    expect(data).toHaveProperty('pendingVerifications');
    expect(data).toHaveProperty('openDisputes');
    expect(data).toHaveProperty('flaggedReviews');
    expect(data).toHaveProperty('flaggedMessages');
    expect(typeof data.totalUsers).toBe('number');
    expect(data.totalUsers).toBeGreaterThanOrEqual(3);
  });
});

// ── User Management ─────────────────────────────────────────

describe('GET /api/v1/admin/users', () => {
  it('should list users with pagination', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/users?limit=5',
      headers: authHeaders(adminToken),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.meta).toHaveProperty('total');
    expect(body.meta).toHaveProperty('totalPages');
  });

  it('should search users by email', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/admin/users?search=${encodeURIComponent('admintest_buyer')}`,
      headers: authHeaders(adminToken),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data[0].email).toContain('admintest_buyer');
  });
});

describe('GET /api/v1/admin/users/:userId', () => {
  it('should return user detail with seller profile', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/admin/users/${sellerUser.userId}`,
      headers: authHeaders(adminToken),
    });

    expect(res.statusCode).toBe(200);
    const { data } = res.json();
    expect(data.email).toBe(sellerUser.email);
    expect(data.sellerProfile).toBeTruthy();
    expect(data).not.toHaveProperty('passwordHash');
  });

  it('should 404 for non-existent user', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/users/00000000-0000-0000-0000-000000000000',
      headers: authHeaders(adminToken),
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('POST /api/v1/admin/users/:userId/suspend', () => {
  it('should suspend user', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/users/${regularUser.userId}/suspend`,
      headers: authHeaders(adminToken),
      payload: { reason: 'Violation of terms of service detected' },
    });

    expect(res.statusCode).toBe(200);

    const user = await prisma.user.findUnique({
      where: { id: regularUser.userId },
    });
    expect(user!.status).toBe('suspended');
  });

  it('should reject without reason', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/users/${regularUser.userId}/suspend`,
      headers: authHeaders(adminToken),
      payload: { reason: 'short' },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('POST /api/v1/admin/users/:userId/reactivate', () => {
  it('should reactivate suspended user', async () => {
    // User was suspended in previous test
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/users/${regularUser.userId}/reactivate`,
      headers: authHeaders(adminToken),
    });

    expect(res.statusCode).toBe(200);

    const user = await prisma.user.findUnique({
      where: { id: regularUser.userId },
    });
    expect(user!.status).toBe('active');
  });
});

describe('POST /api/v1/admin/users/:userId/ban', () => {
  it('should ban user', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/users/${regularUser.userId}/ban`,
      headers: authHeaders(adminToken),
      payload: { reason: 'Repeated violations of marketplace policies' },
    });

    expect(res.statusCode).toBe(200);

    const user = await prisma.user.findUnique({
      where: { id: regularUser.userId },
    });
    expect(user!.status).toBe('banned');

    // Reactivate for subsequent tests
    await app.inject({
      method: 'POST',
      url: `/api/v1/admin/users/${regularUser.userId}/reactivate`,
      headers: authHeaders(adminToken),
    });
  });
});

describe('POST /api/v1/admin/users/:userId/force-logout', () => {
  it('should invalidate all user sessions', async () => {
    // Login the regular user to create a session
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: regularUser.email, password: regularUser.password },
    });
    expect(loginRes.statusCode).toBe(200);

    // Force logout
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/users/${regularUser.userId}/force-logout`,
      headers: authHeaders(adminToken),
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.message).toBe('User sessions invalidated');
  });
});

// ── Verification ────────────────────────────────────────────

describe('GET /api/v1/admin/verifications', () => {
  it('should list pending verifications', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/verifications',
      headers: authHeaders(adminToken),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data[0]).toHaveProperty('verificationType');
    expect(body.data[0]).toHaveProperty('seller');
  });
});

describe('POST /api/v1/admin/verifications/:id/review', () => {
  it('should require rejectionReason on reject', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/verifications/${verificationRequestId}/review`,
      headers: authHeaders(adminToken),
      payload: { action: 'reject' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('should approve verification, update badges, and write the admin expiry (#382)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/verifications/${verificationRequestId}/review`,
      headers: authHeaders(adminToken),
      payload: {
        action: 'approve',
        notes: 'License verified against state records',
        // Admin's authoritative expiry (overrides seller-claimed / TDLR).
        expiresAt: '2029-03-15T00:00:00.000Z',
      },
    });

    expect(res.statusCode).toBe(200);

    // Verify the verification request status + admin-set expiry
    const vr = await prisma.verificationRequest.findUnique({
      where: { id: verificationRequestId },
    });
    expect(vr!.status).toBe('approved');
    expect(vr!.reviewedById).toBe(adminUser.userId);
    expect(vr!.expiresAt?.toISOString().slice(0, 10)).toBe('2029-03-15');

    // Verify seller badges updated + profile expiry re-synced to the admin date
    const seller = await prisma.sellerProfile.findUnique({
      where: { id: sellerId },
    });
    expect(seller!.licenseVerified).toBe(true);
    expect(seller!.verificationTier).toBeGreaterThanOrEqual(3);
    const badges = seller!.verificationBadges as string[];
    expect(badges).toContain('license_verified');
    expect(seller!.licenseExpiry?.toISOString().slice(0, 10)).toBe('2029-03-15');
  });
});

// ── Disputes ────────────────────────────────────────────────

describe('GET /api/v1/admin/disputes', () => {
  it('should list disputes', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/disputes',
      headers: authHeaders(adminToken),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data[0]).toHaveProperty('transaction');
    expect(body.data[0]).toHaveProperty('openedBy');
  });
});

describe('GET /api/v1/admin/disputes/:disputeId', () => {
  it('should return dispute detail', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/admin/disputes/${disputeId}`,
      headers: authHeaders(adminToken),
    });

    expect(res.statusCode).toBe(200);
    const { data } = res.json();
    expect(data.id).toBe(disputeId);
    expect(data.description).toBe('Work was not completed as described');
    expect(data.transaction).toBeTruthy();
  });
});

describe('POST /api/v1/admin/disputes/:id/resolve', () => {
  it('should resolve dispute with outcome', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/disputes/${disputeId}/resolve`,
      headers: authHeaders(adminToken),
      payload: {
        outcome: 'full_refund',
        refundAmount: 100,
        resolutionSummary: 'After reviewing evidence, full refund is warranted due to incomplete work',
      },
    });

    expect(res.statusCode).toBe(200);

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
    });
    expect(dispute!.status).toBe('resolved');
    expect(dispute!.outcome).toBe('full_refund');
    expect(dispute!.assignedAgentId).toBe(adminUser.userId);
    expect(dispute!.resolvedAt).toBeTruthy();
  });
});

// ── SEC-H1 #256: dispute resolution actually moves money ────────
describe('POST /api/v1/admin/disputes/:id/resolve — escrow money movement (SEC-H1 #256)', () => {
  // Seed a fully-funded escrow (captured charge) with its own dispute so each test gets a clean
  // state machine. `escrowStatus` defaults to 'held' with a non-null stripeChargeId — the SEC-C1
  // proof-of-funds gate.
  async function seedFundedDispute(overrides: {
    escrowStatus?: 'held' | 'released' | 'refunded' | 'frozen';
    stripeChargeId?: string | null;
    stripePaymentIntentId?: string | null;
  } = {}) {
    const category = await prisma.category.findFirst({ where: { parentCategoryId: { not: null } } });
    const post = await prisma.post.create({
      data: {
        buyerId: regularUser.userId,
        categoryId: category!.parentCategoryId!,
        subcategoryId: category!.id,
        title: 'admintest funded dispute post',
        description: 'Funded escrow dispute test',
        budgetType: 'fixed',
        budgetMin: 100,
        budgetMax: 100,
        urgency: 'flexible',
        locationCity: 'Dallas',
        locationState: 'TX',
        status: 'filled',
      },
    });
    const offer = await prisma.offer.create({
      data: {
        postId: post.id,
        sellerId,
        offerType: 'service',
        pricingType: 'flat_rate',
        quoteAmount: 100,
        message: 'funded offer',
        status: 'accepted',
        acceptedAt: new Date(),
      },
    });
    const tx = await prisma.transaction.create({
      data: {
        postId: post.id,
        offerId: offer.id,
        buyerId: regularUser.userId,
        sellerId,
        transactionType: 'service',
        quoteAmount: 100,
        buyerFee: 5,
        platformFee: 13,
        sellerPayoutAmount: 92,
        totalCharged: 105,
        status: 'disputed',
        escrowStatus: overrides.escrowStatus ?? 'held',
        stripePaymentIntentId:
          overrides.stripePaymentIntentId === undefined ? 'pi_dispute_test' : overrides.stripePaymentIntentId,
        stripeChargeId:
          overrides.stripeChargeId === undefined ? 'ch_dispute_test' : overrides.stripeChargeId,
      },
    });
    const dispute = await prisma.dispute.create({
      data: {
        transactionId: tx.id,
        postId: post.id,
        openedById: regularUser.userId,
        buyerId: regularUser.userId,
        sellerId,
        disputeType: 'quality',
        description: 'Funded escrow dispute',
        requestedResolution: 'full_refund',
        requestedAmount: 100,
        status: 'open',
        tier: 2,
      },
    });
    return { txId: tx.id, disputeId: dispute.id };
  }

  beforeEach(async () => {
    const stripe = (await import('../src/config/stripe.js')).getStripe();
    (stripe.refunds.create as ReturnType<typeof vi.fn>).mockClear();
    (stripe.transfers.create as ReturnType<typeof vi.fn>).mockClear();
    // Ensure the seller can receive a transfer for the no_refund release path.
    await prisma.sellerProfile.update({
      where: { id: sellerId },
      data: { stripeAccountId: 'acct_dispute_test', stripeChargesEnabled: true, stripePayoutsEnabled: true },
    });
  });

  it('full_refund issues a full Stripe refund and refunds the escrow', async () => {
    const { txId, disputeId: dId } = await seedFundedDispute();
    const stripe = (await import('../src/config/stripe.js')).getStripe();

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/disputes/${dId}/resolve`,
      headers: authHeaders(adminToken),
      payload: { outcome: 'full_refund', resolutionSummary: 'Full refund warranted after evidence review' },
    });

    expect(res.statusCode).toBe(200);
    expect(stripe.refunds.create).toHaveBeenCalledTimes(1);
    const [body, opts] = (stripe.refunds.create as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(body.payment_intent).toBe('pi_dispute_test');
    expect(body.amount).toBeUndefined(); // full refund → no amount
    expect(opts.idempotencyKey).toBe(`dispute_refund_${dId}`);

    const tx = await prisma.transaction.findUnique({ where: { id: txId } });
    expect(tx!.escrowStatus).toBe('refunded');
    expect(tx!.status).toBe('cancelled');
    expect(tx!.stripeRefundId).toBe('re_dispute_test');
    expect(Number(tx!.refundAmount)).toBe(105);
  });

  it('partial_refund issues a partial Stripe refund (amount in cents)', async () => {
    const { txId, disputeId: dId } = await seedFundedDispute();
    const stripe = (await import('../src/config/stripe.js')).getStripe();

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/disputes/${dId}/resolve`,
      headers: authHeaders(adminToken),
      payload: { outcome: 'partial_refund', refundAmount: 40, resolutionSummary: 'Partial refund for partial delivery' },
    });

    expect(res.statusCode).toBe(200);
    const [body] = (stripe.refunds.create as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(body.amount).toBe(4000);

    const tx = await prisma.transaction.findUnique({ where: { id: txId } });
    expect(tx!.escrowStatus).toBe('refunded');
    expect(Number(tx!.refundAmount)).toBe(40);
  });

  it('partial_refund without an amount is rejected (400)', async () => {
    const { disputeId: dId } = await seedFundedDispute();
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/disputes/${dId}/resolve`,
      headers: authHeaders(adminToken),
      payload: { outcome: 'partial_refund', resolutionSummary: 'Partial refund but no amount supplied' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('no_refund releases the escrow to the seller', async () => {
    const { txId, disputeId: dId } = await seedFundedDispute();
    const stripe = (await import('../src/config/stripe.js')).getStripe();

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/disputes/${dId}/resolve`,
      headers: authHeaders(adminToken),
      payload: { outcome: 'no_refund', resolutionSummary: "Buyer's claim denied; releasing to seller" },
    });

    expect(res.statusCode).toBe(200);
    expect(stripe.transfers.create).toHaveBeenCalledTimes(1);
    expect(stripe.refunds.create).not.toHaveBeenCalled();

    const tx = await prisma.transaction.findUnique({ where: { id: txId } });
    expect(tx!.escrowStatus).toBe('released');
    const payout = await prisma.payout.findFirst({ where: { transactionId: txId } });
    expect(payout).toBeTruthy();
  });

  it('full_refund on an escrow already released to the seller is a 409 conflict', async () => {
    const { txId, disputeId: dId } = await seedFundedDispute({ escrowStatus: 'released' });
    const stripe = (await import('../src/config/stripe.js')).getStripe();

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/disputes/${dId}/resolve`,
      headers: authHeaders(adminToken),
      payload: { outcome: 'full_refund', resolutionSummary: 'Attempted refund after release should conflict' },
    });

    expect(res.statusCode).toBe(409);
    expect(stripe.refunds.create).not.toHaveBeenCalled();
    // Dispute stays open so the admin can choose a valid outcome.
    const dispute = await prisma.dispute.findUnique({ where: { id: dId } });
    expect(dispute!.status).toBe('open');
    const tx = await prisma.transaction.findUnique({ where: { id: txId } });
    expect(tx!.escrowStatus).toBe('released');
  });

  it('full_refund with no captured charge records the resolution without moving money', async () => {
    const { txId, disputeId: dId } = await seedFundedDispute({ stripeChargeId: null });
    const stripe = (await import('../src/config/stripe.js')).getStripe();

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/disputes/${dId}/resolve`,
      headers: authHeaders(adminToken),
      payload: { outcome: 'full_refund', resolutionSummary: 'No charge captured; nothing to refund online' },
    });

    expect(res.statusCode).toBe(200);
    expect(stripe.refunds.create).not.toHaveBeenCalled();
    const dispute = await prisma.dispute.findUnique({ where: { id: dId } });
    expect(dispute!.status).toBe('resolved');
    const tx = await prisma.transaction.findUnique({ where: { id: txId } });
    expect(tx!.escrowStatus).toBe('held'); // untouched — no money moved
  });
});

// ── Moderation ──────────────────────────────────────────────

describe('GET /api/v1/admin/moderation/flagged', () => {
  it('should list flagged content', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/moderation/flagged',
      headers: authHeaders(adminToken),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    // At least our flagged review and message
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    const types = body.data.map((i: any) => i.type);
    expect(types).toContain('review');
    expect(types).toContain('message');
  });

  it('should filter by content type', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/moderation/flagged?contentType=review',
      headers: authHeaders(adminToken),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    body.data.forEach((item: any) => {
      expect(item.type).toBe('review');
    });
  });
});

describe('POST /api/v1/admin/moderation/reviews/:reviewId', () => {
  it('should approve flagged review', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/moderation/reviews/${flaggedReviewId}`,
      headers: authHeaders(adminToken),
      payload: { action: 'approve', reason: 'Review content is within guidelines' },
    });

    expect(res.statusCode).toBe(200);

    const review = await prisma.review.findUnique({
      where: { id: flaggedReviewId },
    });
    expect(review!.moderationStatus).toBe('approved');
  });
});

describe('POST /api/v1/admin/moderation/messages/:messageId', () => {
  it('should reject flagged message', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/moderation/messages/${flaggedMessageId}`,
      headers: authHeaders(adminToken),
      payload: { action: 'reject', reason: 'External payment solicitation' },
    });

    expect(res.statusCode).toBe(200);

    const message = await prisma.message.findUnique({
      where: { id: flaggedMessageId },
    });
    expect(message!.moderationStatus).toBe('rejected');
  });
});

// ── Transactions ────────────────────────────────────────────

describe('GET /api/v1/admin/transactions', () => {
  it('should list all transactions', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/transactions',
      headers: authHeaders(adminToken),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data[0]).toHaveProperty('buyer');
    expect(body.data[0]).toHaveProperty('seller');
    expect(body.meta).toHaveProperty('total');
  });
});

// ── Audit Logs ──────────────────────────────────────────────

describe('GET /api/v1/admin/audit-logs', () => {
  it('should list audit logs created by admin actions', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/audit-logs',
      headers: authHeaders(adminToken),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    // Should have entries from suspend, ban, reactivate, force-logout, verify, resolve, moderate
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data[0]).toHaveProperty('action');
    expect(body.data[0]).toHaveProperty('resourceType');
    expect(body.data[0]).toHaveProperty('user');
  });

  it('should filter audit logs by action', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/audit-logs?action=user_suspended',
      headers: authHeaders(adminToken),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    body.data.forEach((log: any) => {
      expect(log.action).toBe('user_suspended');
    });
  });
});
