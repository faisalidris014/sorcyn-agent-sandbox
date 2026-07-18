import { randomBytes, randomUUID, createHash } from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { FastifyInstance } from 'fastify';
import { prisma } from '../../config/database.js';
import { redis } from '../../config/redis.js';
import { env } from '../../config/env.js';
import { sendEmail } from '../../common/utils/email.js';
import { CURRENT_TERMS_VERSION } from '../../common/constants/terms.js';
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from '../../common/utils/errors.js';
import type {
  RegisterInput,
  LoginInput,
  RefreshInput,
  AuthTokens,
  AuthUser,
} from './auth.schemas.js';

const BCRYPT_ROUNDS = 12;
const DUMMY_HASH = '$2b$12$LJ3m4ys3Rl3hPcg.Pjwx8O7Szs1FQr0tF1nQxPJy5/6GlFq0cSi'; // pre-computed dummy

// TTLs in seconds
const EMAIL_VERIFY_TTL = 60 * 60 * 24; // 24 hours
const PASSWORD_RESET_TTL = 60 * 60; // 1 hour
const LOGIN_LOCKOUT_TTL = 60 * 15; // 15 minutes
const RESEND_COOLDOWN_TTL = 60 * 5; // 5 minutes
const PASSWORD_RESET_COUNT_TTL = 60 * 60 * 24; // 24 hours
const MAX_LOGIN_ATTEMPTS = 5;
const MAX_DAILY_RESETS = 3;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // default 15m
  const [, num, unit] = match;
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };
  return parseInt(num) * (multipliers[unit] ?? 60);
}

export class AuthService {
  private accessExpirySeconds: number;
  private refreshExpirySeconds: number;
  private rememberMeExpirySeconds: number;

  constructor(private app: FastifyInstance) {
    this.accessExpirySeconds = parseExpiry(env.JWT_ACCESS_EXPIRY);
    this.refreshExpirySeconds = parseExpiry(env.JWT_REFRESH_EXPIRY);
    this.rememberMeExpirySeconds = 60 * 60 * 24 * 180; // 180 days
  }

  // ── Register ─────────────────────────────────────────────────

