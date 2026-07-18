import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';

// Socket tests depend on timing-sensitive WebSocket events + DB queries.
// Under parallel execution with 19 other test files, DB contention can
// push event delivery past tight timeouts or cause transient Prisma errors.
vi.setConfig({ testTimeout: 15000, retry: 2 });
import { createServer, type Server as HttpServer } from 'node:http';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import { prisma } from '../src/config/database.js';
import { redis } from '../src/config/redis.js';
import { env } from '../src/config/env.js';
import { initSocketIO, getIO, resetIO } from '../src/config/socket.js';
import { registerMessagesGateway } from '../src/modules/messages/messages.gateway.js';
import type { FastifyInstance } from 'fastify';

process.env.NODE_ENV = 'test';

let app: FastifyInstance;
let httpServer: HttpServer;
let buyerToken: string;
let buyerUserId: string;
let sellerToken: string;
let sellerUserId: string;
let conversationId: string;
let port: number;

// Track client sockets for cleanup
const clientSockets: ClientSocket[] = [];

const BUYER = {
  email: 'sockettest-buyer@example.com',
  password: 'TestPass123!',
  firstName: 'Socket',
  lastName: 'Buyer',
  accountType: 'buyer' as const,
  agreeToTerms: true as const,
  agreeToPrivacy: true as const,
};

const SELLER = {
  email: 'sockettest-seller@example.com',
  password: 'TestPass123!',
  firstName: 'Socket',
  lastName: 'Seller',
  accountType: 'buyer' as const,
  agreeToTerms: true as const,
  agreeToPrivacy: true as const,
};

