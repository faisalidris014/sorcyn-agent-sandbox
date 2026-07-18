import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '../src/config/database.js';
import type { FastifyInstance } from 'fastify';

process.env.NODE_ENV = 'test';

// Mock Stripe before any imports that use it
vi.mock('../src/config/stripe.js', () => {
  const mockPaymentIntents = {
    create: vi.fn().mockResolvedValue({
      id: 'pi_test_123',
      client_secret: 'pi_test_123_secret_abc',
      status: 'requires_payment_method',
    }),
  };
  const mockRefunds = {
    create: vi.fn().mockResolvedValue({
      id: 're_test_123',
      status: 'succeeded',
    }),
  };
  const mockAccounts = {
    create: vi.fn().mockResolvedValue({
      id: 'acct_test_new_123',
    }),
  };
  const mockAccountLinks = {
    create: vi.fn().mockResolvedValue({
      url: 'https://connect.stripe.com/setup/test_onboarding',
    }),
  };
  const mockTransfers = {
    create: vi.fn().mockResolvedValue({
      id: 'tr_test_123',
    }),
  };
  // SEC-M7 (#267): payout webhooks resolve the settled transfer ids via the
  // connected account's balance transactions. Default to an empty page; tests
  // override per-case with mockResolvedValueOnce.
  const mockBalanceTransactions = {
    list: vi.fn().mockResolvedValue({ data: [], has_more: false }),
  };

  return {
    getStripe: () => ({
      paymentIntents: mockPaymentIntents,
      refunds: mockRefunds,
      accounts: mockAccounts,
      accountLinks: mockAccountLinks,
      transfers: mockTransfers,
      balanceTransactions: mockBalanceTransactions,
    }),
    verifyWebhookSignature: vi.fn(),
  };
});

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
let sellerProfileId: string;

const BUYER = {
  email: 'paytest-buyer@example.com',
  password: 'TestPass123!',
  firstName: 'Pay',
  lastName: 'Buyer',
  accountType: 'buyer' as const,
  agreeToTerms: true as const,
  agreeToPrivacy: true as const,
};

const SELLER = {
  email: 'paytest-seller@example.com',
  password: 'TestPass123!',
  firstName: 'Pay',
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
      businessName: 'Pay Test Plumbing',
      bio: 'We fix pipes with care.',
      serviceRadiusMiles: 30,
    },
  });

  // Enable Stripe for seller
  await prisma.sellerProfile.updateMany({
    where: { user: { email: SELLER.email } },
    data: { stripeAccountId: 'acct_test_pay', stripeChargesEnabled: true, stripePayoutsEnabled: true },
  });

  const sellerProfile = await prisma.sellerProfile.findFirstOrThrow({
    where: { user: { email: SELLER.email } },
    select: { id: true },
  });
  sellerProfileId = sellerProfile.id;

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
      title: 'Need plumber for payment test',
      description: 'Payment test post - kitchen sink leak requiring professional plumbing service.',
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
    where: { email: { startsWith: 'paytest-' } },
  });
  await prisma.$disconnect();
  await app.close();
});

// ── POST /create-intent ─────────────────────────────────────────

describe('POST /api/v1/payments/create-intent', () => {
  it('should create a payment intent for a transaction', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/create-intent',
      headers: buyerHeaders(),
      payload: { transactionId },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.clientSecret).toBe('pi_test_123_secret_abc');
    expect(body.data.paymentIntentId).toBe('pi_test_123');

    // Verify transaction was updated with payment intent ID
    const tx = await prisma.transaction.findUnique({ where: { id: transactionId } });
    expect(tx?.stripePaymentIntentId).toBe('pi_test_123');
  });

  it('should reject duplicate payment intent', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/create-intent',
      headers: buyerHeaders(),
      payload: { transactionId },
    });

    expect(res.statusCode).toBe(409);
    expect(res.json().error.detail).toContain('already exists');
  });

  it('should reject if not the buyer', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/create-intent',
      headers: sellerHeaders(),
      payload: { transactionId },
    });

    expect(res.statusCode).toBe(403);
  });

  it('should reject non-existent transaction', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/create-intent',
      headers: buyerHeaders(),
      payload: { transactionId: '00000000-0000-0000-0000-000000000000' },
    });

    expect(res.statusCode).toBe(404);
  });

  it('should require authentication', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/create-intent',
      payload: { transactionId },
    });

    expect(res.statusCode).toBe(401);
  });
});

// ── POST /refund ────────────────────────────────────────────────

describe('POST /api/v1/payments/refund', () => {
  it('should refund a transaction', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/refund',
      headers: buyerHeaders(),
      payload: { transactionId, reason: 'Changed my mind about this service' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.escrowStatus).toBe('refunded');
    expect(body.data.stripeRefundId).toBe('re_test_123');

    // Verify transaction was updated
    const tx = await prisma.transaction.findUnique({ where: { id: transactionId } });
    expect(tx?.escrowStatus).toBe('refunded');
    expect(tx?.stripeRefundId).toBe('re_test_123');
    expect(tx?.status).toBe('cancelled');
  });

  it('should reject refund on already-refunded transaction', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/refund',
      headers: buyerHeaders(),
      payload: { transactionId },
    });

    expect(res.statusCode).toBe(409);
    expect(res.json().error.detail).toContain('not in held status');
  });

  it('should reject if not the buyer', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/refund',
      headers: sellerHeaders(),
      payload: { transactionId },
    });

    expect(res.statusCode).toBe(403);
  });
});

