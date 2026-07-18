import { z } from 'zod';

// ── Request Schemas ──────────────────────────────────────────

export const createSellerProfileSchema = z.object({
  businessName: z.string().max(255).trim().optional().describe('Business name (e.g. Dallas Plumbing Services)'),
  bio: z.string().max(2000).trim().optional().describe('Business bio (e.g. Licensed plumber serving DFW for 10 years)'),
  serviceRadiusMiles: z.number().int().min(1).max(500).default(25).describe('Service radius in miles (default 25)'),
  categories: z.array(z.string().uuid()).default([]).describe('Array of category UUIDs you serve'),
  subcategories: z.array(z.string().uuid()).default([]).describe('Array of subcategory UUIDs'),
  yearsExperience: z.number().int().min(0).max(100).optional().describe('Years of experience (e.g. 10)'),
  businessWebsite: z.string().url().max(500).optional().nullable().describe('Website URL (e.g. https://myplumbing.com)'),
  businessHours: z
    // partialRecord (not record): Zod 4's record with an enum key is EXHAUSTIVE
    // — it requires every day present. Closed days are intentionally absent from
    // the payload (the editor omits them; absence == closed on read-back), so an
    // exhaustive record rejects any week with a day off ("expected object,
    // received undefined" on the missing day). partialRecord allows the subset.
    .partialRecord(
      z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
      z.object({
        open: z.string().regex(/^\d{2}:\d{2}$/).describe('Opening time HH:MM (e.g. 08:00)'),
        close: z.string().regex(/^\d{2}:\d{2}$/).describe('Closing time HH:MM (e.g. 17:00)'),
        closed: z.boolean().optional().describe('true if closed this day'),
      }),
    )
    .optional()
    .nullable()
    .describe('Business hours by day of week'),
});

export const updateSellerProfileSchema = z.object({
  businessName: z.string().max(255).trim().optional().nullable().describe('Updated business name'),
  bio: z.string().max(2000).trim().optional().nullable().describe('Updated bio'),
  serviceRadiusMiles: z.number().int().min(1).max(500).optional().describe('Updated service radius'),
  // categories/subcategories are intentionally NOT editable here. Products is auto-granted
  // at creation; Services/Jobs are added only via the verified category-request flow (#301).
  yearsExperience: z.number().int().min(0).max(100).optional().nullable().describe('Updated years of experience'),
  businessWebsite: z.string().url().max(500).optional().nullable().describe('Updated website URL'),
  businessHours: z
    // partialRecord (not record): Zod 4's record with an enum key is EXHAUSTIVE
    // — it requires every day present. Closed days are intentionally absent from
    // the payload (the editor omits them; absence == closed on read-back), so an
    // exhaustive record rejects any week with a day off ("expected object,
    // received undefined" on the missing day). partialRecord allows the subset.
    .partialRecord(
      z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
      z.object({
        open: z.string().regex(/^\d{2}:\d{2}$/),
        close: z.string().regex(/^\d{2}:\d{2}$/),
        closed: z.boolean().optional(),
      }),
    )
    .optional()
    .nullable()
    .describe('Updated business hours'),
  portfolioPhotos: z.array(z.string().url()).max(20).optional().describe('Portfolio photo URLs (max 20)'),
  profilePhotoUrl: z.string().url().optional().nullable().describe('Profile photo URL'),
});

export const submitVerificationSchema = z.object({
  verificationType: z.enum([
    'id',
    'ein',
    'sales_tax',
    'license',
    'insurance',
    'background_check',
  ]).describe('Type of verification to submit'),
  documents: z.array(z.string().url()).min(1, 'At least one document is required').max(10).describe('Document URLs (min 1, max 10)'),
  // License-specific fields
  licenseNumber: z.string().max(100).optional().describe('License number (for license verification)'),
  licenseState: z.string().max(50).optional().describe('State of license (e.g. TX)'),
  licenseExpiry: z.string().datetime().optional().describe('License expiry date (ISO 8601)'),
  // Insurance-specific fields
  insuranceProvider: z.string().max(255).optional().describe('Insurance provider name'),
  insurancePolicyNumber: z.string().max(100).optional().describe('Insurance policy number'),
  insuranceExpiry: z.string().datetime().optional().describe('Insurance expiry date (ISO 8601)'),
});

// ── Category Access Requests (#336) ──────────────────────────

