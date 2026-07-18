import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { NotificationsService } from './notifications.service.js';
import {
  listNotificationsQuerySchema,
  notificationIdParamsSchema,
  notificationPreferencesSchema,
} from './notifications.schemas.js';

const notificationsRoutes: FastifyPluginAsync = async (app) => {
  const notificationsService = new NotificationsService();
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // GET / — List notifications (auth required)
  typedApp.get(
    '/',
    {
      schema: { querystring: listNotificationsQuerySchema, tags: ['Notifications'], description: 'List notifications', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await notificationsService.listNotifications(request.user.sub, request.query);
      return reply.send({ success: true, data: result.notifications, meta: result.meta });
    },
  );

  // GET /unread-count — Count unread notifications (auth required)
  // Static route — must be before /:notificationId
  typedApp.get(
    '/unread-count',
    {
      schema: { tags: ['Notifications'], description: 'Count unread notifications', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await notificationsService.getUnreadCount(request.user.sub);
      return reply.send({ success: true, data: result });
    },
  );

  // GET /preferences — Get the user's notification preferences (auth required)
  typedApp.get(
    '/preferences',
    {
      schema: { tags: ['Notifications'], description: 'Get notification preferences', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await notificationsService.getPreferences(request.user.sub);
      return reply.send({ success: true, data: result });
    },
  );

  // PUT /preferences — Update the user's notification preferences (auth required)
  typedApp.put(
    '/preferences',
    {
      schema: {
        body: notificationPreferencesSchema,
        tags: ['Notifications'],
        description: 'Update notification preferences',
        security: [{ bearerAuth: [] }],
      },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await notificationsService.updatePreferences(request.user.sub, request.body);
      return reply.send({ success: true, data: result });
    },
  );

  // PUT /read-all — Mark all notifications read (auth required)
  // Must be before /:notificationId routes
  typedApp.put(
    '/read-all',
    {
      schema: { tags: ['Notifications'], description: 'Mark all notifications as read', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await notificationsService.markAllRead(request.user.sub);
      return reply.send({ success: true, data: result });
    },
  );

  // PUT /:notificationId/read — Mark notification read (auth required)
  typedApp.put(
    '/:notificationId/read',
    {
      schema: { params: notificationIdParamsSchema, tags: ['Notifications'], description: 'Mark notification as read', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      await notificationsService.markRead(request.user.sub, request.params.notificationId);
      return reply.send({ success: true, data: { message: 'Notification marked as read' } });
    },
  );

  // DELETE /:notificationId — Delete notification (auth required)
  typedApp.delete(
    '/:notificationId',
    {
      schema: { params: notificationIdParamsSchema, tags: ['Notifications'], description: 'Delete notification', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      await notificationsService.deleteNotification(request.user.sub, request.params.notificationId);
      return reply.code(204).send();
    },
  );
};

export default notificationsRoutes;
