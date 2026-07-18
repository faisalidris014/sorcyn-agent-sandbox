import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { SellersService } from './sellers.service.js';
import {
  createSellerProfileSchema,
  updateSellerProfileSchema,
  submitVerificationSchema,
  submitCategoryRequestSchema,
  categoryRequirementsQuerySchema,
  getSellerByIdParamsSchema,
  getSellerByUserIdParamsSchema,
} from './sellers.schemas.js';

const sellersRoutes: FastifyPluginAsync = async (app) => {
  const sellersService = new SellersService();
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // POST / — Create seller profile
  typedApp.post(
    '/',
    {
      schema: { body: createSellerProfileSchema, tags: ['Sellers'], description: 'Create seller profile', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const profile = await sellersService.createSellerProfile(
        request.user.sub,
        request.body,
      );
      return reply.status(201).send({ success: true, data: profile });
    },
  );

  // GET /me — Get my seller profile
  typedApp.get(
    '/me',
    {
      schema: { tags: ['Sellers'], description: 'Get my seller profile', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const profile = await sellersService.getMySellerProfile(request.user.sub);
      return reply.send({ success: true, data: profile });
    },
  );

  // PATCH /me — Update my seller profile
  typedApp.patch(
    '/me',
    {
      schema: { body: updateSellerProfileSchema, tags: ['Sellers'], description: 'Update my seller profile', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const profile = await sellersService.updateSellerProfile(
        request.user.sub,
        request.body,
      );
      return reply.send({ success: true, data: profile });
    },
  );

  // POST /me/verification — Submit verification request
  typedApp.post(
    '/me/verification',
    {
      schema: { body: submitVerificationSchema, tags: ['Sellers'], description: 'Submit verification request', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await sellersService.submitVerification(
        request.user.sub,
        request.body,
      );
      return reply.status(201).send({ success: true, data: result });
    },
  );

  // GET /me/verification — Get my verification requests
  typedApp.get(
    '/me/verification',
    {
      schema: { tags: ['Sellers'], description: 'Get my verification requests', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const requests = await sellersService.getMyVerificationRequests(
        request.user.sub,
      );
      return reply.send({ success: true, data: requests });
    },
  );

  // GET /category-requirements — Required docs/policy for requested subcategories (#336)
  typedApp.get(
    '/category-requirements',
    {
      schema: {
        querystring: categoryRequirementsQuerySchema,
        tags: ['Sellers'],
        description: 'Get verification requirements for the requested subcategories',
        security: [{ bearerAuth: [] }],
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await sellersService.getCategoryRequirements(
        request.query.subcategoryIds,
      );
      return reply.send({ success: true, data: result });
    },
  );

  // POST /me/category-requests — Submit a category-access request (#336)
  typedApp.post(
    '/me/category-requests',
    {
      schema: {
        body: submitCategoryRequestSchema,
        tags: ['Sellers'],
        description: 'Submit a seller category-access request',
        security: [{ bearerAuth: [] }],
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await sellersService.submitCategoryRequest(
        request.user.sub,
        request.body,
      );
      return reply.status(201).send({ success: true, data: result });
    },
  );

  // GET /me/category-requests — List my category-access requests (#336)
  typedApp.get(
    '/me/category-requests',
    {
      schema: {
        tags: ['Sellers'],
        description: 'List my seller category-access requests',
        security: [{ bearerAuth: [] }],
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const requests = await sellersService.getMyCategoryRequests(request.user.sub);
      return reply.send({ success: true, data: requests });
    },
  );

  // GET /:sellerId — Get public seller profile by seller ID
  typedApp.get(
    '/:sellerId',
    {
      schema: { params: getSellerByIdParamsSchema, tags: ['Sellers'], description: 'Get public seller profile' },
    },
    async (request, reply) => {
      const profile = await sellersService.getSellerById(request.params.sellerId);
      return reply.send({ success: true, data: profile });
    },
  );

  // GET /user/:userId — Get public seller profile by user ID
  typedApp.get(
    '/user/:userId',
    {
      schema: { params: getSellerByUserIdParamsSchema, tags: ['Sellers'], description: 'Get seller profile by user ID' },
    },
    async (request, reply) => {
      const profile = await sellersService.getSellerByUserId(request.params.userId);
      return reply.send({ success: true, data: profile });
    },
  );

  // POST /identity/verify — Create Stripe Identity verification session (Phase 3 plan 06)
  typedApp.post(
    '/identity/verify',
    {
      schema: {
        tags: ['Sellers'],
        description: 'Start a Stripe Identity verification session for the ID Verified badge',
        security: [{ bearerAuth: [] }],
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const session = await sellersService.createIdentitySession(request.user.sub);
      return reply.status(201).send({ success: true, data: session });
    },
  );
};

export default sellersRoutes;
