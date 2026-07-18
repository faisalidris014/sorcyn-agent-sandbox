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
let transactionId: string;
let transactionId2: string;
let reviewId: string;

const BUYER = {
  email: 'revtest-buyer@example.com',
  password: 'TestPass123!',
  firstName: 'Rev',
  lastName: 'Buyer',
  accountType: 'buyer' as const,
  agreeToTerms: true as const,
  agreeToPrivacy: true as const,
};

const SELLER = {
  email: 'revtest-seller@example.com',
  password: 'TestPass123!',
  firstName: 'Rev',
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

  // Clean up in correct order
  await prisma.review.deleteMany({
    where: { buyer: { email: BUYER.email } },
  });
  await prisma.message.deleteMany({
    where: { conversation: { participant1: { email: { in: [BUYER.email, SELLER.email] } } } },
  });
  await prisma.notification.deleteMany({
    where: { user: { email: { in: [BUYER.email, SELLER.email] } } },
  });
  await prisma.conversation.deleteMany({
    where: { participant1: { email: { in: [BUYER.email, SELLER.email] } } },
  });
  await prisma.transaction.deleteMany({
    where: { buyer: { email: BUYER.email } },
  });
  await prisma.offer.deleteMany({
    where: { post: { buyer: { email: BUYER.email } } },
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
      businessName: 'Rev Test Plumbing',
      bio: 'We fix pipes with care.',
      serviceRadiusMiles: 30,
    },
  });

  const sellerProfile = await prisma.sellerProfile.findFirst({
    where: { user: { email: SELLER.email } },
  });
  sellerId = sellerProfile!.id;

  // Enable Stripe for seller
  await prisma.sellerProfile.update({
    where: { id: sellerId },
    data: { stripeAccountId: 'acct_test_rev', stripeChargesEnabled: true, stripePayoutsEnabled: true },
  });

  // Get category IDs
  const servicesRes = await app.inject({ method: 'GET', url: '/api/v1/categories/services' });
  const servicesId = servicesRes.json().data.id;
  const plumbingRes = await app.inject({ method: 'GET', url: '/api/v1/categories/plumbing' });
  const plumbingId = plumbingRes.json().data.id;

  // Create 2 posts → 2 offers → accept both → mark complete → approve both → 2 completed transactions
  for (let i = 1; i <= 2; i++) {
    const postRes = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: buyerHeaders(),
      payload: {
        categoryId: servicesId,
        subcategoryId: plumbingId,
        title: `Need plumber for review test ${i}`,
        description: `Review test post ${i} - kitchen sink leak requiring professional plumbing service.`,
        budgetMin: 100,
        budgetMax: 300,
        budgetType: 'range',
        locationCity: 'Dallas',
        locationState: 'TX',
        urgency: 'within_1_week',
      },
    });
    const pId = postRes.json().data.id;

    const offerRes = await app.inject({
      method: 'POST',
      url: '/api/v1/offers',
      headers: sellerHeaders(),
      payload: {
        postId: pId,
        offerType: 'service',
        quoteAmount: 200,
        pricingType: 'flat_rate',
        message: validMessage,
      },
    });
    const oId = offerRes.json().data.id;

    const acceptRes = await app.inject({
      method: 'POST',
      url: `/api/v1/offers/${oId}/accept`,
      headers: buyerHeaders(),
    });
    const txId = acceptRes.json().data.transaction.id;

    if (i === 1) transactionId = txId;
    else transactionId2 = txId;

    // Mark complete (seller)
    await app.inject({
      method: 'POST',
      url: `/api/v1/transactions/${txId}/mark-complete`,
      headers: sellerHeaders(),
      payload: {
        beforePhotos: ['https://example.com/before.jpg'],
        afterPhotos: ['https://example.com/after.jpg'],
        note: 'Work completed',
      },
    });

    // SEC-C1 (#255): approval requires a captured charge for card transactions. In production
    // `stripeChargeId` is set by the verified `payment_intent.succeeded` webhook; simulate it
    // here since this setup never runs a real Stripe payment.
    await prisma.transaction.update({
      where: { id: txId },
      data: { stripeChargeId: `ch_test_${txId}` },
    });

    // Approve (buyer)
    await app.inject({
      method: 'POST',
      url: `/api/v1/transactions/${txId}/approve`,
      headers: buyerHeaders(),
      payload: { note: 'Looks great!' },
    });
  }
});

