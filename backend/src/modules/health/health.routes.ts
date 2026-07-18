import type { FastifyPluginAsync } from 'fastify';

/**
 * Liveness probe (TICKET-001).
 *
 * Dependency-free by design: it does NOT touch Prisma, Redis, or the job
 * queues, so it always returns 200 as long as the process is running. This is
 * distinct from the `/health` readiness probe in app.ts, which pings the
 * database + Redis and returns 503 `degraded` when a dependency is down.
 *
 * Registered at the root (no /api/v1 prefix) so it sits next to /health.
 */
const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    '/healthz',
    {
      schema: { tags: ['Health'], description: 'Liveness probe — always 200 when the process is up' },
    },
    async (_request, reply) => {
      return reply.status(200).send({
        status: 'ok',
        uptime: Math.floor(process.uptime()),
      });
    },
  );
};

export default healthRoutes;
