import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/config/database.js';
import type { FastifyInstance } from 'fastify';
import { createTestUser, authHeaders } from './helpers.js';

process.env.NODE_ENV = 'test';

let app: FastifyInstance;
let buyerToken: string;
let buyerUserId: string;
let sellerToken: string;
let sellerUserId: string;
let servicesId: string;
let plumbingId: string;
let postId: string;
let offerId: string;

const BUYER = {
  email: 'offertest-buyer@example.com',
  password: 'TestPass123!',
  firstName: 'Offer',
  lastName: 'Buyer',
  accountType: 'buyer' as const,
  agreeToTerms: true as const,
  agreeToPrivacy: true as const,
};

const SELLER = {
  email: 'offertest-seller@example.com',
  password: 'TestPass123!',
  firstName: 'Offer',
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

  // Clean up in correct order (transactions → offers → posts → seller profiles → users)
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
      businessName: 'Offer Test Plumbing',
      bio: 'We fix pipes with care.',
      serviceRadiusMiles: 30,
    },
  });

  // Enable Stripe for seller (required for accepting paid offers)
  await prisma.sellerProfile.updateMany({
    where: { user: { email: SELLER.email } },
    data: { stripeAccountId: 'acct_test_offers', stripeChargesEnabled: true, stripePayoutsEnabled: true },
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

  // Create a test post as buyer
  const postRes = await app.inject({
    method: 'POST',
    url: '/api/v1/posts',
    headers: buyerHeaders(),
    payload: {
      categoryId: servicesId,
      subcategoryId: plumbingId,
      title: 'Need plumber for kitchen sink leak',
      description: 'My kitchen sink has been leaking under the cabinet. Need someone experienced with sink repairs.',
      budgetMin: 100,
      budgetMax: 300,
      budgetType: 'range',
      locationCity: 'Dallas',
      locationState: 'TX',
      locationZip: '75201',
      urgency: 'within_1_week',
    },
  });
  postId = postRes.json().data.id;
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
    where: { email: { startsWith: 'offertest-' } },
  });
  await prisma.$disconnect();
  await app.close();
});

// ── POST / — Submit Offer ──────────────────────────────────────

describe('POST /api/v1/offers', () => {
  it('should submit an offer', async () => {
    const res = await app.inject({
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

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.quoteAmount).toBe(200);
    expect(body.data.status).toBe('pending');
    expect(body.data.estimatedPayout).toBeGreaterThan(0);
    expect(body.data.platformFee).toBeGreaterThan(0);
    offerId = body.data.id;
  });

  it('should reject without auth', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/offers',
      payload: {
        postId,
        offerType: 'service',
        quoteAmount: 200,
        message: validMessage,
      },
    });
    expect(res.statusCode).toBe(401);
  });

  it('should reject offer on own post', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/offers',
      headers: buyerHeaders(),
      payload: {
        postId,
        offerType: 'service',
        quoteAmount: 200,
        message: validMessage,
      },
    });
    // Buyer doesn't have a seller profile, so gets 404 for seller profile
    expect(res.statusCode).toBe(404);
  });

  it('should reject quote below $10', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/offers',
      headers: sellerHeaders(),
      payload: {
        postId,
        offerType: 'service',
        quoteAmount: 5,
        message: validMessage,
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it('should reject duplicate offer on same post', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/offers',
      headers: sellerHeaders(),
      payload: {
        postId,
        offerType: 'service',
        quoteAmount: 250,
        message: validMessage,
      },
    });
    expect(res.statusCode).toBe(409);
  });
});

// ── Submit Offer form (#302 optional message, #306 null fields, #304 pricing) ──

