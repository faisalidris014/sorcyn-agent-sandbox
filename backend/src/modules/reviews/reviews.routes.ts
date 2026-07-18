import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { ReviewsService } from './reviews.service.js';
import {
  createReviewSchema,
  listSellerReviewsParamsSchema,
  listSellerReviewsQuerySchema,
  reviewIdParamsSchema,
  reportReviewSchema,
} from './reviews.schemas.js';

const reviewsRoutes: FastifyPluginAsync = async (app) => {
  const reviewsService = new ReviewsService();
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // POST / — Submit review (auth required, buyer only)
  typedApp.post(
    '/',
    {
      schema: { body: createReviewSchema, tags: ['Reviews'], description: 'Submit a review', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const review = await reviewsService.submitReview(request.user.sub, request.body);
      return reply.code(201).send({ success: true, data: review });
    },
  );

  // GET /sellers/:sellerId — List seller reviews (public)
  typedApp.get(
    '/sellers/:sellerId',
    {
      schema: { params: listSellerReviewsParamsSchema, querystring: listSellerReviewsQuerySchema, tags: ['Reviews'], description: 'List seller reviews' },
    },
    async (request, reply) => {
      const result = await reviewsService.listSellerReviews(request.params.sellerId, request.query);
      return reply.send({ success: true, data: result.reviews, meta: result.meta, summary: result.summary });
    },
  );

  // PUT /:reviewId/report — Report review (auth required)
  typedApp.put(
    '/:reviewId/report',
    {
      schema: { params: reviewIdParamsSchema, body: reportReviewSchema, tags: ['Reviews'], description: 'Report a review', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      await reviewsService.reportReview(request.user.sub, request.params.reviewId, request.body);
      return reply.send({ success: true, data: { message: 'Review reported for moderation' } });
    },
  );
};

export default reviewsRoutes;
