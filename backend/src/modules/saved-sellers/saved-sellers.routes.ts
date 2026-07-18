import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { SavedSellersService } from './saved-sellers.service.js';
import {
  sellerIdParamsSchema,
  listSavedSellersQuerySchema,
} from './saved-sellers.schemas.js';

const savedSellersRoutes: FastifyPluginAsync = async (app) => {
  const savedSellersService = new SavedSellersService();
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // POST /:sellerId — Save a seller (auth required)
  typedApp.post(
    '/:sellerId',
    {
      schema: { params: sellerIdParamsSchema, tags: ['Saved Sellers'], description: 'Save a seller to your favorites', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await savedSellersService.saveSeller(request.user.sub, request.params.sellerId);
      return reply.status(201).send({ success: true, data: result });
    },
  );

  // DELETE /:sellerId — Unsave a seller (auth required)
  typedApp.delete(
    '/:sellerId',
    {
      schema: { params: sellerIdParamsSchema, tags: ['Saved Sellers'], description: 'Remove a seller from favorites', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      await savedSellersService.unsaveSeller(request.user.sub, request.params.sellerId);
      return reply.status(204).send();
    },
  );

  // GET / — List saved sellers (auth required)
  typedApp.get(
    '/',
    {
      schema: { querystring: listSavedSellersQuerySchema, tags: ['Saved Sellers'], description: 'List your saved sellers', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await savedSellersService.listSavedSellers(request.user.sub, request.query);
      return reply.send({ success: true, data: result.sellers, meta: result.meta });
    },
  );
};

export default savedSellersRoutes;
