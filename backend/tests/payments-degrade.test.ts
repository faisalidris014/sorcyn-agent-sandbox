import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { prisma } from '../src/config/database.js';
import { redis } from '../src/config/redis.js';
import { env } from '../src/config/env.js';
import type { FastifyInstance } from 'fastify';
import {
  PAYMENT_QUEUED_MESSAGE,
  PAYMENT_BLOCKED_MESSAGE,
  REFUND_BLOCKED_MESSAGE,
  DEGRADE_BLOCKED_TYPE,
  DEGRADE_REFUND_TYPE,
  drainPaymentIntentQueue,
} from '../src/modules/payments/payments.degrade.js';

process.env.NODE_ENV = 'test';

// Same Stripe mock shape as payments.test.ts — the drain path calls paymentIntents.create.
vi.mock('../src/config/stripe.js', () => ({
  getStripe: () => ({
    paymentIntents: {
      create: vi.fn().mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret_abc',
        status: 'requires_payment_method',
      }),
    },
    refunds: { create: vi.fn().mockResolvedValue({ id: 're_test_123', status: 'succeeded' }) },
    accounts: { create: vi.fn().mockResolvedValue({ id: 'acct_test_new' }) },
    accountLinks: { create: vi.fn().mockResolvedValue({ url: 'https://connect.stripe.com/x' }) },
    transfers: { create: vi.fn().mockResolvedValue({ id: 'tr_test_123' }) },
  }),
  verifyWebhookSignature: vi.fn(),
}));

let app: FastifyInstance;
let buyerToken: string;
let buyerUserId: string;
let sellerToken: string;
let postId: string;
let offerId: string;
let sellerProfileId: string;

const BUYER = {
  email: 'degrade-buyer@example.com',
  password: 'TestPass123!',
  firstName: 'Deg',
  lastName: 'Buyer',
  accountType: 'buyer' as const,
  agreeToTerms: true as const,
  agreeToPrivacy: true as const,
};
const SELLER = {
  email: 'degrade-seller@example.com',
  password: 'TestPass123!',
  firstName: 'Deg',
  lastName: 'Seller',
  accountType: 'buyer' as const,
  agreeToTerms: true as const,
  agreeToPrivacy: true as const,
};

const buyerHeaders = () => ({ authorization: `Bearer ${buyerToken}` });
const sellerHeaders = () => ({ authorization: `Bearer ${sellerToken}` });

/** Create a bare transaction directly so we control type + totalCharged. */
async function makeTransaction(opts: {
  transactionType: 'service' | 'product_local_cash';
  quoteAmount: number;
  totalCharged: number;
}) {
  return prisma.transaction.create({
    data: {
      postId,
      offerId,
      buyerId: buyerUserId,
      sellerId: sellerProfileId,
      transactionType: opts.transactionType,
      quoteAmount: opts.quoteAmount,
      totalCharged: opts.totalCharged,
      currency: 'USD',
      status: 'in_progress',
    },
  });
}

async function cleanup() {
  await prisma.paymentIntentQueue.deleteMany({});
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
  await prisma.post.deleteMany({ where: { buyer: { email: BUYER.email } } });
  await prisma.sellerProfile.deleteMany({ where: { user: { email: { in: [BUYER.email, SELLER.email] } } } });
  await prisma.user.deleteMany({ where: { email: { in: [BUYER.email, SELLER.email] } } });
}

