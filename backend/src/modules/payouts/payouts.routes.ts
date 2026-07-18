import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { PayoutsService } from './payouts.service.js';
import {
  listPayoutsQuerySchema,
  payoutIdParamsSchema,
} from './payouts.schemas.js';

const payoutsRoutes: FastifyPluginAsync = async (app) => {
  const payoutsService = new PayoutsService();
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // GET / — List seller's payouts (auth required)
  typedApp.get(
    '/',
    {
      schema: {
        querystring: listPayoutsQuerySchema,
        tags: ['Payouts'],
        description: 'List your payouts as a seller',
        security: [{ bearerAuth: [] }],
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await payoutsService.listPayouts(
        request.user.sub,
        request.query,
      );
      return reply.send({ success: true, data: result.payouts, meta: result.meta });
    },
  );

  // GET /summary — Earnings summary (auth required)
  // IMPORTANT: Must be registered BEFORE /:payoutId to avoid Fastify treating "summary" as a UUID
  typedApp.get(
    '/summary',
    {
      schema: {
        tags: ['Payouts'],
        description: 'Get your earnings summary (total earned, pending, in transit)',
        security: [{ bearerAuth: [] }],
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const summary = await payoutsService.getPayoutsSummary(request.user.sub);
      return reply.send({ success: true, data: summary });
    },
  );

  // GET /:payoutId — Payout detail (auth required, seller owner)
  typedApp.get(
    '/:payoutId',
    {
      schema: {
        params: payoutIdParamsSchema,
        tags: ['Payouts'],
        description: 'Get payout details',
        security: [{ bearerAuth: [] }],
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const payout = await payoutsService.getPayoutDetail(
        request.user.sub,
        request.params.payoutId,
      );
      return reply.send({ success: true, data: payout });
    },
  );
};

export default payoutsRoutes;
