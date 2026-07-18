import { getGeminiModel } from '../../config/gemini.js';
import { redis } from '../../config/redis.js';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { captureException } from '../../config/sentry.js';
import { AppError } from '../../common/utils/errors.js';
import { CategoriesService } from '../categories/categories.service.js';
import { ZodError } from 'zod';
import {
  parsedPostResponseSchema,
  suggestImagesResponseSchema,
  jobProfileResponseSchema,
  type ParsePostRequest,
  type SuggestImagesRequest,
  type GenerateJobProfileRequest,
  type ParsedPostResponse,
  type SuggestImagesResponse,
  type JobProfileResponse,
} from './ai-assist.schemas.js';
import type { CategoryTreeNode } from '../categories/categories.schemas.js';

const AI_RATE_LIMIT_MAX = 20;
const AI_RATE_LIMIT_WINDOW = 3600; // 1 hour in seconds

export class AIAssistService {
  private categoriesService = new CategoriesService();

  // ── Parse natural language → structured post ───────────────

  async parsePostRequest(
    userId: string,
    input: ParsePostRequest,
  ): Promise<ParsedPostResponse & { categoryId: string; subcategoryId?: string }> {
    await this.checkRateLimit(userId);

    const categoryTree = await this.categoriesService.getCategoryTree();
    const categoryContext = this.formatCategoryTree(categoryTree);

    const prompt = `You are an AI assistant for a reverse marketplace where buyers post requests and sellers compete to fulfill them.

Parse the following buyer request into a structured post format. Return ONLY valid JSON with no additional text or markdown.

AVAILABLE CATEGORIES (use slug values):
${categoryContext}

USER REQUEST:
"${input.text}"
${input.location ? `\nUSER LOCATION: ${[input.location.city, input.location.state, input.location.zip].filter(Boolean).join(', ')}` : ''}

INSTRUCTIONS:
1. Detect the most appropriate category, then ALWAYS pick the single most specific matching subcategory under it (use slug values). Every category has subcategories — never return a top-level category without a subcategory. If unsure, choose the closest-fitting subcategory rather than omitting it.
2. Generate a clear, concise title (5-200 chars)
3. Expand the description with helpful details while preserving user intent (20-5000 chars)
4. Estimate budget if mentioned or leave budgetType as "open" if not mentioned
5. Set budgetType: "range" (min/max given), "open" (flexible/unknown), or "fixed" (exact amount)
6. Detect urgency: "asap", "within_24_hours", "within_3_days", "within_1_week", "flexible"
7. Extract category-specific fields relevant to the request
8. Extract requirements (e.g., licensed, insured, experience needed)

RESPONSE FORMAT (JSON only):
{
  "title": "string",
  "description": "string",
  "categorySlug": "string (from available categories)",
  "subcategorySlug": "string (REQUIRED — the most specific subcategory slug under the chosen category)",
  "budgetMin": "number or omit",
  "budgetMax": "number or omit",
  "budgetType": "range | open | fixed",
  "urgency": "asap | within_24_hours | within_3_days | within_1_week | flexible",
  "categorySpecific": {},
  "requirements": {}
}`;

    const rawResponse = await this.callGemini(prompt);
    const parsed = this.parseJsonResponse(rawResponse);
    const validated = this.validateAiOutput(parsedPostResponseSchema, parsed, 'parsePostRequest');

    // Resolve slugs to actual DB category IDs
    const { categoryId, subcategoryId } = await this.resolveCategorySlugs(
      validated.categorySlug,
      validated.subcategorySlug,
    );

    return {
      ...validated,
      categoryId,
      subcategoryId,
    };
  }

  // ── Suggest product images ─────────────────────────────────

