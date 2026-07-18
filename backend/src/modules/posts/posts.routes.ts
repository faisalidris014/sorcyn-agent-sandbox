import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { PostsService } from './posts.service.js';
import { AIAssistService } from './ai-assist.service.js';
import {
  createPostSchema,
  updatePostSchema,
  getPostByIdParamsSchema,
  listMyPostsQuerySchema,
  feedQuerySchema,
  searchPostsQuerySchema,
  discoverFeedQuerySchema,
  createFromOfferSchema,
} from './posts.schemas.js';
import {
  parsePostRequestSchema,
  suggestImagesRequestSchema,
  generateJobProfileRequestSchema,
} from './ai-assist.schemas.js';

const postsRoutes: FastifyPluginAsync = async (app) => {
  const postsService = new PostsService();
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // POST / — Create post (auth required)
  typedApp.post(
    '/',
    {
      schema: { body: createPostSchema, tags: ['Posts'], description: 'Create a new post', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const post = await postsService.createPost(request.user.sub, request.body, request.marketplaceContext);
      return reply.status(201).send({ success: true, data: post });
    },
  );

  // GET /my-posts — List buyer's own posts (auth required)
  typedApp.get(
    '/my-posts',
    {
      schema: { querystring: listMyPostsQuerySchema, tags: ['Posts'], description: 'List my posts', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await postsService.getMyPosts(request.user.sub, request.query);
      return reply.send({ success: true, data: result.posts, meta: result.meta });
    },
  );

  // GET /feed — Public feed for sellers (optional auth: targeted-seller carve-out)
  typedApp.get(
    '/feed',
    {
      schema: { querystring: feedQuerySchema, tags: ['Posts'], description: 'Public post feed for sellers' },
      onRequest: [async (request) => {
        try {
          await request.jwtVerify();
        } catch {
          // Token absent or invalid — proceed unauthenticated (no carve-out)
        }
      }],
    },
    async (request, reply) => {
      const requestingUserId = (request.user as { sub?: string } | undefined)?.sub;
      const result = await postsService.getFeed(request.query, request.marketplaceContext, requestingUserId);
      return reply.send({ success: true, data: result.posts, meta: result.meta });
    },
  );

  // GET /discover — Buyer-facing discovery feed (#37, #315). Surfaces seeded +
  // real publicly-visible posts that have a pending seller offer, each with its
  // offers nested (oldest-first); excludes the viewer's own posts. Auth required.
  typedApp.get(
    '/discover',
    {
      schema: { querystring: discoverFeedQuerySchema, tags: ['Posts'], description: 'Buyer discovery feed (posts with offers to engage)', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await postsService.getDiscoveryFeed(request.query, request.user.sub);
      return reply.send({ success: true, data: result.posts, meta: result.meta });
    },
  );

  // POST /from-offer — Clone a discovery offer into your own real post (#37).
  typedApp.post(
    '/from-offer',
    {
      schema: { body: createFromOfferSchema, tags: ['Posts'], description: 'Create your own real post from a discovery offer ("request a quote like this")', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const post = await postsService.createFromSeedOffer(request.user.sub, request.body, request.marketplaceContext);
      return reply.status(201).send({ success: true, data: post });
    },
  );

  // GET /search — Full-text search
  typedApp.get(
    '/search',
    {
      schema: { querystring: searchPostsQuerySchema, tags: ['Posts'], description: 'Search posts' },
    },
    async (request, reply) => {
      const result = await postsService.searchPosts(request.query, request.marketplaceContext);
      return reply.send({ success: true, data: result.posts, meta: result.meta });
    },
  );

  // ── AI-Assisted Endpoints ─────────────────────────────────

  const aiService = new AIAssistService();

  // POST /ai/parse — Parse natural language into structured post
  typedApp.post(
    '/ai/parse',
    {
      schema: { body: parsePostRequestSchema, tags: ['AI Assist'], description: 'Parse natural language into structured post', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
      config: { rateLimit: { max: 20, timeWindow: '1 hour' } },
    },
    async (request, reply) => {
      const result = await aiService.parsePostRequest(request.user.sub, request.body);
      return reply.send({ success: true, data: result });
    },
  );

  // POST /ai/suggest-images — Suggest product images
  typedApp.post(
    '/ai/suggest-images',
    {
      schema: { body: suggestImagesRequestSchema, tags: ['AI Assist'], description: 'Suggest product images', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
      config: { rateLimit: { max: 20, timeWindow: '1 hour' } },
    },
    async (request, reply) => {
      const result = await aiService.suggestProductImages(request.user.sub, request.body);
      return reply.send({ success: true, data: result });
    },
  );

  // POST /ai/generate-job-profile — Generate job seeker/employer profile
  typedApp.post(
    '/ai/generate-job-profile',
    {
      schema: { body: generateJobProfileRequestSchema, tags: ['AI Assist'], description: 'Generate job profile', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
      config: { rateLimit: { max: 20, timeWindow: '1 hour' } },
    },
    async (request, reply) => {
      const result = await aiService.generateJobProfile(request.user.sub, request.body);
      return reply.send({ success: true, data: result });
    },
  );

  // GET /:postId — Get post details
  typedApp.get(
    '/:postId',
    {
      schema: { params: getPostByIdParamsSchema, tags: ['Posts'], description: 'Get post details' },
    },
    async (request, reply) => {
      // Try to extract user from token if present (optional auth)
      let userId: string | undefined;
      try {
        await request.jwtVerify();
        userId = request.user.sub;
      } catch {
        // Not authenticated — that's fine for public view
      }
      const post = await postsService.getPostById(request.params.postId, userId);
      return reply.send({ success: true, data: post });
    },
  );

  // PUT /:postId — Update post (auth required, owner only, no offers)
  typedApp.put(
    '/:postId',
    {
      schema: { params: getPostByIdParamsSchema, body: updatePostSchema, tags: ['Posts'], description: 'Update post', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const post = await postsService.updatePost(request.user.sub, request.params.postId, request.body);
      return reply.send({ success: true, data: post });
    },
  );

  // DELETE /:postId — Cancel/delete post (auth required, owner only)
  typedApp.delete(
    '/:postId',
    {
      schema: { params: getPostByIdParamsSchema, tags: ['Posts'], description: 'Delete post', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      await postsService.deletePost(request.user.sub, request.params.postId);
      return reply.status(204).send();
    },
  );

  // POST /:postId/extend — Extend post duration (auth required)
  typedApp.post(
    '/:postId/extend',
    {
      schema: { params: getPostByIdParamsSchema, tags: ['Posts'], description: 'Extend post duration', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await postsService.extendPost(request.user.sub, request.params.postId);
      return reply.send({ success: true, data: result });
    },
  );

  // POST /:postId/mark-filled — Mark post as filled (auth required)
  typedApp.post(
    '/:postId/mark-filled',
    {
      schema: { params: getPostByIdParamsSchema, tags: ['Posts'], description: 'Mark post as filled', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await postsService.markFilled(request.user.sub, request.params.postId);
      return reply.send({ success: true, data: result });
    },
  );

  // POST /:postId/archive — Archive post (auth required)
  typedApp.post(
    '/:postId/archive',
    {
      schema: { params: getPostByIdParamsSchema, tags: ['Posts'], description: 'Archive a completed/expired/cancelled post', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await postsService.archivePost(request.user.sub, request.params.postId);
      return reply.send({ success: true, data: result });
    },
  );

  // POST /:postId/repost — Repost with same details (auth required)
  typedApp.post(
    '/:postId/repost',
    {
      schema: { params: getPostByIdParamsSchema, tags: ['Posts'], description: 'Repost with same details', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const post = await postsService.repost(request.user.sub, request.params.postId);
      return reply.status(201).send({ success: true, data: post });
    },
  );
};

export default postsRoutes;
