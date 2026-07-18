import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { AnnouncementsService } from './announcements.service.js';
import {
  createAnnouncementSchema,
  announcementIdParamsSchema,
} from './announcements.schemas.js';

const service = new AnnouncementsService();

// ── Public routes — /api/v1/announcements ──────────────────

export const announcementsRoutes: FastifyPluginAsync = async (app) => {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // GET /active — currently-active announcement(s), polled by the Flutter app
  typedApp.get(
    '/active',
    {
      schema: {
        tags: ['Announcements'],
        description: 'Get currently-active announcement banner(s)',
      },
    },
    async (_request, reply) => {
      const announcements = await service.getActiveAnnouncements();
      return reply.send({ success: true, data: announcements });
    },
  );
};

// ── Admin routes — /api/v1/admin/announcements ─────────────

export const adminAnnouncementsRoutes: FastifyPluginAsync = async (app) => {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  app.addHook('onRequest', app.authenticate);
  app.addHook('onRequest', app.requireAdmin);

  // POST / — create an announcement
  typedApp.post(
    '/',
    {
      schema: {
        body: createAnnouncementSchema,
        tags: ['Admin'],
        description: 'Create an announcement banner',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const announcement = await service.createAnnouncement(request.user.sub, request.body);
      return reply.status(201).send({ success: true, data: announcement });
    },
  );

  // DELETE /:id — clear an announcement
  typedApp.delete(
    '/:id',
    {
      schema: {
        params: announcementIdParamsSchema,
        tags: ['Admin'],
        description: 'Clear an announcement banner',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      await service.deleteAnnouncement(request.user.sub, request.params.id);
      return reply.send({ success: true, data: { message: 'Announcement cleared' } });
    },
  );
};

export default announcementsRoutes;
