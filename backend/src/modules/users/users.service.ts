import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { redis } from '../../config/redis.js';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ConflictError,
} from '../../common/utils/errors.js';
import { t, type SupportedLocale } from '../../common/i18n/index.js';
import type {
  UpdateProfileInput,
  UpgradeToBusinessInput,
  UpdateBusinessProfileInput,
  UserProfile,
  PublicUserProfile,
} from './users.schemas.js';

const BCRYPT_ROUNDS = 12;

/**
 * Kicks off sales-tax certificate verification (#227). Whenever a business
 * account's cert URL is set or replaced, the caller resets
 * `sellerProfile.salesTaxVerified = false` and calls this to (re)queue a
 * `pending` sales_tax verification request for admin review. Any still-open
 * request is superseded (soft-deleted) first so replacing a cert doesn't stack
 * duplicates. Admin approval (admin.service `reviewVerification`) flips
 * `salesTaxVerified` back to true. Must run inside the same transaction as the
 * cert write so the profile and request stay consistent.
 */
async function queueSalesTaxVerification(
  tx: Prisma.TransactionClient,
  sellerId: string,
  certUrl: string,
): Promise<void> {
  await tx.verificationRequest.updateMany({
    where: {
      sellerId,
      verificationType: 'sales_tax',
      status: { in: ['pending', 'under_review'] },
      deletedAt: null,
    },
    data: { deletedAt: new Date() },
  });

  await tx.verificationRequest.create({
    data: {
      sellerId,
      verificationType: 'sales_tax',
      tier: 2,
      documents: [certUrl],
    },
  });
}

export class UsersService {
  // ── Get Current User (Me) ───────────────────────────────────

