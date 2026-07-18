import { z } from 'zod';

// ── Request Schemas ──────────────────────────────────────────

export const createOfferSchema = z.object({
  postId: z.string().uuid('Invalid post ID').describe('UUID of the post to submit offer for'),
  offerType: z.enum(['service', 'product', 'job_application', 'inventory']).describe('Type of offer matching the post category'),
  quoteAmount: z.number().min(10, 'Minimum quote is $10').max(1_000_000).describe('Quote amount in dollars (e.g. 150)'),
  pricingType: z.enum(['flat_rate', 'hourly', 'quote', 'fixed', 'per_item', 'custom']).optional().nullable().describe('Pricing model (e.g. flat_rate)'),
  estimatedHours: z.number().min(0.5).max(10000).optional().nullable().describe('Estimated hours to complete (e.g. 2)'),
  canStart: z.string().max(100).optional().nullable().describe('When you can start (e.g. Within 2 hours, Tomorrow)'),
  specificDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional().nullable().describe('Specific start date (e.g. 2026-03-15)'),
  completionTime: z.string().max(100).optional().nullable().describe('Estimated completion time (e.g. Same day, 3-5 days)'),
  message: z.string().max(1000).optional().nullable().describe('Optional pitch to the buyer — explain your qualifications and approach'),
  attachments: z.array(z.string().url()).max(10).default([]).describe('Supporting document/photo URLs'),
  photos: z.array(z.string().url()).max(10).default([]).describe('Array of photo URLs (max 10)'),
  terms: z.string().max(2000).optional().nullable().describe('Terms and conditions for the work'),
  warranty: z.string().max(1000).optional().nullable().describe('Warranty details if applicable'),
  categorySpecific: z.record(z.string(), z.any()).default({}).describe('Category-specific fields'),
});

export const updateOfferSchema = z.object({
  quoteAmount: z.number().min(10, 'Minimum quote is $10').max(1_000_000).optional().describe('Updated quote amount'),
  pricingType: z.enum(['flat_rate', 'hourly', 'quote', 'fixed', 'per_item', 'custom']).optional().nullable().describe('Updated pricing type'),
  estimatedHours: z.number().min(0.5).max(10000).optional().nullable().describe('Updated hours estimate'),
  canStart: z.string().max(100).optional().nullable().describe('Updated availability'),
  specificDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable().describe('Updated start date'),
  completionTime: z.string().max(100).optional().nullable().describe('Updated completion time'),
  message: z.string().max(1000).optional().nullable().describe('Updated message (optional)'),
  attachments: z.array(z.string().url()).max(10).optional().describe('Updated attachments'),
  photos: z.array(z.string().url()).max(10).optional().describe('Updated photos'),
  terms: z.string().max(2000).optional().nullable().describe('Updated terms'),
  warranty: z.string().max(1000).optional().nullable().describe('Updated warranty'),
  categorySpecific: z.record(z.string(), z.any()).optional().describe('Updated category-specific fields'),
});

export const offerIdParamsSchema = z.object({
  offerId: z.string().uuid('Invalid offer ID').describe('Offer UUID'),
});

export const postIdParamsSchema = z.object({
  postId: z.string().uuid('Invalid post ID').describe('Post UUID'),
});

export const counterOfferSchema = z.object({
  counterAmount: z.number().min(10, 'Minimum counter amount is $10').max(1_000_000).describe('Counter-offer amount in dollars'),
  counterMessage: z.string().min(10).max(1000).optional().describe('Message explaining the counter-offer'),
  counterTerms: z.string().max(2000).optional().describe('Modified terms for the counter-offer'),
});

export const listMyOffersQuerySchema = z.object({
  status: z.enum(['pending', 'accepted', 'declined', 'withdrawn', 'expired', 'counter_offered', 'needs_reconfirmation']).optional().describe('Filter by offer status'),
  page: z.coerce.number().int().min(1).default(1).describe('Page number'),
  limit: z.coerce.number().int().min(1).max(50).default(20).describe('Results per page'),
  sort: z.enum(['newest', 'oldest', 'price_low', 'price_high']).default('newest').describe('Sort order'),
});

export const listPostOffersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('Page number'),
  limit: z.coerce.number().int().min(1).max(50).default(20).describe('Results per page'),
  sort: z.enum(['best_match', 'newest', 'price_low', 'price_high']).default('best_match').describe('Sort order'),
});

// ── Inferred Types ───────────────────────────────────────────

export type CreateOfferInput = z.infer<typeof createOfferSchema>;
export type UpdateOfferInput = z.infer<typeof updateOfferSchema>;
export type CounterOfferInput = z.infer<typeof counterOfferSchema>;
export type ListMyOffersQuery = z.infer<typeof listMyOffersQuerySchema>;
export type ListPostOffersQuery = z.infer<typeof listPostOffersQuerySchema>;
