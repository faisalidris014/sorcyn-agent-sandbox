import { z } from 'zod';

export const createReviewSchema = z.object({
  transactionId: z.string().uuid('Invalid transaction ID').describe('UUID of the completed transaction'),
  overallRating: z.number().int().min(1).max(5).describe('Overall rating 1-5 (e.g. 5)'),
  categoryRatings: z.object({
    quality: z.number().int().min(1).max(5).optional().describe('Quality rating 1-5'),
    communication: z.number().int().min(1).max(5).optional().describe('Communication rating 1-5'),
    timeliness: z.number().int().min(1).max(5).optional().describe('Timeliness rating 1-5'),
    professionalism: z.number().int().min(1).max(5).optional().describe('Professionalism rating 1-5'),
    value: z.number().int().min(1).max(5).optional().describe('Value for money rating 1-5'),
  }).default({}).describe('Detailed category ratings (all optional)'),
  writtenReview: z.string().min(10).max(2000).optional().describe('Written review text (min 10 chars)'),
  wouldRecommend: z.boolean().describe('Would you recommend this seller?'),
  completionPhotos: z.array(z.string().url()).max(10).default([]).describe('Photo URLs of completed work'),
});

export const listSellerReviewsParamsSchema = z.object({
  sellerId: z.string().uuid('Invalid seller ID').describe('Seller profile UUID'),
});

export const listSellerReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('Page number'),
  limit: z.coerce.number().int().min(1).max(50).default(20).describe('Results per page'),
  sort: z.enum(['newest', 'oldest', 'highest', 'lowest']).default('newest').describe('Sort order'),
});

export const reviewIdParamsSchema = z.object({
  reviewId: z.string().uuid('Invalid review ID').describe('Review UUID'),
});

export const reportReviewSchema = z.object({
  reason: z.string().min(10).max(500).describe('Reason for reporting this review (min 10 chars)'),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ListSellerReviewsQuery = z.infer<typeof listSellerReviewsQuerySchema>;
export type ReportReviewInput = z.infer<typeof reportReviewSchema>;
