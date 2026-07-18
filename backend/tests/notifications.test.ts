import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/config/database.js';
import type { FastifyInstance } from 'fastify';

process.env.NODE_ENV = 'test';

let app: FastifyInstance;
let userToken: string;
let userId: string;
let notificationId1: string;
let notificationId2: string;
let notificationId3: string;

const USER = {
  email: 'notiftest-user@example.com',
  password: 'TestPass123!',
  firstName: 'Notif',
  lastName: 'User',
  accountType: 'buyer' as const,
  agreeToTerms: true as const,
  agreeToPrivacy: true as const,
};

function userHeaders() {
  return { authorization: `Bearer ${userToken}` };
}

beforeAll(async () => {
  const { buildApp } = await import('../src/app.js');
  app = await buildApp();
  await app.ready();

  // Clean up
  await prisma.notification.deleteMany({
    where: { user: { email: USER.email } },
  });
  await prisma.user.deleteMany({
    where: { email: USER.email },
  });

  // Register + verify + login
  await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: USER,
  });
  await prisma.user.update({
    where: { email: USER.email },
    data: { emailVerified: true },
  });
  const loginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: USER.email, password: USER.password },
  });
  userToken = loginRes.json().data.tokens.accessToken;
  userId = loginRes.json().data.user.id;

  // Create test notifications directly via Prisma
  const n1 = await prisma.notification.create({
    data: {
      userId,
      type: 'new_offer',
      title: 'New Offer Received',
      message: 'You received a new offer on your post.',
      data: { postId: '00000000-0000-0000-0000-000000000001' },
      channels: ['push', 'in_app'],
    },
  });
  notificationId1 = n1.id;

  const n2 = await prisma.notification.create({
    data: {
      userId,
      type: 'message_received',
      title: 'New Message',
      message: 'John sent you a message.',
      data: { conversationId: '00000000-0000-0000-0000-000000000002' },
      channels: ['push', 'in_app'],
    },
  });
  notificationId2 = n2.id;

  const n3 = await prisma.notification.create({
    data: {
      userId,
      type: 'review_reminder',
      title: 'Leave a Review',
      message: 'How was your experience?',
      data: {},
      channels: ['email', 'in_app'],
      read: true,
      readAt: new Date(),
    },
  });
  notificationId3 = n3.id;
});

afterAll(async () => {
  await prisma.notification.deleteMany({
    where: { user: { email: USER.email } },
  });
  await prisma.user.deleteMany({
    where: { email: USER.email },
  });
  await prisma.$disconnect();
  await app.close();
});

// ── GET /notifications ────────────────────────────────────────

describe('GET /api/v1/notifications', () => {
  it('should list notifications', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/notifications',
      headers: userHeaders(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBe(3);
    expect(body.meta.total).toBe(3);
  });

  it('should filter unread only', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/notifications?unreadOnly=true',
      headers: userHeaders(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBe(2);
  });

  it('should filter by type', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/notifications?type=new_offer',
      headers: userHeaders(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBe(1);
    expect(body.data[0].type).toBe('new_offer');
  });

  it('should respect pagination', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/notifications?page=1&limit=2',
      headers: userHeaders(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBe(2);
    expect(body.meta.totalPages).toBe(2);
  });

  it('should reject without auth', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/notifications',
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── PUT /notifications/:id/read ───────────────────────────────

describe('PUT /api/v1/notifications/:notificationId/read', () => {
  it('should mark notification as read', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/notifications/${notificationId1}/read`,
      headers: userHeaders(),
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().success).toBe(true);

    // Verify in DB
    const n = await prisma.notification.findUnique({ where: { id: notificationId1 } });
    expect(n!.read).toBe(true);
    expect(n!.readAt).toBeTruthy();
  });

  it('should return 404 for non-existent notification', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/notifications/a0000000-0000-4000-a000-000000000099/read`,
      headers: userHeaders(),
    });
    expect(res.statusCode).toBe(404);
  });
});

// ── PUT /notifications/read-all ───────────────────────────────

