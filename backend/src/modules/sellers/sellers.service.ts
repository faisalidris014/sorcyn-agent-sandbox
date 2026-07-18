import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import {
  AppError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
  ValidationError,
} from '../../common/utils/errors.js';
import type {
  CreateSellerProfileInput,
  UpdateSellerProfileInput,
  SubmitVerificationInput,
  SubmitCategoryRequestInput,
  SellerProfileResponse,
  PublicSellerProfile,
} from './sellers.schemas.js';
import {
  routeCategoryRequest,
  deriveRequiredDocTypes,
  deriveOptionalDocTypes,
  findMissingDocTypes,
  type CategoryConfig,
} from './category-verification.js';
import { grantCategoryAccess } from './category-grant.js';
import { deriveCredentialStatus } from '../../common/utils/verification.js';
import { recordCategoryRequestOutcome } from '../../common/middleware/metrics.js';
import { getStripe } from '../../config/stripe.js';
import { env } from '../../config/env.js';

// Profile strength weights
const STRENGTH_WEIGHTS = {
  businessName: 10,
  bio: 15,
  profilePhoto: 10,
  categories: 10,
  yearsExperience: 5,
  portfolioPhotos: 15,
  businessWebsite: 5,
  businessHours: 5,
  emailVerified: 10,
  idVerified: 10,
  licenseVerified: 5,
} as const;

export class SellersService {
  // ── Create Seller Profile ───────────────────────────────────

  async createSellerProfile(
    userId: string,
    input: CreateSellerProfileInput,
  ): Promise<SellerProfileResponse> {
    // Check user exists
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundError('User');
    }

