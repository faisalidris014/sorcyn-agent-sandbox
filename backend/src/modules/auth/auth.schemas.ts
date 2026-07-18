import { z } from 'zod';

// Reusable password validator
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// ── Request Schemas ──────────────────────────────────────────

export const registerSchema = z
  .object({
    email: z.string().email().max(255).describe('User email (e.g. buyer@test.com)').transform((v) => v.toLowerCase().trim()),
    password: passwordSchema.describe('Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special (e.g. TestPassword123!)'),
    firstName: z.string().min(1, 'First name is required').max(100).trim().describe('First name (e.g. John)'),
    lastName: z.string().min(1, 'Last name is required').max(100).trim().describe('Last name (e.g. Doe)'),
    phone: z.string().max(20).optional().describe('Phone number (e.g. 214-555-0100)'),
    accountType: z.enum(['buyer', 'seller', 'both']).default('buyer').describe('Account role: buyer, seller, or both'),
    isBusiness: z.boolean().optional().describe('True for business accounts — requires a valid EIN'),
    ein: z
      .string()
      .regex(/^\d{2}-\d{7}$/, 'EIN must be in XX-XXXXXXX format')
      .optional()
      .describe('Employer Identification Number (XX-XXXXXXX). Required when isBusiness=true.'),
    businessName: z
      .string()
      .min(1)
      .max(255)
      .trim()
      .optional()
      .describe('Legal business name. Required when isBusiness=true.'),
    businessType: z
      .enum(['llc', 'corporation', 'sole_proprietor', 'partnership'])
      .optional()
      .describe('Business entity type. Required when isBusiness=true.'),
    salesTaxCertificateUrl: z
      .string()
      .url()
      .optional()
      .describe(
        'R2 URL of uploaded sales-tax certificate. Optional at register time — the upload endpoint requires auth, so the cert is attached post-registration via POST /users/me/upgrade-to-business. Publishing listings is gated until it is uploaded and submitted for verification (see posts.service).',
      ),
    locationZip: z
      .string()
      .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format')
      .optional()
      .describe('US ZIP code (e.g. 75001)'),
    agreeToTerms: z
      .literal(true, { message: 'You must agree to the Terms of Service' })
      .describe('Must be true — agree to Terms of Service'),
    agreeToPrivacy: z
      .literal(true, { message: 'You must agree to the Privacy Policy' })
      .describe('Must be true — agree to Privacy Policy'),
  })
  .superRefine((data, ctx) => {
    // Phase 3 plan 06: business registrations must include a valid EIN.
    if (data.isBusiness && !data.ein) {
      ctx.addIssue({
        code: 'custom',
        path: ['ein'],
        message: 'Business accounts require a valid EIN (XX-XXXXXXX format)',
      });
    }
    // v2.2: business registrations also require business name, type, and sales-tax cert.
    if (data.isBusiness && !data.businessName) {
      ctx.addIssue({
        code: 'custom',
        path: ['businessName'],
        message: 'Business accounts require a business name',
      });
    }
    if (data.isBusiness && !data.businessType) {
      ctx.addIssue({
        code: 'custom',
        path: ['businessType'],
        message: 'Business accounts require a business type (llc, corporation, sole_proprietor, partnership)',
      });
    }
    // NOTE: salesTaxCertificateUrl is intentionally NOT required here. The upload
    // endpoint (POST /uploads) requires a JWT, which the user does not have until
    // registration succeeds — so requiring the cert at register time made business
    // registration impossible by construction (issue #3). The cert is attached
    // post-registration via POST /users/me/upgrade-to-business (auth in hand), and
    // posts.service.ts blocks publishing until it is uploaded and pending verification.
  });

export const loginSchema = z.object({
  email: z.string().email().describe('Email address (e.g. buyer@test.com)').transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, 'Password is required').describe('Account password (e.g. TestPassword123!)'),
  rememberMe: z.boolean().default(false).describe('Extend session to 30 days'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required').describe('Refresh token from login response'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required').describe('Token from verification email link'),
});

export const resendVerificationSchema = z.object({
  email: z.string().email().describe('Email to resend verification to (e.g. buyer@test.com)').transform((v) => v.toLowerCase().trim()),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().describe('Email to send reset link to (e.g. buyer@test.com)').transform((v) => v.toLowerCase().trim()),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required').describe('Token from password reset email'),
  newPassword: passwordSchema.describe('New password (e.g. NewSecure456!)'),
});

// ── Inferred Types ───────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ── Response Types ───────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  accountType: string;
  isBusiness: boolean;
  ein: string | null;
  emailVerified: boolean;
  phone: string | null;
  locationZip: string | null;
  createdAt: Date;
}
