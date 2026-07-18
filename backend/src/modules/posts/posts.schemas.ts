import { z } from 'zod';

// ── Bounded JSON value validation (SEC-H5 #259) ──────────────
// `categorySpecific` and `requirements` are free-form JSONB. Previously typed
// `z.record(z.string(), z.any())`, which accepted arbitrary nested objects of
// unbounded size/depth and stored them verbatim — a stored-XSS amplifier and a
// cheap storage/DoS vector. We constrain the value space to plain JSON scalars
// and cap depth, key count, array length, string length, and total node count.
export const JSON_MAX_DEPTH = 5;
export const JSON_MAX_STRING_LENGTH = 2000;
export const JSON_MAX_KEY_LENGTH = 200;
export const JSON_MAX_KEYS_PER_OBJECT = 50;
export const JSON_MAX_ARRAY_LENGTH = 100;
export const JSON_MAX_TOTAL_NODES = 500;

function walkBoundedJson(
  value: unknown,
  depth: number,
  state: { nodes: number },
  ctx: z.RefinementCtx,
  path: (string | number)[],
): void {
  state.nodes += 1;
  if (state.nodes > JSON_MAX_TOTAL_NODES) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Exceeds maximum of ${JSON_MAX_TOTAL_NODES} total values`,
      path,
    });
    return;
  }
  if (depth > JSON_MAX_DEPTH) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Nesting too deep (max ${JSON_MAX_DEPTH} levels)`,
      path,
    });
    return;
  }

  if (value === null) return;

  if (typeof value === 'string') {
    if (value.length > JSON_MAX_STRING_LENGTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `String exceeds ${JSON_MAX_STRING_LENGTH} characters`,
        path,
      });
    }
    return;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Number must be finite (no NaN/Infinity)',
        path,
      });
    }
    return;
  }

  if (typeof value === 'boolean') return;

  if (Array.isArray(value)) {
    if (value.length > JSON_MAX_ARRAY_LENGTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Array exceeds ${JSON_MAX_ARRAY_LENGTH} items`,
        path,
      });
    }
    value.forEach((item, i) => walkBoundedJson(item, depth + 1, state, ctx, [...path, i]));
    return;
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>);
    if (keys.length > JSON_MAX_KEYS_PER_OBJECT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Object exceeds ${JSON_MAX_KEYS_PER_OBJECT} keys`,
        path,
      });
    }
    for (const key of keys) {
      if (key.length > JSON_MAX_KEY_LENGTH) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Key exceeds ${JSON_MAX_KEY_LENGTH} characters`,
          path: [...path, key],
        });
      }
      walkBoundedJson(
        (value as Record<string, unknown>)[key],
        depth + 1,
        state,
        ctx,
        [...path, key],
      );
    }
    return;
  }

  // undefined, function, symbol, bigint — not valid JSON, reject.
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: `Unsupported value type: ${typeof value}`,
    path,
  });
}

// A free-form but bounded JSON object: string keys → constrained JSON values.
export const boundedJsonObjectSchema = z
  .record(z.string(), z.unknown())
  .superRefine((obj, ctx) => {
    const state = { nodes: 0 };
    walkBoundedJson(obj, 1, state, ctx, []);
  });

// ── Product-Specific Validation ─────────────────────────────

export const conditionGradeEnum = z.enum([
  'new',
  'like_new',
  'excellent',
  'good',
  'fair',
  'poor',
]);
export type ConditionGrade = z.infer<typeof conditionGradeEnum>;

export const productCategorySpecificSchema = z.object({
  condition: conditionGradeEnum.describe('Item condition (required for products)'),
  brand: z.string().max(100).optional().describe('Brand name'),
  model: z.string().max(100).optional().describe('Model name/number'),
});

// ── Request Schemas ──────────────────────────────────────────

export const createPostSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID').describe('UUID of the category (get from GET /categories)'),
  subcategoryId: z.string().uuid('Invalid subcategory ID').describe('UUID of subcategory under the selected category (required)'),
  title: z.string().min(5, 'Title must be at least 5 characters').max(200).trim().describe('What you need (e.g. Need a plumber for kitchen sink repair)'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000).trim().describe('Detailed description of your request (min 20 chars)'),
  photos: z.array(z.string().url()).max(10).default([]).describe('Array of photo URLs (max 10)'),
  videos: z.array(z.string().url()).max(3).default([]).describe('Array of video URLs (max 3)'),
  budgetMin: z.number().min(0).optional().describe('Minimum budget in dollars (e.g. 100)'),
  budgetMax: z.number().min(0).optional().describe('Maximum budget in dollars (e.g. 300)'),
  budgetType: z.enum(['range', 'open', 'fixed']).default('range').describe('Budget type: range, open, or fixed'),

  // Location
  locationAddress: z.string().max(500).optional().describe('Street address (e.g. 123 Main St)'),
  locationCity: z.string().max(100).optional().describe('City (e.g. Dallas)'),
  locationState: z.string().max(50).optional().describe('State (e.g. TX)'),
  locationZip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code').optional().describe('ZIP code (e.g. 75001)'),
  locationCountry: z.string().max(50).default('US').describe('Country code (default: US)'),
  latitude: z.number().min(-90).max(90).optional().describe('Latitude (e.g. 32.7767)'),
  longitude: z.number().min(-180).max(180).optional().describe('Longitude (e.g. -96.7970)'),

  // Timeline
  urgency: z.enum(['asap', 'within_24_hours', 'within_3_days', 'within_1_week', 'flexible', 'specific_date']).optional().describe('How urgent is this request'),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional().describe('Preferred date (e.g. 2026-03-15)'),
  preferredTime: z.string().max(50).optional().describe('Preferred time (e.g. Morning, 2:00 PM)'),

  // Category-specific
  categorySpecific: boundedJsonObjectSchema.default({}).describe('Category-specific fields as key-value pairs'),
  requirements: boundedJsonObjectSchema.default({}).describe('Additional requirements as key-value pairs'),

  // Marketplace context
  marketplaceContext: z.enum(['b2c', 'b2b', 'c2c']).optional().describe('Marketplace context (defaults to user\'s active context)'),

  // Post options
  status: z.enum(['draft', 'active']).default('active').describe('Post status: draft or active'),
  expiresInHours: z.number().int().min(1).max(2160).default(720).describe('Hours until expiry (default 720 = 30 days, max 2160 = 90 days)'),
});

export const updatePostSchema = z.object({
  title: z.string().min(5).max(200).trim().optional().describe('Updated title'),
  description: z.string().min(20).max(5000).trim().optional().describe('Updated description'),
  categoryId: z.string().uuid().optional().describe('New category UUID'),
  subcategoryId: z.string().uuid().optional().describe('New subcategory UUID (cannot be cleared once set)'),
  photos: z.array(z.string().url()).max(10).optional().describe('Updated photo URLs'),
  videos: z.array(z.string().url()).max(3).optional().describe('Updated video URLs'),
  budgetMin: z.number().min(0).optional().nullable().describe('Updated min budget'),
  budgetMax: z.number().min(0).optional().nullable().describe('Updated max budget'),
  budgetType: z.enum(['range', 'open', 'fixed']).optional().describe('Updated budget type'),

  locationAddress: z.string().max(500).optional().nullable().describe('Updated address'),
  locationCity: z.string().max(100).optional().nullable().describe('Updated city'),
  locationState: z.string().max(50).optional().nullable().describe('Updated state'),
  locationZip: z.string().regex(/^\d{5}(-\d{4})?$/).optional().nullable().describe('Updated ZIP code'),
  locationCountry: z.string().max(50).optional().describe('Updated country'),
  latitude: z.number().min(-90).max(90).optional().nullable().describe('Updated latitude'),
  longitude: z.number().min(-180).max(180).optional().nullable().describe('Updated longitude'),

  urgency: z.enum(['asap', 'within_24_hours', 'within_3_days', 'within_1_week', 'flexible', 'specific_date']).optional().nullable().describe('Updated urgency'),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional().nullable().describe('Updated preferred date'),
  preferredTime: z.string().max(50).optional().nullable().describe('Updated preferred time'),

  categorySpecific: boundedJsonObjectSchema.optional().describe('Updated category-specific fields'),
  requirements: boundedJsonObjectSchema.optional().describe('Updated requirements'),

  // Allow publishing a draft
  status: z.enum(['draft', 'active']).optional().describe('Change status (publish draft)'),
});

export const getPostByIdParamsSchema = z.object({
  postId: z.string().uuid('Invalid post ID').describe('Post UUID'),
});

export const listMyPostsQuerySchema = z.object({
  status: z.enum(['draft', 'active', 'filled', 'expired', 'cancelled', 'archived']).optional().describe('Filter by post status'),
  categoryId: z.string().uuid().optional().describe('Filter by category UUID'),
  marketplaceContext: z.enum(['b2c', 'b2b', 'c2c']).optional().describe('Filter by marketplace context'),
  page: z.coerce.number().int().min(1).default(1).describe('Page number (default 1)'),
  limit: z.coerce.number().int().min(1).max(50).default(20).describe('Results per page (default 20, max 50)'),
  sort: z.enum(['newest', 'oldest', 'expiring_soon', 'most_offers']).default('newest').describe('Sort order'),
});

export const feedQuerySchema = z.object({
  categoryId: z.string().uuid().optional().describe('Filter by category UUID'),
  subcategoryId: z.string().uuid().optional().describe('Filter by subcategory UUID'),
  marketplaceContext: z.enum(['b2c', 'b2b', 'c2c']).optional().describe('Filter by marketplace context (defaults to request context)'),
  search: z.string().max(200).optional().describe('Search text (e.g. plumber)'),
  minBudget: z.coerce.number().min(0).optional().describe('Minimum budget filter'),
  maxBudget: z.coerce.number().min(0).optional().describe('Maximum budget filter'),
  urgency: z.enum(['asap', 'within_24_hours', 'within_3_days', 'within_1_week', 'flexible', 'specific_date']).optional().describe('Filter by urgency'),
  city: z.string().max(100).optional().describe('Filter by city (e.g. Dallas)'),
  state: z.string().max(50).optional().describe('Filter by state (e.g. TX)'),
  latitude: z.coerce.number().min(-90).max(90).optional().describe('Search center latitude'),
  longitude: z.coerce.number().min(-180).max(180).optional().describe('Search center longitude'),
  radiusMiles: z.coerce.number().min(1).max(500).default(25).optional().describe('Search radius in miles (default 25, max 500)'),
  sort: z.enum(['newest', 'expiring_soon', 'budget_high', 'budget_low', 'closest']).default('newest').describe('Sort order: newest | expiring_soon | budget_high | budget_low | closest (requires lat/lng)'),
  page: z.coerce.number().int().min(1).default(1).describe('Page number'),
  limit: z.coerce.number().int().min(1).max(50).default(20).describe('Results per page'),
});

export const searchPostsQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(200).describe('Search query (e.g. plumber, furniture)'),
  categoryId: z.string().uuid().optional().describe('Filter by category UUID'),
  marketplaceContext: z.enum(['b2c', 'b2b', 'c2c']).optional().describe('Filter by marketplace context'),
  minBudget: z.coerce.number().min(0).optional().describe('Minimum budget filter'),
  maxBudget: z.coerce.number().min(0).optional().describe('Maximum budget filter'),
  city: z.string().max(100).optional().describe('Filter by city'),
  state: z.string().max(50).optional().describe('Filter by state'),
  latitude: z.coerce.number().min(-90).max(90).optional().describe('Search center latitude'),
  longitude: z.coerce.number().min(-180).max(180).optional().describe('Search center longitude'),
  radiusMiles: z.coerce.number().min(1).max(500).default(25).optional().describe('Search radius in miles (default 25, max 500)'),
  page: z.coerce.number().int().min(1).default(1).describe('Page number'),
  limit: z.coerce.number().int().min(1).max(50).default(20).describe('Results per page'),
});

// ── Discovery feed + clone-to-real-post (#37) ─────────────────

// Buyer-facing discovery / "For You" feed (#315). Surfaces seeded + real
// publicly-visible posts that have >=1 pending offer, each with offers nested.
export const discoverFeedQuerySchema = z.object({
  categoryId: z.string().uuid().optional().describe('Filter by category UUID'),
  // Feed mode (#323) — a sort/filter over the eligible discovery set:
  //  foryou   (default) — buyer proximity + category affinity (their posted categories)
  //  trending — most / freshest competing seller offers right now
  //  nearby   — within radiusMiles of the buyer, closest first (drops geo-less posts)
  // 'shipping' (remote-fulfillment) is Phase B — it needs an additive Post column.
  mode: z.enum(['foryou', 'trending', 'nearby']).default('foryou').describe('Feed mode: foryou | trending | nearby'),
  // Optional geo override for foryou/nearby; falls back to the buyer's saved location.
  latitude: z.coerce.number().min(-90).max(90).optional().describe('Search center latitude (defaults to buyer location)'),
  longitude: z.coerce.number().min(-180).max(180).optional().describe('Search center longitude (defaults to buyer location)'),
  radiusMiles: z.coerce.number().min(1).max(500).default(25).optional().describe('Nearby radius in miles (default 25, max 500)'),
  page: z.coerce.number().int().min(1).default(1).describe('Page number'),
  limit: z.coerce.number().int().min(1).max(50).default(20).describe('Results per page'),
});

// Clone-to-real-post: a buyer engages a seller's offer from discovery ("Request a
// quote like this"). Category/subcategory are inherited from the seed post
// server-side and cannot be set here. Budget/location/variant specifics are the
// buyer's own — nothing is carried over from the seller's lead quote.
export const createFromOfferSchema = z.object({
  offerId: z.string().uuid('Invalid offer ID').describe('UUID of the discovery offer being engaged'),
  title: z.string().min(5).max(200).trim().optional().describe('Editable title (defaults to the seed post title if omitted)'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000).trim().describe('Your request details'),
  photos: z.array(z.string().url()).max(10).default([]).describe('Array of photo URLs (max 10)'),
  videos: z.array(z.string().url()).max(3).default([]).describe('Array of video URLs (max 3)'),
  budgetMin: z.number().min(0).optional().describe('Your minimum budget'),
  budgetMax: z.number().min(0).optional().describe('Your maximum budget'),
  budgetType: z.enum(['range', 'open', 'fixed']).default('range').describe('Budget type'),
  locationAddress: z.string().max(500).optional().describe('Street address'),
  locationCity: z.string().max(100).optional().describe('City'),
  locationState: z.string().max(50).optional().describe('State'),
  locationZip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code').optional().describe('ZIP code'),
  locationCountry: z.string().max(50).default('US').describe('Country code (default: US)'),
  latitude: z.number().min(-90).max(90).optional().describe('Latitude'),
  longitude: z.number().min(-180).max(180).optional().describe('Longitude'),
  urgency: z.enum(['asap', 'within_24_hours', 'within_3_days', 'within_1_week', 'flexible', 'specific_date']).optional().describe('How urgent is this request'),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional().describe('Preferred date'),
  preferredTime: z.string().max(50).optional().describe('Preferred time'),
  categorySpecific: boundedJsonObjectSchema.default({}).describe('Category-specific fields (your own specs)'),
  requirements: boundedJsonObjectSchema.default({}).describe('Additional requirements'),
  marketplaceContext: z.enum(['b2c', 'b2b', 'c2c']).optional().describe('Marketplace context'),
  expiresInHours: z.number().int().min(1).max(2160).default(720).describe('Hours until expiry (default 720 = 30 days)'),
});

// ── Inferred Types ───────────────────────────────────────────

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type DiscoverFeedQuery = z.infer<typeof discoverFeedQuerySchema>;
export type CreateFromOfferInput = z.infer<typeof createFromOfferSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type ListMyPostsQuery = z.infer<typeof listMyPostsQuerySchema>;
export type FeedQuery = z.infer<typeof feedQuerySchema>;
export type SearchPostsQuery = z.infer<typeof searchPostsQuerySchema>;