  async register(
    input: RegisterInput,
    ip: string,
  ): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new ConflictError('Email is already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    // Business accounts always buy and sell — enforce server-side regardless of
    // what the client sent. The mobile app hides the account-type selector for
    // business signups (#225), but the client is not authoritative, so we
    // coerce to 'both' here at the persistence boundary (#226, defensive).
    const accountType: 'buyer' | 'seller' | 'both' = input.isBusiness
      ? 'both'
      : (input.accountType as 'buyer' | 'seller' | 'both');

    // Create user (and seller profile atomically when registering as business)
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone ?? null,
          accountType,
          locationZip: input.locationZip ?? null,
          ein: input.ein ?? null,
          isBusiness: input.isBusiness ?? false,
          emailVerified: false,
          // Record Terms acceptance (#314). Reaching here means the request
          // passed the schema's agreeToTerms/agreeToPrivacy literal-true gate.
          termsAcceptedAt: new Date(),
          termsVersion: CURRENT_TERMS_VERSION,
        },
      });

      if (input.isBusiness) {
        await tx.sellerProfile.create({
          data: {
            userId: created.id,
            businessName: input.businessName ?? null,
            businessType: input.businessType ?? null,
            salesTaxCertificateUrl: input.salesTaxCertificateUrl ?? null,
          },
        });
      }

      return created;
    });

    // Generate tokens
    const tokens = await this.generateTokenPair(user, false, ip);

    // Generate email verification token
    const verifyToken = await this.generateVerificationToken(
      user.id,
      user.email,
    );
    sendVerificationEmail(user.email, user.firstName, verifyToken);

    return { user: this.toAuthUser(user), tokens };
  }

  // ── Login ────────────────────────────────────────────────────

  async login(
    input: LoginInput,
    ip: string,
    userAgent: string,
  ): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const { email, password, rememberMe } = input;

    // Check lockout
    const isLocked = await redis.exists(`auth:login_lockout:${email}`);
    if (isLocked) {
      throw new UnauthorizedError(
        'Account temporarily locked due to too many failed attempts. Try again in 15 minutes.',
      );
    }

    // Find user (exclude soft-deleted)
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    // Timing-safe compare: always run bcrypt even if user not found
    const hashToCompare = user?.passwordHash ?? DUMMY_HASH;
    const isValid = await bcrypt.compare(password, hashToCompare);

    if (!user || !isValid) {
      await this.recordFailedLogin(email);
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check account status
    if (user.status === 'suspended') {
      throw new UnauthorizedError(
        'Your account has been suspended. Contact support for assistance.',
      );
    }
    if (user.status === 'banned') {
      throw new UnauthorizedError('Your account has been banned.');
    }

    // Clear failed login attempts on success
    await redis.del(`auth:login_attempts:${email}`);
    await redis.del(`auth:login_lockout:${email}`);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokenPair(user, rememberMe, ip, userAgent);

    return { user: this.toAuthUser(user), tokens };
  }

  // ── Refresh ──────────────────────────────────────────────────

  async refresh(
    input: RefreshInput,
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    // Verify refresh token
    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(input.refreshToken, env.JWT_REFRESH_SECRET) as jwt.JwtPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh' || !payload.sub || !payload.jti) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Check token exists in Redis
    const redisKey = `auth:refresh:${payload.sub}:${payload.jti}`;
    const stored = await redis.get(redisKey);
    if (!stored) {
      throw new UnauthorizedError('Refresh token has been revoked');
    }

    const storedData = JSON.parse(stored);

    // Reuse detection (SEC-M2 #262): a validly-signed token whose stored entry
    // is already marked `rotated` is being presented after it was rotated away —
    // the classic stolen-refresh-token replay. Kill the whole family. Previously
    // the old key was deleted on rotation, so a replayed-after-rotation token hit
    // the generic "revoked" miss above and this theft response never fired.
    if (storedData.rotated === true) {
      await this.invalidateAllSessions(payload.sub);
      throw new UnauthorizedError('Token reuse detected. All sessions invalidated.');
    }

    // Verify hash matches
    const incomingHash = hashToken(input.refreshToken);
    if (storedData.hashedToken !== incomingHash) {
      // Possible token theft — invalidate all sessions for this user
      await this.invalidateAllSessions(payload.sub);
      throw new UnauthorizedError('Token reuse detected. All sessions invalidated.');
    }

    // Rotate: tombstone the old token instead of deleting it, so a later replay
    // of this same token is caught by the reuse check above rather than silently
    // treated as a generic "revoked" miss. The tombstone TTL tracks the token's
    // remaining JWT lifetime, so it self-expires exactly when the token would
    // stop verifying anyway — no unbounded key growth. (SEC-M2 #262)
    const remainingTtl =
      typeof payload.exp === 'number'
        ? payload.exp - Math.floor(Date.now() / 1000)
        : 0;
    if (remainingTtl > 0) {
      await redis.set(
        redisKey,
        JSON.stringify({ ...storedData, rotated: true }),
        'EX',
        remainingTtl,
      );
    } else {
      await redis.del(redisKey);
    }

    // Load user and check still active
    const user = await prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null, status: 'active' },
    });
    if (!user) {
      throw new UnauthorizedError('User account is no longer active');
    }

    // Preserve rememberMe from original login
    const rememberMe = storedData.rememberMe === true;

    // Generate new token pair
    const accessToken = this.generateAccessToken(user);
    const newRefresh = this.generateRefreshToken(user.id, rememberMe);

    // Store new refresh token
    await this.storeRefreshToken(
      user.id,
      newRefresh.jti,
      hashToken(newRefresh.token),
      newRefresh.expiresIn,
      storedData.ip ?? 'unknown',
      storedData.userAgent,
      rememberMe,
    );

    // Update cached session version
    await redis.set(`auth:sv:${user.id}`, String(user.sessionVersion));

    return {
      accessToken: accessToken.token,
      refreshToken: newRefresh.token,
      expiresIn: accessToken.expiresIn,
    };
  }

  // ── Logout ───────────────────────────────────────────────────

  async logout(
    userId: string,
    accessTokenJti: string,
    refreshToken: string,
  ): Promise<void> {
    // Blacklist access token (TTL = max access token lifetime)
    await redis.set(
      `auth:blacklist:${accessTokenJti}`,
      '1',
      'EX',
      this.accessExpirySeconds,
    );

    // Invalidate refresh token
    try {
      const payload = jwt.verify(
        refreshToken,
        env.JWT_REFRESH_SECRET,
      ) as jwt.JwtPayload;
      if (payload.sub === userId && payload.jti) {
        await redis.del(`auth:refresh:${userId}:${payload.jti}`);
      }
    } catch {
      // Refresh token may already be expired/invalid — that's fine
    }
  }

  // ── Email Verification ───────────────────────────────────────

  async generateVerificationToken(
    userId: string,
    email: string,
  ): Promise<string> {
    const token = randomBytes(32).toString('hex');
    await redis.set(
      `auth:email_verify:${token}`,
      JSON.stringify({ userId, email }),
      'EX',
      EMAIL_VERIFY_TTL,
    );
    return token;
  }

  async verifyEmail(token: string): Promise<void> {
    const data = await redis.get(`auth:email_verify:${token}`);
    if (!data) {
      throw new ValidationError('Invalid or expired verification token');
    }

    const { userId } = JSON.parse(data) as { userId: string; email: string };

    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });

    // Single-use: delete token
    await redis.del(`auth:email_verify:${token}`);
  }

  async resendVerification(email: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    // Silent return if not found or already verified (prevent enumeration)
    if (!user || user.emailVerified) return;

    // Check cooldown
    const cooldownKey = `auth:resend_cooldown:${user.id}`;
    const onCooldown = await redis.exists(cooldownKey);
    if (onCooldown) {
      throw new ValidationError(
        'Please wait 5 minutes before requesting another verification email',
      );
    }

    // Generate token and send
    const token = await this.generateVerificationToken(user.id, user.email);
    await redis.set(cooldownKey, '1', 'EX', RESEND_COOLDOWN_TTL);
    sendVerificationEmail(user.email, user.firstName, token);
  }

  // ── Password Reset ───────────────────────────────────────────

  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    // Always return silently (prevent enumeration)
    if (!user) return;

    // Check daily limit
    const countKey = `auth:password_reset_count:${email}`;
    const count = await redis.incr(countKey);
    if (count === 1) {
      await redis.expire(countKey, PASSWORD_RESET_COUNT_TTL);
    }
    if (count > MAX_DAILY_RESETS) return; // silently stop

    // Generate reset token
    const token = randomBytes(32).toString('hex');
    await redis.set(
      `auth:password_reset:${token}`,
      JSON.stringify({ userId: user.id, email: user.email }),
      'EX',
      PASSWORD_RESET_TTL,
    );

    sendPasswordResetEmail(user.email, user.firstName, token);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const data = await redis.get(`auth:password_reset:${token}`);
    if (!data) {
      throw new ValidationError('Invalid or expired reset token');
    }

    const { userId } = JSON.parse(data) as { userId: string; email: string };

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ValidationError('Invalid or expired reset token');
    }

    // Ensure new password differs from current
    const isSame = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSame) {
      throw new ValidationError(
        'New password must be different from your current password',
      );
    }

    // Hash and update, incrementing session version to invalidate existing tokens
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    });

    // Delete reset token (single-use)
    await redis.del(`auth:password_reset:${token}`);

    // Invalidate all sessions and bump cached session version
    await this.invalidateAllSessions(userId);
  }

  // ── Private Helpers ──────────────────────────────────────────

  private generateAccessToken(user: {
    id: string;
    email: string;
    accountType: string;
    emailVerified: boolean;
    isAdmin: boolean;
    sessionVersion: number;
  }): { token: string; jti: string; expiresIn: number } {
    const jti = randomUUID();
    const token = this.app.jwt.sign({
      sub: user.id,
      email: user.email,
      accountType: user.accountType,
      emailVerified: user.emailVerified,
      isAdmin: user.isAdmin,
      sv: user.sessionVersion,
      jti,
    });
    return { token, jti, expiresIn: this.accessExpirySeconds };
  }

  private generateRefreshToken(
    userId: string,
    rememberMe: boolean,
  ): { token: string; jti: string; expiresIn: number } {
    const jti = randomUUID();
    const expiresIn = rememberMe
      ? this.rememberMeExpirySeconds
      : this.refreshExpirySeconds;
    const token = jwt.sign(
      { sub: userId, jti, type: 'refresh' },
      env.JWT_REFRESH_SECRET,
      { expiresIn },
    );
    return { token, jti, expiresIn };
  }

  private async generateTokenPair(
    user: {
      id: string;
      email: string;
      accountType: string;
      emailVerified: boolean;
      isAdmin: boolean;
      sessionVersion: number;
    },
    rememberMe: boolean,
    ip: string,
    userAgent?: string,
  ): Promise<AuthTokens> {
    const access = this.generateAccessToken(user);
    const refresh = this.generateRefreshToken(user.id, rememberMe);

    await this.storeRefreshToken(
      user.id,
      refresh.jti,
      hashToken(refresh.token),
      refresh.expiresIn,
      ip,
      userAgent,
      rememberMe,
    );

    // Cache session version for fast middleware checks
    await redis.set(`auth:sv:${user.id}`, String(user.sessionVersion));

    return {
      accessToken: access.token,
      refreshToken: refresh.token,
      expiresIn: access.expiresIn,
      tokenType: 'Bearer',
    };
  }

  private async storeRefreshToken(
    userId: string,
    jti: string,
    hashedToken: string,
    ttlSeconds: number,
    ip: string,
    userAgent?: string,
    rememberMe?: boolean,
  ): Promise<void> {
    await redis.set(
      `auth:refresh:${userId}:${jti}`,
      JSON.stringify({
        hashedToken,
        ip,
        userAgent: userAgent ?? 'unknown',
        rememberMe: rememberMe ?? false,
        createdAt: new Date().toISOString(),
      }),
      'EX',
      ttlSeconds,
    );
  }

  private async recordFailedLogin(email: string): Promise<void> {
    const attemptsKey = `auth:login_attempts:${email}`;
    const attempts = await redis.incr(attemptsKey);

    if (attempts === 1) {
      await redis.expire(attemptsKey, LOGIN_LOCKOUT_TTL);
    }

    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      await redis.set(
        `auth:login_lockout:${email}`,
        '1',
        'EX',
        LOGIN_LOCKOUT_TTL,
      );
    }
  }

  private async invalidateAllSessions(userId: string): Promise<void> {
    // Scan for all refresh tokens belonging to this user
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        'MATCH',
        `auth:refresh:${userId}:*`,
        'COUNT',
        100,
      );
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== '0');

    // Bump cached session version so in-flight access tokens are rejected
    await redis.incr(`auth:sv:${userId}`);
  }

  private toAuthUser(
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      accountType: string;
      isBusiness?: boolean;
      ein?: string | null;
      emailVerified: boolean;
      phone: string | null;
      locationZip: string | null;
      createdAt: Date;
    },
  ): AuthUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      accountType: user.accountType,
      isBusiness: user.isBusiness ?? false,
      ein: user.ein ?? null,
      emailVerified: user.emailVerified,
      phone: user.phone,
      locationZip: user.locationZip,
      createdAt: user.createdAt,
    };
  }
}

// ── Email Helpers (Resend or console stub) ────────

function sendVerificationEmail(
  email: string,
  firstName: string,
  token: string,
): void {
  const url = `${env.FRONTEND_URL}/verify-email?token=${token}`;
  sendEmail({
    to: email,
    subject: `Verify Your Email - ${env.BRAND_NAME}`,
    text: `Hi ${firstName}, please verify your email: ${url}`,
    html: `<p>Hi ${firstName},</p><p>Please <a href="${url}">verify your email</a> to get started.</p>`,
  });
}

function sendPasswordResetEmail(
  email: string,
  firstName: string,
  token: string,
): void {
  const url = `${env.FRONTEND_URL}/reset-password?token=${token}`;
  sendEmail({
    to: email,
    subject: `Reset Your Password - ${env.BRAND_NAME}`,
    text: `Hi ${firstName}, reset your password: ${url}`,
    html: `<p>Hi ${firstName},</p><p><a href="${url}">Reset your password</a>. This link expires in 1 hour.</p>`,
  });
}
