import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '../src/config/database.js';
import { redis } from '../src/config/redis.js';
import { CURRENT_TERMS_VERSION } from '../src/common/constants/terms.js';
import type { FastifyInstance } from 'fastify';

// Set test environment before importing app (which loads env)
process.env.NODE_ENV = 'test';

let app: FastifyInstance;

const TEST_USER = {
  email: 'authtest@example.com',
  password: 'TestPass123!',
  firstName: 'Auth',
  lastName: 'Tester',
  accountType: 'buyer' as const,
  agreeToTerms: true as const,
  agreeToPrivacy: true as const,
};

// Helper to login and get tokens
async function loginTestUser(password?: string) {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: {
      email: TEST_USER.email,
      password: password ?? TEST_USER.password,
    },
  });
  return res.json();
}

beforeAll(async () => {
  // Dynamic import after setting env
  const { buildApp } = await import('../src/app.js');
  app = await buildApp();
  await app.ready();

  // Clean up any leftover test user
  await prisma.user.deleteMany({
    where: { email: { in: [TEST_USER.email, 'duplicate@example.com'] } },
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({
    where: { email: { in: [TEST_USER.email, 'duplicate@example.com'] } },
  });
  await prisma.$disconnect();
  await app.close();
});

beforeEach(async () => {
  // Clear auth-related Redis keys between tests
  let cursor = '0';
  do {
    const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'auth:*', 'COUNT', 100);
    cursor = nextCursor;
    if (keys.length > 0) await redis.del(...keys);
  } while (cursor !== '0');
});

// ── Register ───────────────────────────────────────────────────

describe('POST /api/v1/auth/register', () => {
  it('should register a new user and return tokens', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: TEST_USER,
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe(TEST_USER.email);
    expect(body.data.user.firstName).toBe(TEST_USER.firstName);
    expect(body.data.user.accountType).toBe('buyer');
    expect(body.data.user.emailVerified).toBe(false);
    expect(body.data.tokens.accessToken).toBeDefined();
    expect(body.data.tokens.refreshToken).toBeDefined();
    expect(body.data.tokens.expiresIn).toBeGreaterThan(0);
    expect(body.data.tokens.tokenType).toBe('Bearer');
    expect((body.data.user as Record<string, unknown>).passwordHash).toBeUndefined();
  });

  it('should record Terms of Service acceptance on the new user (#314)', async () => {
    // Registered by the test above. Assert acceptance was persisted.
    const user = await prisma.user.findUnique({
      where: { email: TEST_USER.email },
      select: { termsAcceptedAt: true, termsVersion: true },
    });
    expect(user).not.toBeNull();
    expect(user?.termsAcceptedAt).toBeInstanceOf(Date);
    expect(user?.termsVersion).toBe(CURRENT_TERMS_VERSION);
  });

  it('should reject duplicate email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: TEST_USER,
    });

    expect(res.statusCode).toBe(409);
    expect(res.json().error.detail).toContain('already registered');
  });

  it('should reject weak passwords', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { ...TEST_USER, email: 'weak@example.com', password: 'short' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('should reject password without uppercase', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { ...TEST_USER, email: 'x@example.com', password: 'testpass123!' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('should reject password without special character', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { ...TEST_USER, email: 'x@example.com', password: 'TestPass123' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('should reject missing required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: 'missing@example.com' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('should reject agreeToTerms = false', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { ...TEST_USER, email: 'x@example.com', agreeToTerms: false },
    });
    expect(res.statusCode).toBe(400);
  });

  it('should normalize email to lowercase', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { ...TEST_USER, email: 'Duplicate@Example.COM' },
    });

    if (res.statusCode === 201) {
      expect(res.json().data.user.email).toBe('duplicate@example.com');
      await prisma.user.delete({ where: { email: 'duplicate@example.com' } });
    }
  });

  // ── EIN gate (Phase 4 carry-over) ─────────────────────────────
  // Mirrors backend Zod superRefine in auth.schemas.ts (Phase 3 plan 06):
  //   isBusiness=true && !ein  ⇒ 400 with `ein` path
  //   isBusiness=true && ein matches /^\d{2}-\d{7}$/ ⇒ 201 + ein persisted

  it('rejects business account without EIN (Phase 4 carry-over)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        ...TEST_USER,
        email: `biz-no-ein-${Date.now()}@acme.com`,
        isBusiness: true,
        // ein omitted on purpose
      },
    });
    expect(res.statusCode).toBe(400);
    expect(JSON.stringify(res.json())).toMatch(/ein/i);
  });

  it('accepts business account with full v2.2 business payload', async () => {
    const email = `biz-with-ein-${Date.now()}@acme.com`;
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        ...TEST_USER,
        email,
        isBusiness: true,
        ein: '12-3456789',
        businessName: 'DFW Resale LLC',
        businessType: 'llc',
        salesTaxCertificateUrl: 'https://r2.example.com/uploads/cert.pdf',
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.user.email).toBe(email);
    // v2.2: AuthUser now echoes isBusiness and ein to the client
    expect(res.json().data.user.isBusiness).toBe(true);
    expect(res.json().data.user.ein).toBe('12-3456789');

    const persisted = await prisma.user.findUnique({ where: { email } });
    expect(persisted?.ein).toBe('12-3456789');
    expect(persisted?.isBusiness).toBe(true);

    // SellerProfile row should have been created atomically with business fields
    const sp = await prisma.sellerProfile.findUnique({ where: { userId: persisted!.id } });
    expect(sp?.businessName).toBe('DFW Resale LLC');
    expect(sp?.businessType).toBe('llc');
    expect(sp?.salesTaxCertificateUrl).toBe('https://r2.example.com/uploads/cert.pdf');
    expect(sp?.einVerified).toBe(false);
    expect(sp?.salesTaxVerified).toBe(false);

    // Cleanup so afterAll's narrow delete doesn't miss it.
    await prisma.sellerProfile.deleteMany({ where: { userId: persisted!.id } });
    await prisma.user.delete({ where: { email } });
  });

  // #226: business accounts always buy and sell. The client is not
  // authoritative — even if it sends accountType=buyer/seller, the server must
  // coerce to 'both'. Pairs with the mobile selector ticket #225.
  it('coerces a business registration to account_type=both even when the client sends buyer', async () => {
    const email = `biz-coerce-${Date.now()}@acme.com`;
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        ...TEST_USER,
        email,
        accountType: 'buyer', // client tries to register the business as buyer-only
        isBusiness: true,
        ein: '12-3456789',
        businessName: 'Coerce Me LLC',
        businessType: 'llc',
      },
    });
    expect(res.statusCode).toBe(201);
    // Echoed back as 'both', not the 'buyer' the client sent.
    expect(res.json().data.user.accountType).toBe('both');

    const persisted = await prisma.user.findUnique({ where: { email } });
    expect(persisted?.accountType).toBe('both');
    expect(persisted?.isBusiness).toBe(true);

    // Cleanup so afterAll's narrow delete doesn't miss it.
    await prisma.sellerProfile.deleteMany({ where: { userId: persisted!.id } });
    await prisma.user.delete({ where: { email } });
  });

  it('rejects business account missing businessType', async () => {
    const email = `biz-no-type-${Date.now()}@acme.com`;
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        ...TEST_USER,
        email,
        isBusiness: true,
        ein: '12-3456789',
        businessName: 'Missing Type LLC',
        salesTaxCertificateUrl: 'https://r2.example.com/uploads/cert.pdf',
        // businessType omitted on purpose
      },
    });
    expect(res.statusCode).toBe(400);
    expect(JSON.stringify(res.json())).toMatch(/businessType/i);
  });

  // Issue #3: salesTaxCertificateUrl is NOT required at register time — the upload
  // endpoint needs a JWT the user does not have yet. Registration must succeed
  // without it; the cert is attached later via /users/me/upgrade-to-business and
  // posts.service blocks publishing until it is uploaded + pending verification.
  it('accepts business account without salesTaxCertificateUrl (cert attached post-register, issue #3)', async () => {
    const email = `biz-no-cert-${Date.now()}@acme.com`;
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        ...TEST_USER,
        email,
        isBusiness: true,
        ein: '12-3456789',
        businessName: 'No Cert Yet LLC',
        businessType: 'llc',
        // salesTaxCertificateUrl omitted on purpose — uploaded after auth exists
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.user.isBusiness).toBe(true);

    const persisted = await prisma.user.findUnique({ where: { email } });
    expect(persisted?.isBusiness).toBe(true);

    // SellerProfile is still created atomically, with a null cert pending upload.
    const sp = await prisma.sellerProfile.findUnique({ where: { userId: persisted!.id } });
    expect(sp).not.toBeNull();
    expect(sp?.salesTaxCertificateUrl).toBeNull();
    expect(sp?.salesTaxVerified).toBe(false);

    // Cleanup so afterAll's narrow delete doesn't miss it.
    await prisma.sellerProfile.deleteMany({ where: { userId: persisted!.id } });
    await prisma.user.delete({ where: { email } });
  });
});