  async getMe(userId: string, locale?: SupportedLocale): Promise<UserProfile> {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundError('User', undefined, locale);
    }
    return this.toUserProfile(user);
  }

  // ── Get Public User Profile ─────────────────────────────────

  async getUserById(userId: string, locale?: SupportedLocale): Promise<PublicUserProfile> {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null, status: 'active' },
    });
    if (!user) {
      throw new NotFoundError('User', userId, locale);
    }
    return this.toPublicProfile(user);
  }

  // ── Update Profile ──────────────────────────────────────────

  async updateProfile(
    userId: string,
    input: UpdateProfileInput,
    locale?: SupportedLocale,
  ): Promise<UserProfile> {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundError('User', undefined, locale);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.firstName !== undefined && { firstName: input.firstName }),
        ...(input.lastName !== undefined && { lastName: input.lastName }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.bio !== undefined && { bio: input.bio }),
        ...(input.locationCity !== undefined && { locationCity: input.locationCity }),
        ...(input.locationState !== undefined && { locationState: input.locationState }),
        ...(input.locationZip !== undefined && { locationZip: input.locationZip }),
        ...(input.locationCountry !== undefined && { locationCountry: input.locationCountry }),
        ...(input.latitude !== undefined && { latitude: input.latitude }),
        ...(input.longitude !== undefined && { longitude: input.longitude }),
        ...(input.notificationPreferences !== undefined && {
          notificationPreferences: input.notificationPreferences,
        }),
        ...(input.preferredLanguage !== undefined && {
          preferredLanguage: input.preferredLanguage,
        }),
      },
    });

    return this.toUserProfile(updated);
  }

  // ── Update Profile Photo ────────────────────────────────────

  async updateProfilePhoto(
    userId: string,
    photoUrl: string,
    locale?: SupportedLocale,
  ): Promise<UserProfile> {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundError('User', undefined, locale);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { profilePhotoUrl: photoUrl },
    });

    return this.toUserProfile(updated);
  }

  // ── Change Password ─────────────────────────────────────────

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    locale?: SupportedLocale,
  ): Promise<void> {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundError('User', undefined, locale);
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new ValidationError(t('errors.validation.passwordIncorrect', locale));
    }

    const isSame = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSame) {
      throw new ValidationError(t('errors.validation.passwordSame', locale));
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Invalidate all refresh tokens
    await this.invalidateAllSessions(userId);
  }

  // ── Switch Account Type ─────────────────────────────────────

  async switchAccountType(
    userId: string,
    accountType: 'buyer' | 'seller' | 'both',
    locale?: SupportedLocale,
  ): Promise<UserProfile> {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundError('User', undefined, locale);
    }

    // If switching to seller or both, ensure seller profile exists
    if (accountType === 'seller' || accountType === 'both') {
      const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { userId },
      });
      if (!sellerProfile) {
        // Auto-create a basic seller profile
        await prisma.sellerProfile.create({
          data: {
            userId,
            emailVerified: user.emailVerified,
          },
        });
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { accountType },
    });

    return this.toUserProfile(updated);
  }

  // ── Switch Marketplace Context ──────────────────────────────

  async switchMarketplaceContext(
    userId: string,
    context: 'b2c' | 'b2b' | 'c2c',
    locale?: SupportedLocale,
  ): Promise<UserProfile> {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundError('User', undefined, locale);
    }

    // Validate: user must have this context in their marketplaceContexts
    const userContexts = user.marketplaceContexts as string[];
    if (!userContexts.includes(context)) {
      throw new ConflictError(
        t('errors.conflict.invalidContext', locale, { context: context.toUpperCase() }),
      );
    }

    // B2B requires a seller profile with businessName
    if (context === 'b2b') {
      const sellerProfile = await prisma.sellerProfile.findFirst({
        where: { userId, deletedAt: null },
      });
      if (!sellerProfile?.businessName) {
        throw new ConflictError(
          t('errors.conflict.b2bRequiresBusiness', locale),
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { activeMarketplace: context },
    });

    return this.toUserProfile(updated);
  }

  // ── Upgrade Classic → Business (v2.2) ──────────────────────

  async upgradeToBusiness(
    userId: string,
    input: UpgradeToBusinessInput,
    locale?: SupportedLocale,
  ): Promise<UserProfile> {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundError('User', undefined, locale);
    }
    if (user.isBusiness) {
      throw new ConflictError('Account is already a business account');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: userId },
        data: { isBusiness: true, ein: input.ein },
      });

      const profile = await tx.sellerProfile.upsert({
        where: { userId },
        create: {
          userId,
          businessName: input.businessName,
          businessType: input.businessType,
          salesTaxCertificateUrl: input.salesTaxCertificateUrl,
          emailVerified: user.emailVerified,
        },
        update: {
          businessName: input.businessName,
          businessType: input.businessType,
          salesTaxCertificateUrl: input.salesTaxCertificateUrl,
          salesTaxVerified: false,
        },
      });

      await queueSalesTaxVerification(tx, profile.id, input.salesTaxCertificateUrl);

      return u;
    });

    return this.toUserProfile(updated);
  }

  // ── Complete / update business profile (issue #3) ───────────
  // Attach the sales-tax certificate (and optionally correct name/type/EIN) for an
  // account that is ALREADY a business. This is the post-registration completion
  // path: business accounts can register without a cert (the /uploads endpoint needs
  // an auth token the user only has after registering), then call this once the
  // cert has been uploaded. Publishing remains gated by posts.service until the cert
  // is uploaded AND submitted for verification.
  async updateBusinessProfile(
    userId: string,
    input: UpdateBusinessProfileInput,
    locale?: SupportedLocale,
  ): Promise<UserProfile> {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundError('User', undefined, locale);
    }
    if (!user.isBusiness) {
      throw new ConflictError('Account is not a business account. Use upgrade-to-business first.');
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (input.ein) {
        await tx.user.update({ where: { id: userId }, data: { ein: input.ein } });
      }

      const profile = await tx.sellerProfile.upsert({
        where: { userId },
        create: {
          userId,
          businessName: input.businessName ?? null,
          businessType: input.businessType ?? null,
          salesTaxCertificateUrl: input.salesTaxCertificateUrl,
          emailVerified: user.emailVerified,
        },
        update: {
          salesTaxCertificateUrl: input.salesTaxCertificateUrl,
          salesTaxVerified: false,
          ...(input.businessName !== undefined ? { businessName: input.businessName } : {}),
          ...(input.businessType !== undefined ? { businessType: input.businessType } : {}),
        },
      });

      await queueSalesTaxVerification(tx, profile.id, input.salesTaxCertificateUrl);

      return tx.user.findFirstOrThrow({ where: { id: userId } });
    });

    return this.toUserProfile(updated);
  }

  // ── Update FCM Token ────────────────────────────────────────

  async updateFcmToken(userId: string, fcmToken: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken },
    });
  }

  // ── Soft Delete Account ─────────────────────────────────────

  async deleteAccount(userId: string, password: string, locale?: SupportedLocale): Promise<void> {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundError('User', undefined, locale);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new ForbiddenError(t('errors.forbidden.passwordFailed', locale));
    }

    // Soft delete user
    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        status: 'deleted',
        email: `deleted_${Date.now()}_${user.email}`, // free up email for reuse
      },
    });

    // Soft delete seller profile if exists
    await prisma.sellerProfile.updateMany({
      where: { userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    // Invalidate all sessions
    await this.invalidateAllSessions(userId);
  }

  // ── Private Helpers ─────────────────────────────────────────

  private async invalidateAllSessions(userId: string): Promise<void> {
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
  }

  private toUserProfile(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    accountType: string;
    isBusiness?: boolean;
    ein?: string | null;
    phone: string | null;
    phoneVerified: boolean;
    emailVerified: boolean;
    profilePhotoUrl: string | null;
    locationCity: string | null;
    locationState: string | null;
    locationZip: string | null;
    locationCountry: string;
    latitude: unknown;
    longitude: unknown;
    bio: string | null;
    notificationPreferences: unknown;
    preferredLanguage: string;
    activeMarketplace: string;
    marketplaceContexts: unknown;
    rating: unknown;
    totalReviews: number;
    totalTransactions: number;
    status: string;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserProfile {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      accountType: user.accountType,
      isBusiness: user.isBusiness ?? false,
      ein: user.ein ?? null,
      phone: user.phone,
      phoneVerified: user.phoneVerified,
      emailVerified: user.emailVerified,
      profilePhotoUrl: user.profilePhotoUrl,
      locationCity: user.locationCity,
      locationState: user.locationState,
      locationZip: user.locationZip,
      locationCountry: user.locationCountry,
      latitude: user.latitude ? Number(user.latitude) : null,
      longitude: user.longitude ? Number(user.longitude) : null,
      bio: user.bio,
      notificationPreferences: user.notificationPreferences,
      preferredLanguage: user.preferredLanguage,
      activeMarketplace: user.activeMarketplace,
      marketplaceContexts: user.marketplaceContexts,
      rating: user.rating ? Number(user.rating) : null,
      totalReviews: user.totalReviews,
      totalTransactions: user.totalTransactions,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private toPublicProfile(user: {
    id: string;
    firstName: string;
    lastName: string;
    accountType: string;
    profilePhotoUrl: string | null;
    locationCity: string | null;
    locationState: string | null;
    bio: string | null;
    rating: unknown;
    totalReviews: number;
    totalTransactions: number;
    createdAt: Date;
  }): PublicUserProfile {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      accountType: user.accountType,
      profilePhotoUrl: user.profilePhotoUrl,
      locationCity: user.locationCity,
      locationState: user.locationState,
      bio: user.bio,
      rating: user.rating ? Number(user.rating) : null,
      totalReviews: user.totalReviews,
      totalTransactions: user.totalTransactions,
      createdAt: user.createdAt,
    };
  }
}
