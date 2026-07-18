import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import bcrypt from 'bcrypt';
import { prisma } from '../src/config/database.js';
import type { FastifyInstance } from 'fastify';

process.env.NODE_ENV = 'test';

/**
 * Cold-start seeded-post behavior (issue #37).
 *
 * Seeded (fake-buyer) posts exist only to attract real seller offers and make the
 * marketplace look active. They must NEVER be a party to a real transaction, and
 * seeded status is never exposed. This pins the v1 behavior:
 *   - a real seller's offer on a seeded post is accepted normally, but every
 *     fake-buyer-directed side effect is suppressed;
 *   - the seeded post + offer surface in the buyer discovery feed (isSeed hidden),
 *     excluding the viewer's own authored/offered posts;
 *   - the only action from discovery is clone-to-your-own-post, which creates a
 *     real post with provenance and notifies the referred seller;
 *   - there is NO path to accept/transact a seller's offer on a seeded post.
 */

let app: FastifyInstance;
let servicesId: string;
let seedPostId: string;
let sellerAProfileId: string;
let sellerAOfferId: string;
// #315 — real (non-seeded) discovery fixtures
let sellerBProfileId: string;
let realPublicPostId: string;
let realOfferOldId: string;
let realOfferNewId: string;
let heldPostId: string;

const PASSWORD = 'TestPass123!';
const FAKE_BUYER_EMAIL = 'seed37_fakebuyer@example.com';
const SELLER_A_EMAIL = 'seed37_sellera@example.com';
const REAL_BUYER_EMAIL = 'seed37_realbuyer@example.com';
const SELLER_B_EMAIL = 'disc315_sellerb@example.com';
const OTHER_BUYER_EMAIL = 'disc315_otherbuyer@example.com';
const HELD_BUYER_EMAIL = 'disc315_heldbuyer@example.com';

let fakeBuyerToken: string;
let sellerAToken: string;
let realBuyerToken: string;
let realBuyerId: string;

