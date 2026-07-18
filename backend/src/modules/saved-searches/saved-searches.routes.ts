import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { SavedSearchesService } from './saved-searches.service.js';
import {
  createSavedSearchSchema,
  updateSavedSearchSchema,
  savedSearchIdParamsSchema,
  listSavedSearchesQuerySchema,
} from './saved-searches.schemas.js';

const savedSearchesRoutes: FastifyPluginAsync = async (app) => {
  const savedSearchesService = new SavedSearchesService();
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // POST / — Create saved search (auth required)
  typedApp.post(
    '/',
    {
      schema: {
        body: createSavedSearchSchema,
        tags: ['Saved Searches'],
        description: 'Create a new saved search with notification preferences',
        security: [{ bearerAuth: [] }],
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await savedSearchesService.createSavedSearch(
        request.user.sub,
        request.body,
      );
      return reply.code(201).send({ success: true, data: result });
    },
  );

  // GET / — List saved searches (auth required)
  typedApp.get(
    '/',
    {
      schema: {
        querystring: listSavedSearchesQuerySchema,
        tags: ['Saved Searches'],
        description: 'List your saved searches',
        security: [{ bearerAuth: [] }],
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await savedSearchesService.listSavedSearches(
        request.user.sub,
        request.query,
      );
      return reply.send({ success: true, data: result.savedSearches, meta: result.meta });
    },
  );

  // PUT /:searchId — Update saved search (auth required, owner only)
  typedApp.put(
    '/:searchId',
    {
      schema: {
        params: savedSearchIdParamsSchema,
        body: updateSavedSearchSchema,
        tags: ['Saved Searches'],
        description: 'Update a saved search',
        security: [{ bearerAuth: [] }],
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await savedSearchesService.updateSavedSearch(
        request.user.sub,
        request.params.searchId,
        request.body,
      );
      return reply.send({ success: true, data: result });
    },
  );

  // DELETE /:searchId — Soft delete saved search (auth required, owner only)
  typedApp.delete(
    '/:searchId',
    {
      schema: {
        params: savedSearchIdParamsSchema,
        tags: ['Saved Searches'],
        description: 'Delete a saved search',
        security: [{ bearerAuth: [] }],
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      await savedSearchesService.deleteSavedSearch(
        request.user.sub,
        request.params.searchId,
      );
      return reply.code(204).send();
    },
  );
};

export default savedSearchesRoutes;
