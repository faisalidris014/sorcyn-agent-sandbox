import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { PostsService } from '../posts/posts.service.js';
import { searchPostsQuerySchema } from './search.schemas.js';

const searchRoutes: FastifyPluginAsync = async (app) => {
  const postsService = new PostsService();
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // GET /posts — Search posts (full-text)
  // This route is unauthenticated and runs two raw tsquery scans plus a per-row
  // Haversine trig computation when geo params are present. The coarse global
  // 1000/hr IP limit is too loose to bound that DB CPU cost, so apply a strict
  // per-route limit to blunt anonymous DoS amplification (SEC-M4 #264).
  typedApp.get(
    '/posts',
    {
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
      schema: { querystring: searchPostsQuerySchema, tags: ['Search'], description: 'Full-text search posts' },
    },
    async (request, reply) => {
      const result = await postsService.searchPosts(request.query);
      return reply.send({ success: true, data: result.posts, meta: result.meta });
    },
  );
};

export default searchRoutes;