describe('PUT /api/v1/notifications/read-all', () => {
  it('should mark all notifications as read', async () => {
    // Reset n2 to unread first
    await prisma.notification.update({
      where: { id: notificationId2 },
      data: { read: false, readAt: null },
    });

    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/notifications/read-all',
      headers: userHeaders(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.count).toBeGreaterThanOrEqual(1);

    // Verify all are read
    const unread = await prisma.notification.count({
      where: { userId, read: false, deletedAt: null },
    });
    expect(unread).toBe(0);
  });
});

// ── DELETE /notifications/:id ─────────────────────────────────

describe('DELETE /api/v1/notifications/:notificationId', () => {
  it('should soft delete notification', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/notifications/${notificationId3}`,
      headers: userHeaders(),
    });

    expect(res.statusCode).toBe(204);

    // Verify soft delete
    const n = await prisma.notification.findUnique({ where: { id: notificationId3 } });
    expect(n!.deletedAt).toBeTruthy();
  });

  it('should return 404 for already deleted notification', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/notifications/${notificationId3}`,
      headers: userHeaders(),
    });
    expect(res.statusCode).toBe(404);
  });

  it('should exclude deleted from list', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/notifications',
      headers: userHeaders(),
    });

    expect(res.statusCode).toBe(200);
    const ids = res.json().data.map((n: { id: string }) => n.id);
    expect(ids).not.toContain(notificationId3);
  });
});

// ── GET /unread-count ─────────────────────────────────────────

describe('GET /api/v1/notifications/unread-count', () => {
  it('should return the current unread count for the user', async () => {
    const unreadInDb = await prisma.notification.count({
      where: { userId, read: false, deletedAt: null },
    });
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/notifications/unread-count',
      headers: userHeaders(),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.count).toBe(unreadInDb);
  });

  it('should reject without auth', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/notifications/unread-count',
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── GET / PUT /preferences ────────────────────────────────────

describe('Notification preferences', () => {
  it('GET /preferences returns merged defaults', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/notifications/preferences',
      headers: userHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const prefs = res.json().data;
    expect(prefs.push_messages).toBe(true);
    expect(prefs.email_offers).toBe(true);
    expect(prefs.sms_offers).toBe(false);
    expect(prefs.types).toBeDefined();
  });

  it('PUT /preferences merges per-type opt-outs', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/notifications/preferences',
      headers: userHeaders(),
      payload: { types: { offer_received: false } },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.types.offer_received).toBe(false);
  });

  it('createNotification respects per-type opt-out (no row created)', async () => {
    const before = await prisma.notification.count({
      where: { userId, type: 'offer_received' },
    });
    const { NotificationsService } = await import('../src/modules/notifications/notifications.service.js');
    const result = await new NotificationsService().createNotification({
      userId,
      type: 'offer_received',
      title: 'should be suppressed',
      message: 'opt-out should drop this',
      data: {},
      channels: ['in_app'],
    });
    expect(result).toBeNull();
    const after = await prisma.notification.count({
      where: { userId, type: 'offer_received' },
    });
    expect(after).toBe(before);
  });

  it('createNotification still fires for types that are NOT opted out', async () => {
    const { NotificationsService } = await import('../src/modules/notifications/notifications.service.js');
    const result = await new NotificationsService().createNotification({
      userId,
      type: 'transaction_completed',
      title: 'should land',
      message: 'no opt-out for this type',
      data: {},
      channels: ['in_app'],
    });
    expect(result?.id).toBeDefined();
    await prisma.notification.deleteMany({ where: { userId, type: 'transaction_completed' } });
  });

  it('createNotification returns null for a non-existent user (no FK violation) — #216', async () => {
    const ghostUserId = '00000000-0000-0000-0000-0000000000ff';
    const before = await prisma.notification.count({ where: { userId: ghostUserId } });
    const { NotificationsService } = await import('../src/modules/notifications/notifications.service.js');
    const result = await new NotificationsService().createNotification({
      userId: ghostUserId,
      type: 'review_reminder',
      title: 'stale job',
      message: 'this user no longer exists',
      data: {},
      channels: ['in_app'],
    });
    expect(result).toBeNull();
    const after = await prisma.notification.count({ where: { userId: ghostUserId } });
    expect(after).toBe(before);
  });
});