export const categoryDocumentSchema = z.object({
  // `insurance` is an OPTIONAL doc (#381) — accepted here so a seller can attach
  // a certificate alongside required docs; it never gates access (see
  // findMissingDocTypes, which checks required types only).
  type: z.enum(['id', 'license', 'background_check', 'insurance']).describe('Document type'),
  url: z.string().url().describe('Uploaded document URL'),
  // #382: optional expiry for license/insurance docs. Written onto the
  // VerificationRequest this request opens (currently the insurance cert path)
  // so the lapse sweep has an expiry to act on. Ignored for non-expiring docs.
  expiresAt: z.string().datetime().optional().describe('Credential expiry date (ISO 8601, license/insurance)'),
});

export const submitCategoryRequestSchema = z.object({
  majorCategoryId: z.string().uuid().describe('Major category UUID (Services or Jobs)'),
  subcategoryIds: z
    .array(z.string().uuid())
    .min(1, 'At least one subcategory is required')
    .max(25)
    .describe('Subcategory UUIDs to unlock'),
  documents: z
    .array(categoryDocumentSchema)
    .max(10)
    .default([])
    .describe('Submitted documents ([{type,url}])'),
  licenseNumber: z.string().max(100).optional().describe('License number (for licensed subcategories)'),
  holderName: z.string().max(255).optional().describe('License holder name'),
});

export const categoryRequirementsQuerySchema = z.object({
  subcategoryIds: z
    .string()
    .min(1, 'subcategoryIds is required')
    .transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean))
    .describe('Comma-separated subcategory UUIDs'),
});

export const getSellerByIdParamsSchema = z.object({
  sellerId: z.string().uuid('Invalid seller ID').describe('Seller profile UUID'),
});

export const getSellerByUserIdParamsSchema = z.object({
  userId: z.string().uuid('Invalid user ID').describe('User UUID'),
});

// ── Inferred Types ───────────────────────────────────────────

export type CreateSellerProfileInput = z.infer<typeof createSellerProfileSchema>;
export type UpdateSellerProfileInput = z.infer<typeof updateSellerProfileSchema>;
export type SubmitVerificationInput = z.infer<typeof submitVerificationSchema>;
export type SubmitCategoryRequestInput = z.infer<typeof submitCategoryRequestSchema>;
export type CategoryRequirementsQuery = z.infer<typeof categoryRequirementsQuerySchema>;

// ── Response Types ───────────────────────────────────────────

export interface SellerProfileResponse {
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

  // Verification
  verificationTier: number;
  verificationBadges: unknown;
  emailVerified: boolean;
  phoneVerified: boolean;
  idVerified: boolean;
  licenseVerified: boolean;
  insuranceVerified: boolean;
  backgroundCheckVerified: boolean;

  // Credential expiry (owner-only, #382). Raw dates + derived owner-facing status
  // (`verified`/`expiring`/`expired`) computed at serialize time, never persisted.
  licenseExpiry: Date | null;
  insuranceExpiry: Date | null;
  licenseStatus: 'verified' | 'expiring' | 'expired' | null;
  insuranceStatus: 'verified' | 'expiring' | 'expired' | null;

  // Sales-tax certificate (owner-only — never exposed on public profiles)
  salesTaxCertificateUrl: string | null;
  salesTaxVerified: boolean;
  salesTaxStatus: 'pending' | 'under_review' | 'approved' | 'rejected' | 'expired' | null;
  salesTaxRejectionReason: string | null;

  // Stripe
  stripeOnboardingStatus: string;
  stripeChargesEnabled: boolean;
  stripePayoutsEnabled: boolean;

  // Stats
  profileStrength: number;
  rating: number | null;
  totalReviews: number;
  totalCompleted: number;
  totalActiveOffers: number;
  acceptanceRate: number | null;
  responseTimeHours: number | null;
  ratingBadge: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface PublicSellerProfile {
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

  // Verification badges (public)
  verificationTier: number;
  verificationBadges: unknown;
  idVerified: boolean;
  licenseVerified: boolean;
  insuranceVerified: boolean;
  backgroundCheckVerified: boolean;

  // Stats
  rating: number | null;
  totalReviews: number;
  totalCompleted: number;
  ratingBadge: string | null;

  // User info
  user: {
    firstName: string;
    lastName: string;
    locationCity: string | null;
    locationState: string | null;
  };

  createdAt: Date;
}
