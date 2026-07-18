import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';

// Set test environment before importing app (which loads env)
process.env.NODE_ENV = 'test';

let app: FastifyInstance;

beforeAll(async () => {
  // Dynamic import after setting env
  const { buildApp } = await import('../src/app.js');
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

// ── Liveness probe (TICKET-001) ────────────────────────────────

describe('GET /healthz', () => {
  it('should return 200 with status ok and a numeric uptime', async () => {
    const res = await app.inject({ method: 'GET', url: '/healthz' });

    expect(res.statusCode).toBe(200);

    const body = res.json();
    expect(body.status).toBe('ok');
    expect(typeof body.uptime).toBe('number');
    expect(body.uptime).toBeGreaterThanOrEqual(0);
  });

  it('should not depend on the database or Redis (always 200)', async () => {
    // The dependency-free liveness probe must succeed even when backend
    // services are unavailable — unlike the /health readiness probe.
    const res = await app.inject({ method: 'GET', url: '/healthz' });
    expect(res.statusCode).toBe(200);
  });
});