// ── POST /seller/onboard ────────────────────────────────────────

describe('POST /api/v1/payments/seller/onboard', () => {
  it('should return onboarding URL for existing Stripe account', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/seller/onboard',
      headers: sellerHeaders(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.url).toBe('https://connect.stripe.com/setup/test_onboarding');
    expect(body.data.accountId).toBe('acct_test_pay');
  });

  it('should create new account for seller without Stripe', async () => {
    // Temporarily remove stripeAccountId
    await prisma.sellerProfile.updateMany({
      where: { user: { email: SELLER.email } },
      data: { stripeAccountId: null },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/seller/onboard',
      headers: sellerHeaders(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.url).toBe('https://connect.stripe.com/setup/test_onboarding');
    expect(body.data.accountId).toBe('acct_test_new_123');

    // Verify seller profile was updated
    const seller = await prisma.sellerProfile.findFirst({
      where: { user: { email: SELLER.email } },
    });
    expect(seller?.stripeAccountId).toBe('acct_test_new_123');

    // Restore for subsequent tests
    await prisma.sellerProfile.updateMany({
      where: { user: { email: SELLER.email } },
      data: { stripeAccountId: 'acct_test_pay', stripeChargesEnabled: true, stripePayoutsEnabled: true },
    });
  });

  it('should reject non-seller', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/seller/onboard',
      headers: buyerHeaders(),
    });

    expect(res.statusCode).toBe(404);
  });
});

// ── GET /seller/status ──────────────────────────────────────────

describe('GET /api/v1/payments/seller/status', () => {
  it('should return Stripe status for onboarded seller', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/payments/seller/status',
      headers: sellerHeaders(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.onboarded).toBe(true);
    expect(body.data.chargesEnabled).toBe(true);
    expect(body.data.payoutsEnabled).toBe(true);
    expect(body.data.accountId).toBe('acct_test_pay');
  });

  it('should return not-onboarded for seller without Stripe', async () => {
    // Temporarily remove stripeAccountId
    await prisma.sellerProfile.updateMany({
      where: { user: { email: SELLER.email } },
      data: { stripeAccountId: null, stripeChargesEnabled: false, stripePayoutsEnabled: false },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/payments/seller/status',
      headers: sellerHeaders(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.onboarded).toBe(false);
    expect(body.data.chargesEnabled).toBe(false);
    expect(body.data.payoutsEnabled).toBe(false);
    expect(body.data.accountId).toBeNull();

    // Restore
    await prisma.sellerProfile.updateMany({
      where: { user: { email: SELLER.email } },
      data: { stripeAccountId: 'acct_test_pay', stripeChargesEnabled: true, stripePayoutsEnabled: true },
    });
  });

  it('should reject non-seller', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/payments/seller/status',
      headers: buyerHeaders(),
    });

    expect(res.statusCode).toBe(404);
  });
});

// ── POST /webhook ───────────────────────────────────────────────

