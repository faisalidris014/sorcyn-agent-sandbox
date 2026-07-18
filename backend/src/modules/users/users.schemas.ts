import { z } from 'zod';

// ── Supported values ────────────────────────────────────────

const SUPPORTED_LANGUAGES = ['en', 'es', 'zh', 'ar', 'fr', 'pt', 'hi', 'vi', 'ko', 'ja'] as const;
const MARKETPLACE_CONTEXTS = ['b2c', 'b2b', 'c2c'] as const;

// ── Request Schemas ──────────────────────────────────────────

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).trim().optional().describe('First name (e.g. John)'),
  lastName: z.string().min(1).max(100).trim().optional().describe('Last name (e.g. Doe)'),
  phone: z.string().max(20).optional().nullable().describe('Phone number (e.g. 214-555-0100)'),
  bio: z.string().max(2000).trim().optional().nullable().describe('Short bio about yourself'),
  locationCity: z.string().max(100).trim().optional().nullable().describe('City (e.g. Dallas)'),
  locationState: z.string().max(50).trim().optional().nullable().describe('State (e.g. TX)'),
  locationZip: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format')
    .optional()
    .nullable()
    .describe('ZIP code (e.g. 75001)'),
  locationCountry: z.string().max(50).trim().optional().describe('Country (default: US)'),
  latitude: z.number().min(-90).max(90).optional().nullable().describe('Latitude (e.g. 32.7767)'),
  longitude: z.number().min(-180).max(180).optional().nullable().describe('Longitude (e.g. -96.7970)'),
  notificationPreferences: z
    .object({
      email_offers: z.boolean().optional().describe('Email notifications for offers'),
      sms_offers: z.boolean().optional().describe('SMS notifications for offers'),
      push_messages: z.boolean().optional().describe('Push notifications for messages'),
    })
    .optional()
    .describe('Notification preferences'),
  preferredLanguage: z
    .enum(SUPPORTED_LANGUAGES)
    .optional()
    .describe('Preferred language code (e.g. en, es, zh)'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required').describe('Your current password'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .describe('New password (e.g. NewSecure456!)'),
});

export const updateFcmTokenSchema = z.object({
  fcmToken: z.string().min(1, 'FCM token is required').describe('Firebase Cloud Messaging device token'),
});

export const switchAccountTypeSchema = z.object({
  accountType: z.enum(['buyer', 'seller', 'both']).describe('New account type'),
});

export const switchMarketplaceContextSchema = z.object({
  context: z.enum(MARKETPLACE_CONTEXTS).describe('Marketplace context to switch to (b2c, b2b, c2c)'),
});

export const getUserByIdParamsSchema = z.object({
  userId: z.string().uuid('Invalid user ID').describe('User UUID'),
});

// v2.2: classic-to-business upgrade
export const upgradeToBusinessSchema = z.object({
  ein: z
    .string()
    .regex(/^\d{2}-\d{7}$/, 'EIN must be in XX-XXXXXXX format')
    .describe('Employer Identification Number (XX-XXXXXXX)'),
  businessName: z.string().min(1).max(255).trim().describe('Legal business name'),
  businessType: z
    .enum(['llc', 'corporation', 'sole_proprietor', 'partnership'])
    .describe('Business entity type'),
  salesTaxCertificateUrl: z
    .string()
    .url()
    .describe('R2 URL of uploaded sales-tax certificate'),
});

// Issue #3: attach/update the sales-tax certificate (and optionally name/type/EIN)
// for an account that is ALREADY a business — e.g. a business account that
// registered without a cert because /uploads needs an auth token the user only
// gets after registration. upgradeToBusiness 409s on already-business accounts,
// so this is the post-registration completion path.
export const updateBusinessProfileSchema = z.object({
  salesTaxCertificateUrl: z
    .string()
    .url()
    .describe('R2 URL of uploaded sales-tax certificate'),
  ein: z
    .string()
    .regex(/^\d{2}-\d{7}$/, 'EIN must be in XX-XXXXXXX format')
    .optional()
    .describe('Employer Identification Number (XX-XXXXXXX) — optional, only if correcting'),
  businessName: z.string().min(1).max(255).trim().optional().describe('Legal business name — optional, only if correcting'),
  businessType: z
    .enum(['llc', 'corporation', 'sole_proprietor', 'partnership'])
    .optional()
    .describe('Business entity type — optional, only if correcting'),
});

// ── Inferred Types ───────────────────────────────────────────

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateFcmTokenInput = z.infer<typeof updateFcmTokenSchema>;
export type SwitchAccountTypeInput = z.infer<typeof switchAccountTypeSchema>;
export type SwitchMarketplaceContextInput = z.infer<typeof switchMarketplaceContextSchema>;
export type UpgradeToBusinessInput = z.infer<typeof upgradeToBusinessSchema>;
export type UpdateBusinessProfileInput = z.infer<typeof updateBusinessProfileSchema>;

// ── Response Types ───────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  accountType: string;
  isBusiness: boolean;
  ein: string | null;
  phone: string | null;
  phoneVerified: boolean;
  emailVerified: boolean;
  profilePhotoUrl: string | null;
  locationCity: string | null;
  locationState: string | null;
  locationZip: string | null;
  locationCountry: string;
  latitude: number | null;
  longitude: number | null;
  bio: string | null;
  notificationPreferences: unknown;
  preferredLanguage: string;
  activeMarketplace: string;
  marketplaceContexts: unknown;
  rating: number | null;
  totalReviews: number;
  totalTransactions: number;
  status: string;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicUserProfile {
  id: string;
  firstName: string;
  lastName: string;
  accountType: string;
  profilePhotoUrl: string | null;
  locationCity: string | null;
  locationState: string | null;
  bio: string | null;
  rating: number | null;
  totalReviews: number;
  totalTransactions: number;
  createdAt: Date;
}
