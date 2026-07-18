import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { prisma } from '../src/config/database.js';
import { redis } from '../src/config/redis.js';
import type { FastifyInstance } from 'fastify';

process.env.NODE_ENV = 'test';

// Mock Gemini before any imports that use it
vi.mock('../src/config/gemini.js', () => {
  const mockGenerateContent = vi.fn();

  return {
    getGemini: vi.fn(() => ({
      getGenerativeModel: vi.fn(() => ({
        generateContent: mockGenerateContent,
      })),
    })),
    getGeminiModel: vi.fn(() => ({
      generateContent: mockGenerateContent,
    })),
    __mockGenerateContent: mockGenerateContent,
  };
});

// Get mock reference after vi.mock
const { __mockGenerateContent: mockGenerateContent } = await import('../src/config/gemini.js') as any;

let app: FastifyInstance;
let accessToken: string;
let userId: string;
let servicesId: string;
let servicesSlug: string;
let plumbingSlug: string;

const TEST_USER = {
  email: 'aitest@example.com',
  password: 'TestPass123!',
  firstName: 'AI',
  lastName: 'Tester',
  accountType: 'buyer' as const,
  agreeToTerms: true as const,
  agreeToPrivacy: true as const,
};

function authHeaders() {
  return { authorization: `Bearer ${accessToken}` };
}

function mockGeminiResponse(data: unknown) {
  mockGenerateContent.mockResolvedValueOnce({
    response: {
      text: () => JSON.stringify(data),
    },
  });
}

function mockGeminiMarkdownResponse(data: unknown) {
  mockGenerateContent.mockResolvedValueOnce({
    response: {
      text: () => '```json\n' + JSON.stringify(data) + '\n```',
    },
  });
}

beforeAll(async () => {
  const { buildApp } = await import('../src/app.js');
  app = await buildApp();
  await app.ready();

  // Clean up previous test data
  await prisma.post.deleteMany({
    where: { buyer: { email: TEST_USER.email } },
  });
  await prisma.sellerProfile.deleteMany({
    where: { user: { email: TEST_USER.email } },
  });
  await prisma.user.deleteMany({
    where: { email: TEST_USER.email },
  });

  // Register and login
  await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: TEST_USER,
  });

  await prisma.user.update({
    where: { email: TEST_USER.email },
    data: { emailVerified: true },
  });

  const loginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: TEST_USER.email, password: TEST_USER.password },
  });
  const body = loginRes.json();
  accessToken = body.data.tokens.accessToken;
  userId = body.data.user.id;

  // Get category slugs and IDs
  const servicesRes = await app.inject({
    method: 'GET',
    url: '/api/v1/categories/services',
  });
  servicesId = servicesRes.json().data.id;
  servicesSlug = 'services';

  const plumbingRes = await app.inject({
    method: 'GET',
    url: '/api/v1/categories/plumbing',
  });
  plumbingSlug = 'plumbing';

  // Clear any rate limit keys
  const keys = await redis.keys('ai:rate:*');
  if (keys.length) await redis.del(...keys);
});

afterAll(async () => {
  await prisma.post.deleteMany({
    where: { buyer: { email: TEST_USER.email } },
  });
  await prisma.sellerProfile.deleteMany({
    where: { user: { email: TEST_USER.email } },
  });
  await prisma.user.deleteMany({
    where: { email: TEST_USER.email },
  });
  const keys = await redis.keys('ai:rate:*');
  if (keys.length) await redis.del(...keys);
  await prisma.$disconnect();
  await app.close();
});

