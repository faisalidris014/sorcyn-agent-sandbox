import { z } from 'zod';

// ── Request Schemas ──────────────────────────────────────────

export const listCategoriesQuerySchema = z.object({
  parentId: z.string().uuid().optional().describe('Filter by parent category UUID'),
  activeOnly: z
    .enum(['true', 'false'])
    .default('true')
    .describe('Only active categories (default: true)')
    .transform((v) => v === 'true'),
  mvpOnly: z
    .enum(['true', 'false'])
    .default('false')
    .describe('Only MVP categories — Products, Services, Jobs (default: false)')
    .transform((v) => v === 'true'),
  context: z.enum(['b2c', 'b2b', 'c2c']).optional().describe('Filter by marketplace context'),
});

export const getCategoryBySlugParamsSchema = z.object({
  slug: z.string().min(1).max(100).describe('Category slug (e.g. services, products, jobs)'),
});

// ── Inferred Types ───────────────────────────────────────────

export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;

// ── Response Types ───────────────────────────────────────────

export interface CategoryResponse {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  parentCategoryId: string | null;
  sortOrder: number;
  isActive: boolean;
  enabledInMvp: boolean;
}

export interface CategoryWithChildren extends CategoryResponse {
  children: CategoryResponse[];
}

export interface CategoryTreeNode extends CategoryResponse {
  children: CategoryResponse[];
}