describe('POST /api/v1/payments/webhook', () => {
  it('should reject missing stripe-signature header', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/webhook',
      payload: { type: 'payment_intent.succeeded' },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error.detail).toContain('Missing stripe-signature');
  });

  it('should reject invalid signature', async () => {
    const { verifyWebhookSignature } = await import('../src/config/stripe.js');
    (verifyWebhookSignature as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      throw new Error('Invalid signature');
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/webhook',
      headers: { 'stripe-signature': 'invalid_sig' },
      payload: { type: 'payment_intent.succeeded' },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error.detail).toContain('Invalid webhook signature');
  });

  it('should handle payment_intent.succeeded event', async () => {
    // Reset transaction to have a payment intent but escrow not yet held
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { stripePaymentIntentId: 'pi_webhook_test', escrowStatus: 'held', status: 'in_progress' },
    });

    const { verifyWebhookSignature } = await import('../src/config/stripe.js');
    (verifyWebhookSignature as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      id: `evt_pi_succeeded_${Date.now()}`,
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_webhook_test',
          metadata: { transactionId },
          latest_charge: 'ch_test_123',
        },
      },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/webhook',
      headers: { 'stripe-signature': 'valid_sig' },
      payload: {},
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().received).toBe(true);

    // Verify transaction was updated
    const tx = await prisma.transaction.findUnique({ where: { id: transactionId } });
    expect(tx?.stripeChargeId).toBe('ch_test_123');
  });

  it('should handle account.updated event', async () => {
    const { verifyWebhookSignature } = await import('../src/config/stripe.js');
    (verifyWebhookSignature as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      id: `evt_acct_updated_${Date.now()}`,
      type: 'account.updated',
      data: {
        object: {
          id: 'acct_test_pay',
          charges_enabled: true,
          payouts_enabled: true,
        },
      },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/webhook',
      headers: { 'stripe-signature': 'valid_sig' },
      payload: {},
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().received).toBe(true);
  });

  it('should handle identity.verification_session.requires_input event and create rejected VerificationRequest', async () => {
    const sessionId = `vs_test_rejected_${Date.now()}`;

    // Clean up any prior rejected requests for this seller
    await prisma.verificationRequest.deleteMany({
      where: { sellerId: sellerProfileId, status: 'rejected' },
    });

    const { verifyWebhookSignature } = await import('../src/config/stripe.js');
    (verifyWebhookSignature as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      id: `evt_identity_rejected_${Date.now()}`,
      type: 'identity.verification_session.requires_input',
      data: {
        object: {
          id: sessionId,
          metadata: { sellerProfileId },
          last_error: { reason: 'document_expired' },
        },
      },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/webhook',
      headers: { 'stripe-signature': 'valid_sig' },
      payload: {},
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().received).toBe(true);

    const request = await prisma.verificationRequest.findFirst({
      where: { sellerId: sellerProfileId, status: 'rejected' },
    });
    expect(request).not.toBeNull();
    expect(request?.rejectionReason).toBe('document_expired');

    // Cleanup
    await prisma.verificationRequest.deleteMany({ where: { id: request!.id } });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4 coverage gap-fill — Payment webhook idempotency
// CONCERNS.md High-priority — RESEARCH §9 P0
// ─────────────────────────────────────────────────────────────────────────────

describe('Payment webhook idempotency (Phase 4 coverage gap-fill)', () => {
  // SEC-H2 #257: dedup is a durable DB ledger (processed_webhook_events), not
  // Redis. The webhook route checks for an existing row BEFORE processing and
  // inserts it only AFTER the handler succeeds, so a handler failure leaves no
  // row and Stripe's retry re-runs the (idempotent) handler.

  it('processes the same payment_intent.succeeded event_id exactly once (idempotency)', async () => {
    // Use a unique event ID so this test is isolated from the suite-level webhook test
    const uniqueEventId = `evt_idem_dedup_${Date.now()}`;

    // Clear any leftover ledger row from a prior run
    await prisma.processedWebhookEvent.deleteMany({ where: { eventId: uniqueEventId } });

    const { verifyWebhookSignature } = await import('../src/config/stripe.js');

    // Reset transaction to a state the webhook can process
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { stripePaymentIntentId: 'pi_idem_test', escrowStatus: 'held', status: 'in_progress' },
    });

    const mockEvent = {
      id: uniqueEventId,
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_idem_test',
          metadata: { transactionId },
          latest_charge: 'ch_idem_test',
        },
      },
    };

    // First delivery — should process normally
    (verifyWebhookSignature as ReturnType<typeof vi.fn>).mockReturnValueOnce(mockEvent);
    const first = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/webhook',
      headers: { 'stripe-signature': 'valid_sig' },
      payload: {},
    });
    expect(first.statusCode).toBe(200);
    expect(first.json().received).toBe(true);

    // Verify the durable ledger row now exists (recorded AFTER successful handling)
    const ledgerRow = await prisma.processedWebhookEvent.findUnique({
      where: { eventId: uniqueEventId },
    });
    expect(ledgerRow).not.toBeNull();
    expect(ledgerRow?.eventType).toBe('payment_intent.succeeded');

    // Second delivery — same event_id; route finds the ledger row → skip re-processing
    (verifyWebhookSignature as ReturnType<typeof vi.fn>).mockReturnValueOnce(mockEvent);
    const second = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/webhook',
      headers: { 'stripe-signature': 'valid_sig' },
      payload: {},
    });
    expect(second.statusCode).toBe(200);
    // Stripe webhook dedup: second delivery returns 200 (not 409) but does NOT re-process
    expect(second.json().received).toBe(true);

    // Cleanup
    await prisma.processedWebhookEvent.deleteMany({ where: { eventId: uniqueEventId } });
  });

  it('pre-seeded ledger row skips re-processing — no DB write on replay', async () => {
    // SEC-H2 #257: pre-seed the ledger as if a prior delivery already processed
    // this event; the route must short-circuit before touching the transaction.
    const preExistingEventId = `evt_preseed_${Date.now()}`;
    await prisma.processedWebhookEvent.create({
      data: { eventId: preExistingEventId, eventType: 'payment_intent.succeeded' },
    });

    const { verifyWebhookSignature } = await import('../src/config/stripe.js');
    (verifyWebhookSignature as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      id: preExistingEventId,
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_preseed_test',
          metadata: { transactionId },
          latest_charge: 'ch_preseed_test',
        },
      },
    });

    // Record transaction state BEFORE replay
    const txBefore = await prisma.transaction.findUnique({ where: { id: transactionId } });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/webhook',
      headers: { 'stripe-signature': 'valid_sig' },
      payload: {},
    });

    // Should return 200 but skip all DB writes (dedup hit)
    expect(res.statusCode).toBe(200);

    // Transaction state must be UNCHANGED (no double-processing)
    const txAfter = await prisma.transaction.findUnique({ where: { id: transactionId } });
    expect(txAfter?.updatedAt).toEqual(txBefore?.updatedAt);

    // Cleanup
    await prisma.processedWebhookEvent.deleteMany({ where: { eventId: preExistingEventId } });
  });

  it('returns 500 and records NO ledger row when the handler throws (fail-closed for retry)', async () => {
    // SEC-H2 #257 core fix: a handler failure must NOT mark the event processed,
    // so Stripe's retry can re-deliver. Previously the dedup key was set before
    // handling, silently dropping the retry.
    const failEventId = `evt_handler_fail_${Date.now()}`;
    await prisma.processedWebhookEvent.deleteMany({ where: { eventId: failEventId } });

    const { verifyWebhookSignature } = await import('../src/config/stripe.js');
    const { PaymentsService } = await import('../src/modules/payments/payments.service.js');
    (verifyWebhookSignature as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      id: failEventId,
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_handler_fail', metadata: { transactionId } } },
    });

    const handlerSpy = vi
      .spyOn(PaymentsService.prototype, 'handleWebhookEvent')
      .mockRejectedValueOnce(new Error('simulated handler failure'));

    try {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/payments/webhook',
        headers: { 'stripe-signature': 'valid_sig' },
        payload: {},
      });

      // Non-2xx so Stripe retries
      expect(res.statusCode).toBe(500);

      // The event must NOT be marked processed — otherwise the retry is dropped
      const ledgerRow = await prisma.processedWebhookEvent.findUnique({
        where: { eventId: failEventId },
      });
      expect(ledgerRow).toBeNull();
    } finally {
      handlerSpy.mockRestore();
      await prisma.processedWebhookEvent.deleteMany({ where: { eventId: failEventId } });
    }
  });

  it('does not double-release escrow when refund event fires after successful release', async () => {
    // Seed a completed transaction directly with correct Prisma schema field names.
    // Required fields: postId, offerId, buyerId, sellerId, transactionType, quoteAmount.
    // Optional amount fields use schema names: totalCharged, platformFee, sellerPayoutAmount, etc.
    const sellerProfile = await prisma.sellerProfile.findFirst({ where: { user: { email: SELLER.email } } });
    const completedTxId = (await prisma.transaction.create({
      data: {
        postId,
        offerId,
        buyerId: buyerUserId,
        sellerId: sellerProfile!.id,
        transactionType: 'service',
        quoteAmount: 200,
        status: 'completed',
        escrowStatus: 'released',
        escrowReleasedAt: new Date(),
        releaseReason: 'buyer_approved',
        completedAt: new Date(),
        stripePaymentIntentId: 'pi_double_release_test',
      },
    })).id;

    // Count payouts before replay
    const payoutsBefore = await prisma.payout.count({ where: { transactionId: completedTxId } });

    // Fire a refund event for an already-completed transaction
    const { verifyWebhookSignature } = await import('../src/config/stripe.js');
    const refundEventId = `evt_refund_post_release_${Date.now()}`;
    await prisma.processedWebhookEvent.deleteMany({ where: { eventId: refundEventId } });

    (verifyWebhookSignature as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      id: refundEventId,
      type: 'charge.refunded',
      data: {
        object: {
          id: 'ch_double_release_test',
          payment_intent: 'pi_double_release_test',
          metadata: { transactionId: completedTxId },
        },
      },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/webhook',
      headers: { 'stripe-signature': 'valid_sig' },
      payload: {},
    });
    expect(res.statusCode).toBe(200);

    // Payout count must not increase (already released — no double payout)
    const payoutsAfter = await prisma.payout.count({ where: { transactionId: completedTxId } });
    expect(payoutsAfter).toBe(payoutsBefore);

    // Cleanup
    await prisma.transaction.delete({ where: { id: completedTxId } });
    await prisma.processedWebhookEvent.deleteMany({ where: { eventId: refundEventId } });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Escrow release → seller payout regression
//
// approveAndRelease (transactions.service.ts) optimistically persists
// escrowStatus='released' BEFORE calling releaseEscrow. The old guard
// `if (tx.escrowStatus !== 'held') return` then short-circuited, so
// stripe.transfers.create never ran and the seller was NEVER PAID on the normal
// buyer-approval path. The bug was invisible because approveAndRelease swallows
// releaseEscrow errors and .env.test has no STRIPE_SECRET_KEY, so the existing
// approve test stayed green. These tests drive releaseEscrow with the exact
// state approveAndRelease leaves and assert the transfer + payout fire.
// ─────────────────────────────────────────────────────────────────────────────

describe('releaseEscrow seller-payout regression (escrow guard)', () => {
  async function seedReleasableTx(escrowStatus: string): Promise<string> {
    const sellerProfile = await prisma.sellerProfile.findFirst({ where: { user: { email: SELLER.email } } });
    return (await prisma.transaction.create({
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
        status: 'completed',
        escrowStatus,
        stripePaymentIntentId: `pi_release_${escrowStatus}_${Date.now()}`,
        // A genuinely releasable transaction has a CAPTURED charge — set by the verified
        // `payment_intent.succeeded` webhook. SEC-C1 (#255) gates the seller transfer on this.
        stripeChargeId: `ch_release_${escrowStatus}_${Date.now()}`,
      },
    })).id;
  }

  async function transfersCreateMock() {
    const { getStripe } = await import('../src/config/stripe.js');
    return (getStripe() as unknown as { transfers: { create: ReturnType<typeof vi.fn> } }).transfers.create;
  }

  it('creates the Stripe transfer + payout even when escrowStatus was pre-set to released (seller-payout regression)', async () => {
    const create = await transfersCreateMock();
    create.mockClear();
    const txId = await seedReleasableTx('released'); // the exact state approveAndRelease leaves behind

    const { PaymentsService } = await import('../src/modules/payments/payments.service.js');
    await new PaymentsService().releaseEscrow(txId);

    expect(create).toHaveBeenCalledTimes(1);
    const payout = await prisma.payout.findFirst({ where: { transactionId: txId } });
    expect(payout).not.toBeNull();
    expect(payout?.stripeTransferId).toBe('tr_test_123');

    await prisma.payout.deleteMany({ where: { transactionId: txId } });
    await prisma.transaction.delete({ where: { id: txId } });
  });

  it('is idempotent — skips the transfer when a payout already exists', async () => {
    const txId = await seedReleasableTx('released');
    const sellerProfile = await prisma.sellerProfile.findFirst({ where: { user: { email: SELLER.email } } });
    await prisma.payout.create({
      data: {
        transactionId: txId,
        sellerId: sellerProfile!.id,
        grossAmount: 200,
        platformFee: 16,
        platformFeePercentage: 8,
        netPayout: 184,
        currency: 'USD',
        stripeTransferId: 'tr_already_done',
        status: 'pending',
      },
    });
    const create = await transfersCreateMock();
    create.mockClear();

    const { PaymentsService } = await import('../src/modules/payments/payments.service.js');
    await new PaymentsService().releaseEscrow(txId);

    expect(create).not.toHaveBeenCalled();

    await prisma.payout.deleteMany({ where: { transactionId: txId } });
    await prisma.transaction.delete({ where: { id: txId } });
  });

  it('never transfers to the seller when escrow was refunded', async () => {
    const txId = await seedReleasableTx('refunded');
    const create = await transfersCreateMock();
    create.mockClear();

    const { PaymentsService } = await import('../src/modules/payments/payments.service.js');
    await new PaymentsService().releaseEscrow(txId);

    expect(create).not.toHaveBeenCalled();
    const payout = await prisma.payout.findFirst({ where: { transactionId: txId } });
    expect(payout).toBeNull();

    await prisma.transaction.delete({ where: { id: txId } });
  });

  // SEC-C1 (#255): the PaymentIntent id is stored at intent-CREATION, before the buyer pays.
  // A transaction whose intent was created but whose charge never succeeded has
  // stripePaymentIntentId set but stripeChargeId null. releaseEscrow must NOT transfer
  // platform funds to the seller for money that was never collected.
  it('never transfers when the charge was never captured (stripeChargeId null) — unfunded escrow', async () => {
    const sellerProfile = await prisma.sellerProfile.findFirst({ where: { user: { email: SELLER.email } } });
    const txId = (await prisma.transaction.create({
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
        escrowStatus: 'held', // born 'held' at offer-acceptance — does NOT prove funding
        stripePaymentIntentId: `pi_unfunded_${Date.now()}`,
        stripeChargeId: null, // intent created, buyer abandoned/declined — never captured
      },
    })).id;

    const create = await transfersCreateMock();
    create.mockClear();

    const { PaymentsService } = await import('../src/modules/payments/payments.service.js');
    await new PaymentsService().releaseEscrow(txId);

    expect(create).not.toHaveBeenCalled();
    const payout = await prisma.payout.findFirst({ where: { transactionId: txId } });
    expect(payout).toBeNull();

    await prisma.transaction.delete({ where: { id: txId } });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SEC-M1 (#261): refund/release race → buyer refunded AND seller paid (double-spend)
//
// `processRefund` guarded on escrowStatus==='held'; `approveAndRelease`/auto-release guarded on
// the payout record's absence — DISJOINT guards with a TOCTOU window. Firing refund and approve
// near-simultaneously let BOTH pass: the buyer's charge was refunded AND the seller was paid from
// the platform balance. The fix makes the escrow `held`→terminal transition a single atomic
// compare-and-swap, so refund and release are mutually exclusive — whichever flips out of 'held'
// first wins and the loser aborts before touching Stripe.
//
// A double-spend is proven by `stripeRefundId` (buyer refunded) AND a payout row (seller paid)
// both existing for the same transaction. The invariant: that must NEVER happen.
// ─────────────────────────────────────────────────────────────────────────────

describe('refund/release mutual exclusion (SEC-M1 #261)', () => {
  async function seedHeldFundedTx(): Promise<string> {
    const sellerProfile = await prisma.sellerProfile.findFirst({ where: { user: { email: SELLER.email } } });
    const stamp = `${Date.now()}_${Math.round(performance.now() * 1000)}`;
    return (await prisma.transaction.create({
      data: {
        postId,
        offerId,
        buyerId: buyerUserId,
        sellerId: sellerProfile!.id,
        transactionType: 'service',
        quoteAmount: 200,
        totalCharged: 210,
        sellerPayoutAmount: 184,
        platformFee: 16,
        platformFeePercentage: 8,
        currency: 'USD',
        status: 'awaiting_approval', // approvable by the buyer
        escrowStatus: 'held',
        stripePaymentIntentId: `pi_race_${stamp}`,
        stripeChargeId: `ch_race_${stamp}`, // funded — SEC-C1 (#255) gate satisfied
      },
    })).id;
  }

  async function cleanup(txId: string) {
    await prisma.payout.deleteMany({ where: { transactionId: txId } });
    await prisma.transaction.delete({ where: { id: txId } }).catch(() => {});
  }

  it('never refunds the buyer AND pays the seller when refund + approve fire concurrently', async () => {
    const txId = await seedHeldFundedTx();
    const { PaymentsService } = await import('../src/modules/payments/payments.service.js');
    const { TransactionsService } = await import('../src/modules/transactions/transactions.service.js');

    // Fire both money paths at once. The escrow CAS serializes them at the DB row level.
    const [refundRes, approveRes] = await Promise.allSettled([
      new PaymentsService().processRefund(buyerUserId, { transactionId: txId }),
      new TransactionsService().approveAndRelease(buyerUserId, txId, {}),
    ]);

    // Exactly one of the two must have won; the other must have been rejected.
    const refundWon = refundRes.status === 'fulfilled';
    const approveWon = approveRes.status === 'fulfilled';
    expect(refundWon !== approveWon).toBe(true); // XOR — never both, never neither

    const tx = await prisma.transaction.findUnique({ where: { id: txId } });
    const payout = await prisma.payout.findFirst({ where: { transactionId: txId } });

    // The double-spend invariant: buyer-refunded AND seller-paid must never coexist.
    const buyerRefunded = !!tx?.stripeRefundId;
    const sellerPaid = !!payout;
    expect(buyerRefunded && sellerPaid).toBe(false);

    // And the terminal escrow state must match exactly the path that won.
    if (refundWon) {
      expect(tx?.escrowStatus).toBe('refunded');
      expect(sellerPaid).toBe(false);
    } else {
      expect(tx?.escrowStatus).toBe('released');
      expect(buyerRefunded).toBe(false);
    }

    await cleanup(txId);
  });

  it('rejects approve+release after the escrow was already refunded (no seller transfer)', async () => {
    const txId = await seedHeldFundedTx();
    const { PaymentsService } = await import('../src/modules/payments/payments.service.js');
    const { TransactionsService } = await import('../src/modules/transactions/transactions.service.js');
    const transfersCreate = (await import('../src/config/stripe.js')).getStripe().transfers.create as ReturnType<typeof vi.fn>;

    await new PaymentsService().processRefund(buyerUserId, { transactionId: txId });
    transfersCreate.mockClear();

    // Rejected by whichever guard trips first — the status guard (refund set status='cancelled')
    // or the escrow guard. Either way the seller must never be paid.
    await expect(
      new TransactionsService().approveAndRelease(buyerUserId, txId, {}),
    ).rejects.toThrow(/awaiting approval|no longer held|refunded|cancelled/i);

    expect(transfersCreate).not.toHaveBeenCalled();
    const payout = await prisma.payout.findFirst({ where: { transactionId: txId } });
    expect(payout).toBeNull();
    const tx = await prisma.transaction.findUnique({ where: { id: txId } });
    expect(tx?.escrowStatus).toBe('refunded');

    await cleanup(txId);
  });

  it('rejects refund after the escrow was already released (buyer not double-refunded)', async () => {
    const txId = await seedHeldFundedTx();
    const { PaymentsService } = await import('../src/modules/payments/payments.service.js');
    const { TransactionsService } = await import('../src/modules/transactions/transactions.service.js');

    await new TransactionsService().approveAndRelease(buyerUserId, txId, {});

    await expect(
      new PaymentsService().processRefund(buyerUserId, { transactionId: txId }),
    ).rejects.toThrow(/not in held status/i);

    const tx = await prisma.transaction.findUnique({ where: { id: txId } });
    expect(tx?.escrowStatus).toBe('released');
    expect(tx?.stripeRefundId).toBeNull();

    await cleanup(txId);
  });
});

// ─────────────────────────────────────────────────────────────────
// SEC-M7 (#267): payout webhook handlers must correlate a connected-account
// payout to the EXACT Payout record(s) it settles — via the underlying transfer
// linkage — instead of mutating the "oldest in_transit" payout for the seller.
// Under concurrent payouts the oldest-heuristic mislabeled bank arrival/failure
// and the wrong bankAccountLast4 onto an unrelated record.
// ─────────────────────────────────────────────────────────────────
describe('payout webhook correlation (SEC-M7 #267)', () => {
  async function balanceTxnList() {
    const { getStripe } = await import('../src/config/stripe.js');
    return (getStripe() as unknown as {
      balanceTransactions: { list: ReturnType<typeof vi.fn> };
    }).balanceTransactions.list;
  }

  // A connected-account payout settles a set of balance transactions; each one
  // that came from a platform transfer carries `source_transfer` = our transfer id.
  function btPage(transferIds: string[], hasMore = false) {
    return {
      data: transferIds.map((tid, i) => ({
        id: `btxn_${tid}_${i}`,
        source: { source_transfer: tid },
      })),
      has_more: hasMore,
    };
  }

  function payoutEvent(
    type: 'payout.paid' | 'payout.failed',
    payoutId: string,
    extra: Record<string, unknown> = {},
  ) {
    return {
      id: `evt_${payoutId}`,
      type,
      account: 'acct_test_pay',
      data: {
        object: {
          id: payoutId,
          object: 'payout',
          failure_message: null,
          destination: { last4: '4242', bank_name: 'Test Bank' },
          ...extra,
        },
      },
    } as any;
  }

  async function mkTx(): Promise<string> {
    return (
      await prisma.transaction.create({
        data: {
          postId,
          offerId,
          buyerId: buyerUserId,
          sellerId: sellerProfileId,
          transactionType: 'service',
          quoteAmount: 200,
          sellerPayoutAmount: 184,
          platformFee: 16,
          platformFeePercentage: 8,
          currency: 'USD',
          status: 'completed',
          escrowStatus: 'released',
        },
      })
    ).id;
  }

  async function seedInTransitPayout(transferId: string): Promise<string> {
    const txId = await mkTx();
    return (
      await prisma.payout.create({
        data: {
          transactionId: txId,
          sellerId: sellerProfileId,
          grossAmount: 200,
          platformFee: 16,
          platformFeePercentage: 8,
          netPayout: 184,
          currency: 'USD',
          stripeTransferId: transferId,
          status: 'in_transit',
        },
      })
    ).id;
  }

  // Per-test isolation: the Stripe mock is module-level, so reset call history +
  // the queued one-shot responses before each case. Tear down any payout/transaction
  // rows this seller accumulated so the shared afterAll FK cleanup stays green even
  // if an assertion throws mid-test.
  beforeEach(async () => {
    const list = await balanceTxnList();
    list.mockReset();
    list.mockResolvedValue({ data: [], has_more: false });
  });

  afterEach(async () => {
    const rows = await prisma.payout.findMany({
      where: { sellerId: sellerProfileId },
      select: { id: true, transactionId: true },
    });
    await prisma.payout.deleteMany({ where: { sellerId: sellerProfileId } });
    for (const r of rows) {
      await prisma.transaction.delete({ where: { id: r.transactionId } }).catch(() => {});
    }
  });

  it('marks the ACTUAL payout paid, not the oldest in_transit one', async () => {
    // A is older, B is newer — both in_transit for the same seller.
    const oldId = await seedInTransitPayout('tr_OLD_267');
    const newId = await seedInTransitPayout('tr_NEW_267');

    const list = await balanceTxnList();
    list.mockResolvedValueOnce(btPage(['tr_NEW_267'])); // this bank payout settled B

    const { PaymentsService } = await import('../src/modules/payments/payments.service.js');
    await new PaymentsService().handleWebhookEvent(
      payoutEvent('payout.paid', 'po_actual_267'),
    );

    const oldP = await prisma.payout.findUnique({ where: { id: oldId } });
    const newP = await prisma.payout.findUnique({ where: { id: newId } });

    // The newer (actual) payout is the one marked paid — the bug would have hit the older one.
    expect(newP?.status).toBe('paid');
    expect(newP?.stripePayoutId).toBe('po_actual_267');
    expect(newP?.bankAccountLast4).toBe('4242');
    expect(newP?.paidAt).not.toBeNull();

    // The unrelated older payout is untouched.
    expect(oldP?.status).toBe('in_transit');
    expect(oldP?.stripePayoutId).toBeNull();

    // The connected account was scoped on the balance-transaction lookup.
    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({ payout: 'po_actual_267' }),
      expect.objectContaining({ stripeAccount: 'acct_test_pay' }),
    );

  });

  it('marks ALL transfers a single bank payout bundles as paid', async () => {
    const xId = await seedInTransitPayout('tr_BUNDLE_X');
    const yId = await seedInTransitPayout('tr_BUNDLE_Y');
    const zId = await seedInTransitPayout('tr_BUNDLE_Z'); // not in this payout

    const list = await balanceTxnList();
    list.mockResolvedValueOnce(btPage(['tr_BUNDLE_X', 'tr_BUNDLE_Y']));

    const { PaymentsService } = await import('../src/modules/payments/payments.service.js');
    await new PaymentsService().handleWebhookEvent(
      payoutEvent('payout.paid', 'po_bundle_267'),
    );

    const x = await prisma.payout.findUnique({ where: { id: xId } });
    const y = await prisma.payout.findUnique({ where: { id: yId } });
    const z = await prisma.payout.findUnique({ where: { id: zId } });

    expect(x?.status).toBe('paid');
    expect(y?.status).toBe('paid');
    expect(x?.stripePayoutId).toBe('po_bundle_267');
    expect(y?.stripePayoutId).toBe('po_bundle_267');
    expect(z?.status).toBe('in_transit'); // not part of the deposit

  });

  it('paginates balance transactions to resolve every transfer', async () => {
    const aId = await seedInTransitPayout('tr_PAGE_A');
    const bId = await seedInTransitPayout('tr_PAGE_B');

    const list = await balanceTxnList();
    list
      .mockResolvedValueOnce(btPage(['tr_PAGE_A'], true)) // page 1, has_more
      .mockResolvedValueOnce(btPage(['tr_PAGE_B'], false)); // page 2

    const { PaymentsService } = await import('../src/modules/payments/payments.service.js');
    await new PaymentsService().handleWebhookEvent(
      payoutEvent('payout.paid', 'po_paged_267'),
    );

    const a = await prisma.payout.findUnique({ where: { id: aId } });
    const b = await prisma.payout.findUnique({ where: { id: bId } });
    expect(a?.status).toBe('paid');
    expect(b?.status).toBe('paid');
    expect(list).toHaveBeenCalledTimes(2);
    // second page requested with starting_after = last id of page 1
    expect(list).toHaveBeenLastCalledWith(
      expect.objectContaining({ starting_after: 'btxn_tr_PAGE_A_0' }),
      expect.objectContaining({ stripeAccount: 'acct_test_pay' }),
    );

  });

  it('marks the ACTUAL payout failed, not the oldest in_transit one', async () => {
    const oldId = await seedInTransitPayout('tr_FAIL_OLD');
    const newId = await seedInTransitPayout('tr_FAIL_NEW');

    const list = await balanceTxnList();
    list.mockResolvedValueOnce(btPage(['tr_FAIL_NEW']));

    const { PaymentsService } = await import('../src/modules/payments/payments.service.js');
    await new PaymentsService().handleWebhookEvent(
      payoutEvent('payout.failed', 'po_failed_267', {
        failure_message: 'account_closed',
      }),
    );

    const oldP = await prisma.payout.findUnique({ where: { id: oldId } });
    const newP = await prisma.payout.findUnique({ where: { id: newId } });

    expect(newP?.status).toBe('failed');
    expect(newP?.failureReason).toBe('account_closed');
    expect(newP?.stripePayoutId).toBe('po_failed_267');
    expect(newP?.failedAt).not.toBeNull();
    expect(oldP?.status).toBe('in_transit');

  });

  it('is idempotent on replay — does not re-resolve or touch a second record', async () => {
    const firstId = await seedInTransitPayout('tr_REPLAY_1');

    const list = await balanceTxnList();
    list.mockResolvedValueOnce(btPage(['tr_REPLAY_1']));

    const { PaymentsService } = await import('../src/modules/payments/payments.service.js');
    await new PaymentsService().handleWebhookEvent(
      payoutEvent('payout.paid', 'po_replay_267'),
    );
    expect((await prisma.payout.findUnique({ where: { id: firstId } }))?.status).toBe('paid');

    // A second in_transit payout exists when the duplicate event is re-delivered.
    const secondId = await seedInTransitPayout('tr_REPLAY_2');
    list.mockClear();

    await new PaymentsService().handleWebhookEvent(
      payoutEvent('payout.paid', 'po_replay_267'),
    );

    // The replay short-circuits on the recorded stripePayoutId: no Stripe lookup,
    // and the unrelated second payout is left in_transit.
    expect(list).not.toHaveBeenCalled();
    expect((await prisma.payout.findUnique({ where: { id: secondId } }))?.status).toBe(
      'in_transit',
    );

  });

  it('no-ops when no transfer matches — never falls back to oldest in_transit', async () => {
    const orphanId = await seedInTransitPayout('tr_ORPHAN_267');

    const list = await balanceTxnList();
    list.mockResolvedValueOnce(btPage(['tr_SOMEONE_ELSE'])); // unknown transfer

    const { PaymentsService } = await import('../src/modules/payments/payments.service.js');
    await new PaymentsService().handleWebhookEvent(
      payoutEvent('payout.paid', 'po_orphan_267'),
    );

    // The seller's only in_transit payout is left untouched (the bug would have paid it).
    const orphan = await prisma.payout.findUnique({ where: { id: orphanId } });
    expect(orphan?.status).toBe('in_transit');
    expect(orphan?.stripePayoutId).toBeNull();

  });
});
