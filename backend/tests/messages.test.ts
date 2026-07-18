import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/config/database.js';
import { redis } from '../src/config/redis.js';
import type { FastifyInstance } from 'fastify';

process.env.NODE_ENV = 'test';

let app: FastifyInstance;
let buyerToken: string;
let buyerUserId: string;
let sellerToken: string;
let sellerUserId: string;
let conversationId: string;
let postId: string;
let offerId: string;
let sellerId: string;

const BUYER = {
  email: 'msgtest-buyer@example.com',
  password: 'TestPass123!',
  firstName: 'Msg',
  lastName: 'Buyer',
  accountType: 'buyer' as const,
  agreeToTerms: true as const,
  agreeToPrivacy: true as const,
};

const SELLER = {
  email: 'msgtest-seller@example.com',
  password: 'TestPass123!',
  firstName: 'Msg',
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

  // Clean up in correct order (respect foreign keys)
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
      businessName: 'Msg Test Plumbing',
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
    data: { stripeAccountId: 'acct_test_msg', stripeChargesEnabled: true, stripePayoutsEnabled: true },
  });

  // Get category IDs
  const servicesRes = await app.inject({
    method: 'GET',
    url: '/api/v1/categories/services',
  });
  const servicesId = servicesRes.json().data.id;
  const plumbingRes = await app.inject({
    method: 'GET',
    url: '/api/v1/categories/plumbing',
  });
  const plumbingId = plumbingRes.json().data.id;

  // Create post → submit offer → accept offer (creates conversation)
  const postRes = await app.inject({
    method: 'POST',
    url: '/api/v1/posts',
    headers: buyerHeaders(),
    payload: {
      categoryId: servicesId,
      subcategoryId: plumbingId,
      title: 'Need plumber for messaging test',
      description: 'Messaging test post - kitchen sink leak requiring professional plumbing service.',
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

  await app.inject({
    method: 'POST',
    url: `/api/v1/offers/${offerId}/accept`,
    headers: buyerHeaders(),
  });

  // Get the created conversation
  const convo = await prisma.conversation.findFirst({
    where: {
      participant1Id: buyerUserId,
      participant2Id: sellerUserId,
    },
  });
  conversationId = convo!.id;
});

afterAll(async () => {
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
    where: { email: { startsWith: 'msgtest-' } },
  });
  // Clean rate limit keys
  const keys = await redis.keys('msg:rate:*');
  if (keys.length > 0) await redis.del(...keys);
  await prisma.$disconnect();
  await app.close();
});

// ── GET /conversations ────────────────────────────────────────

describe('GET /api/v1/messages/conversations', () => {
  it('should list conversations for buyer', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/messages/conversations',
      headers: buyerHeaders(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data[0].otherParticipant).toBeDefined();
  });

  it('should list conversations for seller', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/messages/conversations',
      headers: sellerHeaders(),
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.length).toBeGreaterThanOrEqual(1);
  });

  it('should reject without auth', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/messages/conversations',
    });
    expect(res.statusCode).toBe(401);
  });

  it('reports the other participant role from each side (Buyers/Sellers filter)', async () => {
    const buyerRes = await app.inject({
      method: 'GET',
      url: '/api/v1/messages/conversations',
      headers: buyerHeaders(),
    });
    const fromBuyer = buyerRes.json().data.find((c: { id: string }) => c.id === conversationId);
    expect(fromBuyer.otherRole).toBe('seller');

    const sellerRes = await app.inject({
      method: 'GET',
      url: '/api/v1/messages/conversations',
      headers: sellerHeaders(),
    });
    const fromSeller = sellerRes.json().data.find((c: { id: string }) => c.id === conversationId);
    expect(fromSeller.otherRole).toBe('buyer');
  });

  it('includes a deal context object with amount and state', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/messages/conversations',
      headers: buyerHeaders(),
    });
    const convo = res.json().data.find((c: { id: string }) => c.id === conversationId);
    expect(convo.deal).toBeDefined();
    // Accepted offer reconciled with a transaction → escrow state, amount 200.
    expect(convo.deal.amount).toBe(200);
    expect(['in_escrow', 'completed']).toContain(convo.deal.state);
    expect(convo.deal.photoUrl).toBeNull(); // test post has no photos
  });
});

// ── GET /conversations/:id ────────────────────────────────────

