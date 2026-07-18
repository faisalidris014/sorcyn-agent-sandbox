import { z } from 'zod';

// ── Request Schemas ──────────────────────────────────────────

export const transactionIdParamsSchema = z.object({
  transactionId: z.string().uuid('Invalid transaction ID').describe('Transaction UUID'),
});

export const updateTransactionStatusSchema = z.object({
  status: z.enum([
    'scheduled', 'on_the_way', 'started',
    'preparing_shipment', 'shipped', 'in_transit',
    'pending_meetup', 'meetup_scheduled',
  ]).describe('New transaction status'),
  trackingNumber: z.string().max(100).optional().describe('Shipping tracking number (e.g. 1Z999AA10123456784)'),
  carrier: z.string().max(50).optional().describe('Shipping carrier (e.g. UPS, FedEx, USPS)'),
  estimatedDeliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Estimated delivery date (e.g. 2026-03-20)'),
  meetupLocation: z.string().max(500).optional().describe('Meetup address (e.g. 123 Main St, Dallas, TX)'),
  meetupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Meetup date (e.g. 2026-03-15)'),
  meetupTime: z.string().max(20).optional().describe('Meetup time (e.g. 2:00 PM)'),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Scheduled work date (e.g. 2026-03-15)'),
  scheduledTime: z.string().max(50).optional().describe('Scheduled work time (e.g. 9:00 AM - 12:00 PM)'),
  specialInstructions: z.string().max(2000).optional().describe('Special instructions for the buyer'),
  note: z.string().max(500).optional().describe('Additional notes'),
});

export const markCompleteSchema = z.object({
  afterPhotos: z.array(z.string().url()).min(1, 'At least one after photo is required').max(20).describe('After photos showing completed work (required, min 1)'),
  // SEC-M8 (#268): before photos are required for ALL transaction types so the core
  // before/after fraud control tying payouts to evidence cannot be bypassed.
  beforePhotos: z.array(z.string().url()).min(1, 'At least one before photo is required').max(20).describe('Before photos for comparison (required, min 1)'),
  workSummary: z.string().min(10).max(2000).optional().describe('Summary of work completed'),
  completionNotes: z.string().max(2000).optional().describe('Additional completion notes'),
});

export const approveTransactionSchema = z.object({
  completionPhotos: z.array(z.string().url()).max(20).default([]).describe('Optional buyer confirmation photos'),
  note: z.string().max(500).optional().describe('Approval note (e.g. Great work!)'),
});

export const requestChangesSchema = z.object({
  reason: z.string().min(20, 'Please describe the required changes in at least 20 characters').max(1000).describe('What changes are needed (min 20 chars)'),
});

export const cancelTransactionSchema = z.object({
  reason: z.string().min(10, 'Please provide a reason for cancellation').max(500).describe('Reason for cancellation (min 10 chars)'),
});

export const listMyTransactionsQuerySchema = z.object({
  role: z.enum(['buyer', 'seller']).default('buyer').describe('View as buyer or seller'),
  status: z.enum([
    'in_progress', 'scheduled', 'on_the_way', 'started',
    'awaiting_approval', 'changes_requested', 'approved',
    'cancelled', 'disputed',
    'preparing_shipment', 'shipped', 'in_transit', 'delivered',
    'pending_meetup', 'meetup_scheduled', 'meetup_complete', 'qr_scanned',
    'completed', 'pending_start', 'in_progress_milestone',
  ]).optional().describe('Filter by transaction status'),
  page: z.coerce.number().int().min(1).default(1).describe('Page number'),
  limit: z.coerce.number().int().min(1).max(50).default(20).describe('Results per page'),
  sort: z.enum(['newest', 'oldest']).default('newest').describe('Sort order'),
});

// ── Inferred Types ───────────────────────────────────────────

export type UpdateTransactionStatusInput = z.infer<typeof updateTransactionStatusSchema>;
export type MarkCompleteInput = z.infer<typeof markCompleteSchema>;
export type ApproveTransactionInput = z.infer<typeof approveTransactionSchema>;
export type RequestChangesInput = z.infer<typeof requestChangesSchema>;
export type CancelTransactionInput = z.infer<typeof cancelTransactionSchema>;
export type ListMyTransactionsQuery = z.infer<typeof listMyTransactionsQuerySchema>;
