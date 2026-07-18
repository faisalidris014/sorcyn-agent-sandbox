import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { DisputesService } from './disputes.service.js';
import {
  createDisputeSchema,
  listMyDisputesQuerySchema,
  disputeIdParamsSchema,
  submitEvidenceSchema,
  appealDisputeSchema,
} from './disputes.schemas.js';

const disputesRoutes: FastifyPluginAsync = async (app) => {
  const disputesService = new DisputesService();
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // POST / — Create dispute (auth required)
  typedApp.post(
    '/',
    {
      schema: {
        body: createDisputeSchema,
        tags: ['Disputes'],
        description: 'File a dispute on a transaction',
        security: [{ bearerAuth: [] }],
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const dispute = await disputesService.createDispute(
        request.user.sub,
        request.body,
      );
      return reply.code(201).send({ success: true, data: dispute });
    },
  );

  // GET /my-disputes — List user's disputes (auth required)
  typedApp.get(
    '/my-disputes',
    {
      schema: {
        querystring: listMyDisputesQuerySchema,
        tags: ['Disputes'],
        description: 'List your disputes as buyer or seller',
        security: [{ bearerAuth: [] }],
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await disputesService.listMyDisputes(
        request.user.sub,
        request.query,
      );
      return reply.send({ success: true, data: result.disputes, meta: result.meta });
    },
  );

  // GET /:disputeId — Dispute detail (auth required, participant only)
  typedApp.get(
    '/:disputeId',
    {
      schema: {
        params: disputeIdParamsSchema,
        tags: ['Disputes'],
        description: 'Get dispute details (participant only)',
        security: [{ bearerAuth: [] }],
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const dispute = await disputesService.getDisputeDetail(
        request.user.sub,
        request.params.disputeId,
      );
      return reply.send({ success: true, data: dispute });
    },
  );

  // POST /:disputeId/evidence — Submit evidence (auth required, participant, open/under_review only)
  typedApp.post(
    '/:disputeId/evidence',
    {
      schema: {
        params: disputeIdParamsSchema,
        body: submitEvidenceSchema,
        tags: ['Disputes'],
        description: 'Submit evidence for an open dispute',
        security: [{ bearerAuth: [] }],
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await disputesService.submitEvidence(
        request.user.sub,
        request.params.disputeId,
        request.body,
      );
      return reply.send({ success: true, data: result });
    },
  );

  // POST /:disputeId/appeal — Appeal resolved dispute (auth required, participant)
  typedApp.post(
    '/:disputeId/appeal',
    {
      schema: {
        params: disputeIdParamsSchema,
        body: appealDisputeSchema,
        tags: ['Disputes'],
        description: 'Appeal a resolved dispute',
        security: [{ bearerAuth: [] }],
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const dispute = await disputesService.appealDispute(
        request.user.sub,
        request.params.disputeId,
        request.body,
      );
      return reply.send({ success: true, data: dispute });
    },
  );
};

export default disputesRoutes;