describe('POST /api/v1/offers — Submit Offer form', () => {
  // Offers created here must not count against the shared seller's
  // MAX_ACTIVE_OFFERS (25) cap in later describe blocks, so track + purge them.
  const createdPostIds: string[] = [];

  afterAll(async () => {
    if (createdPostIds.length === 0) return;
    await prisma.offer.deleteMany({ where: { postId: { in: createdPostIds } } });
    await prisma.post.deleteMany({ where: { id: { in: createdPostIds } } });
  });

  // Each test needs a fresh post: a seller can only have one offer per post.
  async function createFreshPost() {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: buyerHeaders(),
      payload: {
        categoryId: servicesId,
        subcategoryId: plumbingId,
        title: 'Need plumber for bathroom job',
        description: 'Bathroom sink and faucet replacement, looking for an experienced plumber.',
        budgetMin: 100,
        budgetMax: 300,
        budgetType: 'range',
        locationCity: 'Dallas',
        locationState: 'TX',
        locationZip: '75201',
        urgency: 'within_1_week',
      },
    });
    const id = res.json().data.id as string;
    createdPostIds.push(id);
    return id;
  }

  it('accepts an offer with no message (#302)', async () => {
    const freshPostId = await createFreshPost();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/offers',
      headers: sellerHeaders(),
      payload: { postId: freshPostId, offerType: 'service', quoteAmount: 200 },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.message).toBe('');
  });

  it('accepts an offer with a short message (no 50-char floor) (#302)', async () => {
    const freshPostId = await createFreshPost();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/offers',
      headers: sellerHeaders(),
      payload: { postId: freshPostId, offerType: 'service', quoteAmount: 200, message: 'Hi' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.message).toBe('Hi');
  });

  it('round-trips optional offer photos (#312)', async () => {
    const freshPostId = await createFreshPost();
    const photos = [
      'https://cdn.example.com/offer-photos/seller/a.jpg',
      'https://cdn.example.com/offer-photos/seller/b.jpg',
    ];
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/offers',
      headers: sellerHeaders(),
      payload: {
        postId: freshPostId,
        offerType: 'service',
        quoteAmount: 200,
        photos,
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.photos).toEqual(photos);
  });

  it('defaults photos to an empty array when omitted (#312)', async () => {
    const freshPostId = await createFreshPost();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/offers',
      headers: sellerHeaders(),
      payload: { postId: freshPostId, offerType: 'service', quoteAmount: 200 },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.photos).toEqual([]);
  });

  it('rejects non-URL offer photos (#312)', async () => {
    const freshPostId = await createFreshPost();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/offers',
      headers: sellerHeaders(),
      payload: {
        postId: freshPostId,
        offerType: 'service',
        quoteAmount: 200,
        photos: ['not-a-url'],
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it('accepts explicit null optional numeric/string fields (#306)', async () => {
    const freshPostId = await createFreshPost();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/offers',
      headers: sellerHeaders(),
      payload: {
        postId: freshPostId,
        offerType: 'service',
        quoteAmount: 200,
        estimatedHours: null,
        pricingType: null,
        canStart: null,
        specificDate: null,
        completionTime: null,
        message: null,
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.estimatedHours).toBeNull();
  });

  it('allows resubmit after decline and resets the exclusivity window (#2)', async () => {
    const freshPostId = await createFreshPost();

    const first = await app.inject({
      method: 'POST',
      url: '/api/v1/offers',
      headers: sellerHeaders(),
      payload: { postId: freshPostId, offerType: 'service', quoteAmount: 150 },
    });
    expect(first.statusCode).toBe(201);
    const firstOfferId = first.json().data.id;

    // Buyer declines the offer.
    const decline = await app.inject({
      method: 'POST',
      url: `/api/v1/offers/${firstOfferId}/decline`,
      headers: buyerHeaders(),
    });
    expect(decline.statusCode).toBe(204);

    // Seller resubmits — allowed now (previously 409'd), creates a new offer.
    const second = await app.inject({
      method: 'POST',
      url: '/api/v1/offers',
      headers: sellerHeaders(),
      payload: { postId: freshPostId, offerType: 'service', quoteAmount: 175 },
    });
    expect(second.statusCode).toBe(201);
    expect(second.json().data.id).not.toBe(firstOfferId);

    // Exclusivity window restarted (publicAfter in the future).
    const post = await prisma.post.findUnique({ where: { id: freshPostId } });
    expect(post?.publicAfter).not.toBeNull();
    expect(post!.publicAfter!.getTime()).toBeGreaterThan(Date.now());

    // The seller who offered can still load the (now in-window) post detail.
    const view = await app.inject({
      method: 'GET',
      url: `/api/v1/posts/${freshPostId}`,
      headers: sellerHeaders(),
    });
    expect(view.statusCode).toBe(200);
  });

  it('accepts per_item and custom pricing types (#304)', async () => {
    for (const pricingType of ['per_item', 'custom'] as const) {
      const freshPostId = await createFreshPost();
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/offers',
        headers: sellerHeaders(),
        payload: {
          postId: freshPostId,
          offerType: 'service',
          quoteAmount: 200,
          pricingType,
          categorySpecific: pricingType === 'per_item'
            ? { unitPrice: 50, quantity: 4 }
            : { customPricing: '$50 base + $10/room' },
        },
      });
      expect(res.statusCode, `pricingType=${pricingType}`).toBe(201);
      expect(res.json().data.pricingType).toBe(pricingType);
    }
  });
});

