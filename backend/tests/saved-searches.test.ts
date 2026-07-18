import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/config/database.js';
import type { FastifyInstance } from 'fastify';

process.env.NODE_ENV = 'test';

let app: FastifyInstance;
let userToken: string;
let userId: string;
let otherUserToken: string;
let otherUserId: string;
let savedSearchId: string;

const USER = {
  email: 'ss-user@example.com',
  password: 'TestPass123!',
  firstName: 'SS',
  lastName: 'User',
  accountType: 'buyer' as const,
  agreeToTerms: true as const,
  agreeToPrivacy: true as const,
};

const OTHER = {
  email: 'ss-other@example.com',
  password: 'TestPass123!',
  firstName: 'SS',
  lastName: 'Other',
  accountType: 'buyer' as const,
  agreeToTerms: true as const,
  agreeToPrivacy: true as const,
};

function userHeaders() {
  return { authorization: `Bearer ${userToken}` };
}

function otherHeaders() {
  return { authorization: `Bearer ${otherUserToken}` };
}

async function registerAndLogin(userData: typeof USER) {
  const regRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: userData,
  });
  const id = regRes.json().data.user.id;
  await prisma.user.update({ where: { id }, data: { emailVerified: true } });
  const loginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: userData.email, password: userData.password },
  });
  return { id, token: loginRes.json().data.tokens.accessToken };
}

beforeAll(async () => {
  const { buildApp } = await import('../src/app.js');
  app = await buildApp();
  await app.ready();

  // Clean up
  await prisma.savedSearch.deleteMany({ where: { user: { email: { in: [USER.email, OTHER.email] } } } });
  await prisma.user.deleteMany({ where: { email: { in: [USER.email, OTHER.email] } } });

  const user = await registerAndLogin(USER);
  userId = user.id;
  userToken = user.token;

  const other = await registerAndLogin(OTHER);
  otherUserId = other.id;
  otherUserToken = other.token;
});

afterAll(async () => {
  await prisma.savedSearch.deleteMany({ where: { user: { email: { in: [USER.email, OTHER.email] } } } });
  await prisma.user.deleteMany({ where: { email: { in: [USER.email, OTHER.email] } } });
  await app.close();
});

describe('Saved Searches Module', () => {
  describe('POST /api/v1/saved-searches', () => {
    it('should create a saved search', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/saved-searches',
        headers: userHeaders(),
        payload: {
          name: 'Plumbing in Dallas',
          searchType: 'posts',
          filters: { category: 'services', city: 'Dallas' },
          notificationsEnabled: true,
        },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('Plumbing in Dallas');
      expect(body.data.searchType).toBe('posts');
      expect(body.data.notificationsEnabled).toBe(true);
      savedSearchId = body.data.id;
    });

    it('should require authentication', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/saved-searches',
        payload: {
          name: 'Test',
          searchType: 'posts',
          filters: {},
        },
      });

      expect(res.statusCode).toBe(401);
    });

    it('should validate search type enum', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/saved-searches',
        headers: userHeaders(),
        payload: {
          name: 'Test',
          searchType: 'invalid',
          filters: {},
        },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/v1/saved-searches', () => {
    it('should list saved searches', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/saved-searches',
        headers: userHeaders(),
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      expect(body.meta.total).toBeGreaterThanOrEqual(1);
    });

    it('should not return other users\' saved searches', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/saved-searches',
        headers: otherHeaders(),
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.length).toBe(0);
    });
  });

  describe('PUT /api/v1/saved-searches/:searchId', () => {
    it('should update a saved search', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/api/v1/saved-searches/${savedSearchId}`,
        headers: userHeaders(),
        payload: {
          name: 'Updated Plumbing Search',
          notificationsEnabled: false,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.name).toBe('Updated Plumbing Search');
      expect(body.data.notificationsEnabled).toBe(false);
    });

    it('should reject update by non-owner', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/api/v1/saved-searches/${savedSearchId}`,
        headers: otherHeaders(),
        payload: { name: 'Hacked' },
      });

      expect(res.statusCode).toBe(403);
    });

    it('should return 404 for non-existent search', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/saved-searches/00000000-0000-0000-0000-000000000000',
        headers: userHeaders(),
        payload: { name: 'Nope' },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/v1/saved-searches/:searchId', () => {
    it('should reject delete by non-owner', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/saved-searches/${savedSearchId}`,
        headers: otherHeaders(),
      });

      expect(res.statusCode).toBe(403);
    });

    it('should soft delete a saved search', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/saved-searches/${savedSearchId}`,
        headers: userHeaders(),
      });

      expect(res.statusCode).toBe(204);

      // Verify it's gone from list
      const listRes = await app.inject({
        method: 'GET',
        url: '/api/v1/saved-searches',
        headers: userHeaders(),
      });
      expect(listRes.json().data.length).toBe(0);
    });
  });
});
