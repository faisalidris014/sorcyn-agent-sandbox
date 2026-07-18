import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/config/database.js';
import type { FastifyInstance } from 'fastify';

process.env.NODE_ENV = 'test';

let app: FastifyInstance;
let buyerToken: string;
let buyerUserId: string;
let sellerToken: string;
let sellerUserId: string;
let transactionId: string;
let postId: string;
let offerId: string;
let servicesId: string;
let plumbingId: string;

const BUYER = {
  email: 'txtest-buyer@example.com',
  password: 'TestPass123!',
  firstName: 'Tx',
  lastName: 'Buyer',
  accountType: 'buyer' as const,
  agreeToTerms: true as const,
  agreeToPrivacy: true as const,
};

const SELLER = {
  email: 'txtest-seller@example.com',
  password: 'TestPass123!',
  firstName: 'Tx',
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

const validMessage = 'I can help with this project. I have extensive experience in plumbing repairs and have been serving the DFW area for over 10 years.';

beforeAll(async () => {
  const { buildApp } = await import('../src/app.js');
  app = await buildApp();
  await app.ready();

  // Clean up
  await prisma.transaction.deleteMany({
    where: {
      OR: [
        { buyer: { email: BUYER.email } },
        { seller: { user: { email: SELLER.email } } },
      ],
    },
  });
  await prisma.offer.deleteMany({
    where: {
      OR: [
        { post: { buyer: { email: BUYER.email } } },
        { seller: { user: { email: SELLER.email } } },
      ],
    },
  });
  await prisma.post.deleteMany({
    where: { buyer: { email: BUYER.email } },
  });
  await prisma.sellerProfile.deleteMany({
    where: { user: { email: { in: [BUYER.email, SELLER.email] } } },
  });
  await prisma.user.deleteMany({
    where: { email: { in: [BUYER.email, SELLER.email] } },
  });

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
  await app.inject({
    method: 'POST',
    url: '/api/v1/sellers',
    headers: sellerHeaders(),
    payload: {
      businessName: 'Tx Test Plumbing',
      bio: 'We fix pipes with care.',
      serviceRadiusMiles: 30,
    },
  });

  // Enable Stripe for seller (required for accepting paid offers)
  await prisma.sellerProfile.updateMany({
    where: { user: { email: SELLER.email } },
    data: { stripeAccountId: 'acct_test_tx', stripeChargesEnabled: true, stripePayoutsEnabled: true },
  });

  // Get category IDs
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

  // Create post → submit offer → accept offer → get transaction
  const postRes = await app.inject({
    method: 'POST',
    url: '/api/v1/posts',
    headers: buyerHeaders(),
    payload: {
      categoryId: servicesId,
      subcategoryId: plumbingId,
      title: 'Need plumber for transaction test',
      description: 'Transaction test post - kitchen sink leak requiring professional plumbing service.',
      budgetMin: 100,
      budgetMax: 300,
      budgetType: 'range',
      locationCity: 'Dallas',
      locationState: 'TX',
      urgency: 'within_1_week',
    },
  });
  postId = postRes.json().data.id;

  const offerRes = await app.inject({
    method: 'POST',
    url: '/api/v1/offers',
    headers: sellerHeaders(),
    payload: {
      postId,
      offerType: 'service',
      quoteAmount: 200,
      pricingType: 'flat_rate',
      message: validMessage,
    },
  });
  offerId = offerRes.json().data.id;

  const acceptRes = await app.inject({
    method: 'POST',
    url: `/api/v1/offers/${offerId}/accept`,
    headers: buyerHeaders(),
  });
  transactionId = acceptRes.json().data.transaction.id;
});

afterAll(async () => {
  await prisma.transaction.deleteMany({
    where: {
      OR: [
        { buyer: { email: BUYER.email } },
        { seller: { user: { email: SELLER.email } } },
      ],
    },
  });
  await prisma.offer.deleteMany({
    where: {
      OR: [
        { post: { buyer: { email: BUYER.email } } },
        { seller: { user: { email: SELLER.email } } },
      ],
    },
  });
  await prisma.post.deleteMany({
    where: { buyer: { email: BUYER.email } },
  });
  await prisma.sellerProfile.deleteMany({
    where: { user: { email: { in: [BUYER.email, SELLER.email] } } },
  });
  await prisma.user.deleteMany({
    where: { email: { startsWith: 'txtest-' } },
  });
  await prisma.$disconnect();
  await app.close();
});

// ── GET /my-transactions ────────────────────────────────────────

describe('GET /api/v1/transactions/my-transactions', () => {
  it('should list buyer transactions', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/transactions/my-transactions?role=buyer',
      headers: buyerHeaders(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.meta.total).toBeGreaterThanOrEqual(1);
  });

  it('should list seller transactions', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/transactions/my-transactions?role=seller',
      headers: sellerHeaders(),
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.length).toBeGreaterThanOrEqual(1);
  });

  it('should reject without auth', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/transactions/my-transactions',
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── GET /:transactionId ─────────────────────────────────────────

describe('GET /api/v1/transactions/:transactionId', () => {
  it('should return transaction for buyer', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/transactions/${transactionId}`,
      headers: buyerHeaders(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.id).toBe(transactionId);
    expect(body.data.status).toBe('in_progress');
    expect(body.data.escrowStatus).toBe('held');
    expect(body.data.quoteAmount).toBe(200);
  });

  it('should return transaction for seller', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/transactions/${transactionId}`,
      headers: sellerHeaders(),
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.id).toBe(transactionId);
  });

  // #289: the seller object must carry a non-null `userId` (+ summary fields).
  // The mobile `SellerSummary.fromJson` casts `userId` as a non-null String, so a
  // missing value crashes both transaction-detail screens. Guard against regression.
  it('should include seller.userId and summary fields', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/transactions/${transactionId}`,
      headers: buyerHeaders(),
    });

    expect(res.statusCode).toBe(200);
    const seller = res.json().data.seller;
    expect(seller).toBeTruthy();
    expect(typeof seller.userId).toBe('string');
    expect(seller.userId).toBe(sellerUserId);
    expect(seller.id).toBeTruthy();
    expect(seller).toHaveProperty('totalReviews');
    expect(seller).toHaveProperty('totalCompleted');
    expect(Array.isArray(seller.verificationBadges)).toBe(true);
    expect(seller.user).toMatchObject({
      firstName: expect.any(String),
      lastName: expect.any(String),
    });
  });
});

// ── PUT /:transactionId/status — Update Status (Seller) ─────────

describe('PUT /api/v1/transactions/:transactionId/status', () => {
  it('should update to scheduled', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/transactions/${transactionId}/status`,
      headers: sellerHeaders(),
      payload: {
        status: 'scheduled',
        scheduledDate: '2026-03-01',
        scheduledTime: '09:00 AM',
        note: 'Scheduled for next week',
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.status).toBe('scheduled');
  });

  it('should update to started', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/transactions/${transactionId}/status`,
      headers: sellerHeaders(),
      payload: { status: 'started' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.status).toBe('started');
  });

  it('should reject buyer updating status', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/transactions/${transactionId}/status`,
      headers: buyerHeaders(),
      payload: { status: 'started' },
    });
    // Buyer has no seller profile
    expect(res.statusCode).toBe(404);
  });

  it('should reject invalid transition for type', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/transactions/${transactionId}/status`,
      headers: sellerHeaders(),
      payload: { status: 'preparing_shipment' },
    });
    expect(res.statusCode).toBe(409);
  });
});

// ── POST /:transactionId/mark-complete ──────────────────────────

describe('POST /api/v1/transactions/:transactionId/mark-complete', () => {
  it('should mark complete with before and after photos', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/transactions/${transactionId}/mark-complete`,
      headers: sellerHeaders(),
      payload: {
        beforePhotos: ['https://cdn.example.com/before1.jpg'],
        afterPhotos: ['https://cdn.example.com/after1.jpg'],
        workSummary: 'Fixed the leak by replacing the P-trap and tightening connections.',
        completionNotes: 'All connections tested, no leaks found.',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.status).toBe('awaiting_approval');
    expect(body.data.beforePhotos).toHaveLength(1);
    expect(body.data.afterPhotos).toHaveLength(1);
    expect(body.data.autoReleaseAt).toBeTruthy();
  });

  it('emits transaction_marked_complete to the buyer', async () => {
    const notif = await prisma.notification.findFirst({
      where: { userId: buyerUserId, type: 'transaction_marked_complete', data: { path: ['transactionId'], equals: transactionId } },
    });
    expect(notif).not.toBeNull();
    expect(notif?.title).toBe('Work marked complete');
  });

  it('should reject buyer marking complete', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/transactions/${transactionId}/mark-complete`,
      headers: buyerHeaders(),
      payload: {
        beforePhotos: ['https://cdn.example.com/before1.jpg'],
        afterPhotos: ['https://cdn.example.com/after1.jpg'],
      },
    });
    expect(res.statusCode).toBe(404); // no seller profile
  });

  it('should reject without after photos', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/transactions/${transactionId}/mark-complete`,
      headers: sellerHeaders(),
      payload: {
        beforePhotos: ['https://cdn.example.com/before1.jpg'],
        afterPhotos: [],
      },
    });
    expect(res.statusCode).toBe(400);
  });

  // SEC-M8 (#268): before photos are required for all transaction types.
  it('should reject without before photos', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/transactions/${transactionId}/mark-complete`,
      headers: sellerHeaders(),
      payload: {
        afterPhotos: ['https://cdn.example.com/after1.jpg'],
      },
    });
    expect(res.statusCode).toBe(400);
  });
});

// ── POST /:transactionId/request-changes ────────────────────────

describe('POST /api/v1/transactions/:transactionId/request-changes', () => {
  it('should request changes (1st time)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/transactions/${transactionId}/request-changes`,
      headers: buyerHeaders(),
      payload: {
        reason: 'The faucet is still dripping slightly. Please return to tighten the connection.',
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.status).toBe('changes_requested');
  });

  it('should reject if not awaiting_approval', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/transactions/${transactionId}/request-changes`,
      headers: buyerHeaders(),
      payload: {
        reason: 'Still not working properly after the first attempt at fixing it.',
      },
    });
    expect(res.statusCode).toBe(409); // status is changes_requested, not awaiting_approval
  });
});

// ── Seller re-submits complete, buyer requests changes again, then approves ──

describe('Full approval flow', () => {
  it('seller marks complete again after changes', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/transactions/${transactionId}/mark-complete`,
      headers: sellerHeaders(),
      payload: {
        beforePhotos: ['https://cdn.example.com/before2.jpg'],
        afterPhotos: ['https://cdn.example.com/after2.jpg', 'https://cdn.example.com/after3.jpg'],
        workSummary: 'Re-tightened the connection. Leak is fully resolved now.',
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.status).toBe('awaiting_approval');
  });

  it('buyer approves and releases funds', async () => {
    // SEC-C1 (#255): approval requires a captured charge for card transactions. In production
    // `stripeChargeId` is set by the verified `payment_intent.succeeded` webhook; simulate that
    // here since the test flow never runs a real Stripe payment.
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { stripeChargeId: `ch_test_${transactionId}` },
    });

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/transactions/${transactionId}/approve`,
      headers: buyerHeaders(),
      payload: {
        note: 'Great work, thank you!',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.status).toBe('completed');
    expect(body.data.escrowStatus).toBe('released');
    expect(body.data.completedAt).toBeTruthy();
    expect(body.data.autoReleaseAt).toBeNull();
    // Newly-exposed escrow fields in the transaction response
    expect(body.data.escrowReleasedAt).toBeTruthy();
    expect(body.data.releaseReason).toBe('buyer_approved');
  });

  it('emits transaction_completed to the seller', async () => {
    const notif = await prisma.notification.findFirst({
      where: { userId: sellerUserId, type: 'transaction_completed', data: { path: ['transactionId'], equals: transactionId } },
    });
    expect(notif).not.toBeNull();
    expect(notif?.title).toBe('Payment released');
  });

  // SEC-C1 (#255): a card transaction whose charge was never captured (stripeChargeId null)
  // must not be approvable — otherwise it would be optimistically marked released/completed.
  it('rejects buyer approval when the charge was never captured', async () => {
    const sellerProfile = await prisma.sellerProfile.findFirst({ where: { user: { email: SELLER.email } } });
    const unfunded = await prisma.transaction.create({
      data: {
        postId,
        offerId,
        buyerId: buyerUserId,
        sellerId: sellerProfile!.id,
        transactionType: 'service',
        quoteAmount: 200,
        sellerPayoutAmount: 184,
        platformFee: 16,
        platformFeePercentage: 8,
        currency: 'USD',
        status: 'awaiting_approval',
        escrowStatus: 'held',
        stripePaymentIntentId: `pi_unfunded_approve_${Date.now()}`,
        stripeChargeId: null,
      },
    });

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/transactions/${unfunded.id}/approve`,
      headers: buyerHeaders(),
      payload: { note: 'approve' },
    });

    expect(res.statusCode).toBe(409);
    const after = await prisma.transaction.findUnique({ where: { id: unfunded.id } });
    expect(after?.escrowStatus).toBe('held');
    expect(after?.status).toBe('awaiting_approval');

    await prisma.transaction.delete({ where: { id: unfunded.id } });
  });

  it('should reject approve on completed transaction', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/transactions/${transactionId}/approve`,
      headers: buyerHeaders(),
      payload: {},
    });
    expect(res.statusCode).toBe(409);
  });
});

// ── Cancel Transaction (separate transaction) ───────────────────

describe('PUT /api/v1/transactions/:transactionId/cancel', () => {
  let cancelTxId: string;

  beforeAll(async () => {
    // Create a new post → offer → accept → transaction for cancel testing
    const postRes = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: buyerHeaders(),
      payload: {
        categoryId: servicesId,
        subcategoryId: plumbingId,
        title: 'Plumber needed for cancel test scenario',
        description: 'Another plumbing job for testing cancellation flow. Need faucet replacement.',
        budgetMin: 50,
        budgetMax: 200,
        budgetType: 'range',
        locationCity: 'Dallas',
        locationState: 'TX',
        urgency: 'flexible',
      },
    });
    const cancelPostId = postRes.json().data.id;

    const offerRes = await app.inject({
      method: 'POST',
      url: '/api/v1/offers',
      headers: sellerHeaders(),
      payload: {
        postId: cancelPostId,
        offerType: 'service',
        quoteAmount: 100,
        message: validMessage,
      },
    });
    const cancelOfferId = offerRes.json().data.id;

    const acceptRes = await app.inject({
      method: 'POST',
      url: `/api/v1/offers/${cancelOfferId}/accept`,
      headers: buyerHeaders(),
    });
    cancelTxId = acceptRes.json().data.transaction.id;
  });

  it('should cancel transaction as buyer', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/transactions/${cancelTxId}/cancel`,
      headers: buyerHeaders(),
      payload: {
        reason: 'Seller not responding to messages after 48 hours.',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.status).toBe('cancelled');
    expect(body.data.escrowStatus).toBe('refunded');
    expect(body.data.cancelledAt).toBeTruthy();
  });

  it('should reject cancel on already-cancelled transaction', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/transactions/${cancelTxId}/cancel`,
      headers: buyerHeaders(),
      payload: {
        reason: 'Trying to cancel again after first cancellation.',
      },
    });
    expect(res.statusCode).toBe(409);
  });

  it('should reject cancel without reason', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/transactions/${cancelTxId}/cancel`,
      headers: buyerHeaders(),
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4 coverage gap-fill — Transaction state transitions
// CONCERNS.md High-priority — RESEARCH §9 P0
// ─────────────────────────────────────────────────────────────────────────────

describe('Transaction state transitions (Phase 4 coverage gap-fill)', () => {
  // W-2: State-machine matrix is defined in:
  //   backend/src/modules/transactions/transactions.service.ts lines 21-23 (constants):
  //     SERVICE_STATUSES  = ['scheduled','on_the_way','started','awaiting_approval']  (line 21)
  //     SHIPPED_STATUSES  = ['preparing_shipment','shipped','in_transit']              (line 22)
  //     MEETUP_STATUSES   = ['pending_meetup','meetup_scheduled']                       (line 23)
  //   validateStatusTransition() at line 405 switches on transactionType and validates
  //   that the requested newStatus is in the type-specific valid set.
  // These tests assert against the same status values so a rename/refactor is caught.

  // Fresh transaction IDs for the gap-fill tests (created via the full flow to avoid FK issues)
  let freshServiceTxId: string;
  let freshShippedTxId: string;

  beforeAll(async () => {
    // Create a fresh service post + offer + accept to get an in_progress service transaction
    const freshPostRes = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: buyerHeaders(),
      payload: {
        categoryId: servicesId,
        subcategoryId: plumbingId,
        title: 'Phase 4 gap-fill service tx test',
        description: 'Gap-fill test post for state machine transition tests — plumbing repair service.',
        budgetMin: 50,
        budgetMax: 150,
        budgetType: 'range',
        locationCity: 'Dallas',
        locationState: 'TX',
        urgency: 'within_1_week',
      },
    });
    const freshPostId = freshPostRes.json().data.id;

    const freshOfferRes = await app.inject({
      method: 'POST',
      url: '/api/v1/offers',
      headers: sellerHeaders(),
      payload: {
        postId: freshPostId,
        offerType: 'service',
        quoteAmount: 100,
        pricingType: 'flat_rate',
        message: 'Gap-fill test offer for service transaction state machine tests — professional plumbing service.',
      },
    });
    const freshOfferId = freshOfferRes.json().data.id;

    const freshAcceptRes = await app.inject({
      method: 'POST',
      url: `/api/v1/offers/${freshOfferId}/accept`,
      headers: buyerHeaders(),
    });
    freshServiceTxId = freshAcceptRes.json().data.transaction.id;

    // Create a second fresh post for the shipped transaction test
    const shippedPostRes = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: buyerHeaders(),
      payload: {
        categoryId: servicesId,
        subcategoryId: plumbingId,
        title: 'Phase 4 gap-fill shipped tx test',
        description: 'Gap-fill test post for shipped product state machine transition tests.',
        budgetMin: 50,
        budgetMax: 150,
        budgetType: 'range',
        locationCity: 'Dallas',
        locationState: 'TX',
        urgency: 'within_1_week',
      },
    });
    const shippedPostId = shippedPostRes.json().data.id;

    const shippedOfferRes = await app.inject({
      method: 'POST',
      url: '/api/v1/offers',
      headers: sellerHeaders(),
      payload: {
        postId: shippedPostId,
        offerType: 'service',
        quoteAmount: 100,
        pricingType: 'flat_rate',
        message: 'Gap-fill test offer for shipped product state machine transition tests.',
      },
    });
    const shippedOfferId = shippedOfferRes.json().data.id;

    const shippedAcceptRes = await app.inject({
      method: 'POST',
      url: `/api/v1/offers/${shippedOfferId}/accept`,
      headers: buyerHeaders(),
    });
    freshShippedTxId = shippedAcceptRes.json().data.transaction.id;

    // Manually set the shipped transaction type to product_shipped for type-aware matrix test
    await prisma.transaction.update({
      where: { id: freshShippedTxId },
      data: { transactionType: 'product_shipped' },
    });
  });

  it('rejects a status invalid for service type (shipped status on service transaction)', async () => {
    // 'preparing_shipment' is only valid for product_shipped; service transaction rejects it
    // W-2: SHIPPED_STATUSES at transactions.service.ts:22; service tx uses SERVICE_STATUSES at :21
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/transactions/${freshServiceTxId}/status`,
      headers: sellerHeaders(),
      payload: { status: 'preparing_shipment' },
    });
    // ConflictError from validateStatusTransition → 409 via error handler
    expect(res.statusCode).toBe(409);
    expect(res.json().error.detail).toMatch(/preparing_shipment|Invalid status/i);
  });

  it('accepts a valid status for service type (scheduled is in SERVICE_STATUSES)', async () => {
    // 'scheduled' IS in SERVICE_STATUSES at transactions.service.ts:21
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/transactions/${freshServiceTxId}/status`,
      headers: sellerHeaders(),
      payload: { status: 'scheduled' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.status).toBe('scheduled');
  });

  it('rejects a service status on a shipped transaction (type-aware matrix)', async () => {
    // 'scheduled' is valid for service but NOT for product_shipped (SHIPPED_STATUSES:22)
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/transactions/${freshShippedTxId}/status`,
      headers: sellerHeaders(),
      payload: { status: 'scheduled' },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.detail).toMatch(/scheduled|Invalid status/i);
  });
});
