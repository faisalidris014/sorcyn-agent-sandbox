import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '../src/config/database.js';
import type { FastifyInstance } from 'fastify';

process.env.NODE_ENV = 'test';

let app: FastifyInstance;
let accessToken: string;
let userId: string;

const TEST_USER = {
  email: 'usertest@example.com',
  password: 'TestPass123!',
  firstName: 'User',
  lastName: 'Tester',
  accountType: 'buyer' as const,
  agreeToTerms: true as const,
  agreeToPrivacy: true as const,
};

async function registerAndLogin() {
  await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: TEST_USER,
  });

  const loginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: TEST_USER.email, password: TEST_USER.password },
  });
  const body = loginRes.json();
  accessToken = body.data.tokens.accessToken;
  userId = body.data.user.id;
}

function authHeaders() {
  return { authorization: `Bearer ${accessToken}` };
}

beforeAll(async () => {
  const { buildApp } = await import('../src/app.js');
  app = await buildApp();
  await app.ready();

  // Clean up
  await prisma.sellerProfile.deleteMany({
    where: { user: { email: TEST_USER.email } },
  });
  await prisma.user.deleteMany({
    where: { email: TEST_USER.email },
  });

  await registerAndLogin();
});

afterAll(async () => {
  await prisma.sellerProfile.deleteMany({
    where: { user: { email: TEST_USER.email } },
  });
  await prisma.user.deleteMany({
    where: { email: { startsWith: 'usertest' } },
  });
  await prisma.$disconnect();
  await app.close();
});

// ── GET /me ───────────────────────────────────────────────────

describe('GET /api/v1/users/me', () => {
  it('should return current user profile', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/users/me',
      headers: authHeaders(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.email).toBe(TEST_USER.email);
    expect(body.data.firstName).toBe(TEST_USER.firstName);
    expect(body.data.accountType).toBe('buyer');
    // Should not expose passwordHash
    expect(body.data.passwordHash).toBeUndefined();
  });

  it('should require authentication', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/users/me',
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── PATCH /me ─────────────────────────────────────────────────

describe('PATCH /api/v1/users/me', () => {
  it('should update profile fields', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/me',
      headers: authHeaders(),
      payload: {
        firstName: 'Updated',
        bio: 'Hello world',
        locationCity: 'Dallas',
        locationState: 'TX',
        locationZip: '75201',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.firstName).toBe('Updated');
    expect(body.data.bio).toBe('Hello world');
    expect(body.data.locationCity).toBe('Dallas');
    expect(body.data.locationState).toBe('TX');
    expect(body.data.locationZip).toBe('75201');
  });

  it('should accept partial updates', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/me',
      headers: authHeaders(),
      payload: { bio: 'Just bio update' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.bio).toBe('Just bio update');
    // firstName should remain from previous update
    expect(res.json().data.firstName).toBe('Updated');
  });

  it('should reject invalid ZIP code', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/me',
      headers: authHeaders(),
      payload: { locationZip: 'invalid' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('should allow setting fields to null', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/me',
      headers: authHeaders(),
      payload: { bio: null, phone: null },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.bio).toBeNull();
    expect(res.json().data.phone).toBeNull();
  });
});

// ── POST /me/change-password ──────────────────────────────────

describe('POST /api/v1/users/me/change-password', () => {
  it('should change password with correct current password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/users/me/change-password',
      headers: authHeaders(),
      payload: {
        currentPassword: TEST_USER.password,
        newPassword: 'NewPass456!',
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.message).toContain('changed successfully');

    // Login with new password
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_USER.email, password: 'NewPass456!' },
    });
    expect(loginRes.statusCode).toBe(200);
    accessToken = loginRes.json().data.tokens.accessToken;

    // Change back
    await app.inject({
      method: 'POST',
      url: '/api/v1/users/me/change-password',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        currentPassword: 'NewPass456!',
        newPassword: TEST_USER.password,
      },
    });
    // Re-login with original
    const relogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_USER.email, password: TEST_USER.password },
    });
    accessToken = relogin.json().data.tokens.accessToken;
  });

  it('should reject wrong current password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/users/me/change-password',
      headers: authHeaders(),
      payload: {
        currentPassword: 'WrongOldPass123!',
        newPassword: 'NewPass456!',
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.detail).toContain('incorrect');
  });

  it('should reject same password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/users/me/change-password',
      headers: authHeaders(),
      payload: {
        currentPassword: TEST_USER.password,
        newPassword: TEST_USER.password,
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.detail).toContain('different');
  });
});

