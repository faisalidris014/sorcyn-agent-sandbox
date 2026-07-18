import { z } from 'zod';

export const createSavedSearchSchema = z.object({
  name: z.string().min(1).max(255).describe('Name for this saved search (e.g. "Plumbing in Dallas")'),
  searchType: z.enum(['posts', 'sellers']).describe('Type of results to search for'),
  filters: z.record(z.string(), z.unknown()).describe('Search filter criteria as JSON object'),
  notificationsEnabled: z.boolean().default(true).describe('Receive notifications when new results match'),
});

export const updateSavedSearchSchema = z.object({
  name: z.string().min(1).max(255).optional().describe('Updated name'),
  filters: z.record(z.string(), z.unknown()).optional().describe('Updated filters'),
  notificationsEnabled: z.boolean().optional().describe('Toggle notifications'),
  isActive: z.boolean().optional().describe('Activate or deactivate this saved search'),
});

export const savedSearchIdParamsSchema = z.object({
  searchId: z.string().uuid('Invalid saved search ID').describe('Saved search UUID'),
});

export const listSavedSearchesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('Page number'),
  limit: z.coerce.number().int().min(1).max(50).default(20).describe('Results per page'),
});

export type CreateSavedSearchInput = z.infer<typeof createSavedSearchSchema>;
export type UpdateSavedSearchInput = z.infer<typeof updateSavedSearchSchema>;
export type ListSavedSearchesQuery = z.infer<typeof listSavedSearchesQuerySchema>;
