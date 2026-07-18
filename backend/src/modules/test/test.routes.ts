import type { FastifyPluginAsync } from 'fastify';
import { env } from '../../config/env.js';

/**
 * Phase 4 D-08 — staging-only chaos endpoint.
 * Registered ONLY when NODE_ENV !== 'production'. Gated behind X-Test-Token.
 * See scripts/synthetic-incident.sh and docs/runbooks/observability-drill.md.
 */
export const testRoutes: FastifyPluginAsync = async (app) => {
  if (env.NODE_ENV === 'production') return; // belt-and-suspenders

  app.get('/__test/force-500', async (req, reply) => {
    const token = req.headers['x-test-token'];
    if (!env.TEST_FORCE_TOKEN || !token || token !== env.TEST_FORCE_TOKEN) {
      return reply.status(403).send({ error: 'Forbidden' });
    }
    // Intentional 5xx for chaos drill — feeds AlertManager rule ApiHigh5xxBurst.
    req.log.warn({ chaos: true, alert: 'force-500' }, 'synthetic-incident force-500 fired');
    return reply.status(500).send({ error: 'Synthetic incident: force-500' });
  });
};