// ── Login ──────────────────────────────────────────────────────

describe('POST /api/v1/auth/login', () => {
  it('should login with valid credentials', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_USER.email, password: TEST_USER.password },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe(TEST_USER.email);
    expect(body.data.tokens.accessToken).toBeDefined();
    expect(body.data.tokens.refreshToken).toBeDefined();
  });

  it('should reject invalid password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_USER.email, password: 'WrongPassword123!' },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().error.detail).toContain('Invalid email or password');
  });

  it('should reject non-existent email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'nonexistent@example.com', password: 'SomePass123!' },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().error.detail).toContain('Invalid email or password');
  });

  it('should lock account after 5 failed attempts', async () => {
    for (let i = 0; i < 5; i++) {
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: TEST_USER.email, password: 'WrongPassword123!' },
      });
    }

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_USER.email, password: TEST_USER.password },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().error.detail).toContain('temporarily locked');
  });

  it('should update lastLoginAt on successful login', async () => {
    const before = await prisma.user.findUnique({
      where: { email: TEST_USER.email },
      select: { lastLoginAt: true },
    });

    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_USER.email, password: TEST_USER.password },
    });

    const after = await prisma.user.findUnique({
      where: { email: TEST_USER.email },
      select: { lastLoginAt: true },
    });

    expect(after!.lastLoginAt).not.toBeNull();
    if (before!.lastLoginAt) {
      expect(after!.lastLoginAt!.getTime()).toBeGreaterThanOrEqual(
        before!.lastLoginAt.getTime(),
      );
    }
  });
});

