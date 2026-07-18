import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { MessagesService } from './messages.service.js';
import {
  listConversationsQuerySchema,
  conversationIdParamsSchema,
  postIdParamsSchema,
  getConversationMessagesQuerySchema,
  sendMessageSchema,
  reportConversationSchema,
} from './messages.schemas.js';

const messagesRoutes: FastifyPluginAsync = async (app) => {
  const messagesService = new MessagesService();
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // GET /conversations — List conversations (auth required)
  typedApp.get(
    '/conversations',
    {
      schema: { querystring: listConversationsQuerySchema, tags: ['Messages'], description: 'List conversations', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await messagesService.listConversations(request.user.sub, request.query);
      return reply.send({ success: true, data: result.conversations, meta: result.meta });
    },
  );

  // GET /conversations/by-post/:postId — Resolve the current user's conversation for a
  // post (static `by-post` segment is matched ahead of the `:conversationId` param).
  // Returns 404 when no thread exists yet (client: "submit an offer first").
  typedApp.get(
    '/conversations/by-post/:postId',
    {
      schema: { params: postIdParamsSchema, tags: ['Messages'], description: 'Resolve conversation by post', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await messagesService.getConversationByPost(request.user.sub, request.params.postId);
      return reply.send({ success: true, data: result });
    },
  );

  // GET /conversations/:conversationId — Get conversation with messages (auth required)
  typedApp.get(
    '/conversations/:conversationId',
    {
      schema: { params: conversationIdParamsSchema, querystring: getConversationMessagesQuerySchema, tags: ['Messages'], description: 'Get conversation messages', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await messagesService.getConversation(request.user.sub, request.params.conversationId, request.query);
      return reply.send({ success: true, data: result });
    },
  );

  // POST /conversations/:conversationId/messages — Send message (auth required)
  typedApp.post(
    '/conversations/:conversationId/messages',
    {
      schema: { params: conversationIdParamsSchema, body: sendMessageSchema, tags: ['Messages'], description: 'Send a message', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const message = await messagesService.sendMessage(request.user.sub, request.params.conversationId, request.body);
      return reply.code(201).send({ success: true, data: message });
    },
  );

  // PUT /conversations/:conversationId/mark-read — Mark read (auth required)
  typedApp.put(
    '/conversations/:conversationId/mark-read',
    {
      schema: { params: conversationIdParamsSchema, tags: ['Messages'], description: 'Mark conversation as read', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      await messagesService.markRead(request.user.sub, request.params.conversationId);
      return reply.send({ success: true, data: { message: 'Messages marked as read' } });
    },
  );

  // PUT /conversations/:conversationId/mark-unread — Mark unread (auth required)
  typedApp.put(
    '/conversations/:conversationId/mark-unread',
    {
      schema: { params: conversationIdParamsSchema, tags: ['Messages'], description: 'Mark conversation as unread', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      await messagesService.markUnread(request.user.sub, request.params.conversationId);
      return reply.send({ success: true, data: { message: 'Conversation marked as unread' } });
    },
  );

  // DELETE /conversations/:conversationId — Hide conversation from caller's inbox (auth required)
  typedApp.delete(
    '/conversations/:conversationId',
    {
      schema: { params: conversationIdParamsSchema, tags: ['Messages'], description: 'Delete (hide) conversation for the current user', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      await messagesService.deleteConversation(request.user.sub, request.params.conversationId);
      return reply.send({ success: true, data: { message: 'Conversation deleted' } });
    },
  );

  // POST /conversations/:conversationId/report — Report conversation (auth required)
  typedApp.post(
    '/conversations/:conversationId/report',
    {
      schema: { params: conversationIdParamsSchema, body: reportConversationSchema, tags: ['Messages'], description: 'Report conversation', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      await messagesService.reportConversation(request.user.sub, request.params.conversationId, request.body);
      return reply.send({ success: true, data: { message: 'Conversation reported for review' } });
    },
  );
};

export default messagesRoutes;
