/**
 * Phase 4 B-2 — E2E tier coverage file.
 *
 * Tier classification: tests/e2e/ → tests that exercise the FULL transaction loop
 * end-to-end: post → offer → accept → escrow → completion → review.
 * These are the highest-value tests that validate the entire buyer/seller flow.
 *
 * Coverage threshold for this tier: lines ≥ 40% (B-2 enforcement).
 *
 * This file tests the core reverse-marketplace flow that justifies the platform.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { prisma } from '../../src/config/database.js';
import type { FastifyInstance } from 'fastify';

process.env.NODE_ENV = 'test';

// Mock Stripe for E2E — we don't want real charges in E2E tests
vi.mock('../../src/config/stripe.js', () => ({
  getStripe: () => ({
    paymentIntents: {
      create: vi.fn().mockResolvedValue({
        id: 'pi_e2e_test',
        client_secret: 'pi_e2e_test_secret',
        status: 'requires_payment_method',
      }),
    },
    refunds: { create: vi.fn().mockResolvedValue({ id: 're2e_test', status: 'succeeded' }) },
    accounts: { create: vi.fn().mockResolvedValue({ id: 'acct_e2e_test' }) },
    accountLinks: { create: vi.fn().mockResolvedValue({ url: 'https://connect.stripe.com/e2e' }) },
    transfers: { create: vi.fn().mockResolvedValue({ id: 'tr_e2e_test' }) },
  }),
  verifyWebhookSignature: vi.fn(),
}));

let app: FastifyInstance;
let buyerToken: string;
let buyerUserId: string;
let sellerToken: string;
let servicesId: string;
let plumbingId: string;

const E2E_BUYER = `e2e_buyer_${Date.now()}@example.com`;
const E2E_SELLER = `e2e_seller_${Date.now()}@example.com`;
const PASSWORD = 'E2ETestPass!2026';

beforeAll(async () => {
  const { buildApp } = await import('../../src/app.js');
  app = await buildApp();
  await app.ready();

  // Register buyer
  await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: {
      email: E2E_BUYER, password: PASSWORD,
      firstName: 'E2E', lastName: 'Buyer',
      accountType: 'buyer', agreeToTerms: true, agreeToPrivacy: true,
    },
  });
  await prisma.user.update({ where: { email: E2E_BUYER }, data: { emailVerified: true } });
  const buyerLogin = await app.inject({
    method: 'POST', url: '/api/v1/auth/login',
    payload: { email: E2E_BUYER, password: PASSWORD },
  });
  buyerToken = buyerLogin.json().data.tokens.accessToken;
  buyerUserId = buyerLogin.json().data.user.id;

  // Register seller
  await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: {
      email: E2E_SELLER, password: PASSWORD,
      firstName: 'E2E', lastName: 'Seller',
      accountType: 'buyer', agreeToTerms: true, agreeToPrivacy: true,
    },
  });
  await prisma.user.update({ where: { email: E2E_SELLER }, data: { emailVerified: true } });
  const sellerLogin = await app.inject({
    method: 'POST', url: '/api/v1/auth/login',
    payload: { email: E2E_SELLER, password: PASSWORD },
  });
  sellerToken = sellerLogin.json().data.tokens.accessToken;

  // Create seller profile + enable Stripe
  await app.inject({
    method: 'POST', url: '/api/v1/sellers',
    headers: { authorization: `Bearer ${sellerToken}` },
    payload: { businessName: 'E2E Plumbing Co', bio: 'E2E test seller.', serviceRadiusMiles: 30 },
  });
  await prisma.sellerProfile.updateMany({
    where: { user: { email: E2E_SELLER } },
    data: { stripeAccountId: 'acct_e2e_test', stripeChargesEnabled: true, stripePayoutsEnabled: true },
  });

  // Get category IDs
  const svcRes = await app.inject({ method: 'GET', url: '/api/v1/categories/services' });
  servicesId = svcRes.json().data.id;
  const plumbRes = await app.inject({ method: 'GET', url: '/api/v1/categories/plumbing' });
  plumbingId = plumbRes.json().data.id;
});

afterAll(async () => {
  // Delete in FK order
  await prisma.transaction.deleteMany({ where: { buyer: { email: E2E_BUYER } } });
  await prisma.offer.deleteMany({ where: { post: { buyer: { email: E2E_BUYER } } } });
  await prisma.post.deleteMany({ where: { buyer: { email: E2E_BUYER } } });
  await prisma.sellerProfile.deleteMany({ where: { user: { email: { in: [E2E_BUYER, E2E_SELLER] } } } });
  await prisma.user.deleteMany({ where: { email: { in: [E2E_BUYER, E2E_SELLER] } } });
  await prisma.$disconnect();
  await app.close();
});

describe('E2E: Full reverse-marketplace flow — post → offer → accept → payment', () => {
  it('buyer creates a post successfully', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: { authorization: `Bearer ${buyerToken}` },
      payload: {
        categoryId: servicesId,
        subcategoryId: plumbingId,
        title: 'E2E need plumber test',
        description: 'E2E test post for full transaction flow — plumbing leak repair.',
        budgetMin: 100, budgetMax: 300, budgetType: 'range',
        locationCity: 'Dallas', locationState: 'TX',
        urgency: 'within_1_week',
      },
    });
    expect(res.statusCode).toBe(201);
    const post = res.json().data;
    expect(post.id).toBeTruthy();
    expect(post.title).toBe('E2E need plumber test');
    expect(post.status).toBe('active');

    // Seller submits offer
    const offerRes = await app.inject({
      method: 'POST', url: '/api/v1/offers',
      headers: { authorization: `Bearer ${sellerToken}` },
      payload: {
        postId: post.id,
        offerType: 'service',
        quoteAmount: 200,
        pricingType: 'flat_rate',
        message: 'I can fix your plumbing issue same day. Licensed and insured with 10 years DFW experience.',
      },
    });
    expect(offerRes.statusCode).toBe(201);
    const offer = offerRes.json().data;
    expect(offer.id).toBeTruthy();
    expect(offer.status).toBe('pending');

    // Buyer accepts offer → creates transaction
    const acceptRes = await app.inject({
      method: 'POST',
      url: `/api/v1/offers/${offer.id}/accept`,
      headers: { authorization: `Bearer ${buyerToken}` },
    });
    expect(acceptRes.statusCode).toBe(201);
    const transaction = acceptRes.json().data.transaction;
    expect(transaction.id).toBeTruthy();
    expect(transaction.status).toBe('in_progress');

    // Payment intent creation
    const paymentRes = await app.inject({
      method: 'POST', url: '/api/v1/payments/create-intent',
      headers: { authorization: `Bearer ${buyerToken}` },
      payload: { transactionId: transaction.id },
    });
    expect(paymentRes.statusCode).toBe(201);
    const paymentData = paymentRes.json().data;
    expect(paymentData.clientSecret).toBeTruthy();
    expect(paymentData.paymentIntentId).toBe('pi_e2e_test');
  });

  it('buyer can list their transactions', async () => {
    // transactions route: reply.send({ success: true, data: result.transactions, meta: result.meta })
    // → body.data is the array directly; body.meta has pagination
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/transactions/my-transactions?role=buyer',
      headers: { authorization: `Bearer ${buyerToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data).toBeInstanceOf(Array);
    expect(body.meta.total).toBeGreaterThanOrEqual(1);
  });

  it('seller can list their transactions', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/transactions/my-transactions?role=seller',
      headers: { authorization: `Bearer ${sellerToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data).toBeInstanceOf(Array);
  });
});
