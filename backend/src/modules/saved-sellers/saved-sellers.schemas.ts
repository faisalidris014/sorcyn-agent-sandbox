import { z } from 'zod';

export const sellerIdParamsSchema = z.object({
  sellerId: z.string().uuid('Invalid seller profile ID').describe('Seller profile UUID'),
});

export const listSavedSellersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('Page number'),
  limit: z.coerce.number().int().min(1).max(50).default(20).describe('Results per page'),
});

export type ListSavedSellersQuery = z.infer<typeof listSavedSellersQuerySchema>;
