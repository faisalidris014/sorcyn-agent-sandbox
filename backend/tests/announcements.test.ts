import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '../src/config/database.js';
import type { FastifyInstance } from 'fastify';
import {
  createTestUser,
  makeAdmin,
  authHeaders,
  cleanupTestData,
  type TestUser,
} from './helpers.js';

process.env.NODE_ENV = 'test';

let app: FastifyInstance;
let adminUser: TestUser;
let adminToken: string;
let regularUser: TestUser;

const CLEANUP_PATTERN = 'anntest';

async function clearAnnouncements(): Promise<void> {
  await prisma.systemAnnouncement.deleteMany({});
}

beforeAll(async () => {
  const { buildApp } = await import('../src/app.js');
  app = await buildApp();
  await app.ready();

  await cleanupTestData([CLEANUP_PATTERN]);
  await clearAnnouncements();

  adminUser = await createTestUser(app, {
    email: 'anntest_admin@example.com',
    firstName: 'Ann',
    lastName: 'Admin',
    accountType: 'both',
  });
  adminToken = await makeAdmin(app, adminUser);

  regularUser = await createTestUser(app, {
    email: 'anntest_buyer@example.com',
    firstName: 'Ann',
    lastName: 'Buyer',
    accountType: 'buyer',
  });
});

afterAll(async () => {
  await clearAnnouncements();
  await cleanupTestData([CLEANUP_PATTERN]);
  await app.close();
});

beforeEach(async () => {
  await clearAnnouncements();
});

describe('POST /api/v1/admin/announcements', () => {
  it('creates an announcement as admin (201) and writes an audit log', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/announcements',
      headers: authHeaders(adminToken),
      payload: { message: 'Scheduled maintenance tonight', severity: 'warning' },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBeTruthy();
    expect(body.data.message).toBe('Scheduled maintenance tonight');
    expect(body.data.severity).toBe('warning');
    expect(body.data.endsAt).toBeNull();

    const log = await prisma.auditLog.findFirst({
      where: { action: 'announcement_created', resourceId: body.data.id },
    });
    expect(log).not.toBeNull();
    expect(log?.resourceType).toBe('announcement');
    expect(log?.userId).toBe(adminUser.userId);
  });

  it('defaults severity to info', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/announcements',
      headers: authHeaders(adminToken),
      payload: { message: 'Heads up everyone' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.severity).toBe('info');
  });

  it('rejects a too-short message (400)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/announcements',
      headers: authHeaders(adminToken),
      payload: { message: 'hi' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects endsAt before startsAt (400)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/announcements',
      headers: authHeaders(adminToken),
      payload: {
        message: 'Bad window announcement',
        startsAt: '2026-06-20T00:00:00.000Z',
        endsAt: '2026-06-19T00:00:00.000Z',
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it('forbids non-admin users (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/announcements',
      headers: authHeaders(regularUser.token),
      payload: { message: 'Should not be allowed' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('requires authentication (401)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/announcements',
      payload: { message: 'No token here' },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/v1/announcements/active', () => {
  it('is public and returns active announcements', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/v1/admin/announcements',
      headers: authHeaders(adminToken),
      payload: { message: 'We are live', severity: 'info' },
    });

    const res = await app.inject({ method: 'GET', url: '/api/v1/announcements/active' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].message).toBe('We are live');
  });

  it('excludes future (not-yet-started) announcements', async () => {
    await prisma.systemAnnouncement.create({
      data: {
        message: 'Future banner',
        severity: 'info',
        startsAt: new Date(Date.now() + 60 * 60 * 1000),
        createdBy: adminUser.userId,
      },
    });

    const res = await app.inject({ method: 'GET', url: '/api/v1/announcements/active' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toHaveLength(0);
  });

  it('excludes expired announcements', async () => {
    await prisma.systemAnnouncement.create({
      data: {
        message: 'Expired banner',
        severity: 'critical',
        startsAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() - 60 * 60 * 1000),
        createdBy: adminUser.userId,
      },
    });

    const res = await app.inject({ method: 'GET', url: '/api/v1/announcements/active' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toHaveLength(0);
  });

  it('orders newest-active first', async () => {
    await prisma.systemAnnouncement.createMany({
      data: [
        {
          message: 'Older',
          severity: 'info',
          startsAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          createdBy: adminUser.userId,
        },
        {
          message: 'Newer',
          severity: 'warning',
          startsAt: new Date(Date.now() - 60 * 1000),
          createdBy: adminUser.userId,
        },
      ],
    });

    const res = await app.inject({ method: 'GET', url: '/api/v1/announcements/active' });
    const data = res.json().data;
    expect(data).toHaveLength(2);
    expect(data[0].message).toBe('Newer');
    expect(data[1].message).toBe('Older');
  });
});

describe('DELETE /api/v1/admin/announcements/:id', () => {
  it('clears an announcement and writes an audit log', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/announcements',
      headers: authHeaders(adminToken),
      payload: { message: 'Temporary notice', severity: 'info' },
    });
    const id = created.json().data.id;

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/admin/announcements/${id}`,
      headers: authHeaders(adminToken),
    });
    expect(res.statusCode).toBe(200);

    const active = await app.inject({ method: 'GET', url: '/api/v1/announcements/active' });
    expect(active.json().data).toHaveLength(0);

    const log = await prisma.auditLog.findFirst({
      where: { action: 'announcement_cleared', resourceId: id },
    });
    expect(log).not.toBeNull();
  });

  it('returns 404 for an unknown id', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/admin/announcements/00000000-0000-0000-0000-000000000000',
      headers: authHeaders(adminToken),
    });
    expect(res.statusCode).toBe(404);
  });

  it('forbids non-admin users (403)', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/announcements',
      headers: authHeaders(adminToken),
      payload: { message: 'Admin-only delete target' },
    });
    const id = created.json().data.id;

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/admin/announcements/${id}`,
      headers: authHeaders(regularUser.token),
    });
    expect(res.statusCode).toBe(403);
  });
});