afterAll(async () => {
  await prisma.review.deleteMany({
    where: { buyer: { email: BUYER.email } },
  });
  await prisma.message.deleteMany({
    where: { conversation: { participant1: { email: { in: [BUYER.email, SELLER.email] } } } },
  });
  await prisma.notification.deleteMany({
    where: { user: { email: { in: [BUYER.email, SELLER.email] } } },
  });
  await prisma.conversation.deleteMany({
    where: { participant1: { email: { in: [BUYER.email, SELLER.email] } } },
  });
  await prisma.transaction.deleteMany({
    where: { buyer: { email: BUYER.email } },
  });
  await prisma.offer.deleteMany({
    where: { post: { buyer: { email: BUYER.email } } },
  });
  await prisma.post.deleteMany({
    where: { buyer: { email: BUYER.email } },
  });
  await prisma.sellerProfile.deleteMany({
    where: { user: { email: { in: [BUYER.email, SELLER.email] } } },
  });
  await prisma.user.deleteMany({
    where: { email: { startsWith: 'revtest-' } },
  });
  await prisma.$disconnect();
  await app.close();
});

// ── POST /reviews ─────────────────────────────────────────────

describe('POST /api/v1/reviews', () => {
  it('should submit a review successfully', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/reviews',
      headers: buyerHeaders(),
      payload: {
        transactionId,
        overallRating: 5,
        categoryRatings: {
          quality: 5,
          communication: 5,
          timeliness: 4,
          professionalism: 5,
          value: 5,
        },
        writtenReview: 'Excellent plumber! Fixed the leak quickly and cleaned up.',
        wouldRecommend: true,
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.overallRating).toBe(5);
    expect(body.data.transactionId).toBe(transactionId);
    reviewId = body.data.id;
  });

  it('should update seller averageRating and totalReviews', async () => {
    const seller = await prisma.sellerProfile.findUnique({ where: { id: sellerId } });
    expect(seller!.totalReviews).toBe(1);
    expect(Number(seller!.rating)).toBe(5);
  });

  it('should reject duplicate review on same transaction', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/reviews',
      headers: buyerHeaders(),
      payload: {
        transactionId,
        overallRating: 4,
        wouldRecommend: true,
      },
    });
    expect(res.statusCode).toBe(409);
  });

  it('should reject non-buyer review', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/reviews',
      headers: sellerHeaders(),
      payload: {
        transactionId: transactionId2,
        overallRating: 5,
        wouldRecommend: true,
      },
    });
    expect(res.statusCode).toBe(403);
  });

  it('should validate rating range', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/reviews',
      headers: buyerHeaders(),
      payload: {
        transactionId: transactionId2,
        overallRating: 6,
        wouldRecommend: true,
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it('should validate writtenReview min length', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/reviews',
      headers: buyerHeaders(),
      payload: {
        transactionId: transactionId2,
        overallRating: 4,
        writtenReview: 'Short',
        wouldRecommend: true,
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it('should submit second review and update average', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/reviews',
      headers: buyerHeaders(),
      payload: {
        transactionId: transactionId2,
        overallRating: 4,
        categoryRatings: { quality: 4, communication: 4 },
        writtenReview: 'Good work but took a bit longer than expected.',
        wouldRecommend: true,
      },
    });

    expect(res.statusCode).toBe(201);

    // Verify updated stats
    const seller = await prisma.sellerProfile.findUnique({ where: { id: sellerId } });
    expect(seller!.totalReviews).toBe(2);
    expect(Number(seller!.rating)).toBe(4.5);
    // 2 reviews with avg 4.5 → "good" badge (needs 3+ for "highly_rated")
    expect(seller!.ratingBadge).toBe('good');
  });

  it('should reject without auth', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/reviews',
      payload: {
        transactionId,
        overallRating: 5,
        wouldRecommend: true,
      },
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── GET /reviews/sellers/:sellerId ────────────────────────────

describe('GET /api/v1/reviews/sellers/:sellerId', () => {
  it('should list seller reviews', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/reviews/sellers/${sellerId}`,
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBe(2);
    expect(body.meta.total).toBe(2);
    expect(body.summary).toBeDefined();
    expect(body.summary.totalReviews).toBe(2);
    expect(body.summary.ratingBadge).toBe('good');
  });

  it('redacts buyer PII on the public endpoint (SEC-M3 #263)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/reviews/sellers/${sellerId}`,
    });

    expect(res.statusCode).toBe(200);
    const review = res.json().data[0];

    // No raw buyer id at the top level or inside the buyer object.
    expect(review.buyerId).toBeUndefined();
    expect(review.buyer.id).toBeUndefined();

    // First name + last initial only — no full last name.
    expect(review.buyer.displayName).toBe('Rev B.');
    expect(review.buyer.firstName).toBeUndefined();
    expect(review.buyer.lastName).toBeUndefined();
  });

  it('should sort by rating (highest)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/reviews/sellers/${sellerId}?sort=highest`,
    });

    expect(res.statusCode).toBe(200);
    const reviews = res.json().data;
    expect(reviews[0].overallRating).toBeGreaterThanOrEqual(reviews[1].overallRating);
  });

  it('should sort by rating (lowest)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/reviews/sellers/${sellerId}?sort=lowest`,
    });

    expect(res.statusCode).toBe(200);
    const reviews = res.json().data;
    expect(reviews[0].overallRating).toBeLessThanOrEqual(reviews[1].overallRating);
  });

  it('should return 404 for non-existent seller', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/reviews/sellers/a0000000-0000-4000-a000-000000000099',
    });
    expect(res.statusCode).toBe(404);
  });

  it('should respect pagination', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/reviews/sellers/${sellerId}?page=1&limit=1`,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.length).toBe(1);
    expect(res.json().meta.totalPages).toBe(2);
  });
});

// ── PUT /reviews/:reviewId/report ─────────────────────────────

describe('PUT /api/v1/reviews/:reviewId/report', () => {
  it('should flag review for moderation', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/reviews/${reviewId}/report`,
      headers: sellerHeaders(),
      payload: {
        reason: 'This review contains false information about the service provided.',
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().success).toBe(true);

    // Verify flagged in DB
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    expect(review!.flagged).toBe(true);
    expect(review!.moderationStatus).toBe('pending');
  });

  it('should return 404 for non-existent review', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/reviews/a0000000-0000-4000-a000-000000000099/report',
      headers: sellerHeaders(),
      payload: {
        reason: 'This review contains false information about the service.',
      },
    });
    expect(res.statusCode).toBe(404);
  });
});

