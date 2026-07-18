import { z } from 'zod';

export const listPayoutsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('Page number'),
  limit: z.coerce.number().int().min(1).max(50).default(20).describe('Results per page'),
  status: z.enum(['pending', 'in_transit', 'paid', 'failed', 'cancelled']).optional().describe('Filter by payout status'),
});

export const payoutIdParamsSchema = z.object({
  payoutId: z.string().uuid('Invalid payout ID').describe('Payout UUID'),
});

export type ListPayoutsQuery = z.infer<typeof listPayoutsQuerySchema>;