  async suggestProductImages(
    userId: string,
    input: SuggestImagesRequest,
  ): Promise<SuggestImagesResponse> {
    await this.checkRateLimit(userId);

    const prompt = `You are helping a marketplace user find product images.

Given the product below, provide up to 3 relevant Unsplash image URLs that match the product.

PRODUCT: "${input.productName}"
${input.categorySlug ? `CATEGORY: ${input.categorySlug}` : ''}

INSTRUCTIONS:
- Use real Unsplash URLs in this format: https://images.unsplash.com/photo-{id}?w=800
- Provide a brief description for each image
- Include a search query that could find similar images
- Return ONLY valid JSON, no markdown

RESPONSE FORMAT (JSON only):
{
  "images": [
    {
      "url": "https://images.unsplash.com/photo-...",
      "description": "Brief description of image",
      "searchQuery": "search terms for this product"
    }
  ]
}`;

    const rawResponse = await this.callGemini(prompt);
    const parsed = this.parseJsonResponse(rawResponse);
    return this.validateAiOutput(suggestImagesResponseSchema, parsed, 'suggestProductImages');
  }

  // ── Generate job profile ───────────────────────────────────

  async generateJobProfile(
    userId: string,
    input: GenerateJobProfileRequest,
  ): Promise<JobProfileResponse> {
    await this.checkRateLimit(userId);

    const profileTypeLabel = input.profileType === 'job_seeker' ? 'job seeker' : 'employer';

    const prompt = `You are an AI assistant for a reverse marketplace helping create ${profileTypeLabel} profiles.

Parse the following description into a structured ${profileTypeLabel} profile. Return ONLY valid JSON with no additional text or markdown.

DESCRIPTION:
"${input.text}"

${input.profileType === 'job_seeker' ? `INSTRUCTIONS FOR JOB SEEKER PROFILE:
1. Generate a professional title (e.g., "Senior Software Engineer")
2. Write a compelling description highlighting experience and skills
3. Extract categorySpecific fields: skills (array), experienceYears (number), education (string), availability (full_time/part_time/contract/freelance), preferredWorkType (remote/onsite/hybrid)
4. Suggest salary range based on experience and role` : `INSTRUCTIONS FOR EMPLOYER JOB POSTING:
1. Generate a clear job title
2. Write a detailed job description with responsibilities
3. Extract categorySpecific fields: responsibilities (array), requiredSkills (array), experienceRequired (string), employmentType (full_time/part_time/contract), workType (remote/onsite/hybrid), companySize (string if mentioned)
4. Suggest salary range based on role and market rates`}

RESPONSE FORMAT (JSON only):
{
  "title": "string (5-200 chars)",
  "description": "string (20-5000 chars)",
  "categorySpecific": {},
  "suggestedBudget": {
    "min": "number",
    "max": "number"
  }
}`;

    const rawResponse = await this.callGemini(prompt);
    const parsed = this.parseJsonResponse(rawResponse);
    return this.validateAiOutput(jobProfileResponseSchema, parsed, 'generateJobProfile');
  }

  // ── Private helpers ────────────────────────────────────────