function generateToken(userId: string, email: string): string {
  return jwt.sign(
    {
      sub: userId,
      email,
      accountType: 'buyer',
      emailVerified: true,
      isAdmin: false,
      jti: `test-jti-${Date.now()}-${Math.random()}`,
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' },
  );
}

function createClientSocket(token: string): ClientSocket {
  const socket = ioClient(`http://localhost:${port}`, {
    transports: ['websocket'],
    auth: { token },
    autoConnect: false,
  });
  clientSockets.push(socket);
  return socket;
}

function waitForEvent<T = unknown>(socket: ClientSocket, event: string, timeoutMs = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${event}`));
    }, timeoutMs);
    socket.once(event, (data: T) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

function waitForConnect(socket: ClientSocket, timeoutMs = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (socket.connected) return resolve();
    const timer = setTimeout(() => reject(new Error('Connection timeout')), timeoutMs);
    socket.once('connect', () => { clearTimeout(timer); resolve(); });
    socket.once('connect_error', (err) => { clearTimeout(timer); reject(err); });
  });
}

beforeAll(async () => {
  const { buildApp } = await import('../src/app.js');
  app = await buildApp();
  await app.ready();

  // Clean up test data
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
    where: { email: { startsWith: 'sockettest-' } },
  });

  // Register buyer
  await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: BUYER });
  await prisma.user.update({ where: { email: BUYER.email }, data: { emailVerified: true } });
  const buyerLogin = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: BUYER.email, password: BUYER.password },
  });
  buyerToken = buyerLogin.json().data.tokens.accessToken;
  buyerUserId = buyerLogin.json().data.user.id;

  // Register seller
  await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: SELLER });
  await prisma.user.update({ where: { email: SELLER.email }, data: { emailVerified: true } });
  const sellerLogin = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: SELLER.email, password: SELLER.password },
  });
  sellerToken = sellerLogin.json().data.tokens.accessToken;
  sellerUserId = sellerLogin.json().data.user.id;

  // Create seller profile with Stripe enabled
  await app.inject({
    method: 'POST',
    url: '/api/v1/sellers',
    headers: { authorization: `Bearer ${sellerToken}` },
    payload: { businessName: 'Socket Test Plumbing', bio: 'Test bio', serviceRadiusMiles: 30 },
  });
  const sellerProfile = await prisma.sellerProfile.findFirst({ where: { user: { email: SELLER.email } } });
  await prisma.sellerProfile.update({
    where: { id: sellerProfile!.id },
    data: { stripeAccountId: 'acct_test_socket', stripeChargesEnabled: true, stripePayoutsEnabled: true },
  });

  // Create post → offer → accept (creates conversation)
  const servicesRes = await app.inject({ method: 'GET', url: '/api/v1/categories/services' });
  const plumbingRes = await app.inject({ method: 'GET', url: '/api/v1/categories/plumbing' });
  const postRes = await app.inject({
    method: 'POST',
    url: '/api/v1/posts',
    headers: { authorization: `Bearer ${buyerToken}` },
    payload: {
      categoryId: servicesRes.json().data.id,
      subcategoryId: plumbingRes.json().data.id,
      title: 'Socket test plumbing job',
      description: 'Socket test post — professional plumbing service needed for kitchen sink repair.',
      budgetMin: 100, budgetMax: 300, budgetType: 'range',
      locationCity: 'Dallas', locationState: 'TX', urgency: 'within_1_week',
    },
  });
  const postId = postRes.json().data.id;

  const offerRes = await app.inject({
    method: 'POST',
    url: '/api/v1/offers',
    headers: { authorization: `Bearer ${sellerToken}` },
    payload: {
      postId,
      offerType: 'service',
      quoteAmount: 200,
      pricingType: 'flat_rate',
      message: 'I can help with this project. I have extensive experience in plumbing repairs and have been serving the DFW area.',
    },
  });
  await app.inject({
    method: 'POST',
    url: `/api/v1/offers/${offerRes.json().data.id}/accept`,
    headers: { authorization: `Bearer ${buyerToken}` },
  });

  const convo = await prisma.conversation.findFirst({
    where: { participant1Id: buyerUserId, participant2Id: sellerUserId },
  });
  conversationId = convo!.id;

  // Start a Socket.IO server on a random port for testing
  httpServer = createServer();
  const io = initSocketIO(httpServer);
  registerMessagesGateway(io);

  await new Promise<void>((resolve) => {
    httpServer.listen(0, () => {
      const addr = httpServer.address();
      port = typeof addr === 'object' && addr ? addr.port : 0;
      resolve();
    });
  });
}, 30000);

afterEach(() => {
  // Disconnect all client sockets after each test
  for (const s of clientSockets) {
    if (s.connected) s.disconnect();
  }
  clientSockets.length = 0;
});

afterAll(async () => {
  // Clean up Socket.IO — close server and reset singleton to prevent
  // cross-contamination with other test files running in parallel
  const io = getIO();
  if (io) io.close();
  resetIO();
  httpServer?.close();

  // Clean up test data
  await prisma.message.deleteMany({
    where: { conversation: { participant1: { email: { in: [BUYER.email, SELLER.email] } } } },
  });
  await prisma.notification.deleteMany({
    where: { user: { email: { in: [BUYER.email, SELLER.email] } } },
  });
  await prisma.conversation.deleteMany({
    where: { participant1: { email: { in: [BUYER.email, SELLER.email] } } },
  });
  await prisma.transaction.deleteMany({ where: { buyer: { email: BUYER.email } } });
  await prisma.offer.deleteMany({ where: { post: { buyer: { email: BUYER.email } } } });
  await prisma.post.deleteMany({ where: { buyer: { email: BUYER.email } } });
  await prisma.sellerProfile.deleteMany({
    where: { user: { email: { in: [BUYER.email, SELLER.email] } } },
  });
  await prisma.user.deleteMany({ where: { email: { startsWith: 'sockettest-' } } });

  // Clean presence keys
  const presenceKeys = await redis.keys('presence:*');
  if (presenceKeys.length > 0) await redis.del(...presenceKeys);

  await prisma.$disconnect();
  await app.close();
});

// ── Connection & Authentication ──────────────────────────────────

describe('Socket.IO — Connection & Authentication', () => {
  it('should connect with valid JWT token', async () => {
    const socket = createClientSocket(buyerToken);
    socket.connect();
    await waitForConnect(socket);

    expect(socket.connected).toBe(true);
  });

  it('should reject connection without token', async () => {
    const socket = ioClient(`http://localhost:${port}`, {
      transports: ['websocket'],
      autoConnect: false,
    });
    clientSockets.push(socket);

    socket.connect();

    const err = await waitForEvent<Error>(socket, 'connect_error');
    expect(err.message).toContain('Authentication required');
    expect(socket.connected).toBe(false);
  });

  it('should reject connection with invalid JWT', async () => {
    const socket = createClientSocket('invalid-token-value');
    socket.connect();

    const err = await waitForEvent<Error>(socket, 'connect_error');
    expect(err.message).toContain('Invalid or expired token');
    expect(socket.connected).toBe(false);
  });

  it('should reject connection with blacklisted token', async () => {
    // Generate a token and blacklist its JTI
    const jti = `blacklisted-jti-${Date.now()}`;
    const token = jwt.sign(
      { sub: buyerUserId, email: BUYER.email, accountType: 'buyer', emailVerified: true, isAdmin: false, jti },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' },
    );
    await redis.set(`auth:blacklist:${jti}`, '1', 'EX', 900);

    const socket = createClientSocket(token);
    socket.connect();

    const err = await waitForEvent<Error>(socket, 'connect_error');
    expect(err.message).toContain('Token has been revoked');

    await redis.del(`auth:blacklist:${jti}`);
  });
});

