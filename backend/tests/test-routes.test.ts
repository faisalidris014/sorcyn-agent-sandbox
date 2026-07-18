import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';

describe('GET /api/v1/__test/force-500 (D-08 chaos endpoint)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.TEST_FORCE_TOKEN = 'test-token-ABCDEFGHIJKLMNOP';
    const { buildApp } = await import('../src/app.js');
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    delete process.env.TEST_FORCE_TOKEN;
  });

  it('rejects request without X-Test-Token header (403)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/__test/force-500' });
    expect(res.statusCode).toBe(403);
  });

  it('rejects request with wrong X-Test-Token (403)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/__test/force-500',
      headers: { 'x-test-token': 'wrong' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('returns 500 with correct X-Test-Token (intentional chaos)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/__test/force-500',
      headers: { 'x-test-token': 'test-token-ABCDEFGHIJKLMNOP' },
    });
    expect(res.statusCode).toBe(500);
    expect(res.json().error).toContain('Synthetic incident');
  });
});
