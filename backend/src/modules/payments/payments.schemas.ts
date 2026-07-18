import { z } from 'zod';

export const createPaymentIntentSchema = z.object({
  transactionId: z.string().uuid('Invalid transaction ID').describe('UUID of the transaction to pay for'),
});
export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;

export const refundPaymentSchema = z.object({
  transactionId: z.string().uuid('Invalid transaction ID').describe('UUID of the transaction to refund'),
  reason: z.string().min(10).max(500).optional().describe('Reason for refund (min 10 chars if provided)'),
});
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;