// ── GET /my-offers — Seller's Offers ────────────────────────────

describe('GET /api/v1/offers/my-offers', () => {
  it('should list seller offers', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/offers/my-offers',
      headers: sellerHeaders(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.meta.total).toBeGreaterThanOrEqual(1);
  });

  it('should filter by status', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/offers/my-offers?status=pending',
      headers: sellerHeaders(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    body.data.forEach((offer: { status: string }) => {
      expect(offer.status).toBe('pending');
    });
  });

  it('should reject without auth', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/offers/my-offers',
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── GET /post/:postId — Post Offers (Buyer View) ────────────────

describe('GET /api/v1/offers/post/:postId', () => {
  it('should return offers for post buyer', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/offers/post/${postId}`,
      headers: buyerHeaders(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    // Check best match flag exists
    const hasBestMatch = body.data.some((o: { isBestMatch: boolean }) => o.isBestMatch);
    expect(hasBestMatch).toBe(true);
    // seller.userId must be present — mobile SellerSummary.userId is non-nullable (#296)
    expect(body.data[0].seller.userId).toBe(sellerUserId);
  });

  it('should reject non-owner', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/offers/post/${postId}`,
      headers: sellerHeaders(),
    });
    expect(res.statusCode).toBe(403);
  });
});

// ── GET /:offerId — Offer Detail ────────────────────────────────

describe('GET /api/v1/offers/:offerId', () => {
  it('should return offer for seller owner', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/offers/${offerId}`,
      headers: sellerHeaders(),
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.id).toBe(offerId);
  });

  it('should return offer for post buyer', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/offers/${offerId}`,
      headers: buyerHeaders(),
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.id).toBe(offerId);
  });
});

// ── PUT /:offerId — Edit Offer ──────────────────────────────────

describe('PUT /api/v1/offers/:offerId', () => {
  it('should update pending offer', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/offers/${offerId}`,
      headers: sellerHeaders(),
      payload: { quoteAmount: 225 },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.quoteAmount).toBe(225);
    expect(body.data.estimatedPayout).toBeGreaterThan(0);
  });

  it('should reject non-owner edit', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/offers/${offerId}`,
      headers: buyerHeaders(),
      payload: { quoteAmount: 225 },
    });
    // Buyer has no seller profile → 404
    expect(res.statusCode).toBe(404);
  });
});

// ── POST /:offerId/accept — Accept Offer ────────────────────────