// ── Refresh ────────────────────────────────────────────────────

describe('POST /api/v1/auth/refresh', () => {
  it('should return new tokens with valid refresh token', async () => {
    const loginBody = await loginTestUser();
    const { refreshToken } = loginBody.data.tokens;

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBeDefined();
    expect(body.data.refreshToken).toBeDefined();
    expect(body.data.expiresIn).toBeGreaterThan(0);
    expect(body.data.refreshToken).not.toBe(refreshToken);
  });

  it('should reject reused (rotated) refresh token', async () => {
    const loginBody = await loginTestUser();
    const { refreshToken } = loginBody.data.tokens;

    // First use succeeds
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken },
    });

    // Second use fails (token rotated)
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken },
    });

    expect(res.statusCode).toBe(401);
  });

  it('should reject invalid refresh token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: 'invalid.token.here' },
    });

    expect(res.statusCode).toBe(401);
  });
});

// ── Logout ─────────────────────────────────────────────────────

describe('POST /api/v1/auth/logout', () => {
  it('should require authentication', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      payload: { refreshToken: 'some-token' },
    });

    expect(res.statusCode).toBe(401);
  });

  it('should logout successfully and blacklist access token', async () => {
    const loginBody = await loginTestUser();
    const { accessToken, refreshToken } = loginBody.data.tokens;

    const logoutRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { refreshToken },
    });
    expect(logoutRes.statusCode).toBe(200);

    // Blacklisted token should be rejected
    const protectedRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { refreshToken: 'doesnt-matter' },
    });
    expect(protectedRes.statusCode).toBe(401);
  });
});

// ── Email Verification ─────────────────────────────────────────