describe('GET /api/v1/messages/conversations/:conversationId', () => {
  it('should get conversation with messages', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/messages/conversations/${conversationId}`,
      headers: buyerHeaders(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.conversation).toBeDefined();
    expect(body.data.conversation.id).toBe(conversationId);
    expect(body.data.messages).toBeDefined();
  });

  it('should return 404 for non-participant', async () => {
    // Register a third user
    const otherUser = {
      email: 'msgtest-other@example.com',
      password: 'TestPass123!',
      firstName: 'Other',
      lastName: 'User',
      accountType: 'buyer' as const,
      agreeToTerms: true as const,
      agreeToPrivacy: true as const,
    };
    await prisma.user.deleteMany({ where: { email: otherUser.email } });
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: otherUser,
    });
    await prisma.user.update({
      where: { email: otherUser.email },
      data: { emailVerified: true },
    });
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: otherUser.email, password: otherUser.password },
    });
    const otherToken = loginRes.json().data.tokens.accessToken;

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/messages/conversations/${conversationId}`,
      headers: { authorization: `Bearer ${otherToken}` },
    });
    expect(res.statusCode).toBe(404);

    // Clean up
    await prisma.user.deleteMany({ where: { email: otherUser.email } });
  });
});

// ── POST /conversations/:id/messages ──────────────────────────

describe('POST /api/v1/messages/conversations/:conversationId/messages', () => {
  it('should send a message', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/messages/conversations/${conversationId}/messages`,
      headers: buyerHeaders(),
      payload: {
        messageText: 'Hi, when can you come fix the sink?',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.messageText).toBe('Hi, when can you come fix the sink?');
    expect(body.data.senderId).toBe(buyerUserId);
    expect(body.data.flagged).toBe(false);
  });

  it('should flag external payment mentions (venmo)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/messages/conversations/${conversationId}/messages`,
      headers: sellerHeaders(),
      payload: {
        messageText: 'Just send me the money on Venmo instead of the platform',
      },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().data.flagged).toBe(true);
  });

  it('should flag external payment mentions (cashapp)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/messages/conversations/${conversationId}/messages`,
      headers: sellerHeaders(),
      payload: {
        messageText: 'You can pay me through CashApp',
      },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().data.flagged).toBe(true);
  });

  it('should update unread counter', async () => {
    // Buyer sends message → seller's unread should increment
    await app.inject({
      method: 'POST',
      url: `/api/v1/messages/conversations/${conversationId}/messages`,
      headers: buyerHeaders(),
      payload: { messageText: 'Another message from buyer' },
    });

    const convo = await prisma.conversation.findUnique({ where: { id: conversationId } });
    // Buyer is participant1, so seller (participant2) unread count should be > 0
    expect(convo!.unreadCountP2).toBeGreaterThan(0);
  });

  it('should validate empty message', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/messages/conversations/${conversationId}/messages`,
      headers: buyerHeaders(),
      payload: { messageText: '' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('should reject without auth', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/messages/conversations/${conversationId}/messages`,
      payload: { messageText: 'Unauthorized message' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('should return 404 for non-existent conversation', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/messages/conversations/a0000000-0000-4000-a000-000000000099/messages',
      headers: buyerHeaders(),
      payload: { messageText: 'Hello' },
    });
    expect(res.statusCode).toBe(404);
  });
});

// ── PUT /conversations/:id/mark-read ──────────────────────────

describe('PUT /api/v1/messages/conversations/:conversationId/mark-read', () => {
  it('should mark messages as read and reset unread count', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/messages/conversations/${conversationId}/mark-read`,
      headers: sellerHeaders(),
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().success).toBe(true);

    // Verify unread count reset for seller (participant2)
    const convo = await prisma.conversation.findUnique({ where: { id: conversationId } });
    expect(convo!.unreadCountP2).toBe(0);
  });

  it('should return 404 for non-existent conversation', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/messages/conversations/a0000000-0000-4000-a000-000000000099/mark-read',
      headers: buyerHeaders(),
    });
    expect(res.statusCode).toBe(404);
  });
});

// ── PUT /conversations/:id/mark-unread ────────────────────────

describe('PUT /api/v1/messages/conversations/:conversationId/mark-unread', () => {
  it('re-flags a read conversation as unread for the caller', async () => {
    // Ensure a clean read baseline first (seller = participant2).
    await app.inject({
      method: 'PUT',
      url: `/api/v1/messages/conversations/${conversationId}/mark-read`,
      headers: sellerHeaders(),
    });

    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/messages/conversations/${conversationId}/mark-unread`,
      headers: sellerHeaders(),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().success).toBe(true);

    const convo = await prisma.conversation.findUnique({ where: { id: conversationId } });
    expect(convo!.unreadCountP2).toBeGreaterThanOrEqual(1);

    // Restore read state so later assertions aren't affected.
    await app.inject({
      method: 'PUT',
      url: `/api/v1/messages/conversations/${conversationId}/mark-read`,
      headers: sellerHeaders(),
    });
  });

  it('returns 404 for non-existent conversation', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/messages/conversations/a0000000-0000-4000-a000-000000000099/mark-unread',
      headers: buyerHeaders(),
    });
    expect(res.statusCode).toBe(404);
  });
});

// ── DELETE /conversations/:id (per-user hide) ─────────────────