describe('AI-Assisted Post Creation', () => {
  beforeAll(() => {
    mockGenerateContent.mockReset();
  });

  describe('POST /api/v1/posts/ai/parse', () => {
    it('should parse a service request into a structured post', async () => {
      mockGeminiResponse({
        title: 'Kitchen Sink Leak Repair',
        description: 'Need an experienced plumber to fix a leak under my kitchen sink cabinet. The leak started recently and needs prompt attention.',
        categorySlug: servicesSlug,
        subcategorySlug: plumbingSlug,
        budgetMin: 100,
        budgetMax: 300,
        budgetType: 'range',
        urgency: 'within_3_days',
        categorySpecific: { serviceType: 'repair' },
        requirements: { licensed: true },
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/posts/ai/parse',
        headers: authHeaders(),
        payload: {
          text: 'I need someone to fix my leaking kitchen sink, it started dripping yesterday',
          location: { city: 'Dallas', state: 'TX' },
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.title).toBe('Kitchen Sink Leak Repair');
      expect(body.data.categoryId).toBe(servicesId);
      expect(body.data.budgetType).toBe('range');
      expect(body.data.urgency).toBe('within_3_days');
    });

    it('should handle markdown-wrapped JSON responses from AI', async () => {
      mockGeminiMarkdownResponse({
        title: 'Lawn Mowing Service Needed',
        description: 'Looking for someone to mow a medium-sized lawn in the Dallas area on a weekly basis.',
        categorySlug: servicesSlug,
        budgetMin: 30,
        budgetMax: 60,
        budgetType: 'range',
        urgency: 'within_1_week',
        categorySpecific: {},
        requirements: {},
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/posts/ai/parse',
        headers: authHeaders(),
        payload: {
          text: 'Need someone to mow my lawn weekly in Dallas, medium-sized yard',
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.title).toBe('Lawn Mowing Service Needed');
    });

    it('should reject requests without authentication', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/posts/ai/parse',
        payload: {
          text: 'I need a plumber for my bathroom sink leak repair',
        },
      });

      expect(res.statusCode).toBe(401);
    });

    it('should reject text that is too short', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/posts/ai/parse',
        headers: authHeaders(),
        payload: { text: 'Fix my sink' },
      });

      expect(res.statusCode).toBe(400);
    });

    it('should fallback to first category when AI returns unknown slug', async () => {
      mockGeminiResponse({
        title: 'Mysterious Request',
        description: 'This is a test request that maps to an unknown category slug from AI.',
        categorySlug: 'nonexistent-category',
        budgetType: 'open',
        urgency: 'flexible',
        categorySpecific: {},
        requirements: {},
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/posts/ai/parse',
        headers: authHeaders(),
        payload: {
          text: 'I need help with something very unusual and specific to test',
        },
      });

      expect(res.statusCode).toBe(200);
      // Should fallback to first available category
      expect(res.json().data.categoryId).toBeDefined();
    });
  });

  describe('POST /api/v1/posts/ai/suggest-images', () => {
    it('should suggest product images', async () => {
      mockGeminiResponse({
        images: [
          {
            url: 'https://images.unsplash.com/photo-1234567890',
            description: 'iPhone 15 Pro front view',
            searchQuery: 'iPhone 15 Pro',
          },
          {
            url: 'https://images.unsplash.com/photo-0987654321',
            description: 'iPhone 15 Pro side angle',
            searchQuery: 'iPhone Pro smartphone',
          },
        ],
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/posts/ai/suggest-images',
        headers: authHeaders(),
        payload: {
          productName: 'iPhone 15 Pro 256GB',
          categorySlug: 'electronics',
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.images).toHaveLength(2);
      expect(body.data.images[0].url).toContain('unsplash.com');
    });

    it('should reject requests without authentication', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/posts/ai/suggest-images',
        payload: { productName: 'iPhone 15 Pro' },
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/v1/posts/ai/generate-job-profile', () => {
    it('should generate a job seeker profile', async () => {
      mockGeminiResponse({
        title: 'Senior Software Engineer',
        description: 'Experienced full-stack developer with 5+ years specializing in React and Node.js. Proficient in TypeScript, cloud services, and agile methodologies.',
        categorySpecific: {
          skills: ['React', 'Node.js', 'TypeScript'],
          experienceYears: 5,
          availability: 'full_time',
          preferredWorkType: 'remote',
        },
        suggestedBudget: { min: 120000, max: 160000 },
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/posts/ai/generate-job-profile',
        headers: authHeaders(),
        payload: {
          text: 'I am a software engineer with 5 years of experience in React and Node.js looking for remote work',
          profileType: 'job_seeker',
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.title).toBe('Senior Software Engineer');
      expect(body.data.categorySpecific.skills).toContain('React');
      expect(body.data.suggestedBudget.min).toBe(120000);
    });

    it('should generate an employer job posting', async () => {
      mockGeminiResponse({
        title: 'Full-Stack Developer',
        description: 'We are looking for a full-stack developer to join our growing team. Responsibilities include building web applications and APIs.',
        categorySpecific: {
          responsibilities: ['Build web applications', 'Design APIs'],
          requiredSkills: ['JavaScript', 'Python', 'SQL'],
          employmentType: 'full_time',
          workType: 'hybrid',
        },
        suggestedBudget: { min: 90000, max: 130000 },
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/posts/ai/generate-job-profile',
        headers: authHeaders(),
        payload: {
          text: 'We need a full-stack developer for our startup, hybrid work in Dallas, building web apps and APIs',
          profileType: 'employer',
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.title).toBe('Full-Stack Developer');
      expect(body.data.categorySpecific.employmentType).toBe('full_time');
    });

    it('should reject text that is too short', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/posts/ai/generate-job-profile',
        headers: authHeaders(),
        payload: {
          text: 'Need a developer',
          profileType: 'employer',
        },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limit after 20 requests', async () => {
      // Set rate limit counter at the limit (no mock needed — rate check blocks before AI call)
      const rateKey = `ai:rate:${userId}`;
      await redis.set(rateKey, '20');
      await redis.expire(rateKey, 3600);

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/posts/ai/parse',
        headers: authHeaders(),
        payload: {
          text: 'I need someone to clean my house thoroughly this weekend',
        },
      });

      expect(res.statusCode).toBe(429);

      // Clean up
      await redis.del(rateKey);
    });
  });

  describe('Error Handling', () => {
    it('should handle AI returning invalid JSON', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => 'This is not valid JSON at all',
        },
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/posts/ai/parse',
        headers: authHeaders(),
        payload: {
          text: 'I need help fixing my broken dishwasher, it stopped working yesterday',
        },
      });

      expect(res.statusCode).toBe(500);
      expect(res.json().error.detail).toContain('AI returned an invalid response');
    });

    it('classifies quota-exhausted SDK errors as 429 with actionable detail', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('API quota exceeded'));

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/posts/ai/parse',
        headers: authHeaders(),
        payload: {
          text: 'I need a contractor to build a fence in my backyard',
        },
      });

      expect(res.statusCode).toBe(429);
      expect(res.json().error.detail).toContain('quota exceeded');
    });

    it('classifies invalid-API-key SDK errors as 503', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('API key not valid. Please pass a valid API key.'));

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/posts/ai/parse',
        headers: authHeaders(),
        payload: {
          text: 'I need a contractor to paint my living room walls this weekend',
        },
      });

      expect(res.statusCode).toBe(503);
      expect(res.json().error.detail).toContain('authentication failed');
    });

    it('classifies network failures as 502', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('fetch failed: ETIMEDOUT'));

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/posts/ai/parse',
        headers: authHeaders(),
        payload: {
          text: 'I need an electrician to install three new outlets in my garage',
        },
      });

      expect(res.statusCode).toBe(502);
      expect(res.json().error.detail).toContain('temporarily unreachable');
    });

    it('falls back to 500 for unrecognized SDK errors', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('something completely unexpected'));

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/posts/ai/parse',
        headers: authHeaders(),
        payload: {
          text: 'I need a plumber to fix a leaking kitchen sink as soon as possible',
        },
      });

      expect(res.statusCode).toBe(500);
      expect(res.json().error.detail).toContain('AI processing failed');
    });

    it('returns 502 when Gemini output drifts from the expected schema (not a 400 ValidationError)', async () => {
      // Gemini returns valid JSON but wrong shape (missing required fields). Before the fix,
      // this surfaced as a 400 "Request validation failed" — misleading because the *user's*
      // request was fine. After the fix it's a 502 with an AI-specific message.
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify({ unexpected: 'shape', not: 'matching schema' }),
        },
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/posts/ai/parse',
        headers: authHeaders(),
        payload: {
          text: 'I need a handyman to assemble three IKEA bookshelves in my apartment',
        },
      });

      expect(res.statusCode).toBe(502);
      expect(res.json().error.detail).toContain('unexpected response format');
    });
  });
});