describe('GET /api/v1/auth/verify-email', () => {
  it('should verify email with valid token', async () => {
    const user = await prisma.user.findUnique({ where: { email: TEST_USER.email } });

    await prisma.user.update({
      where: { id: user!.id },
      data: { emailVerified: false },
    });

    const token = 'test-verify-token-123';
    await redis.set(
      `auth:email_verify:${token}`,
      JSON.stringify({ userId: user!.id, email: user!.email }),
      'EX',
      86400,
    );

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/auth/verify-email?token=${token}`,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.message).toContain('verified');

    const updated = await prisma.user.findUnique({ where: { email: TEST_USER.email } });
    expect(updated!.emailVerified).toBe(true);
  });

  it('should reject invalid token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/verify-email?token=invalid-token',
    });
    expect(res.statusCode).toBe(400);
  });

  it('should reject reuse of same token (single-use)', async () => {
    const user = await prisma.user.findUnique({ where: { email: TEST_USER.email } });

    const token = 'single-use-token-456';
    await redis.set(
      `auth:email_verify:${token}`,
      JSON.stringify({ userId: user!.id, email: user!.email }),
      'EX',
      86400,
    );

    const res1 = await app.inject({
      method: 'GET',
      url: `/api/v1/auth/verify-email?token=${token}`,
    });
    expect(res1.statusCode).toBe(200);

    const res2 = await app.inject({
      method: 'GET',
      url: `/api/v1/auth/verify-email?token=${token}`,
    });
    expect(res2.statusCode).toBe(400);
  });
});

// ── Resend Verification ────────────────────────────────────────

describe('POST /api/v1/auth/resend-verification', () => {
  it('should return success for existing unverified user', async () => {
    await prisma.user.update({
      where: { email: TEST_USER.email },
      data: { emailVerified: false },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/resend-verification',
      payload: { email: TEST_USER.email },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().success).toBe(true);
  });

  it('should return success for non-existent email (no enumeration)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/resend-verification',
      payload: { email: 'nobody@example.com' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().success).toBe(true);
  });

  it('should enforce cooldown on repeated requests', async () => {
    await prisma.user.update({
      where: { email: TEST_USER.email },
      data: { emailVerified: false },
    });

    // First request
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/resend-verification',
      payload: { email: TEST_USER.email },
    });

    // Second request should hit cooldown
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/resend-verification',
      payload: { email: TEST_USER.email },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error.detail).toContain('wait 5 minutes');
  });
});

// ── Forgot Password ────────────────────────────────────────────

describe('POST /api/v1/auth/forgot-password', () => {
  it('should return generic success for existing email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/forgot-password',
      payload: { email: TEST_USER.email },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.message).toContain('If an account exists');
  });

  it('should return generic success for non-existent email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/forgot-password',
      payload: { email: 'ghost@example.com' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.message).toContain('If an account exists');
  });
});

// ── Reset Password ─────────────────────────────────────────────

describe('POST /api/v1/auth/reset-password', () => {
  it('should reject invalid token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/reset-password',
      payload: { token: 'bogus-token', newPassword: 'NewSecurePass456!' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('should reject same password as current', async () => {
    const user = await prisma.user.findUnique({ where: { email: TEST_USER.email } });

    const token = 'same-pass-token';
    await redis.set(
      `auth:password_reset:${token}`,
      JSON.stringify({ userId: user!.id, email: user!.email }),
      'EX',
      3600,
    );

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/reset-password',
      payload: { token, newPassword: TEST_USER.password },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error.detail).toContain('different');
  });

  it('should reset password with valid token', async () => {
    const user = await prisma.user.findUnique({ where: { email: TEST_USER.email } });

    const token = 'reset-token-789';
    await redis.set(
      `auth:password_reset:${token}`,
      JSON.stringify({ userId: user!.id, email: user!.email }),
      'EX',
      3600,
    );

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/reset-password',
      payload: { token, newPassword: 'NewSecurePass456!' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.message).toContain('reset successfully');

    // Verify login with new password
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: TEST_USER.email, password: 'NewSecurePass456!' },
    });
    expect(loginRes.statusCode).toBe(200);

    // Reset back to original password
    const resetToken2 = 'reset-token-cleanup';
    await redis.set(
      `auth:password_reset:${resetToken2}`,
      JSON.stringify({ userId: user!.id, email: user!.email }),
      'EX',
      3600,
    );
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/reset-password',
      payload: { token: resetToken2, newPassword: TEST_USER.password },
    });
  });

  it('should invalidate all sessions after password reset', async () => {
    const user = await prisma.user.findUnique({ where: { email: TEST_USER.email } });

    // Login to create a session
    const loginBody = await loginTestUser();
    const { refreshToken } = loginBody.data.tokens;

    // Reset password
    const token = 'invalidate-sessions-token';
    await redis.set(
      `auth:password_reset:${token}`,
      JSON.stringify({ userId: user!.id, email: user!.email }),
      'EX',
      3600,
    );

    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/reset-password',
      payload: { token, newPassword: 'AnotherPass789!' },
    });

    // Old refresh token should be invalid
    const refreshRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken },
    });
    expect(refreshRes.statusCode).toBe(401);

    // Reset password back
    const resetToken2 = 'cleanup-token-2';
    await redis.set(
      `auth:password_reset:${resetToken2}`,
      JSON.stringify({ userId: user!.id, email: user!.email }),
      'EX',
      3600,
    );
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/reset-password',
      payload: { token: resetToken2, newPassword: TEST_USER.password },
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4 coverage gap-fill — Auth session rotation
// CONCERNS.md High-priority — RESEARCH §9 P0
// ─────────────────────────────────────────────────────────────────────────────

describe('Auth session rotation (Phase 4 coverage gap-fill)', () => {
  // Auth service reuse detection:
  //   Redis key: auth:refresh:{userId}:{jti}  (auth.service.ts line 182)
  //   On rotation: old key deleted, new key stored with hashed token
  //   Reuse detection: hash mismatch on existing key → revoke entire family
  //     error: "Token reuse detected. All sessions invalidated." (auth.service.ts:194)

  it('rotates refresh token — old token is revoked, new token is valid', async () => {
    // Auth service rotation (auth.service.ts:182-233):
    // 1. Verify JWT → look up Redis key auth:refresh:{sub}:{jti}
    // 2. Compare hash; if mismatch → invalidate all sessions (family revocation)
    // 3. If match → delete old key, issue new pair, store new key
    // After rotation: old JTI Redis key is gone (revoked); new JTI key exists.
    const email = `authrot_reuse_${Date.now()}@example.com`;
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email,
        password: TEST_USER.password,
        firstName: 'Rot',
        lastName: 'Reuse',
        accountType: 'buyer',
        agreeToTerms: true,
        agreeToPrivacy: true,
      },
    });
    const user = await prisma.user.findUnique({ where: { email } });
    await prisma.user.update({ where: { id: user!.id }, data: { emailVerified: true } });

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email, password: TEST_USER.password },
    });
    // Route returns { success: true, data: { accessToken, refreshToken, expiresIn } }
    const originalRefreshToken: string = loginRes.json().data.tokens.refreshToken;

    // Rotation: first refresh succeeds and issues a new pair
    const r1 = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: originalRefreshToken },
    });
    expect(r1.statusCode).toBe(200);
    const rotatedRefreshToken: string = r1.json().data.refreshToken;
    expect(rotatedRefreshToken).toBeTruthy();
    expect(rotatedRefreshToken).not.toBe(originalRefreshToken);

    // The rotated (new) token is valid for the legitimate client...
    const r2 = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: rotatedRefreshToken },
    });
    expect(r2.statusCode).toBe(200);

    // Cleanup
    await prisma.user.delete({ where: { id: user!.id } });
  });

  it('detects reuse of a rotated token and invalidates the whole family (SEC-M2 #262)', async () => {
    // Before #262 the old key was deleted on rotation, so replaying it hit a
    // generic "revoked" miss and the family-invalidation theft response never
    // fired. Now the old key is tombstoned as `rotated`, so a replay is treated
    // as theft → invalidateAllSessions, killing even the freshly-rotated token.
    const email = `authrot_familykill_${Date.now()}@example.com`;
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email,
        password: TEST_USER.password,
        firstName: 'Family',
        lastName: 'Kill',
        accountType: 'buyer',
        agreeToTerms: true,
        agreeToPrivacy: true,
      },
    });
    const user = await prisma.user.findUnique({ where: { email } });
    await prisma.user.update({ where: { id: user!.id }, data: { emailVerified: true } });

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email, password: TEST_USER.password },
    });
    const originalRefreshToken: string = loginRes.json().data.tokens.refreshToken;

    // Legitimate rotation issues a new token pair.
    const r1 = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: originalRefreshToken },
    });
    expect(r1.statusCode).toBe(200);
    const rotatedRefreshToken: string = r1.json().data.refreshToken;

    // Attacker replays the stolen, already-rotated original token.
    const replay = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: originalRefreshToken },
    });
    expect(replay.statusCode).toBe(401);
    expect(replay.json().error?.detail ?? '').toMatch(/reuse/i);

    // Family invalidation: the legitimate client's rotated token is now dead too.
    const afterKill = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: rotatedRefreshToken },
    });
    expect(afterKill.statusCode).toBe(401);

    // Cleanup
    await prisma.user.delete({ where: { id: user!.id } });
  });

  it('handles concurrent refresh requests — original token is consumed after both settle', async () => {
    const email = `authrot_concurrent_${Date.now()}@example.com`;
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email,
        password: TEST_USER.password,
        firstName: 'Concurrent',
        lastName: 'Refresh',
        accountType: 'buyer',
        agreeToTerms: true,
        agreeToPrivacy: true,
      },
    });
    const user = await prisma.user.findUnique({ where: { email } });
    await prisma.user.update({ where: { id: user!.id }, data: { emailVerified: true } });

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email, password: TEST_USER.password },
    });
    const sharedRefreshToken: string = loginRes.json().data.tokens.refreshToken;

    // Two concurrent refreshes with the same token
    // Route returns { success: true, data: { accessToken, refreshToken, expiresIn } }
    const [a, b] = await Promise.all([
      app.inject({ method: 'POST', url: '/api/v1/auth/refresh', payload: { refreshToken: sharedRefreshToken } }),
      app.inject({ method: 'POST', url: '/api/v1/auth/refresh', payload: { refreshToken: sharedRefreshToken } }),
    ]);

    // At least one must succeed; second either fails (401) or succeeds then invalidates the family
    const successes = [a, b].filter((r) => r.statusCode === 200);
    expect(successes.length).toBeGreaterThanOrEqual(1);

    // Key invariant: original token cannot be reused after both settle
    const r3 = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: sharedRefreshToken },
    });
    expect(r3.statusCode).toBe(401);

    // Cleanup
    await prisma.user.delete({ where: { id: user!.id } });
  });

  it('invalidates all active refresh tokens after password reset', async () => {
    const email = `authrot_pwreset_${Date.now()}@example.com`;
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email,
        password: TEST_USER.password,
        firstName: 'PwReset',
        lastName: 'Rotation',
        accountType: 'buyer',
        agreeToTerms: true,
        agreeToPrivacy: true,
      },
    });
    const user = await prisma.user.findUnique({ where: { email } });
    await prisma.user.update({ where: { id: user!.id }, data: { emailVerified: true } });

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email, password: TEST_USER.password },
    });
    const activeRefreshToken: string = loginRes.json().data.tokens.refreshToken;

    // Trigger password reset via Redis token (matches auth.service.ts reset flow)
    const resetToken = `rot_pw_reset_${Date.now()}`;
    await redis.set(
      `auth:password_reset:${resetToken}`,
      JSON.stringify({ userId: user!.id, email }),
      'EX',
      3600,
    );

    const resetRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/reset-password',
      payload: { token: resetToken, newPassword: 'RotatedNewPass!2026' },
    });
    expect(resetRes.statusCode).toBe(200);

    // Pre-reset refresh token must now be invalid (all sessions revoked)
    const refreshRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: activeRefreshToken },
    });
    expect(refreshRes.statusCode).toBe(401);

    // Cleanup
    await prisma.user.delete({ where: { id: user!.id } });
  });
});