describe('DELETE /api/v1/messages/conversations/:conversationId', () => {
  it('hides the thread for the caller but not the other participant', async () => {
    // Buyer (participant1) deletes → gone from buyer list, still in seller list.
    const del = await app.inject({
      method: 'DELETE',
      url: `/api/v1/messages/conversations/${conversationId}`,
      headers: buyerHeaders(),
    });
    expect(del.statusCode).toBe(200);

    const buyerList = await app.inject({
      method: 'GET',
      url: '/api/v1/messages/conversations',
      headers: buyerHeaders(),
    });
    expect(buyerList.json().data.find((c: { id: string }) => c.id === conversationId)).toBeUndefined();

    const sellerList = await app.inject({
      method: 'GET',
      url: '/api/v1/messages/conversations',
      headers: sellerHeaders(),
    });
    expect(sellerList.json().data.find((c: { id: string }) => c.id === conversationId)).toBeDefined();

    const convo = await prisma.conversation.findUnique({ where: { id: conversationId } });
    expect(convo!.hiddenAtP1).not.toBeNull();
  });

  it('resurfaces a hidden thread for the recipient when a new message arrives', async () => {
    // Seller messages the buyer → buyer's hiddenAtP1 clears, thread returns.
    await app.inject({
      method: 'POST',
      url: `/api/v1/messages/conversations/${conversationId}/messages`,
      headers: sellerHeaders(),
      payload: { messageText: 'Following up on your request — are you still interested?' },
    });

    const buyerList = await app.inject({
      method: 'GET',
      url: '/api/v1/messages/conversations',
      headers: buyerHeaders(),
    });
    expect(buyerList.json().data.find((c: { id: string }) => c.id === conversationId)).toBeDefined();

    const convo = await prisma.conversation.findUnique({ where: { id: conversationId } });
    expect(convo!.hiddenAtP1).toBeNull();
  });

  it('returns 404 for non-existent conversation', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/messages/conversations/a0000000-0000-4000-a000-000000000099',
      headers: buyerHeaders(),
    });
    expect(res.statusCode).toBe(404);
  });
});

// ── POST /conversations/:id/report ────────────────────────────

describe('POST /api/v1/messages/conversations/:conversationId/report', () => {
  it('should flag messages for moderation', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/messages/conversations/${conversationId}/report`,
      headers: buyerHeaders(),
      payload: {
        reason: 'Seller is asking for payment outside the platform via Venmo',
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().success).toBe(true);

    // Verify messages flagged
    const flaggedCount = await prisma.message.count({
      where: { conversationId, flagged: true },
    });
    expect(flaggedCount).toBeGreaterThan(0);
  });

  it('should validate reason length', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/messages/conversations/${conversationId}/report`,
      headers: buyerHeaders(),
      payload: { reason: 'short' },
    });
    expect(res.statusCode).toBe(400);
  });
});

// ── Offer submit seeds the conversation (#305) ────────────────

describe('offer submission seeds the buyer↔seller conversation', () => {
  it('created the thread with the seller pitch as its first message', async () => {
    // The conversation here was created when the seller submitted the offer (not at
    // accept), seeded with `validMessage`. Accept then reconciled it with the txn.
    const seeded = await prisma.message.findFirst({
      where: { conversationId, senderId: sellerUserId, messageText: validMessage },
    });
    expect(seeded).not.toBeNull();
  });

  it('linked the conversation to the transaction on accept (no duplicate thread)', async () => {
    const convos = await prisma.conversation.findMany({ where: { postId } });
    expect(convos.length).toBe(1);
    expect(convos[0].transactionId).not.toBeNull();
  });
});

// ── GET /conversations/by-post/:postId (#303) ─────────────────

describe('GET /api/v1/messages/conversations/by-post/:postId', () => {
  it('resolves the conversation for the post (seller side)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/messages/conversations/by-post/${postId}`,
      headers: sellerHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.id).toBe(conversationId);
    expect(body.data.otherParticipant.id).toBe(buyerUserId);
    expect(body.data).toHaveProperty('isLocked');
  });

  it('returns 404 when the caller has no conversation for the post', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/messages/conversations/by-post/a0000000-0000-4000-a000-000000000099',
      headers: sellerHeaders(),
    });
    expect(res.statusCode).toBe(404);
  });
});

// ── Read-only lock on transaction completion (#305) ───────────

describe('locked conversation (transaction complete)', () => {
  it('surfaces isLocked and rejects new messages with 409', async () => {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lockedAt: new Date() },
    });

    const detail = await app.inject({
      method: 'GET',
      url: `/api/v1/messages/conversations/${conversationId}`,
      headers: buyerHeaders(),
    });
    expect(detail.statusCode).toBe(200);
    expect(detail.json().data.conversation.isLocked).toBe(true);

    const send = await app.inject({
      method: 'POST',
      url: `/api/v1/messages/conversations/${conversationId}/messages`,
      headers: buyerHeaders(),
      payload: { messageText: 'Can I still message after completion?' },
    });
    expect(send.statusCode).toBe(409);

    // Restore so this fixture's state stays clean for any later assertions.
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lockedAt: null },
    });
  });
});