// ── PATCH /me/account-type ────────────────────────────────────

describe('PATCH /api/v1/users/me/account-type', () => {
  it('should switch to both and auto-create seller profile', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/me/account-type',
      headers: authHeaders(),
      payload: { accountType: 'both' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.accountType).toBe('both');

    // Verify seller profile was created
    const sp = await prisma.sellerProfile.findUnique({ where: { userId } });
    expect(sp).not.toBeNull();
  });

  it('should switch to buyer', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/me/account-type',
      headers: authHeaders(),
      payload: { accountType: 'buyer' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.accountType).toBe('buyer');
  });
});

// ── PATCH /me/photo ──────────────────────────────────────────

describe('PATCH /api/v1/users/me/photo', () => {
  it('should update profile photo URL', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/me/photo',
      headers: authHeaders(),
      payload: { photoUrl: 'https://cdn.example.com/photos/avatar.jpg' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.profilePhotoUrl).toBe('https://cdn.example.com/photos/avatar.jpg');
  });

  it('should reject invalid URL', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/me/photo',
      headers: authHeaders(),
      payload: { photoUrl: 'not-a-url' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('should reject without authentication', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/me/photo',
      payload: { photoUrl: 'https://cdn.example.com/photos/avatar.jpg' },
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── PUT /me/marketplace-context ─────────────────────────────

describe('PUT /api/v1/users/me/marketplace-context', () => {
  it('should switch to b2c context', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/users/me/marketplace-context',
      headers: authHeaders(),
      payload: { context: 'b2c' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.activeMarketplace).toBe('b2c');
  });

  it('should reject context not in user allowed contexts', async () => {
    // Default user contexts is ['b2c'], so b2b should be rejected
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/users/me/marketplace-context',
      headers: authHeaders(),
      payload: { context: 'b2b' },
    });
    expect(res.statusCode).toBe(409);
  });

  it('should reject invalid context value', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/users/me/marketplace-context',
      headers: authHeaders(),
      payload: { context: 'invalid' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('should reject without authentication', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/users/me/marketplace-context',
      payload: { context: 'b2c' },
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── PUT /me/fcm-token ─────────────────────────────────────────

describe('PUT /api/v1/users/me/fcm-token', () => {
  it('should update FCM token', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/users/me/fcm-token',
      headers: authHeaders(),
      payload: { fcmToken: 'test-fcm-token-123' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.message).toContain('FCM token updated');
  });
});

// ── GET /:userId ──────────────────────────────────────────────

describe('GET /api/v1/users/:userId', () => {
  it('should return public profile for valid user', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/users/${userId}`,
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.id).toBe(userId);
    expect(body.data.firstName).toBeDefined();
    // Public profile should not expose email or sensitive fields
    expect(body.data.email).toBeUndefined();
    expect(body.data.phone).toBeUndefined();
    expect(body.data.notificationPreferences).toBeUndefined();
  });

  it('should return 404 for non-existent user', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/users/00000000-0000-0000-0000-000000000000',
    });
    expect(res.statusCode).toBe(404);
  });

  it('should return 400 for invalid UUID', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/users/not-a-uuid',
    });
    expect(res.statusCode).toBe(400);
  });
});

// ── DELETE /me ─────────────────────────────────────────────────

describe('DELETE /api/v1/users/me', () => {
  it('should reject with wrong password', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/users/me',
      headers: authHeaders(),
      payload: { password: 'WrongPassword123!' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('should soft delete account with correct password', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/users/me',
      headers: authHeaders(),
      payload: { password: TEST_USER.password },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.message).toContain('deleted');

    // User should be soft-deleted
    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user!.deletedAt).not.toBeNull();
    expect(user!.status).toBe('deleted');
    // Email should be prefixed for reuse
    expect(user!.email).toContain('deleted_');
  });
});