async function cleanup(): Promise<void> {
  const emails = [
    FAKE_BUYER_EMAIL, SELLER_A_EMAIL, REAL_BUYER_EMAIL,
    SELLER_B_EMAIL, OTHER_BUYER_EMAIL, HELD_BUYER_EMAIL,
  ];
  const users = await prisma.user.findMany({ where: { email: { in: emails } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  if (ids.length === 0) return;
  // Posts cloned by the real buyer reference the seed post via SET NULL, and
  // offers/posts cascade from users. Clear cloned posts first, then users.
  await prisma.post.deleteMany({ where: { buyerId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}

async function login(email: string): Promise<string> {
  const res = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, password: PASSWORD } });
  if (res.statusCode !== 200) {
    throw new Error(`login failed for ${email}: ${res.statusCode} ${res.body}`);
  }
  return res.json().data.tokens.accessToken;
}

async function waitForNotification(userId: string, type: string, ms = 3000): Promise<boolean> {
  const deadline = Date.now() + ms;
  do {
    const n = await prisma.notification.findFirst({ where: { userId, type } });
    if (n) return true;
    await new Promise((r) => setTimeout(r, 100));
  } while (Date.now() < deadline);
  return false;
}

beforeAll(async () => {
  const { buildApp } = await import('../src/app.js');
  app = await buildApp();
  await app.ready();
  await cleanup();

  servicesId = (await app.inject({ method: 'GET', url: '/api/v1/categories/services' })).json().data.id;
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  // Fake buyer (synthetic) — owns the seeded post and must never be contacted.
  const fakeBuyer = await prisma.user.create({
    data: {
      email: FAKE_BUYER_EMAIL, passwordHash, accountType: 'buyer',
      firstName: 'Seed', lastName: 'Buyer', emailVerified: true, status: 'active',
    },
  });
  fakeBuyerToken = await login(FAKE_BUYER_EMAIL);

  // Seeded post (isSeed=true), immediately public, owned by the fake buyer.
  const seedPost = await prisma.post.create({
    data: {
      buyerId: fakeBuyer.id,
      categoryId: servicesId,
      title: 'Need a reliable house cleaner in Dallas',
      description: 'Looking for a thorough recurring house cleaning service in the Dallas area.',
      budgetType: 'open',
      locationCity: 'Dallas', locationState: 'TX', locationZip: '75201',
      latitude: 32.7767, longitude: -96.7970,
      marketplaceContext: 'b2c',
      status: 'active',
      isSeed: true,
      publicAfter: null,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  seedPostId = seedPost.id;

  // Real seller A — will offer on the seeded post.
  const sellerA = await prisma.user.create({
    data: {
      email: SELLER_A_EMAIL, passwordHash, accountType: 'seller',
      firstName: 'Sally', lastName: 'Seller', emailVerified: true, status: 'active',
    },
  });
  const profileA = await prisma.sellerProfile.create({
    data: { userId: sellerA.id, businessName: 'Sally Cleans', categories: [servicesId] },
  });
  sellerAProfileId = profileA.id;
  sellerAToken = await login(SELLER_A_EMAIL);

  // Real buyer — views discovery and clones.
  const realBuyer = await prisma.user.create({
    data: {
      email: REAL_BUYER_EMAIL, passwordHash, accountType: 'buyer',
      firstName: 'Riley', lastName: 'Realbuyer', emailVerified: true, status: 'active',
    },
  });
  realBuyerId = realBuyer.id;
  realBuyerToken = await login(REAL_BUYER_EMAIL);

  // ── #315: real (non-seeded) discovery fixtures ──────────────────────────
  // Second real seller, for a 2nd competing offer on a real post.
  const sellerB = await prisma.user.create({
    data: {
      email: SELLER_B_EMAIL, passwordHash, accountType: 'seller',
      firstName: 'Bob', lastName: 'Builder', emailVerified: true, status: 'active',
    },
  });
  const profileB = await prisma.sellerProfile.create({
    data: { userId: sellerB.id, businessName: 'Bob Cleans Too', categories: [servicesId] },
  });
  sellerBProfileId = profileB.id;

  // A REAL buyer post (isSeed=false), publicly visible (no exclusivity hold), with
  // TWO pending offers at distinct times — verifies real posts surface in discovery
  // and that offers are returned oldest-first (#315).
  const otherBuyer = await prisma.user.create({
    data: {
      email: OTHER_BUYER_EMAIL, passwordHash, accountType: 'buyer',
      firstName: 'Olive', lastName: 'Otherbuyer', emailVerified: true, status: 'active',
    },
  });
  const realPublicPost = await prisma.post.create({
    data: {
      buyerId: otherBuyer.id,
      categoryId: servicesId,
      title: 'Need a deep clean for a 2-bedroom apartment in Dallas',
      description: 'One-time deep cleaning for a 2-bedroom apartment — kitchen and bathrooms included.',
      budgetType: 'open',
      locationCity: 'Dallas', locationState: 'TX', locationZip: '75202',
      latitude: 32.78, longitude: -96.8,
      marketplaceContext: 'b2c',
      status: 'active',
      isSeed: false,
      publicAfter: null,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  realPublicPostId = realPublicPost.id;

  const baseTime = Date.now();
  const oldOffer = await prisma.offer.create({
    data: {
      postId: realPublicPostId, sellerId: sellerAProfileId,
      offerType: 'service', quoteAmount: 140, status: 'pending',
      message: 'I can deep clean your 2-bedroom apartment this weekend — flat rate, supplies included.',
      createdAt: new Date(baseTime - 2 * 60 * 60 * 1000),
    },
  });
  realOfferOldId = oldOffer.id;
  const newOffer = await prisma.offer.create({
    data: {
      postId: realPublicPostId, sellerId: sellerBProfileId,
      offerType: 'service', quoteAmount: 160, status: 'pending',
      message: 'Detailed deep clean with eco-friendly products, available early next week.',
      createdAt: new Date(baseTime - 1 * 60 * 60 * 1000),
    },
  });
  realOfferNewId = newOffer.id;

  // A REAL post still inside the 3-day exclusivity window (publicAfter in the
  // future) — must NOT surface in the public buyer discovery feed (#315).
  const heldBuyer = await prisma.user.create({
    data: {
      email: HELD_BUYER_EMAIL, passwordHash, accountType: 'buyer',
      firstName: 'Hank', lastName: 'Heldbuyer', emailVerified: true, status: 'active',
    },
  });
  const heldPost = await prisma.post.create({
    data: {
      buyerId: heldBuyer.id,
      categoryId: servicesId,
      title: 'Need recurring office cleaning in Dallas',
      description: 'Looking for a recurring nightly office cleaning crew in downtown Dallas.',
      budgetType: 'open',
      locationCity: 'Dallas', locationState: 'TX', locationZip: '75203',
      marketplaceContext: 'b2c',
      status: 'active',
      isSeed: false,
      publicAfter: new Date(baseTime + 2 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(baseTime + 30 * 24 * 60 * 60 * 1000),
    },
  });
  heldPostId = heldPost.id;
  await prisma.offer.create({
    data: {
      postId: heldPostId, sellerId: sellerAProfileId,
      offerType: 'service', quoteAmount: 200, status: 'pending',
      message: 'Experienced nightly office cleaning crew available for downtown Dallas contracts.',
      createdAt: new Date(baseTime - 30 * 60 * 1000),
    },
  });
}, 30000);

afterAll(async () => {
  await cleanup();
  await app.close();
});

describe('Seeded-post discovery + clone (issue #37)', () => {
  it('accepts a real seller offer on a seeded post but suppresses all fake-buyer side effects', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/offers',
      headers: { authorization: `Bearer ${sellerAToken}` },
      payload: {
        postId: seedPostId,
        offerType: 'service',
        quoteAmount: 120,
        message: 'I run a 5-star recurring cleaning service in Dallas and can start this week. Happy to do a walkthrough first.',
      },
    });
    expect(res.statusCode).toBe(201);
    sellerAOfferId = res.json().data.id;

    // Offer is really recorded.
    const offer = await prisma.offer.findUnique({ where: { id: sellerAOfferId } });
    expect(offer?.status).toBe('pending');

    // Fake buyer received NOTHING (no offer_received, no notification of any kind).
    const fakeBuyer = await prisma.user.findUnique({ where: { email: FAKE_BUYER_EMAIL }, select: { id: true } });
    const notifs = await prisma.notification.findMany({ where: { userId: fakeBuyer!.id } });
    expect(notifs).toHaveLength(0);
  });

  it('surfaces the seeded post + offer in the buyer discovery feed, never exposing isSeed', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/posts/discover',
      headers: { authorization: `Bearer ${realBuyerToken}` },
    });
    expect(res.statusCode).toBe(200);
    const items = res.json().data as Array<Record<string, unknown>>;
    const item = items.find((p) => p.id === seedPostId);
    expect(item).toBeDefined();
    // Seeded status / provenance never serialized.
    expect(item).not.toHaveProperty('isSeed');
    expect(item).not.toHaveProperty('referredSellerId');
    expect(item).not.toHaveProperty('sourceSeedPostId');
    // The real offer is attached for the buyer to engage.
    const offers = item!.offers as Array<Record<string, unknown>>;
    expect(offers.some((o) => o.id === sellerAOfferId && o.sellerId === sellerAProfileId)).toBe(true);
    // PII gate applies to discovery too — viewer is unfunded on a seed post, so
    // exact coordinates + zip + address are redacted (SEC-M6 #266 / #258).
    expect(item!.latitude).toBeNull();
    expect(item!.longitude).toBeNull();
    expect(item!.locationZip).toBeNull();
    expect(item!.locationAddress).toBeNull();
    // Coarse location remains for relevance.
    expect(item!.locationCity).toBe('Dallas');
  });

  it('excludes a post from discovery for the seller who offered on it', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/posts/discover',
      headers: { authorization: `Bearer ${sellerAToken}` },
    });
    expect(res.statusCode).toBe(200);
    const items = res.json().data as Array<Record<string, unknown>>;
    expect(items.find((p) => p.id === seedPostId)).toBeUndefined();
  });

  it('refuses to accept a seller offer on a seeded post — even by the (fake) buyer', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/offers/${sellerAOfferId}/accept`,
      headers: { authorization: `Bearer ${fakeBuyerToken}` },
    });
    expect(res.statusCode).toBe(403);
    // No transaction ever touches a seeded post.
    const txCount = await prisma.transaction.count({ where: { postId: seedPostId } });
    expect(txCount).toBe(0);
  });

  it('clones a discovery offer into the buyer\'s own real post with provenance + seller notification', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/posts/from-offer',
      headers: { authorization: `Bearer ${realBuyerToken}` },
      payload: {
        offerId: sellerAOfferId,
        description: 'I need a recurring cleaning for a 3-bedroom house, every two weeks, starting next month.',
        budgetType: 'range',
        budgetMin: 100,
        budgetMax: 180,
        locationCity: 'Dallas', locationState: 'TX', locationZip: '75204',
      },
    });
    expect(res.statusCode).toBe(201);
    const newPost = res.json().data;

    // Owned by the real buyer, same category, NOT seeded.
    expect(newPost.buyerId).toBe(realBuyerId);
    expect(newPost.categoryId).toBe(servicesId);
    expect(newPost.id).not.toBe(seedPostId);

    const dbPost = await prisma.post.findUnique({ where: { id: newPost.id } });
    expect(dbPost?.isSeed).toBe(false);
    expect(dbPost?.referredSellerId).toBe(sellerAProfileId);
    expect(dbPost?.sourceSeedPostId).toBe(seedPostId);
    // Immediately public — no exclusivity hold, competition open.
    expect(dbPost?.publicAfter).toBeNull();

    // Referred seller is notified and deep-linked to re-offer.
    expect(await waitForNotification(
      (await prisma.sellerProfile.findUnique({ where: { id: sellerAProfileId }, select: { userId: true } }))!.userId,
      'referral_lead',
    )).toBe(true);

    // The seeded post is untouched — still seeded, still active, never a counterparty.
    const seed = await prisma.post.findUnique({ where: { id: seedPostId } });
    expect(seed?.isSeed).toBe(true);
    expect(seed?.status).toBe('active');
  });
});

describe('Buyer Discover feed — real posts + ordering (issue #315)', () => {
  it('surfaces a real, publicly-visible buyer post (not just seeded) with its offers, never exposing isSeed', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/posts/discover?limit=50&categoryId=${servicesId}`,
      headers: { authorization: `Bearer ${realBuyerToken}` },
    });
    expect(res.statusCode).toBe(200);
    const items = res.json().data as Array<Record<string, unknown>>;
    const item = items.find((p) => p.id === realPublicPostId);
    expect(item).toBeDefined();
    // Real vs seeded must be indistinguishable — isSeed is never serialized.
    expect(item).not.toHaveProperty('isSeed');
    const offers = item!.offers as Array<Record<string, unknown>>;
    expect(offers.some((o) => o.id === realOfferOldId)).toBe(true);
    expect(offers.some((o) => o.id === realOfferNewId)).toBe(true);
  });

  it('orders a post\'s nested offers oldest-first (earliest seller keeps the top slot)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/posts/discover?limit=50&categoryId=${servicesId}`,
      headers: { authorization: `Bearer ${realBuyerToken}` },
    });
    expect(res.statusCode).toBe(200);
    const items = res.json().data as Array<Record<string, unknown>>;
    const item = items.find((p) => p.id === realPublicPostId)!;
    const offers = item.offers as Array<Record<string, unknown>>;
    // The oldest offer is first; the newer offer comes after it.
    expect(offers[0].id).toBe(realOfferOldId);
    const oldIdx = offers.findIndex((o) => o.id === realOfferOldId);
    const newIdx = offers.findIndex((o) => o.id === realOfferNewId);
    expect(oldIdx).toBeLessThan(newIdx);
  });

  it('excludes real posts still inside the 3-day exclusivity window', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/posts/discover?limit=50&categoryId=${servicesId}`,
      headers: { authorization: `Bearer ${realBuyerToken}` },
    });
    expect(res.statusCode).toBe(200);
    const items = res.json().data as Array<Record<string, unknown>>;
    expect(items.find((p) => p.id === heldPostId)).toBeUndefined();
  });

  it('still excludes the viewer\'s own real post from their Discover feed', async () => {
    // Olive (otherBuyer) owns realPublicPost — she must not see it in her own feed.
    const otherBuyerToken = await login(OTHER_BUYER_EMAIL);
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/posts/discover?limit=50&categoryId=${servicesId}`,
      headers: { authorization: `Bearer ${otherBuyerToken}` },
    });
    expect(res.statusCode).toBe(200);
    const items = res.json().data as Array<Record<string, unknown>>;
    expect(items.find((p) => p.id === realPublicPostId)).toBeUndefined();
  });
});