// ── processReviewReminder: stale-job hardening (#216) ─────────

describe('ReviewsService.processReviewReminder stale-job handling', () => {
  it('drops a reminder for a non-existent transaction without throwing', async () => {
    const { ReviewsService } = await import('../src/modules/reviews/reviews.service.js');
    const ghostTxId = 'b0000000-0000-4000-a000-0000000000aa';
    await expect(
      new ReviewsService().processReviewReminder({
        transactionId: ghostTxId,
        buyerId: buyerUserId,
        sellerId,
        reminderType: 'day_30',
      }),
    ).resolves.toBeUndefined();
    const count = await prisma.notification.count({
      where: { userId: buyerUserId, type: 'review_reminder', data: { path: ['transactionId'], equals: ghostTxId } },
    });
    expect(count).toBe(0);
  });

  it('drops a reminder when the buyer no longer exists (no FK violation)', async () => {
    const { ReviewsService } = await import('../src/modules/reviews/reviews.service.js');
    const ghostBuyerId = '00000000-0000-0000-0000-0000000000ff';
    await expect(
      new ReviewsService().processReviewReminder({
        transactionId,
        buyerId: ghostBuyerId,
        sellerId,
        reminderType: 'day_30',
      }),
    ).resolves.toBeUndefined();
    const count = await prisma.notification.count({ where: { userId: ghostBuyerId } });
    expect(count).toBe(0);
  });
});