// ── Conversation Room Management ─────────────────────────────────

describe('Socket.IO — Conversation Rooms', () => {
  it('should join a conversation room (valid participant)', async () => {
    const socket = createClientSocket(buyerToken);
    socket.connect();
    await waitForConnect(socket);

    socket.emit('join_conversation', conversationId);

    const data = await waitForEvent<{ conversationId: string }>(socket, 'joined_conversation');
    expect(data.conversationId).toBe(conversationId);
  });

  it('should reject joining a conversation the user is not part of', async () => {
    // Create a third user who is NOT a participant
    const otherEmail = 'sockettest-outsider@example.com';
    await prisma.user.deleteMany({ where: { email: otherEmail } });
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: otherEmail, password: 'TestPass123!', firstName: 'Other', lastName: 'User',
        accountType: 'buyer', agreeToTerms: true, agreeToPrivacy: true,
      },
    });
    const otherUser = await prisma.user.update({
      where: { email: otherEmail },
      data: { emailVerified: true },
    });
    const otherToken = generateToken(otherUser.id, otherEmail);

    const socket = createClientSocket(otherToken);
    socket.connect();
    await waitForConnect(socket);

    socket.emit('join_conversation', conversationId);

    const errData = await waitForEvent<{ message: string }>(socket, 'error');
    expect(errData.message).toContain('not found or access denied');

    await prisma.user.deleteMany({ where: { email: otherEmail } });
  });

  it('should leave a conversation room without error', async () => {
    const socket = createClientSocket(buyerToken);
    socket.connect();
    await waitForConnect(socket);

    socket.emit('join_conversation', conversationId);
    await waitForEvent(socket, 'joined_conversation');

    // Leave should not throw
    socket.emit('leave_conversation', conversationId);

    // Give it a moment then verify socket is still connected
    await new Promise((r) => setTimeout(r, 200));
    expect(socket.connected).toBe(true);
  });
});

// ── Typing Indicators ────────────────────────────────────────────

