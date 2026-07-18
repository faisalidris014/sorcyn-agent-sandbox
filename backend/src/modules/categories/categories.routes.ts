import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { CategoriesService } from './categories.service.js';
import {
  listCategoriesQuerySchema,
  getCategoryBySlugParamsSchema,
} from './categories.schemas.js';

const categoriesRoutes: FastifyPluginAsync = async (app) => {
  const categoriesService = new CategoriesService();
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // GET / — List categories
  typedApp.get(
    '/',
    {
      schema: { querystring: listCategoriesQuerySchema, tags: ['Categories'], description: 'List categories' },
    },
    async (request, reply) => {
      const categories = await categoriesService.listCategories(request.query);
      return reply.send({ success: true, data: categories });
    },
  );

  // GET /tree — Full category tree
  typedApp.get(
    '/tree',
    {
      schema: { tags: ['Categories'], description: 'Get full category tree' },
    },
    async (request, reply) => {
      const tree = await categoriesService.getCategoryTree(request.marketplaceContext);
      return reply.send({ success: true, data: tree });
    },
  );

  // GET /:slug — Get category by slug with children
  typedApp.get(
    '/:slug',
    {
      schema: { params: getCategoryBySlugParamsSchema, tags: ['Categories'], description: 'Get category by slug' },
    },
    async (request, reply) => {
      const category = await categoriesService.getCategoryBySlug(request.params.slug);
      return reply.send({ success: true, data: category });
    },
  );
};

export default categoriesRoutes;
