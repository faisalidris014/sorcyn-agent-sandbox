import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/config/database.js';
import type { FastifyInstance } from 'fastify';

process.env.NODE_ENV = 'test';

let app: FastifyInstance;

beforeAll(async () => {
  const { buildApp } = await import('../src/app.js');
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await prisma.$disconnect();
  await app.close();
});

// ── GET / — List Categories ──────────────────────────────────

describe('GET /api/v1/categories', () => {
  it('should list top-level categories', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/categories',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    // Should have at least the 3 MVP categories + 2 Phase 2 categories
    expect(body.data.length).toBeGreaterThanOrEqual(3);
    // Default activeOnly=true filters out inactive
    body.data.forEach((cat: { isActive: boolean }) => {
      expect(cat.isActive).toBe(true);
    });
  });

  it('should filter by MVP-enabled only', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/categories?mvpOnly=true',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    body.data.forEach((cat: { enabledInMvp: boolean }) => {
      expect(cat.enabledInMvp).toBe(true);
    });
  });

  it('should list subcategories when parentId is provided', async () => {
    // First get the services category
    const catRes = await app.inject({
      method: 'GET',
      url: '/api/v1/categories/services',
    });
    const servicesId = catRes.json().data.id;

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/categories?parentId=${servicesId}`,
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBeGreaterThanOrEqual(10); // 18 service subcategories
    body.data.forEach((cat: { parentCategoryId: string }) => {
      expect(cat.parentCategoryId).toBe(servicesId);
    });
  });
});

// ── GET /tree — Category Tree ────────────────────────────────

describe('GET /api/v1/categories/tree', () => {
  it('should return full category tree with children', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/categories/tree',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.data)).toBe(true);

    // Each top-level category should have a children array
    const services = body.data.find((c: { slug: string }) => c.slug === 'services');
    expect(services).toBeDefined();
    expect(Array.isArray(services.children)).toBe(true);
    expect(services.children.length).toBeGreaterThanOrEqual(10);
  });
});

// ── GET /:slug — Get Category by Slug ────────────────────────

describe('GET /api/v1/categories/:slug', () => {
  it('should return category with children', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/categories/products',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.slug).toBe('products');
    expect(body.data.name).toBe('Products');
    expect(Array.isArray(body.data.children)).toBe(true);
    expect(body.data.children.length).toBeGreaterThanOrEqual(5); // 8 product subcategories
  });

  it('should return 404 for non-existent slug', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/categories/nonexistent-category',
    });
    expect(res.statusCode).toBe(404);
  });

  it('should return a leaf category with empty children', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/categories/plumbing',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.slug).toBe('plumbing');
    expect(body.data.children).toEqual([]);
  });
});