  private async checkRateLimit(userId: string): Promise<void> {
    const key = `ai:rate:${userId}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, AI_RATE_LIMIT_WINDOW);
    if (count > AI_RATE_LIMIT_MAX) {
      throw new AppError(429, 'AI rate limit exceeded (20 requests/hour). Please try again later.');
    }
  }

  private async callGemini(prompt: string): Promise<string> {
    try {
      const model = getGeminiModel();
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (!text) {
        throw new Error('Empty response from AI model');
      }
      return text;
    } catch (error: unknown) {
      if (error instanceof AppError) throw error;
      throw this.classifyGeminiError(error);
    }
  }

  // Convert raw Gemini SDK / config errors into actionable AppErrors and
  // surface them to Sentry. Before this method existed, every failure (quota,
  // auth, network, schema) collapsed into a generic 500 with no Sentry breadcrumb,
  // which made #95 impossible to diagnose from logs.
  private classifyGeminiError(error: unknown): AppError {
    const message = error instanceof Error ? error.message : String(error);
    const lower = message.toLowerCase();

    let status = 500;
    let detail = 'AI processing failed. Please try again or create your post manually.';
    let reason: 'config' | 'quota' | 'auth' | 'network' | 'model' | 'unknown' = 'unknown';

    if (message === 'GEMINI_API_KEY is not configured') {
      status = 503;
      detail = 'AI service is not configured. Please create your post manually.';
      reason = 'config';
    } else if (lower.includes('quota') || lower.includes('rate limit') || lower.includes('resource_exhausted') || lower.includes('429')) {
      status = 429;
      detail = 'AI service quota exceeded. Please try again later or create your post manually.';
      reason = 'quota';
    } else if (lower.includes('api key') || lower.includes('unauthenticated') || lower.includes('permission_denied') || lower.includes('401') || lower.includes('403')) {
      status = 503;
      detail = 'AI service authentication failed. Please create your post manually.';
      reason = 'auth';
    } else if (lower.includes('not found') && lower.includes('model')) {
      status = 503;
      detail = 'AI model is unavailable. Please create your post manually.';
      reason = 'model';
    } else if (lower.includes('etimedout') || lower.includes('econnreset') || lower.includes('enotfound') || lower.includes('fetch failed') || lower.includes('network')) {
      status = 502;
      detail = 'AI service is temporarily unreachable. Please try again.';
      reason = 'network';
    }

    captureException(error, { source: 'ai-assist.callGemini', reason });

    if (env.NODE_ENV !== 'production') {
      detail = `${detail} [debug: ${message}]`;
    }
    return new AppError(status, detail);
  }

  private parseJsonResponse(raw: string): unknown {
    // Strip markdown code blocks if present (Gemini often wraps JSON in ```)
    let cleaned = raw.trim();
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      cleaned = codeBlockMatch[1].trim();
    }
    try {
      return JSON.parse(cleaned);
    } catch (error) {
      captureException(error, { source: 'ai-assist.parseJsonResponse', rawSnippet: raw.slice(0, 500) });
      throw new AppError(500, 'AI returned an invalid response. Please try again.');
    }
  }

  // Wrap schema validation so Gemini-output drift surfaces as a 502 with a
  // specific message + Sentry breadcrumb, instead of bubbling a ZodError to the
  // global handler (which would mislabel it as a 400 "Request validation failed").
  private validateAiOutput<T>(
    schema: { parse: (input: unknown) => T },
    input: unknown,
    source: string,
  ): T {
    try {
      return schema.parse(input);
    } catch (error) {
      if (error instanceof ZodError) {
        captureException(error, { source: `ai-assist.${source}`, issues: error.issues, input });
        throw new AppError(502, 'AI returned an unexpected response format. Please try again.');
      }
      throw error;
    }
  }

  private formatCategoryTree(tree: CategoryTreeNode[]): string {
    return tree.map((cat) => {
      const children = cat.children
        .map((child) => `  - ${child.name} (slug: "${child.slug}")`)
        .join('\n');
      return `- ${cat.name} (slug: "${cat.slug}")\n${children}`;
    }).join('\n');
  }

  private async resolveCategorySlugs(
    categorySlug: string,
    subcategorySlug?: string,
  ): Promise<{ categoryId: string; subcategoryId?: string }> {
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
    });
    if (!category) {
      // Fallback: try to find the closest match among top-level categories
      const fallback = await prisma.category.findFirst({
        where: { parentCategoryId: null, isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
      if (!fallback) {
        throw new AppError(500, 'No categories available.');
      }
      return { categoryId: fallback.id };
    }

    let subcategoryId: string | undefined;
    if (subcategorySlug) {
      const subcategory = await prisma.category.findUnique({
        where: { slug: subcategorySlug },
      });
      if (subcategory && subcategory.parentCategoryId === category.id) {
        subcategoryId = subcategory.id;
      }
    }

    return { categoryId: category.id, subcategoryId };
  }
}