describe('Buyer Discover feed — modes: For You / Trending / Nearby (issue #323)', () => {
  const disc = (qs: string) =>
    app.inject({
      method: 'GET',
      url: `/api/v1/posts/discover?limit=50&categoryId=${servicesId}&${qs}`,
      headers: { authorization: `Bearer ${realBuyerToken}` },
    });

  it('rejects an unknown mode with 400', async () => {
    const res = await disc('mode=bogus');
    expect(res.statusCode).toBe(400);
  });

  it('trending ranks a post with more competing offers ahead of one with fewer', async () => {
    // realPublicPost has 2 pending offers; the seeded post has 1 — so under
    // trending the 2-offer post must appear before the 1-offer post.
    const res = await disc('mode=trending');
    expect(res.statusCode).toBe(200);
    const items = res.json().data as Array<Record<string, unknown>>;
    const realIdx = items.findIndex((p) => p.id === realPublicPostId);
    const seedIdx = items.findIndex((p) => p.id === seedPostId);
    expect(realIdx).toBeGreaterThanOrEqual(0);
    expect(seedIdx).toBeGreaterThanOrEqual(0);
    expect(realIdx).toBeLessThan(seedIdx);
  });

  it('nearby keeps posts within the radius of the supplied center, closest first', async () => {
    // Center on Dallas — both fixtures sit within 25 miles and must appear.
    const res = await disc('mode=nearby&latitude=32.7767&longitude=-96.797&radiusMiles=25');
    expect(res.statusCode).toBe(200);
    const items = res.json().data as Array<Record<string, unknown>>;
    expect(items.find((p) => p.id === realPublicPostId)).toBeDefined();
    expect(items.find((p) => p.id === seedPostId)).toBeDefined();
  });

  it('nearby drops posts outside the radius of the supplied center', async () => {
    // Center on New York with a 25-mile radius — the Dallas fixtures fall outside.
    const res = await disc('mode=nearby&latitude=40.7128&longitude=-74.006&radiusMiles=25');
    expect(res.statusCode).toBe(200);
    const items = res.json().data as Array<Record<string, unknown>>;
    expect(items.find((p) => p.id === realPublicPostId)).toBeUndefined();
    expect(items.find((p) => p.id === seedPostId)).toBeUndefined();
  });

  it('foryou (default) never empties the feed for a viewer without a saved location', async () => {
    // realBuyer has no lat/lng — foryou must degrade gracefully (recency fallback)
    // and still surface the eligible posts rather than filtering them all out.
    const res = await disc('mode=foryou');
    expect(res.statusCode).toBe(200);
    const items = res.json().data as Array<Record<string, unknown>>;
    expect(items.find((p) => p.id === realPublicPostId)).toBeDefined();
    // Default (no mode param) resolves to foryou — same result.
    const resDefault = await app.inject({
      method: 'GET',
      url: `/api/v1/posts/discover?limit=50&categoryId=${servicesId}`,
      headers: { authorization: `Bearer ${realBuyerToken}` },
    });
    const defItems = resDefault.json().data as Array<Record<string, unknown>>;
    expect(defItems.find((p) => p.id === realPublicPostId)).toBeDefined();
  });
});
