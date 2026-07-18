import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { UploadsService } from './uploads.service.js';
import {
  presignedUrlSchema,
  deleteUploadQuerySchema,
} from './uploads.schemas.js';

const uploadsRoutes: FastifyPluginAsync = async (app) => {
  const uploadsService = new UploadsService();
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // POST / — Generate presigned upload URL (auth required)
  typedApp.post(
    '/',
    {
      schema: {
        body: presignedUrlSchema,
        tags: ['Uploads'],
        description: 'Generate a presigned URL for direct file upload to Cloudflare R2',
        security: [{ bearerAuth: [] }],
      },
      onRequest: [app.authenticate],
      config: { rateLimit: { max: 30, timeWindow: '1 hour' } },
    },
    async (request, reply) => {
      const result = await uploadsService.generatePresignedUrl(
        request.user.sub,
        request.body,
      );
      return reply.code(201).send({ success: true, data: result });
    },
  );

  // DELETE / — Delete an uploaded file (auth required, ownership verified)
  typedApp.delete(
    '/',
    {
      schema: {
        querystring: deleteUploadQuerySchema,
        tags: ['Uploads'],
        description: 'Delete an uploaded file by its R2 key',
        security: [{ bearerAuth: [] }],
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      await uploadsService.deleteUpload(request.user.sub, request.query.key);
      return reply.send({ success: true, data: { message: 'File deleted' } });
    },
  );
};

export default uploadsRoutes;