beforeAll(async () => {
  const { buildApp } = await import('../src/app.js');
  app = await buildApp();
  await app.ready();

  await cleanup();

  // Buyer
  await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: BUYER });
  await prisma.user.update({ where: { email: BUYER.email }, data: { emailVerified: true } });
  const buyerLogin = await app.inject({
    method: 'POST', url: '/api/v1/auth/login',
    payload: { email: BUYER.email, password: BUYER.password },
  });
  buyerToken = buyerLogin.json().data.tokens.accessToken;
  buyerUserId = buyerLogin.json().data.user.id;

  // Seller
  await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: SELLER });
  await prisma.user.update({ where: { email: SELLER.email }, data: { emailVerified: true } });
  const sellerLogin = await app.inject({
    method: 'POST', url: '/api/v1/auth/login',
    payload: { email: SELLER.email, password: SELLER.password },
  });
  sellerToken = sellerLogin.json().data.tokens.accessToken;

  await app.inject({
    method: 'POST', url: '/api/v1/sellers', headers: sellerHeaders(),
    payload: { businessName: 'Degrade Test Co', bio: 'We test outages thoroughly.', serviceRadiusMiles: 30 },
  });
  await prisma.sellerProfile.updateMany({
    where: { user: { email: SELLER.email } },
    data: { stripeAccountId: 'acct_test_deg', stripeChargesEnabled: true, stripePayoutsEnabled: true },
  });
  const seller = await prisma.sellerProfile.findFirst({ where: { user: { email: SELLER.email } } });
  sellerProfileId = seller!.id;

  // A post + offer to satisfy transaction FKs (reused across scenario txns).
  const servicesId = (await app.inject({ method: 'GET', url: '/api/v1/categories/services' })).json().data.id;
  const plumbingId = (await app.inject({ method: 'GET', url: '/api/v1/categories/plumbing' })).json().data.id;
  const postRes = await app.inject({
    method: 'POST', url: '/api/v1/posts', headers: buyerHeaders(),
    payload: {
      categoryId: servicesId, subcategoryId: plumbingId,
      title: 'Need plumber for degrade test',
      description: 'Degrade test post — kitchen sink leak requiring professional plumbing work.',
      budgetMin: 100, budgetMax: 700, budgetType: 'range',
      locationCity: 'Dallas', locationState: 'TX', urgency: 'within_1_week',
    },
  });
  postId = postRes.json().data.id;
  const offerRes = await app.inject({
    method: 'POST', url: '/api/v1/offers', headers: sellerHeaders(),
    payload: {
      postId, offerType: 'service', quoteAmount: 200, pricingType: 'flat_rate',
      message: 'I can help with this plumbing project — over 10 years serving the DFW metro area.',
    },
  });
  offerId = offerRes.json().data.id;
});

afterEach(async () => {
  // Always leave the flag off so unrelated state can't leak between tests.
  env.STRIPE_DEGRADED = false;
  await prisma.paymentIntentQueue.deleteMany({});
});

afterAll(async () => {
  await prisma.paymentIntentQueue.deleteMany({});
  await cleanup();
  await redis.quit();
  await prisma.$disconnect();
  await app.close();
});

// ── create-intent matrix ────────────────────────────────────────────────────

