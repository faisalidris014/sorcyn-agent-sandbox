import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Registry, collectDefaultMetrics, Histogram, Counter } from 'prom-client';
import { env } from '../../config/env.js';

const register = new Registry();

collectDefaultMetrics({ register, prefix: 'rm_' });

const httpRequestDuration = new Histogram({
  name: 'rm_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

const httpRequestsTotal = new Counter({
  name: 'rm_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [register],
});

// Seller category-access request outcomes (#336). Instrumented at every router
// and admin-review decision so we can see auto-approve / queue / reject rates.
const categoryRequestOutcomeTotal = new Counter({
  name: 'rm_category_request_outcome_total',
  help: 'Seller category-access request outcomes by router/admin decision',
  labelNames: ['outcome', 'reason', 'authority'] as const,
  registers: [register],
});

/** Record one seller category-access decision (low-cardinality labels only). */
export function recordCategoryRequestOutcome(
  outcome: string,
  reason: string,
  authority: string,
): void {
  categoryRequestOutcomeTotal.labels(outcome, reason, authority).inc();
}

function normalizeRoute(request: FastifyRequest): string {
  // Use the matched route pattern (e.g. /api/v1/posts/:postId) instead of the actual URL
  // to avoid high-cardinality labels from dynamic path params
  const routerPath = request.routeOptions?.url;
  if (routerPath) return routerPath;
  // Fallback: strip UUIDs and numeric IDs from the URL
  return request.url.split('?')[0].replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id').replace(/\/\d+/g, '/:id');
}

// Widened generics — see authenticate.ts for the rationale.
export function registerMetrics(app: FastifyInstance<any, any, any, any, any>): void {
  // Track request duration and count
  app.addHook('onRequest', async (request: FastifyRequest) => {
    (request as any).__metricsStart = process.hrtime.bigint();
  });

  app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const start = (request as any).__metricsStart as bigint | undefined;
    if (!start) return;

    const route = normalizeRoute(request);
    const method = request.method;
    const statusCode = String(reply.statusCode);
    const durationNs = Number(process.hrtime.bigint() - start);
    const durationSec = durationNs / 1e9;

    httpRequestDuration.labels(method, route, statusCode).observe(durationSec);
    httpRequestsTotal.labels(method, route, statusCode).inc();
  });

  // GET /metrics endpoint
  app.get('/metrics', async (request, reply) => {
    // Protect with bearer token if METRICS_TOKEN is set
    if (env.METRICS_TOKEN) {
      const authHeader = request.headers.authorization;
      if (!authHeader || authHeader !== `Bearer ${env.METRICS_TOKEN}`) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    }

    reply.header('Content-Type', register.contentType);
    return register.metrics();
  });
}
