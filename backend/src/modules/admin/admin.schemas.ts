import { z } from 'zod';

// ── Query Schemas ──────────────────────────────────────────

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('Page number'),
  limit: z.coerce.number().int().min(1).max(100).default(20).describe('Results per page'),
  status: z.enum(['active', 'suspended', 'banned', 'deleted']).optional().describe('Filter by user status'),
  accountType: z.enum(['buyer', 'seller', 'both']).optional().describe('Filter by account type'),
  search: z.string().max(100).optional().describe('Search by name or email'),
});

export const userIdParamsSchema = z.object({
  userId: z.string().uuid('Invalid user ID').describe('User UUID'),
});

export const suspendUserSchema = z.object({
  reason: z.string().min(10).max(500).describe('Reason for suspension (min 10 chars)'),
});

export const banUserSchema = z.object({
  reason: z.string().min(10).max(500).describe('Reason for ban (min 10 chars)'),
});

// ── Copyright Takedown (#313) ──────────────────────────────

export const takedownImageSchema = z.object({
  postId: z.string().uuid().describe('Post the infringing image is attached to'),
  imageUrl: z.string().url().describe('Exact photo URL from the post to take down'),
  reason: z.string().max(500).optional().describe('Optional takedown reason for the audit trail'),
});

export const listTakedownsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('Page number'),
  limit: z.coerce.number().int().min(1).max(100).default(50).describe('Results per page'),
});

// ── Verification ───────────────────────────────────────────

export const listVerificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('Page number'),
  limit: z.coerce.number().int().min(1).max(50).default(20).describe('Results per page'),
  status: z
    .enum(['pending', 'under_review', 'approved', 'rejected', 'expired'])
    .optional()
    .describe('Filter by verification status'),
  type: z
    .enum(['id', 'ein', 'license', 'insurance', 'background_check'])
    .optional()
    .describe('Filter by verification type'),
});

export const verificationIdParamsSchema = z.object({
  verificationId: z.string().uuid('Invalid verification ID').describe('Verification request UUID'),
});

export const reviewVerificationSchema = z
  .object({
    action: z.enum(['approve', 'reject']).describe('Approve or reject the verification'),
    notes: z.string().max(1000).optional().describe('Admin notes'),
    rejectionReason: z.string().min(10).max(500).optional().describe('Required when rejecting — reason for rejection'),
    // #382: authoritative expiry the admin sets on approve (license/insurance).
    // Overrides the seller-claimed / TDLR-parsed value; written to the request
    // AND re-synced onto SellerProfile.{license,insurance}Expiry.
    expiresAt: z.string().datetime().optional().describe('Credential expiry date the admin approves (ISO 8601)'),
  })
  .refine(
    (data) => data.action !== 'reject' || data.rejectionReason,
    {
      message: 'Rejection reason required when rejecting',
      path: ['rejectionReason'],
    },
  );

// ── Category Access Requests (#336) ─────────────────────────

export const listCategoryRequestsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('Page number'),
  limit: z.coerce.number().int().min(1).max(50).default(20).describe('Results per page'),
  status: z
    .enum(['pending', 'under_review', 'approved', 'rejected', 'expired'])
    .optional()
    .describe('Filter by status (defaults to pending)'),
});

export const categoryRequestIdParamsSchema = z.object({
  requestId: z.string().uuid('Invalid request ID').describe('Category request UUID'),
});

export const reviewCategoryRequestSchema = z
  .object({
    action: z.enum(['approve', 'reject']).describe('Approve or reject the category request'),
    notes: z.string().max(1000).optional().describe('Admin notes'),
    rejectionReason: z.string().min(10).max(500).optional().describe('Required when rejecting — reason for rejection'),
  })
  .refine((data) => data.action !== 'reject' || data.rejectionReason, {
    message: 'Rejection reason required when rejecting',
    path: ['rejectionReason'],
  });

// ── Disputes ───────────────────────────────────────────────

export const listDisputesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('Page number'),
  limit: z.coerce.number().int().min(1).max(50).default(20).describe('Results per page'),
  status: z
    .enum(['open', 'under_review', 'resolved', 'appealed', 'closed'])
    .optional()
    .describe('Filter by dispute status'),
});

export const disputeIdParamsSchema = z.object({
  disputeId: z.string().uuid('Invalid dispute ID').describe('Dispute UUID'),
});

export const resolveDisputeSchema = z.object({
  outcome: z.enum(['full_refund', 'partial_refund', 'no_refund', 'custom']).describe('Resolution outcome'),
  refundAmount: z.number().min(0).optional().describe('Refund amount for partial_refund/custom (e.g. 50.00)'),
  resolutionSummary: z.string().min(10).max(2000).describe('Summary of the resolution decision (min 10 chars)'),
});

// ── Moderation ─────────────────────────────────────────────

export const listFlaggedContentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('Page number'),
  limit: z.coerce.number().int().min(1).max(50).default(20).describe('Results per page'),
  contentType: z.enum(['review', 'message']).optional().describe('Filter by content type'),
});

export const moderateContentSchema = z.object({
  action: z.enum(['approve', 'reject']).describe('Approve or reject the flagged content'),
  reason: z.string().max(500).optional().describe('Reason for moderation decision'),
});

export const reviewIdParamsSchema = z.object({
  reviewId: z.string().uuid('Invalid review ID').describe('Review UUID'),
});

export const messageIdParamsSchema = z.object({
  messageId: z.string().uuid('Invalid message ID').describe('Message UUID'),
});

// ── Transactions ───────────────────────────────────────────

export const listTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('Page number'),
  limit: z.coerce.number().int().min(1).max(100).default(20).describe('Results per page'),
  status: z.string().optional().describe('Filter by transaction status'),
  escrowStatus: z
    .enum(['held', 'released', 'refunded', 'frozen'])
    .optional()
    .describe('Filter by escrow status'),
});

// ── Audit Log ──────────────────────────────────────────────

export const listAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('Page number'),
  limit: z.coerce.number().int().min(1).max(100).default(50).describe('Results per page'),
  action: z.string().max(100).optional().describe('Filter by action type'),
  resourceType: z.string().max(50).optional().describe('Filter by resource type (e.g. user, post, transaction)'),
  userId: z.string().uuid().optional().describe('Filter by user UUID'),
});

// ── Type Exports ───────────────────────────────────────────

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type SuspendUserInput = z.infer<typeof suspendUserSchema>;
export type BanUserInput = z.infer<typeof banUserSchema>;
export type ListVerificationsQuery = z.infer<typeof listVerificationsQuerySchema>;
export type ReviewVerificationInput = z.infer<typeof reviewVerificationSchema>;
export type ListCategoryRequestsQuery = z.infer<typeof listCategoryRequestsQuerySchema>;
export type ReviewCategoryRequestInput = z.infer<typeof reviewCategoryRequestSchema>;
export type ListDisputesQuery = z.infer<typeof listDisputesQuerySchema>;
export type ResolveDisputeInput = z.infer<typeof resolveDisputeSchema>;
export type ListFlaggedContentQuery = z.infer<typeof listFlaggedContentQuerySchema>;
export type ModerateContentInput = z.infer<typeof moderateContentSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
export type TakedownImageInput = z.infer<typeof takedownImageSchema>;
export type ListTakedownsQuery = z.infer<typeof listTakedownsQuerySchema>;