describe('Socket.IO — Typing Indicators', () => {
  it('should broadcast typing_start to other participants in the conversation', async () => {
    const buyerSocket = createClientSocket(buyerToken);
    const sellerSocket = createClientSocket(sellerToken);

    buyerSocket.connect();
    sellerSocket.connect();
    await Promise.all([waitForConnect(buyerSocket), waitForConnect(sellerSocket)]);

    // Both join the conversation
    buyerSocket.emit('join_conversation', conversationId);
    sellerSocket.emit('join_conversation', conversationId);
    await Promise.all([
      waitForEvent(buyerSocket, 'joined_conversation'),
      waitForEvent(sellerSocket, 'joined_conversation'),
    ]);

    // Buyer starts typing → seller should receive
    const typingPromise = waitForEvent<{ conversationId: string; userId: string }>(
      sellerSocket,
      'typing_start',
    );
    buyerSocket.emit('typing_start', conversationId);

    const typingData = await typingPromise;
    expect(typingData.conversationId).toBe(conversationId);
    expect(typingData.userId).toBe(buyerUserId);
  });

  it('should broadcast typing_stop to other participants', async () => {
    const buyerSocket = createClientSocket(buyerToken);
    const sellerSocket = createClientSocket(sellerToken);

    buyerSocket.connect();
    sellerSocket.connect();
    await Promise.all([waitForConnect(buyerSocket), waitForConnect(sellerSocket)]);

    buyerSocket.emit('join_conversation', conversationId);
    sellerSocket.emit('join_conversation', conversationId);
    await Promise.all([
      waitForEvent(buyerSocket, 'joined_conversation'),
      waitForEvent(sellerSocket, 'joined_conversation'),
    ]);

    const stopPromise = waitForEvent<{ conversationId: string; userId: string }>(
      sellerSocket,
      'typing_stop',
    );
    buyerSocket.emit('typing_stop', conversationId);

    const stopData = await stopPromise;
    expect(stopData.conversationId).toBe(conversationId);
    expect(stopData.userId).toBe(buyerUserId);
  });

  it('should NOT send typing events back to the sender', async () => {
    // Use fresh tokens to avoid state leaking from parallel test suites
    const freshBuyerToken = generateToken(buyerUserId, BUYER.email);
    const buyerSocket = createClientSocket(freshBuyerToken);

    // Set up the listener BEFORE connecting to avoid any race conditions
    let receivedOwnTyping = false;
    buyerSocket.on('typing_start', () => { receivedOwnTyping = true; });

    buyerSocket.connect();
    await waitForConnect(buyerSocket, 5000);

    buyerSocket.emit('join_conversation', conversationId);
    await waitForEvent(buyerSocket, 'joined_conversation', 5000);

    buyerSocket.emit('typing_start', conversationId);

    // Wait a bit to confirm no echo — socket.to() excludes sender by design
    await new Promise((r) => setTimeout(r, 500));
    expect(receivedOwnTyping).toBe(false);
  });
});

// ── Real-Time Message Delivery ───────────────────────────────────