    // Check no existing seller profile
    const existing = await prisma.sellerProfile.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new ConflictError('Seller profile already exists');
    }

    // Products is auto-granted to every new seller (no docs, no selection). Services
    // and Jobs are only added later through the verified category-request flow (#301),
    // so any Services/Jobs categories sent at creation are ignored here.
    const productsMajor = await prisma.category.findUnique({
      where: { slug: 'products' },
      select: { id: true },
    });
    if (!productsMajor) {
      throw new AppError(500, 'Products category is not seeded', 'CONFIG_ERROR');
    }

    const profile = await prisma.sellerProfile.create({
      data: {
        userId,
        businessName: input.businessName ?? null,
        bio: input.bio ?? null,
        serviceRadiusMiles: input.serviceRadiusMiles,
        categories: [productsMajor.id],
        subcategories: [],
        yearsExperience: input.yearsExperience ?? null,
        businessWebsite: input.businessWebsite ?? null,
        businessHours: input.businessHours ?? Prisma.JsonNull,
        emailVerified: user.emailVerified,
      },
    });

    // Switch user to seller/both if they were buyer-only
    if (user.accountType === 'buyer') {
      await prisma.user.update({
        where: { id: userId },
        data: { accountType: 'both' },
      });
    }

    // Auto-create pending EIN VerificationRequest for business accounts that
    // supplied an EIN at registration. VerificationRequest requires a SellerProfile
    // id so it can only be created here, not during auth registration.
    if (user.ein) {
      const existingEin = await prisma.verificationRequest.findFirst({
        where: { sellerId: profile.id, verificationType: 'ein', deletedAt: null },
      });
      if (!existingEin) {
        await prisma.verificationRequest.create({
          data: {
            sellerId: profile.id,
            verificationType: 'ein',
            tier: 2,
            status: 'pending',
            documents: [{ ein: user.ein }] as Prisma.InputJsonValue,
          },
        });
      }
    }

    const strength = this.calculateProfileStrength(profile);
    const updated = await prisma.sellerProfile.update({
      where: { id: profile.id },
      data: { profileStrength: strength },
    });

    return this.toSellerProfileResponse(updated);
  }

  // ── Get My Seller Profile ───────────────────────────────────

  async getMySellerProfile(userId: string): Promise<SellerProfileResponse> {
    const profile = await prisma.sellerProfile.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!profile) {
      throw new NotFoundError('Seller profile');
    }
    return this.toSellerProfileResponse(profile);
  }

  // ── Get Public Seller Profile by ID ─────────────────────────

  async getSellerById(sellerId: string): Promise<PublicSellerProfile> {
    const profile = await prisma.sellerProfile.findFirst({
      where: { id: sellerId, deletedAt: null },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            locationCity: true,
            locationState: true,
            status: true,
          },
        },
      },
    });
    if (!profile || profile.user.status !== 'active') {
      throw new NotFoundError('Seller', sellerId);
    }
    return this.toPublicSellerProfile(profile);
  }

  // ── Get Public Seller Profile by User ID ────────────────────

  async getSellerByUserId(userId: string): Promise<PublicSellerProfile> {
    const profile = await prisma.sellerProfile.findFirst({
      where: { userId, deletedAt: null },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            locationCity: true,
            locationState: true,
            status: true,
          },
        },
      },
    });
    if (!profile || profile.user.status !== 'active') {
      throw new NotFoundError('Seller profile');
    }
    return this.toPublicSellerProfile(profile);
  }

  // ── Update Seller Profile ───────────────────────────────────

  async updateSellerProfile(
    userId: string,
    input: UpdateSellerProfileInput,
  ): Promise<SellerProfileResponse> {
    const profile = await prisma.sellerProfile.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!profile) {
      throw new NotFoundError('Seller profile');
    }

    const data: Prisma.SellerProfileUpdateInput = {};
    if (input.businessName !== undefined) data.businessName = input.businessName;
    if (input.bio !== undefined) data.bio = input.bio;
    if (input.serviceRadiusMiles !== undefined) data.serviceRadiusMiles = input.serviceRadiusMiles;
    // categories/subcategories are not writable here (gated by the #301 category-request flow).
    if (input.yearsExperience !== undefined) data.yearsExperience = input.yearsExperience;
    if (input.businessWebsite !== undefined) data.businessWebsite = input.businessWebsite;
    if (input.businessHours !== undefined) {
      data.businessHours = input.businessHours === null ? Prisma.JsonNull : input.businessHours;
    }
    if (input.portfolioPhotos !== undefined) data.portfolioPhotos = input.portfolioPhotos;
    if (input.profilePhotoUrl !== undefined) data.profilePhotoUrl = input.profilePhotoUrl;

    const updated = await prisma.sellerProfile.update({
      where: { id: profile.id },
      data,
    });

    // Recalculate profile strength
    const strength = this.calculateProfileStrength(updated);
    const final = await prisma.sellerProfile.update({
      where: { id: profile.id },
      data: { profileStrength: strength },
    });

    return this.toSellerProfileResponse(final);
  }

  // ── Submit Verification Request ─────────────────────────────

  async submitVerification(
    userId: string,
    input: SubmitVerificationInput,
  ): Promise<{ id: string; status: string }> {
    const profile = await prisma.sellerProfile.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!profile) {
      throw new NotFoundError('Seller profile');
    }

    // Check for existing pending request of same type
    const existingRequest = await prisma.verificationRequest.findFirst({
      where: {
        sellerId: profile.id,
        verificationType: input.verificationType,
        status: { in: ['pending', 'under_review'] },
        deletedAt: null,
      },
    });
    if (existingRequest) {
      throw new ConflictError(
        `A ${input.verificationType} verification request is already pending`,
      );
    }

    // Determine tier based on verification type
    const tierMap: Record<string, number> = {
      id: 2,
      ein: 2,
      sales_tax: 2,
      license: 3,
      insurance: 3,
      background_check: 4,
    };

    // #382: capture the credential expiry on the request row itself (was always
    // left null before). license/insurance carry a type-specific expiry; other
    // types never expire. The lapse sweep (PR2) reads request.expiresAt.
    const credentialExpiry =
      input.verificationType === 'license'
        ? input.licenseExpiry
        : input.verificationType === 'insurance'
          ? input.insuranceExpiry
          : undefined;

    const request = await prisma.verificationRequest.create({
      data: {
        sellerId: profile.id,
        verificationType: input.verificationType,
        tier: tierMap[input.verificationType] ?? 2,
        documents: input.documents,
        ...(credentialExpiry && { expiresAt: new Date(credentialExpiry) }),
      },
    });

    // Update license/insurance fields on seller profile if provided
    if (input.verificationType === 'license') {
      await prisma.sellerProfile.update({
        where: { id: profile.id },
        data: {
          ...(input.licenseNumber && { licenseNumber: input.licenseNumber }),
          ...(input.licenseState && { licenseState: input.licenseState }),
          ...(input.licenseExpiry && {
            licenseExpiry: new Date(input.licenseExpiry),
          }),
        },
      });
    } else if (input.verificationType === 'insurance') {
      await prisma.sellerProfile.update({
        where: { id: profile.id },
        data: {
          ...(input.insuranceProvider && {
            insuranceProvider: input.insuranceProvider,
          }),
          ...(input.insurancePolicyNumber && {
            insurancePolicyNumber: input.insurancePolicyNumber,
          }),
          ...(input.insuranceExpiry && {
            insuranceExpiry: new Date(input.insuranceExpiry),
          }),
        },
      });
    }

    return { id: request.id, status: request.status };
  }

  // ── Get My Verification Requests ────────────────────────────

  async getMyVerificationRequests(
    userId: string,
  ): Promise<Array<{
    id: string;
    verificationType: string;
    tier: number;
    status: string;
    createdAt: Date;
    reviewedAt: Date | null;
    rejectionReason: string | null;
    expiresAt: Date | null;
  }>> {
    const profile = await prisma.sellerProfile.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!profile) {
      throw new NotFoundError('Seller profile');
    }

    const requests = await prisma.verificationRequest.findMany({
      where: { sellerId: profile.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        verificationType: true,
        tier: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
        rejectionReason: true,
        expiresAt: true,
      },
    });

    return requests;
  }

  // ── Category Access Requests (#336) ─────────────────────────

  /** Required docs + per-subcategory policy for the mobile request form. */
  async getCategoryRequirements(subcategoryIds: string[]): Promise<{
    subcategories: Array<{
      subcategoryId: string;
      mode: string;
      isLicensed: boolean;
      licenseAuthority: string | null;
      requiresBackgroundCheck: boolean;
      recommendsInsurance: boolean;
    }>;
    requiredDocTypes: string[];
    optionalDocTypes: string[];
  }> {
    const configs = await prisma.categoryVerificationConfig.findMany({
      where: { subcategoryId: { in: subcategoryIds } },
    });
    const subcategories = configs.map((c) => ({
      subcategoryId: c.subcategoryId,
      mode: c.mode,
      isLicensed: c.isLicensed,
      licenseAuthority: c.licenseAuthority,
      requiresBackgroundCheck: c.requiresBackgroundCheck,
      recommendsInsurance: c.recommendsInsurance,
    }));
    return {
      subcategories,
      requiredDocTypes: deriveRequiredDocTypes(subcategories as CategoryConfig[]),
      optionalDocTypes: deriveOptionalDocTypes(subcategories as CategoryConfig[]),
    };
  }

  /**
   * Submit a category-access request. The verification router decides the outcome;
   * an auto-approve grants access (and unlocks the feed) atomically.
   */
  async submitCategoryRequest(
    userId: string,
    input: SubmitCategoryRequestInput,
  ): Promise<{ id: string; status: string; outcome: string; requiredDocTypes: string[] }> {
    const profile = await prisma.sellerProfile.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!profile) {
      throw new NotFoundError('Seller profile');
    }

    // Major must be a real top-level category.
    const major = await prisma.category.findFirst({
      where: { id: input.majorCategoryId },
      select: { id: true, parentCategoryId: true },
    });
    if (!major || major.parentCategoryId !== null) {
      throw new ValidationError('Invalid major category');
    }

    // Every requested sub must exist under that major.
    const subs = await prisma.category.findMany({
      where: { id: { in: input.subcategoryIds } },
      select: { id: true, parentCategoryId: true },
    });
    if (subs.length !== input.subcategoryIds.length) {
      throw new ValidationError('One or more subcategories do not exist');
    }
    if (subs.some((s) => s.parentCategoryId !== input.majorCategoryId)) {
      throw new ValidationError('All subcategories must belong to the given major category');
    }

    // Every requested sub must be a configured (gateable) Services/Jobs sub.
    const configRows = await prisma.categoryVerificationConfig.findMany({
      where: { subcategoryId: { in: input.subcategoryIds } },
    });
    if (configRows.length !== input.subcategoryIds.length) {
      throw new ValidationError('One or more subcategories are not available for request');
    }
    const configs: CategoryConfig[] = configRows.map((c) => ({
      subcategoryId: c.subcategoryId,
      mode: c.mode as CategoryConfig['mode'],
      isLicensed: c.isLicensed,
      licenseAuthority: c.licenseAuthority,
      requiresBackgroundCheck: c.requiresBackgroundCheck,
      recommendsInsurance: c.recommendsInsurance,
    }));

    // Block a duplicate pending request overlapping any requested sub.
    const pending = await prisma.sellerCategoryRequest.findMany({
      where: {
        sellerId: profile.id,
        status: { in: ['pending', 'under_review'] },
        deletedAt: null,
      },
      select: { subcategoryIds: true },
    });
    const requested = new Set(input.subcategoryIds);
    for (const p of pending) {
      const ids = Array.isArray(p.subcategoryIds) ? (p.subcategoryIds as string[]) : [];
      if (ids.some((id) => requested.has(id))) {
        throw new ConflictError('A pending request already covers one of these subcategories');
      }
    }

    // Required docs (missing → 422).
    const requiredDocTypes = deriveRequiredDocTypes(configs);
    const missing = findMissingDocTypes(input.documents, requiredDocTypes);
    if (missing.length > 0) {
      throw new AppError(
        422,
        `Missing required documents: ${missing.join(', ')}`,
        'about:blank',
        { documents: missing },
      );
    }

    const decision = await routeCategoryRequest(
      {
        majorCategoryId: input.majorCategoryId,
        subcategoryIds: input.subcategoryIds,
        documents: input.documents,
        licenseNumber: input.licenseNumber,
        holderName: input.holderName,
      },
      configs,
    );

    const baseData = {
      sellerId: profile.id,
      majorCategoryId: input.majorCategoryId,
      subcategoryIds: input.subcategoryIds as unknown as Prisma.InputJsonValue,
      documents: input.documents as unknown as Prisma.InputJsonValue,
      licenseNumber: input.licenseNumber ?? null,
      holderName: input.holderName ?? null,
      requiredDocTypes: requiredDocTypes as unknown as Prisma.InputJsonValue,
      status: decision.status,
      outcome: decision.outcome,
      decisionReason: decision.reason,
      decisionContext:
        decision.context === null
          ? Prisma.JsonNull
          : (decision.context as Prisma.InputJsonValue),
    };

    let requestId: string;
    if (decision.outcome === 'auto_approve') {
      const created = await prisma.$transaction(async (tx) => {
        const req = await tx.sellerCategoryRequest.create({
          data: { ...baseData, reviewedAt: new Date() },
        });
        await grantCategoryAccess(tx, {
          sellerId: profile.id,
          subcategoryIds: input.subcategoryIds,
          isLicensed: decision.isLicensed,
          requiresBackgroundCheck: decision.requiresBackgroundCheck,
        });
        return req;
      });
      requestId = created.id;
    } else {
      const created = await prisma.sellerCategoryRequest.create({
        data: {
          ...baseData,
          ...(decision.status === 'rejected' ? { reviewedAt: new Date() } : {}),
        },
      });
      requestId = created.id;
    }

    recordCategoryRequestOutcome(decision.outcome, decision.reason, decision.authority);

    // #381: if the seller attached an OPTIONAL insurance certificate, open a
    // standard insurance VerificationRequest so it lands in the admin queue
    // (approval flips `insuranceVerified` + the "Insured" badge). This never
    // gates category access — it is created alongside the (already-decided)
    // category request. Skipped silently if one is already pending, so it can't
    // fail the category request.
    const insuranceDoc = input.documents.find((d) => d.type === 'insurance');
    if (insuranceDoc) {
      const pendingInsurance = await prisma.verificationRequest.findFirst({
        where: {
          sellerId: profile.id,
          verificationType: 'insurance',
          status: { in: ['pending', 'under_review'] },
          deletedAt: null,
        },
        select: { id: true },
      });
      if (!pendingInsurance) {
        await prisma.verificationRequest.create({
          data: {
            sellerId: profile.id,
            verificationType: 'insurance',
            tier: 3,
            documents: [insuranceDoc] as unknown as Prisma.InputJsonValue,
            // #382: carry the cert expiry through so the lapse sweep can act on it.
            ...(insuranceDoc.expiresAt && {
              expiresAt: new Date(insuranceDoc.expiresAt),
            }),
          },
        });
      }
    }

    return {
      id: requestId,
      status: decision.status,
      outcome: decision.outcome,
      requiredDocTypes,
    };
  }

  /** List the seller's own category-access requests. */
  async getMyCategoryRequests(userId: string): Promise<
    Array<{
      id: string;
      majorCategoryId: string;
      subcategoryIds: unknown;
      status: string;
      outcome: string | null;
      decisionReason: string | null;
      requiredDocTypes: unknown;
      createdAt: Date;
      reviewedAt: Date | null;
    }>
  > {
    const profile = await prisma.sellerProfile.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!profile) {
      throw new NotFoundError('Seller profile');
    }

    return prisma.sellerCategoryRequest.findMany({
      where: { sellerId: profile.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        majorCategoryId: true,
        subcategoryIds: true,
        status: true,
        outcome: true,
        decisionReason: true,
        requiredDocTypes: true,
        createdAt: true,
        reviewedAt: true,
      },
    });
  }

  // ── Private Helpers ─────────────────────────────────────────

  private calculateProfileStrength(profile: {
    businessName: string | null;
    bio: string | null;
    profilePhotoUrl: string | null;
    categories: unknown;
    yearsExperience: number | null;
    portfolioPhotos: unknown;
    businessWebsite: string | null;
    businessHours: unknown;
    emailVerified: boolean;
    idVerified: boolean;
    licenseVerified: boolean;
  }): number {
    let strength = 0;

    if (profile.businessName) strength += STRENGTH_WEIGHTS.businessName;
    if (profile.bio && profile.bio.length >= 50) strength += STRENGTH_WEIGHTS.bio;
    if (profile.profilePhotoUrl) strength += STRENGTH_WEIGHTS.profilePhoto;

    const cats = profile.categories as string[];
    if (Array.isArray(cats) && cats.length > 0) strength += STRENGTH_WEIGHTS.categories;

    if (profile.yearsExperience !== null) strength += STRENGTH_WEIGHTS.yearsExperience;

    const photos = profile.portfolioPhotos as string[];
    if (Array.isArray(photos) && photos.length >= 3)
      strength += STRENGTH_WEIGHTS.portfolioPhotos;

    if (profile.businessWebsite) strength += STRENGTH_WEIGHTS.businessWebsite;
    if (profile.businessHours) strength += STRENGTH_WEIGHTS.businessHours;
    if (profile.emailVerified) strength += STRENGTH_WEIGHTS.emailVerified;
    if (profile.idVerified) strength += STRENGTH_WEIGHTS.idVerified;
    if (profile.licenseVerified) strength += STRENGTH_WEIGHTS.licenseVerified;

    return Math.min(strength, 100);
  }

  private async toSellerProfileResponse(profile: {
    id: string;
    userId: string;
    businessName: string | null;
    profilePhotoUrl: string | null;
    serviceRadiusMiles: number;
    categories: unknown;
    subcategories: unknown;
    bio: string | null;
    yearsExperience: number | null;
    portfolioPhotos: unknown;
    businessWebsite: string | null;
    businessHours: unknown;
    verificationTier: number;
    verificationBadges: unknown;
    emailVerified: boolean;
    phoneVerified: boolean;
    idVerified: boolean;
    licenseVerified: boolean;
    insuranceVerified: boolean;
    backgroundCheckVerified: boolean;
    licenseExpiry: Date | null;
    insuranceExpiry: Date | null;
    salesTaxCertificateUrl: string | null;
    salesTaxVerified: boolean;
    stripeOnboardingStatus: string;
    stripeChargesEnabled: boolean;
    stripePayoutsEnabled: boolean;
    profileStrength: number;
    rating: unknown;
    totalReviews: number;
    totalCompleted: number;
    totalActiveOffers: number;
    acceptanceRate: unknown;
    responseTimeHours: unknown;
    ratingBadge: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<SellerProfileResponse> {
    // Derive current status for the credential types whose owner view depends on
    // the latest request (sales_tax precedent + license/insurance expiry, #382).
    // One query, newest-first, pick the first row per type.
    const credentialRequests = await prisma.verificationRequest.findMany({
      where: {
        sellerId: profile.id,
        verificationType: { in: ['sales_tax', 'license', 'insurance'] },
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      select: { verificationType: true, status: true, rejectionReason: true },
    });
    const latestOfType = (t: string) =>
      credentialRequests.find((r) => r.verificationType === t) ?? null;
    const latestSalesTax = latestOfType('sales_tax');
    const latestLicense = latestOfType('license');
    const latestInsurance = latestOfType('insurance');

    const now = new Date();

    return {
      id: profile.id,
      userId: profile.userId,
      businessName: profile.businessName,
      profilePhotoUrl: profile.profilePhotoUrl,
      serviceRadiusMiles: profile.serviceRadiusMiles,
      categories: profile.categories,
      subcategories: profile.subcategories,
      bio: profile.bio,
      yearsExperience: profile.yearsExperience,
      portfolioPhotos: profile.portfolioPhotos,
      businessWebsite: profile.businessWebsite,
      businessHours: profile.businessHours,
      verificationTier: profile.verificationTier,
      verificationBadges: profile.verificationBadges,
      emailVerified: profile.emailVerified,
      phoneVerified: profile.phoneVerified,
      idVerified: profile.idVerified,
      licenseVerified: profile.licenseVerified,
      insuranceVerified: profile.insuranceVerified,
      backgroundCheckVerified: profile.backgroundCheckVerified,
      licenseExpiry: profile.licenseExpiry,
      insuranceExpiry: profile.insuranceExpiry,
      licenseStatus: deriveCredentialStatus(
        profile.licenseVerified,
        profile.licenseExpiry,
        latestLicense?.status ?? null,
        now,
      ),
      insuranceStatus: deriveCredentialStatus(
        profile.insuranceVerified,
        profile.insuranceExpiry,
        latestInsurance?.status ?? null,
        now,
      ),
      salesTaxCertificateUrl: profile.salesTaxCertificateUrl,
      salesTaxVerified: profile.salesTaxVerified,
      salesTaxStatus: latestSalesTax?.status ?? null,
      salesTaxRejectionReason: latestSalesTax?.rejectionReason ?? null,
      stripeOnboardingStatus: profile.stripeOnboardingStatus,
      stripeChargesEnabled: profile.stripeChargesEnabled,
      stripePayoutsEnabled: profile.stripePayoutsEnabled,
      profileStrength: profile.profileStrength,
      rating: profile.rating ? Number(profile.rating) : null,
      totalReviews: profile.totalReviews,
      totalCompleted: profile.totalCompleted,
      totalActiveOffers: profile.totalActiveOffers,
      acceptanceRate: profile.acceptanceRate ? Number(profile.acceptanceRate) : null,
      responseTimeHours: profile.responseTimeHours
        ? Number(profile.responseTimeHours)
        : null,
      ratingBadge: profile.ratingBadge,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  private toPublicSellerProfile(
    profile: {
      id: string;
      userId: string;
      businessName: string | null;
      profilePhotoUrl: string | null;
      serviceRadiusMiles: number;
      categories: unknown;
      subcategories: unknown;
      bio: string | null;
      yearsExperience: number | null;
      portfolioPhotos: unknown;
      businessWebsite: string | null;
      businessHours: unknown;
      verificationTier: number;
      verificationBadges: unknown;
      idVerified: boolean;
      licenseVerified: boolean;
      insuranceVerified: boolean;
      backgroundCheckVerified: boolean;
      rating: unknown;
      totalReviews: number;
      totalCompleted: number;
      ratingBadge: string | null;
      createdAt: Date;
      user: {
        firstName: string;
        lastName: string;
        locationCity: string | null;
        locationState: string | null;
      };
    },
  ): PublicSellerProfile {
    return {
      id: profile.id,
      userId: profile.userId,
      businessName: profile.businessName,
      profilePhotoUrl: profile.profilePhotoUrl,
      serviceRadiusMiles: profile.serviceRadiusMiles,
      categories: profile.categories,
      subcategories: profile.subcategories,
      bio: profile.bio,
      yearsExperience: profile.yearsExperience,
      portfolioPhotos: profile.portfolioPhotos,
      businessWebsite: profile.businessWebsite,
      businessHours: profile.businessHours,
      verificationTier: profile.verificationTier,
      verificationBadges: profile.verificationBadges,
      idVerified: profile.idVerified,
      licenseVerified: profile.licenseVerified,
      insuranceVerified: profile.insuranceVerified,
      backgroundCheckVerified: profile.backgroundCheckVerified,
      rating: profile.rating ? Number(profile.rating) : null,
      totalReviews: profile.totalReviews,
      totalCompleted: profile.totalCompleted,
      ratingBadge: profile.ratingBadge,
      user: {
        firstName: profile.user.firstName,
        lastName: profile.user.lastName,
        locationCity: profile.user.locationCity,
        locationState: profile.user.locationState,
      },
      createdAt: profile.createdAt,
    };
  }

  // ── Stripe Identity Verification (Phase 3 plan 06) ──────────────

  /**
   * Creates a Stripe Identity VerificationSession for the seller's profile.
   * The session.url is opened by the mobile client via url_launcher (per
   * RESEARCH.md Pitfall 1: flutter_stripe does NOT support Identity).
   * On `identity.verification_session.verified`, the existing webhook endpoint
   * (reusing STRIPE_WEBHOOK_SECRET — Pitfall 2) auto-creates a VerificationRequest
   * and flips sellerProfile.idVerified to true.
   */
  async createIdentitySession(userId: string): Promise<{ sessionId: string; url: string }> {
    const profile = await prisma.sellerProfile.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });
    if (!profile) throw new NotFoundError('SellerProfile');

    const stripe = getStripe();
    const returnUrl =
      env.STRIPE_CONNECT_RETURN_URL ?? 'reversemarket://seller/identity/complete';

    let session: Awaited<ReturnType<typeof stripe.identity.verificationSessions.create>>;
    try {
      session = await stripe.identity.verificationSessions.create({
        type: 'document',
        metadata: { sellerProfileId: profile.id },
        return_url: returnUrl,
      });
    } catch (e: unknown) {
      if (typeof e === 'object' && e !== null && (e as { statusCode?: number }).statusCode === 429) {
        throw new AppError(429, 'Identity verification is temporarily unavailable. Please wait a few minutes and try again.');
      }
      throw e;
    }

    if (!session.url) {
      throw new ConflictError('Stripe did not return a verification session URL');
    }

    return { sessionId: session.id, url: session.url };
  }
}
