/**
 * Phase 4 B-2 — Integration tier coverage file.
 *
 * Tier classification: tests/integration/ → tests that exercise app.inject through
 * the Fastify application with real Prisma + Redis (no mocks for infrastructure).
 * The bulk of Phase 4 gap-fill tests live here: payments webhook idempotency,
 * transaction state transitions, and auth session rotation all require real DB + Redis.
 *
 * Coverage threshold for this tier: lines ≥ 60% (B-2 enforcement).
 *
 * This file provides a representative integration smoke test covering auth endpoints.
 * The full coverage from the gap-fill describe blocks in:
 *   - tests/payments.test.ts (Payment webhook idempotency)
 *   - tests/transactions.test.ts (Transaction state transitions)
 *   - tests/auth.test.ts (Auth session rotation)
 * is included in this tier by the per-tier vitest run targeting tests/integration/.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/config/database.js';
import type { FastifyInstance } from 'fastify';

process.env.NODE_ENV = 'test';

let app: FastifyInstance;

beforeAll(async () => {
  const { buildApp } = await import('../../src/app.js');
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await prisma.$disconnect();
  await app.close();
});

describe('Integration: Auth register + login + refresh round-trip', () => {
  it('registers a user, verifies email, logs in, and refreshes the token', async () => {
    const email = `int_smoke_${Date.now()}@example.com`;
    const password = 'IntTest!2026';

    // Register
    const regRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email,
        password,
        firstName: 'Int',
        lastName: 'Smoke',
        accountType: 'buyer',
        agreeToTerms: true,
        agreeToPrivacy: true,
      },
    });
    expect(regRes.statusCode).toBe(201);
    const userId = regRes.json().data.user.id;

    // Verify email in DB
    await prisma.user.update({ where: { id: userId }, data: { emailVerified: true } });

    // Login
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email, password },
    });
    expect(loginRes.statusCode).toBe(200);
    const { accessToken, refreshToken } = loginRes.json().data.tokens;
    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();

    // Refresh — rotates the token
    // auth.routes.ts:68 returns { success: true, data: { accessToken, refreshToken, expiresIn } }
    const refreshRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken },
    });
    expect(refreshRes.statusCode).toBe(200);
    const newAccessToken: string = refreshRes.json().data.accessToken;
    const newRefreshToken: string = refreshRes.json().data.refreshToken;
    expect(newAccessToken).toBeTruthy();
    expect(newRefreshToken).not.toBe(refreshToken); // must be rotated

    // Old refresh token is now invalid (rotated out)
    const replayRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken },
    });
    expect(replayRes.statusCode).toBe(401);

    // Cleanup
    await prisma.user.delete({ where: { id: userId } });
  });

  it('returns 401 for protected route without token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/users/me',
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 for expired or invalid access token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/users/me',
      headers: { authorization: 'Bearer invalid.jwt.token' },
    });
    expect(res.statusCode).toBe(401);
  });
});