describe('POST /payments/create-intent — Stripe degrade matrix (issue #84)', () => {
  it('queues a standard (<$500) intent with 202 and does NOT charge the card', async () => {
    const tx = await makeTransaction({ transactionType: 'service', quoteAmount: 200, totalCharged: 215.5 });
    env.STRIPE_DEGRADED = true;

    const res = await app.inject({
      method: 'POST', url: '/api/v1/payments/create-intent',
      headers: buyerHeaders(), payload: { transactionId: tx.id },
    });

    expect(res.statusCode).toBe(202);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('queued');
    expect(body.data.message).toBe(PAYMENT_QUEUED_MESSAGE);

    // A queued row exists for this transaction…
    const queued = await prisma.paymentIntentQueue.findUnique({ where: { transactionId: tx.id } });
    expect(queued?.status).toBe('queued');
    expect(Number(queued?.totalCharged)).toBe(215.5);

    // …and the card was NOT charged (no payment intent created on the transaction).
    const after = await prisma.transaction.findUnique({ where: { id: tx.id } });
    expect(after?.stripePaymentIntentId).toBeNull();
  });

  it('blocks a high-value (>=$500) intent with 503 and queues nothing', async () => {
    const tx = await makeTransaction({ transactionType: 'service', quoteAmount: 600, totalCharged: 648 });
    env.STRIPE_DEGRADED = true;

    const res = await app.inject({
      method: 'POST', url: '/api/v1/payments/create-intent',
      headers: buyerHeaders(), payload: { transactionId: tx.id },
    });

    expect(res.statusCode).toBe(503);
    expect(res.json().error.detail).toBe(PAYMENT_BLOCKED_MESSAGE);
    expect(res.json().error.type).toBe(DEGRADE_BLOCKED_TYPE);

    const queued = await prisma.paymentIntentQueue.findUnique({ where: { transactionId: tx.id } });
    expect(queued).toBeNull();
  });

  it('treats exactly $500 as high-value (inclusive boundary)', async () => {
    const tx = await makeTransaction({ transactionType: 'service', quoteAmount: 460, totalCharged: 500 });
    env.STRIPE_DEGRADED = true;

    const res = await app.inject({
      method: 'POST', url: '/api/v1/payments/create-intent',
      headers: buyerHeaders(), payload: { transactionId: tx.id },
    });
    expect(res.statusCode).toBe(503);
  });

  it('leaves local-cash transactions unaffected during an outage (regression)', async () => {
    const tx = await makeTransaction({ transactionType: 'product_local_cash', quoteAmount: 100, totalCharged: 100 });
    env.STRIPE_DEGRADED = true;

    const res = await app.inject({
      method: 'POST', url: '/api/v1/payments/create-intent',
      headers: buyerHeaders(), payload: { transactionId: tx.id },
    });

    // Same behavior as outside an outage: the service rejects cash as 409, NOT
    // 503/202 — proving the degrade guard never intercepts local cash.
    expect(res.statusCode).toBe(409);
    expect(res.json().error.detail).toContain('Cash transactions');

    const queued = await prisma.paymentIntentQueue.findUnique({ where: { transactionId: tx.id } });
    expect(queued).toBeNull();
  });

  it('passes through normally when the flag is off', async () => {
    const tx = await makeTransaction({ transactionType: 'service', quoteAmount: 200, totalCharged: 215.5 });
    // flag stays false (afterEach reset)
    const res = await app.inject({
      method: 'POST', url: '/api/v1/payments/create-intent',
      headers: buyerHeaders(), payload: { transactionId: tx.id },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.paymentIntentId).toBe('pi_test_123');
  });
});

// ── refund kill switch ──────────────────────────────────────────────────────

describe('POST /payments/refund — Stripe degrade (issue #84)', () => {
  it('returns 503 for all refunds while degraded', async () => {
    const tx = await makeTransaction({ transactionType: 'service', quoteAmount: 200, totalCharged: 215.5 });
    env.STRIPE_DEGRADED = true;

    const res = await app.inject({
      method: 'POST', url: '/api/v1/payments/refund',
      headers: buyerHeaders(), payload: { transactionId: tx.id, reason: 'Outage refund attempt test' },
    });

    expect(res.statusCode).toBe(503);
    expect(res.json().error.detail).toBe(REFUND_BLOCKED_MESSAGE);
    expect(res.json().error.type).toBe(DEGRADE_REFUND_TYPE);
  });
});

// ── retry worker drain ──────────────────────────────────────────────────────

describe('drainPaymentIntentQueue — retry worker (issue #84)', () => {
  it('no-ops while STRIPE_DEGRADED is still true', async () => {
    const tx = await makeTransaction({ transactionType: 'service', quoteAmount: 200, totalCharged: 215.5 });
    env.STRIPE_DEGRADED = true;
    await app.inject({
      method: 'POST', url: '/api/v1/payments/create-intent',
      headers: buyerHeaders(), payload: { transactionId: tx.id },
    });

    const result = await drainPaymentIntentQueue();
    expect(result).toEqual({ drained: 0, failed: 0 });

    const queued = await prisma.paymentIntentQueue.findUnique({ where: { transactionId: tx.id } });
    expect(queued?.status).toBe('queued'); // untouched
  });

  it('drains queued intents once the flag clears, charging the card', async () => {
    const tx = await makeTransaction({ transactionType: 'service', quoteAmount: 200, totalCharged: 215.5 });

    // Queue it while degraded…
    env.STRIPE_DEGRADED = true;
    await app.inject({
      method: 'POST', url: '/api/v1/payments/create-intent',
      headers: buyerHeaders(), payload: { transactionId: tx.id },
    });

    // …then recover and drain.
    env.STRIPE_DEGRADED = false;
    const result = await drainPaymentIntentQueue();
    expect(result.drained).toBe(1);
    expect(result.failed).toBe(0);

    const queued = await prisma.paymentIntentQueue.findUnique({ where: { transactionId: tx.id } });
    expect(queued?.status).toBe('completed');
    expect(queued?.processedAt).not.toBeNull();

    const after = await prisma.transaction.findUnique({ where: { id: tx.id } });
    expect(after?.stripePaymentIntentId).toBe('pi_test_123');
  });
});

// ── user-facing wording rule ────────────────────────────────────────────────

describe('Stripe degrade copy — never names the processor (issue #84)', () => {
  it('all degrade messages say "our payment processor", never "Stripe"', () => {
    for (const msg of [PAYMENT_QUEUED_MESSAGE, PAYMENT_BLOCKED_MESSAGE, REFUND_BLOCKED_MESSAGE]) {
      expect(msg.toLowerCase()).not.toContain('stripe');
      expect(msg.toLowerCase()).toContain('payment processor');
    }
  });
});