describe('POST /api/v1/offers/:offerId/accept', () => {
  it('should accept offer and create transaction', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/offers/${offerId}/accept`,
      headers: buyerHeaders(),
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.offer.status).toBe('accepted');
    expect(body.data.transaction).toBeDefined();
    expect(body.data.transaction.status).toBe('in_progress');
    expect(body.data.transaction.escrowStatus).toBe('held');
    expect(body.data.transaction.quoteAmount).toBe(225);
  });

  it('should reject accepting already-accepted offer', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/offers/${offerId}/accept`,
      headers: buyerHeaders(),
    });
    expect(res.statusCode).toBe(409);
  });

  it('should reject if not the post buyer', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/offers/${offerId}/accept`,
      headers: sellerHeaders(),
    });
    expect(res.statusCode).toBe(403); // seller is not the post buyer
  });
});

// ── PUT /:offerId/edit — Reject edit on accepted offer ──────────

describe('PUT /:offerId edit after accept', () => {
  it('should reject edit of accepted offer', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/offers/${offerId}`,
      headers: sellerHeaders(),
      payload: { quoteAmount: 300 },
    });
    expect(res.statusCode).toBe(409);
  });
});

// ── DELETE /:offerId — Withdraw (rejected on accepted) ──────────

describe('DELETE /api/v1/offers/:offerId', () => {
  it('should reject withdrawal of accepted offer', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/offers/${offerId}`,
      headers: sellerHeaders(),
    });
    expect(res.statusCode).toBe(409);
  });
});

// ── Withdraw a fresh pending offer ──────────────────────────────

describe('Withdraw a pending offer', () => {
  let freshPostId: string;
  let freshOfferId: string;

  beforeAll(async () => {
    // Create another post
    const postRes = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: buyerHeaders(),
      payload: {
        categoryId: servicesId,
        subcategoryId: plumbingId,
        title: 'Another plumbing job for withdraw test',
        description: 'Need someone to fix a leaking bathroom faucet. This is a test post for withdrawal testing.',
        budgetMin: 50,
        budgetMax: 150,
        budgetType: 'range',
        locationCity: 'Dallas',
        locationState: 'TX',
        urgency: 'flexible',
      },
    });
    freshPostId = postRes.json().data.id;

    // Submit offer
    const offerRes = await app.inject({
      method: 'POST',
      url: '/api/v1/offers',
      headers: sellerHeaders(),
      payload: {
        postId: freshPostId,
        offerType: 'service',
        quoteAmount: 100,
        message: validMessage,
      },
    });
    freshOfferId = offerRes.json().data.id;
  });

  it('should withdraw a pending offer', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/offers/${freshOfferId}`,
      headers: sellerHeaders(),
    });
    expect(res.statusCode).toBe(204);
  });
});

// ── POST /:offerId/counter — Counter Offer ────────────────────────

