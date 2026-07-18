import { z } from 'zod';

const evidenceItemSchema = z.object({
  type: z.enum(['photo', 'screenshot', 'document', 'text']).describe('Type of evidence'),
  url: z.string().url().optional().describe('URL to evidence file (required for non-text types)'),
  description: z.string().max(1000).describe('Description of this evidence item'),
});

export const createDisputeSchema = z.object({
  transactionId: z.string().uuid('Invalid transaction ID').describe('UUID of the transaction to dispute'),
  disputeType: z.string().min(1).max(50).describe('Dispute type (e.g. quality_issue, not_as_described, non_delivery, communication)'),
  description: z.string().min(20).max(5000).describe('Detailed description of the dispute (min 20 chars)'),
  requestedResolution: z.enum(['full_refund', 'partial_refund', 'no_refund', 'other']).optional().describe('Requested resolution type'),
  requestedAmount: z.number().min(0).optional().describe('Amount requested for partial refund'),
  evidence: z.array(evidenceItemSchema).max(10).default([]).describe('Initial evidence items (max 10)'),
});

export const listMyDisputesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('Page number'),
  limit: z.coerce.number().int().min(1).max(50).default(20).describe('Results per page'),
  status: z.enum(['open', 'under_review', 'resolved', 'appealed', 'closed']).optional().describe('Filter by dispute status'),
});

export const disputeIdParamsSchema = z.object({
  disputeId: z.string().uuid('Invalid dispute ID').describe('Dispute UUID'),
});

export const submitEvidenceSchema = z.object({
  evidence: z.array(evidenceItemSchema).min(1).max(10).describe('Evidence items to submit (1-10)'),
});

export const appealDisputeSchema = z.object({
  reason: z.string().min(20).max(5000).describe('Reason for appealing the resolved dispute (min 20 chars)'),
  additionalEvidence: z.array(evidenceItemSchema).max(5).default([]).describe('Additional evidence for the appeal (max 5)'),
});

export type CreateDisputeInput = z.infer<typeof createDisputeSchema>;
export type ListMyDisputesQuery = z.infer<typeof listMyDisputesQuerySchema>;
export type SubmitEvidenceInput = z.infer<typeof submitEvidenceSchema>;
export type AppealDisputeInput = z.infer<typeof appealDisputeSchema>;
