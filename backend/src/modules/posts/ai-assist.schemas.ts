import { z } from 'zod';

// ── Request Schemas ──────────────────────────────────────────

export const parsePostRequestSchema = z.object({
  text: z.string()
    .min(20, 'Please provide more details (at least 20 characters)')
    .max(2000, 'Text too long. Please keep it under 2000 characters.')
    .trim()
    .describe('Natural language description of what you need (e.g. I need someone to fix my leaking kitchen sink in Dallas, budget around $200)'),
  location: z.object({
    city: z.string().max(100).optional().describe('City (e.g. Dallas)'),
    state: z.string().max(50).optional().describe('State (e.g. TX)'),
    zip: z.string().regex(/^\d{5}(-\d{4})?$/).optional().describe('ZIP code (e.g. 75001)'),
  }).optional().describe('Optional location context'),
});

export const suggestImagesRequestSchema = z.object({
  productName: z.string().min(2).max(200).trim().describe('Product name to find images for (e.g. iPhone 15 Pro)'),
  categorySlug: z.string().max(100).optional().describe('Category slug for context (e.g. electronics)'),
});

export const generateJobProfileRequestSchema = z.object({
  text: z.string()
    .min(20, 'Please provide more details (at least 20 characters)')
    .max(2000, 'Text too long. Please keep it under 2000 characters.')
    .trim()
    .describe('Describe the job or your experience (e.g. Looking for a senior React developer with 5 years experience)'),
  profileType: z.enum(['job_seeker', 'employer']).describe('Are you looking for work or hiring?'),
});

// ── Response Schemas (validate AI output) ────────────────────

export const parsedPostResponseSchema = z.object({
  title: z.string().min(5).max(200).describe('AI-generated post title'),
  description: z.string().min(20).max(5000).describe('AI-generated description'),
  categorySlug: z.string().describe('Suggested category slug'),
  subcategorySlug: z.string().optional().describe('Suggested subcategory slug'),
  budgetMin: z.number().min(0).optional().describe('Suggested min budget'),
  budgetMax: z.number().min(0).optional().describe('Suggested max budget'),
  budgetType: z.enum(['range', 'open', 'fixed']).default('open').describe('Suggested budget type'),
  urgency: z.enum(['asap', 'within_24_hours', 'within_3_days', 'within_1_week', 'flexible', 'specific_date']).optional().describe('Detected urgency'),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Detected preferred date'),
  categorySpecific: z.record(z.string(), z.any()).default({}).describe('Category-specific extracted data'),
  requirements: z.record(z.string(), z.any()).default({}).describe('Extracted requirements'),
});

export const suggestImagesResponseSchema = z.object({
  images: z.array(z.object({
    url: z.string().url().describe('Image URL'),
    description: z.string().describe('Image description'),
    searchQuery: z.string().optional().describe('Search query used'),
  })).max(5).describe('Suggested product images'),
});

export const jobProfileResponseSchema = z.object({
  title: z.string().min(5).max(200).describe('Generated job title'),
  description: z.string().min(20).max(5000).describe('Generated job description'),
  categorySpecific: z.record(z.string(), z.any()).default({}).describe('Job-specific data'),
  suggestedBudget: z.object({
    min: z.number().min(0).describe('Suggested min salary/rate'),
    max: z.number().min(0).describe('Suggested max salary/rate'),
  }).optional().describe('Suggested compensation range'),
});

// ── Inferred Types ───────────────────────────────────────────

export type ParsePostRequest = z.infer<typeof parsePostRequestSchema>;
export type SuggestImagesRequest = z.infer<typeof suggestImagesRequestSchema>;
export type GenerateJobProfileRequest = z.infer<typeof generateJobProfileRequestSchema>;
export type ParsedPostResponse = z.infer<typeof parsedPostResponseSchema>;
export type SuggestImagesResponse = z.infer<typeof suggestImagesResponseSchema>;
export type JobProfileResponse = z.infer<typeof jobProfileResponseSchema>;