describe('POST /api/v1/offers/:offerId/counter', () => {
  let counterPostId: string;
  let counterOfferId: string;
  let newCounterOfferId: string;

  beforeAll(async () => {
    // Create a fresh post + offer pair for counter-offer testing
    const postRes = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: buyerHeaders(),
      payload: {
        categoryId: servicesId,
        subcategoryId: plumbingId,
        title: 'Counter offer test plumbing job',
        description: 'Need a plumber to test the counter-offer flow. This is a test post for counter-offer testing.',
        budgetMin: 100,
        budgetMax: 300,
        budgetType: 'range',
        locationCity: 'Dallas',
        locationState: 'TX',
        urgency: 'within_1_week',
      },
    });
    counterPostId = postRes.json().data.id;

    const offerRes = await app.inject({
      method: 'POST',
      url: '/api/v1/offers',
      headers: sellerHeaders(),
      payload: {
        postId: counterPostId,
        offerType: 'service',
        quoteAmount: 250,
        pricingType: 'flat_rate',
        message: validMessage,
      },
    });
    counterOfferId = offerRes.json().data.id;
  });

  it('should counter a pending offer', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/offers/${counterOfferId}/counter`,
      headers: buyerHeaders(),
      payload: {
        counterAmount: 180,
        counterMessage: 'Can you do it for less? My budget is tight.',
        counterTerms: 'Payment upon completion only',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.quoteAmount).toBe(180);
    expect(body.data.status).toBe('pending');
    newCounterOfferId = body.data.id;

    // Verify original offer is now counter_offered
    const original = await prisma.offer.findUnique({ where: { id: counterOfferId } });
    expect(original!.status).toBe('counter_offered');
    expect(Number(original!.counterAmount)).toBe(180);
    expect(original!.counterOfferedAt).not.toBeNull();

    // Verify new offer is linked to parent
    const counterOffer = await prisma.offer.findUnique({ where: { id: newCounterOfferId } });
    expect(counterOffer!.parentOfferId).toBe(counterOfferId);
  });

  it('should reject without authentication', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/offers/${counterOfferId}/counter`,
      payload: { counterAmount: 200 },
    });
    expect(res.statusCode).toBe(401);
  });

  it('should reject counter from non-buyer (seller)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/offers/${counterOfferId}/counter`,
      headers: sellerHeaders(),
      payload: { counterAmount: 200 },
    });
    expect(res.statusCode).toBe(403);
  });

  it('should reject counter on already counter-offered offer', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/offers/${counterOfferId}/counter`,
      headers: buyerHeaders(),
      payload: { counterAmount: 190 },
    });
    expect(res.statusCode).toBe(409);
  });

  it('should reject counter amount below $10', async () => {
    // Need a fresh pending offer for this test
    const postRes = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: buyerHeaders(),
      payload: {
        categoryId: servicesId,
        subcategoryId: plumbingId,
        title: 'Counter min amount test post here',
        description: 'Testing that counter-offer rejects amounts below the $10 minimum threshold.',
        budgetMin: 50,
        budgetMax: 100,
        budgetType: 'range',
        locationCity: 'Dallas',
        locationState: 'TX',
        urgency: 'flexible',
      },
    });
    const minPostId = postRes.json().data.id;

    const offerRes = await app.inject({
      method: 'POST',
      url: '/api/v1/offers',
      headers: sellerHeaders(),
      payload: {
        postId: minPostId,
        offerType: 'service',
        quoteAmount: 80,
        message: validMessage,
      },
    });
    const minOfferId = offerRes.json().data.id;

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/offers/${minOfferId}/counter`,
      headers: buyerHeaders(),
      payload: { counterAmount: 5 },
    });
    expect(res.statusCode).toBe(400);
  });

  it('should accept the counter-offer and create transaction', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/offers/${newCounterOfferId}/accept`,
      headers: buyerHeaders(),
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.data.offer.status).toBe('accepted');
    expect(body.data.transaction).toBeDefined();
    expect(body.data.transaction.quoteAmount).toBe(180);
    expect(body.data.transaction.status).toBe('in_progress');
  });

  it('should reject counter on post that is no longer active', async () => {
    // The counterPostId is now 'filled' after acceptance above
    // Create a new offer on a different post that's already filled
    const filledPostRes = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: buyerHeaders(),
      payload: {
        categoryId: servicesId,
        subcategoryId: plumbingId,
        title: 'Post that will be marked filled for counter test',
        description: 'This post will be marked as filled to test counter-offer rejection on inactive posts.',
        budgetMin: 50,
        budgetMax: 100,
        budgetType: 'range',
        locationCity: 'Dallas',
        locationState: 'TX',
        urgency: 'flexible',
      },
    });
    const filledPostId = filledPostRes.json().data.id;

    const offerRes = await app.inject({
      method: 'POST',
      url: '/api/v1/offers',
      headers: sellerHeaders(),
      payload: {
        postId: filledPostId,
        offerType: 'service',
        quoteAmount: 75,
        message: validMessage,
      },
    });
    const inactiveOfferId = offerRes.json().data.id;

    // Mark the post as filled via Prisma
    await prisma.post.update({ where: { id: filledPostId }, data: { status: 'filled' } });

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/offers/${inactiveOfferId}/counter`,
      headers: buyerHeaders(),
      payload: { counterAmount: 60 },
    });
    expect(res.statusCode).toBe(409);
  });

  it('should counter with only required field (counterAmount)', async () => {
    // Create fresh post + offer
    const postRes = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: buyerHeaders(),
      payload: {
        categoryId: servicesId,
        subcategoryId: plumbingId,
        title: 'Minimal counter offer test post',
        description: 'Testing that counter-offer works with only the counterAmount field provided.',
        budgetMin: 50,
        budgetMax: 200,
        budgetType: 'range',
        locationCity: 'Dallas',
        locationState: 'TX',
        urgency: 'flexible',
      },
    });
    const minimalPostId = postRes.json().data.id;

    const offerRes = await app.inject({
      method: 'POST',
      url: '/api/v1/offers',
      headers: sellerHeaders(),
      payload: {
        postId: minimalPostId,
        offerType: 'service',
        quoteAmount: 150,
        message: validMessage,
      },
    });
    const minimalOfferId = offerRes.json().data.id;

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/offers/${minimalOfferId}/counter`,
      headers: buyerHeaders(),
      payload: { counterAmount: 120 },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().data.quoteAmount).toBe(120);
    expect(res.json().data.status).toBe('pending');
  });
});

// ── MAX_OFFERS_PER_POST cap enforcement ─────────────────────────

describe('MAX_OFFERS_PER_POST cap enforcement', () => {
  let capPostId: string;

  beforeAll(async () => {
    // Create a fresh post owned by the buyer
    const postRes = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: buyerHeaders(),
      payload: {
        categoryId: servicesId,
        subcategoryId: plumbingId,
        title: 'Post for offer cap enforcement test',
        description: 'This post is used to test that the 26th offer on a post is rejected with a 409 status.',
        budgetMin: 100,
        budgetMax: 300,
        budgetType: 'range',
        locationCity: 'Dallas',
        locationState: 'TX',
        locationZip: '75201',
        urgency: 'within_1_week',
      },
    });
    capPostId = postRes.json().data.id;
  });

  it('should accept offers 1-25 and reject the 26th with 409', async () => {
    // Submit 25 offers from 25 distinct sellers
    for (let i = 1; i <= 25; i++) {
      const seller = await createTestUser(app, { accountType: 'buyer' });

      // Create a seller profile for this user
      await app.inject({
        method: 'POST',
        url: '/api/v1/sellers',
        headers: authHeaders(seller.token),
        payload: {
          businessName: `Cap Test Seller ${i}`,
          bio: 'Testing the offer cap.',
          serviceRadiusMiles: 30,
        },
      });

      const offerRes = await app.inject({
        method: 'POST',
        url: '/api/v1/offers',
        headers: authHeaders(seller.token),
        payload: {
          postId: capPostId,
          offerType: 'service',
          quoteAmount: 150,
          message: validMessage,
        },
      });
      expect(offerRes.statusCode).toBe(201);
    }

    // 26th seller — must be rejected
    const seller26 = await createTestUser(app, { accountType: 'buyer' });
    await app.inject({
      method: 'POST',
      url: '/api/v1/sellers',
      headers: authHeaders(seller26.token),
      payload: {
        businessName: 'Cap Test Seller 26',
        bio: 'Testing the offer cap boundary.',
        serviceRadiusMiles: 30,
      },
    });

    const rejectedRes = await app.inject({
      method: 'POST',
      url: '/api/v1/offers',
      headers: authHeaders(seller26.token),
      payload: {
        postId: capPostId,
        offerType: 'service',
        quoteAmount: 150,
        message: validMessage,
      },
    });

    expect(rejectedRes.statusCode).toBe(409);
    expect(JSON.stringify(rejectedRes.json())).toContain('maximum of 25 offers');
  }, 120_000); // 26 users × ~300ms network round-trips ≈ 8s; generous timeout for CI
});

// ── MAX_COUNTER_DEPTH cap (5 total rounds = original + 4 counters) ───────────

describe('MAX_COUNTER_DEPTH = 5 cap enforcement', () => {
  let depthPostId: string;
  let chainOfferIds: string[] = []; // index 0 = original; chain length = depth

  beforeAll(async () => {
    // Fresh post for an isolated counter chain
    const postRes = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: buyerHeaders(),
      payload: {
        categoryId: servicesId,
        subcategoryId: plumbingId,
        title: 'Counter depth cap test',
        description: 'Testing the 5-round counter-offer chain cap for the reverse marketplace platform.',
        budgetMin: 100,
        budgetMax: 500,
        budgetType: 'range',
        locationCity: 'Dallas',
        locationState: 'TX',
        urgency: 'flexible',
      },
    });
    depthPostId = postRes.json().data.id;

    // Seller submits the original offer (chain depth 1)
    const offerRes = await app.inject({
      method: 'POST',
      url: '/api/v1/offers',
      headers: sellerHeaders(),
      payload: {
        postId: depthPostId,
        offerType: 'service',
        quoteAmount: 250,
        pricingType: 'flat_rate',
        message: validMessage,
      },
    });
    expect(offerRes.statusCode).toBe(201);
    chainOfferIds.push(offerRes.json().data.id);

    // Buyer counters 4 times — each builds the chain by 1 (depths 2..5).
    // The 4th counter reaches chain length 5 and MUST succeed (= 4 total rounds per plan A-02).
    for (let i = 1; i <= 4; i++) {
      const latestId = chainOfferIds[chainOfferIds.length - 1];
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/offers/${latestId}/counter`,
        headers: buyerHeaders(),
        payload: {
          counterAmount: 200 - i * 10, // 190, 180, 170, 160
          counterMessage: `Counter round ${i}`,
        },
      });
      expect(res.statusCode).toBe(201);
      chainOfferIds.push(res.json().data.id);
    }

    expect(chainOfferIds).toHaveLength(5); // original + 4 counters
  }, 60_000);

  it('should reject the 5th counter with 409 and "maximum of 5 rounds"', async () => {
    const deepestId = chainOfferIds[chainOfferIds.length - 1]; // the 4th counter
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/offers/${deepestId}/counter`,
      headers: buyerHeaders(),
      payload: {
        counterAmount: 150,
        counterMessage: 'This 5th counter must be rejected',
      },
    });
    expect(res.statusCode).toBe(409);
    expect(JSON.stringify(res.json())).toContain('maximum of 5 rounds');
  });

  it('counter chain is private — third-party seller GET on post does not see counter chain', async () => {
    // Third-party seller (separate from the chain seller) attempts to view the post's offers.
    const thirdParty = await createTestUser(app, {
      accountType: 'buyer',
      firstName: 'ThirdParty',
      lastName: 'Seller',
    });
    await app.inject({
      method: 'POST',
      url: '/api/v1/sellers',
      headers: authHeaders(thirdParty.token),
      payload: {
        businessName: 'Third Party Inc',
        bio: 'Curious onlooker.',
        serviceRadiusMiles: 30,
      },
    });

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/offers/post/${depthPostId}`,
      headers: authHeaders(thirdParty.token),
    });

    // Third-party seller is NOT the post owner — service-layer scoping must hide the counter chain.
    // Either 200 with empty/scoped response, or 403 — the chain itself must not be exposed.
    if (res.statusCode === 200) {
      const body = res.json();
      const offers = body?.data ?? [];
      // None of the chain's counter-offer ids should appear
      const exposedIds = offers.map((o: { id: string }) => o.id);
      for (const id of chainOfferIds) {
        expect(exposedIds).not.toContain(id);
      }
    } else {
      expect([403, 404]).toContain(res.statusCode);
    }
  });
});