describe('Socket.IO — Real-Time Message Delivery', () => {
  it('should deliver new_message to conversation room when message sent via REST', async () => {
    const sellerSocket = createClientSocket(sellerToken);
    sellerSocket.connect();
    await waitForConnect(sellerSocket);

    sellerSocket.emit('join_conversation', conversationId);
    await waitForEvent(sellerSocket, 'joined_conversation');

    // Listen for real-time message delivery
    const messagePromise = waitForEvent<{
      id: string;
      conversationId: string;
      senderId: string;
      messageText: string;
    }>(sellerSocket, 'new_message');

    // Buyer sends message via REST API
    await app.inject({
      method: 'POST',
      url: `/api/v1/messages/conversations/${conversationId}/messages`,
      headers: { authorization: `Bearer ${buyerToken}` },
      payload: { messageText: 'Socket delivery test message' },
    });

    const msg = await messagePromise;
    expect(msg.conversationId).toBe(conversationId);
    expect(msg.senderId).toBe(buyerUserId);
    expect(msg.messageText).toBe('Socket delivery test message');
    expect(msg.id).toBeDefined();
  });

  it('should deliver notification to recipient user room on new message', async () => {
    const sellerSocket = createClientSocket(sellerToken);
    sellerSocket.connect();
    await waitForConnect(sellerSocket);

    // Seller is in their user room automatically (joined on connect)
    const notifPromise = waitForEvent<{
      type: string;
      conversationId: string;
      message: { messageText: string };
    }>(sellerSocket, 'notification');

    // Buyer sends message via REST
    await app.inject({
      method: 'POST',
      url: `/api/v1/messages/conversations/${conversationId}/messages`,
      headers: { authorization: `Bearer ${buyerToken}` },
      payload: { messageText: 'Notification delivery test' },
    });

    const notif = await notifPromise;
    expect(notif.type).toBe('message_received');
    expect(notif.conversationId).toBe(conversationId);
    expect(notif.message.messageText).toBe('Notification delivery test');
  });

  it('should emit messages_read when conversation marked as read via REST', async () => {
    // Buyer sends a message first so there's something unread
    await app.inject({
      method: 'POST',
      url: `/api/v1/messages/conversations/${conversationId}/messages`,
      headers: { authorization: `Bearer ${buyerToken}` },
      payload: { messageText: 'Message before read test' },
    });

    // Use fresh token to avoid stale socket state
    const freshBuyerToken = generateToken(buyerUserId, BUYER.email);
    const buyerSocket = createClientSocket(freshBuyerToken);
    buyerSocket.connect();
    await waitForConnect(buyerSocket);
    buyerSocket.emit('join_conversation', conversationId);
    await waitForEvent(buyerSocket, 'joined_conversation');

    // Set up listener BEFORE triggering the event
    const readPromise = waitForEvent<{
      conversationId: string;
      readBy: string;
    }>(buyerSocket, 'messages_read');

    // Small delay to ensure room join is fully propagated
    await new Promise((r) => setTimeout(r, 100));

    // Seller marks conversation as read via REST
    await app.inject({
      method: 'PUT',
      url: `/api/v1/messages/conversations/${conversationId}/mark-read`,
      headers: { authorization: `Bearer ${sellerToken}` },
    });

    const readData = await readPromise;
    expect(readData.conversationId).toBe(conversationId);
    expect(readData.readBy).toBe(sellerUserId);
  });
});

// ── Presence Tracking ────────────────────────────────────────────

describe('Socket.IO — Presence', () => {
  it('should set user as online when connected', async () => {
    const socket = createClientSocket(buyerToken);
    socket.connect();
    await waitForConnect(socket);

    // Wait a moment for presence to be set
    await new Promise((r) => setTimeout(r, 200));

    const presenceValue = await redis.get(`presence:${buyerUserId}`);
    expect(presenceValue).toBeTruthy(); // Should contain socketId
  });

  it('should clean up presence on disconnect', async () => {
    const socket = createClientSocket(buyerToken);
    socket.connect();
    await waitForConnect(socket);

    // Wait for presence to be set
    await new Promise((r) => setTimeout(r, 200));
    const socketId = socket.id!;
    expect(await redis.get(`presence:${buyerUserId}`)).toBeTruthy();

    // Disconnect
    socket.disconnect();
    await new Promise((r) => setTimeout(r, 500));

    // Presence should be cleaned up
    const presenceAfter = await redis.get(`presence:${buyerUserId}`);
    expect(presenceAfter).toBeNull();
    const socketMapping = await redis.get(`presence:socket:${socketId}`);
    expect(socketMapping).toBeNull();
  });

  it('should refresh presence on heartbeat', async () => {
    const socket = createClientSocket(buyerToken);
    socket.connect();
    await waitForConnect(socket);
    await new Promise((r) => setTimeout(r, 200));

    // Get initial TTL
    const ttlBefore = await redis.ttl(`presence:${buyerUserId}`);

    // Send heartbeat
    socket.emit('heartbeat');
    await new Promise((r) => setTimeout(r, 200));

    // TTL should be refreshed (close to 300 seconds)
    const ttlAfter = await redis.ttl(`presence:${buyerUserId}`);
    expect(ttlAfter).toBeGreaterThanOrEqual(ttlBefore);
    expect(ttlAfter).toBeLessThanOrEqual(300);
  });
});