// ── Lifecycle notifications + buyer decline route ──────────────
// Extracted from the audit branch (PR #1): offer_received on submit,
// offer_accepted on accept, and the new POST /:offerId/decline endpoint with
// its offer_declined notification.
describe('Offer lifecycle notifications + buyer decline', () => {
  let lcPostId: string;
  let lcOfferId: string;
  let declinePostId: string;
  let declineOfferId: string;

  const lcPost = (title: string) => ({
    categoryId: servicesId,
    subcategoryId: plumbingId,
    title,
    description: 'Plumbing job created to cover lifecycle notifications and the buyer decline route in tests.',
    budgetMin: 60,
    budgetMax: 200,
    budgetType: 'range',
    locationCity: 'Dallas',
    locationState: 'TX',
    urgency: 'flexible',
  });

  beforeAll(async () => {
    lcPostId = (await app.inject({ method: 'POST', url: '/api/v1/posts', headers: buyerHeaders(), payload: lcPost('Lifecycle accept post') })).json().data.id;
    lcOfferId = (await app.inject({ method: 'POST', url: '/api/v1/offers', headers: sellerHeaders(), payload: { postId: lcPostId, offerType: 'service', quoteAmount: 120, message: validMessage } })).json().data.id;

    declinePostId = (await app.inject({ method: 'POST', url: '/api/v1/posts', headers: buyerHeaders(), payload: lcPost('Lifecycle decline post') })).json().data.id;
    declineOfferId = (await app.inject({ method: 'POST', url: '/api/v1/offers', headers: sellerHeaders(), payload: { postId: declinePostId, offerType: 'service', quoteAmount: 90, message: validMessage } })).json().data.id;
  });

  afterAll(async () => {
    const postIds = [lcPostId, declinePostId];
    await prisma.conversation.deleteMany({ where: { postId: { in: postIds } } });
    await prisma.transaction.deleteMany({ where: { postId: { in: postIds } } });
    await prisma.offer.deleteMany({ where: { postId: { in: postIds } } });
    await prisma.post.deleteMany({ where: { id: { in: postIds } } });
  });

  it('emits offer_received to the buyer on submit', async () => {
    const notif = await prisma.notification.findFirst({
      where: { userId: buyerUserId, type: 'offer_received', data: { path: ['offerId'], equals: lcOfferId } },
    });
    expect(notif).not.toBeNull();
    expect(notif?.title).toBe('New offer received');
  });

  it('emits offer_accepted to the winning seller on accept', async () => {
    const res = await app.inject({ method: 'POST', url: `/api/v1/offers/${lcOfferId}/accept`, headers: buyerHeaders() });
    expect(res.statusCode).toBe(201);
    const notif = await prisma.notification.findFirst({
      where: { userId: sellerUserId, type: 'offer_accepted', data: { path: ['offerId'], equals: lcOfferId } },
    });
    expect(notif).not.toBeNull();
    expect(notif?.title).toBe('Your offer was accepted');
  });

  it('declines a pending offer as the buyer (204) and notifies the seller', async () => {
    const res = await app.inject({ method: 'POST', url: `/api/v1/offers/${declineOfferId}/decline`, headers: buyerHeaders() });
    expect(res.statusCode).toBe(204);
    const updated = await prisma.offer.findUnique({ where: { id: declineOfferId } });
    expect(updated?.status).toBe('declined');
    expect(updated?.declinedAt).toBeTruthy();
    const notif = await prisma.notification.findFirst({
      where: { userId: sellerUserId, type: 'offer_declined', data: { path: ['offerId'], equals: declineOfferId } },
    });
    expect(notif).not.toBeNull();
  });

  it('rejects decline by a non-participant (403)', async () => {
    const stranger = await createTestUser(app, { accountType: 'buyer' });
    const res = await app.inject({ method: 'POST', url: `/api/v1/offers/${declineOfferId}/decline`, headers: authHeaders(stranger.token) });
    expect(res.statusCode).toBe(403);
  });

  it('rejects a second decline on an already-declined offer (409)', async () => {
    const res = await app.inject({ method: 'POST', url: `/api/v1/offers/${declineOfferId}/decline`, headers: buyerHeaders() });
    expect(res.statusCode).toBe(409);
  });
});
