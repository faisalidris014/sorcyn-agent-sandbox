import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { AdminService } from './admin.service.js';
import { TakedownsService } from './takedowns.service.js';
import {
  listUsersQuerySchema,
  userIdParamsSchema,
  suspendUserSchema,
  banUserSchema,
  listVerificationsQuerySchema,
  verificationIdParamsSchema,
  reviewVerificationSchema,
  listCategoryRequestsQuerySchema,
  categoryRequestIdParamsSchema,
  reviewCategoryRequestSchema,
  listDisputesQuerySchema,
  disputeIdParamsSchema,
  resolveDisputeSchema,
  listFlaggedContentQuerySchema,
  moderateContentSchema,
  reviewIdParamsSchema,
  messageIdParamsSchema,
  listTransactionsQuerySchema,
  listAuditLogsQuerySchema,
  takedownImageSchema,
  listTakedownsQuerySchema,
} from './admin.schemas.js';

const adminRoutes: FastifyPluginAsync = async (app) => {
  const adminService = new AdminService();
  const takedownsService = new TakedownsService();
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // All admin routes require authentication + admin role
  app.addHook('onRequest', app.authenticate);
  app.addHook('onRequest', app.requireAdmin);

  // ── Dashboard ──────────────────────────────────────────

  // GET /stats — Dashboard stats
  typedApp.get(
    '/stats',
    {
      schema: { tags: ['Admin'], description: 'Get dashboard stats', security: [{ bearerAuth: [] }] },
    },
    async (_request, reply) => {
      const stats = await adminService.getStats();
      return reply.send({ success: true, data: stats });
    },
  );

  // ── User Management ────────────────────────────────────

  // GET /users — List users
  typedApp.get(
    '/users',
    {
      schema: { querystring: listUsersQuerySchema, tags: ['Admin'], description: 'List users', security: [{ bearerAuth: [] }] },
    },
    async (request, reply) => {
      const result = await adminService.listUsers(request.query);
      return reply.send({ success: true, data: result.users, meta: result.meta });
    },
  );

  // GET /users/:userId — User detail
  typedApp.get(
    '/users/:userId',
    {
      schema: { params: userIdParamsSchema, tags: ['Admin'], description: 'Get user details', security: [{ bearerAuth: [] }] },
    },
    async (request, reply) => {
      const user = await adminService.getUserDetail(request.params.userId);
      return reply.send({ success: true, data: user });
    },
  );

  // POST /users/:userId/suspend — Suspend user
  typedApp.post(
    '/users/:userId/suspend',
    {
      schema: { params: userIdParamsSchema, body: suspendUserSchema, tags: ['Admin'], description: 'Suspend user', security: [{ bearerAuth: [] }] },
    },
    async (request, reply) => {
      await adminService.suspendUser(request.user.sub, request.params.userId, request.body);
      return reply.send({ success: true, data: { message: 'User suspended' } });
    },
  );

  // POST /users/:userId/ban — Ban user
  typedApp.post(
    '/users/:userId/ban',
    {
      schema: { params: userIdParamsSchema, body: banUserSchema, tags: ['Admin'], description: 'Ban user', security: [{ bearerAuth: [] }] },
    },
    async (request, reply) => {
      await adminService.banUser(request.user.sub, request.params.userId, request.body);
      return reply.send({ success: true, data: { message: 'User banned' } });
    },
  );

  // POST /users/:userId/reactivate — Reactivate user
  typedApp.post(
    '/users/:userId/reactivate',
    {
      schema: { params: userIdParamsSchema, tags: ['Admin'], description: 'Reactivate user', security: [{ bearerAuth: [] }] },
    },
    async (request, reply) => {
      await adminService.reactivateUser(request.user.sub, request.params.userId);
      return reply.send({
        success: true,
        data: { message: 'User reactivated' },
      });
    },
  );

  // POST /users/:userId/force-logout — Force logout
  typedApp.post(
    '/users/:userId/force-logout',
    {
      schema: { params: userIdParamsSchema, tags: ['Admin'], description: 'Force logout user', security: [{ bearerAuth: [] }] },
    },
    async (request, reply) => {
      await adminService.forceLogout(request.user.sub, request.params.userId);
      return reply.send({
        success: true,
        data: { message: 'User sessions invalidated' },
      });
    },
  );

  // ── Verification ───────────────────────────────────────

  // GET /verifications — List verification requests
  typedApp.get(
    '/verifications',
    {
      schema: { querystring: listVerificationsQuerySchema, tags: ['Admin'], description: 'List verification requests', security: [{ bearerAuth: [] }] },
    },
    async (request, reply) => {
      const result = await adminService.listPendingVerifications(request.query);
      return reply.send({
        success: true,
        data: result.verifications,
        meta: result.meta,
      });
    },
  );

  // POST /verifications/:verificationId/review — Approve/reject
  typedApp.post(
    '/verifications/:verificationId/review',
    {
      schema: { params: verificationIdParamsSchema, body: reviewVerificationSchema, tags: ['Admin'], description: 'Review verification request', security: [{ bearerAuth: [] }] },
    },
    async (request, reply) => {
      await adminService.reviewVerification(
        request.user.sub,
        request.params.verificationId,
        request.body,
      );
      return reply.send({
        success: true,
        data: { message: `Verification ${request.body.action}d` },
      });
    },
  );

  // ── Category Access Requests (#336) ─────────────────────

  // GET /category-requests — List seller category-access requests
  typedApp.get(
    '/category-requests',
    {
      schema: { querystring: listCategoryRequestsQuerySchema, tags: ['Admin'], description: 'List seller category-access requests', security: [{ bearerAuth: [] }] },
    },
    async (request, reply) => {
      const result = await adminService.listCategoryRequests(request.query);
      return reply.send({
        success: true,
        data: result.requests,
        meta: result.meta,
      });
    },
  );

  // POST /category-requests/:requestId/review — Approve/reject
  typedApp.post(
    '/category-requests/:requestId/review',
    {
      schema: { params: categoryRequestIdParamsSchema, body: reviewCategoryRequestSchema, tags: ['Admin'], description: 'Review a seller category-access request', security: [{ bearerAuth: [] }] },
    },
    async (request, reply) => {
      await adminService.reviewCategoryRequest(
        request.user.sub,
        request.params.requestId,
        request.body,
      );
      return reply.send({
        success: true,
        data: { message: `Category request ${request.body.action}d` },
      });
    },
  );

  // ── Disputes ───────────────────────────────────────────

  // GET /disputes — List disputes
  typedApp.get(
    '/disputes',
    {
      schema: { querystring: listDisputesQuerySchema, tags: ['Admin'], description: 'List disputes', security: [{ bearerAuth: [] }] },
    },
    async (request, reply) => {
      const result = await adminService.listDisputes(request.query);
      return reply.send({
        success: true,
        data: result.disputes,
        meta: result.meta,
      });
    },
  );

  // GET /disputes/:disputeId — Dispute detail
  typedApp.get(
    '/disputes/:disputeId',
    {
      schema: { params: disputeIdParamsSchema, tags: ['Admin'], description: 'Get dispute details', security: [{ bearerAuth: [] }] },
    },
    async (request, reply) => {
      const dispute = await adminService.getDisputeDetail(request.params.disputeId);
      return reply.send({ success: true, data: dispute });
    },
  );

  // POST /disputes/:disputeId/resolve — Resolve dispute
  typedApp.post(
    '/disputes/:disputeId/resolve',
    {
      schema: { params: disputeIdParamsSchema, body: resolveDisputeSchema, tags: ['Admin'], description: 'Resolve dispute', security: [{ bearerAuth: [] }] },
    },
    async (request, reply) => {
      await adminService.resolveDispute(request.user.sub, request.params.disputeId, request.body);
      return reply.send({
        success: true,
        data: { message: 'Dispute resolved' },
      });
    },
  );

  // ── Moderation ─────────────────────────────────────────

  // GET /moderation/flagged — List flagged content
  typedApp.get(
    '/moderation/flagged',
    {
      schema: { querystring: listFlaggedContentQuerySchema, tags: ['Admin'], description: 'List flagged content', security: [{ bearerAuth: [] }] },
    },
    async (request, reply) => {
      const result = await adminService.listFlaggedContent(request.query);
      return reply.send({
        success: true,
        data: result.items,
        meta: result.meta,
      });
    },
  );

  // POST /moderation/reviews/:reviewId — Moderate review
  typedApp.post(
    '/moderation/reviews/:reviewId',
    {
      schema: { params: reviewIdParamsSchema, body: moderateContentSchema, tags: ['Admin'], description: 'Moderate review', security: [{ bearerAuth: [] }] },
    },
    async (request, reply) => {
      await adminService.moderateReview(request.user.sub, request.params.reviewId, request.body);
      return reply.send({
        success: true,
        data: { message: `Review ${request.body.action}d` },
      });
    },
  );

  // POST /moderation/messages/:messageId — Moderate message
  typedApp.post(
    '/moderation/messages/:messageId',
    {
      schema: { params: messageIdParamsSchema, body: moderateContentSchema, tags: ['Admin'], description: 'Moderate message', security: [{ bearerAuth: [] }] },
    },
    async (request, reply) => {
      await adminService.moderateMessage(request.user.sub, request.params.messageId, request.body);
      return reply.send({
        success: true,
        data: { message: `Message ${request.body.action}d` },
      });
    },
  );

  // ── Transactions ───────────────────────────────────────

  // GET /transactions — List all transactions
  typedApp.get(
    '/transactions',
    {
      schema: { querystring: listTransactionsQuerySchema, tags: ['Admin'], description: 'List all transactions', security: [{ bearerAuth: [] }] },
    },
    async (request, reply) => {
      const result = await adminService.listAllTransactions(request.query);
      return reply.send({
        success: true,
        data: result.transactions,
        meta: result.meta,
      });
    },
  );

  // ── Audit Logs ─────────────────────────────────────────

  // GET /audit-logs — List audit logs
  typedApp.get(
    '/audit-logs',
    {
      schema: { querystring: listAuditLogsQuerySchema, tags: ['Admin'], description: 'List audit logs', security: [{ bearerAuth: [] }] },
    },
    async (request, reply) => {
      const result = await adminService.listAuditLogs(request.query);
      return reply.send({ success: true, data: result.logs, meta: result.meta });
    },
  );

  // ── Copyright Takedowns (#313) ─────────────────────────

  // POST /takedowns — Take down an infringing image: removes it from the post,
  // blocklists its perceptual hash for staydown, strikes the uploader, and
  // suspends the account at the strike threshold.
  typedApp.post(
    '/takedowns',
    {
      schema: {
        body: takedownImageSchema,
        tags: ['Admin'],
        description: 'Take down a copyrighted image from a post and strike the uploader',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const result = await takedownsService.takeDownImage(request.user.sub, request.body);
      return reply.code(201).send({ success: true, data: result });
    },
  );

  // GET /takedowns — List blocklist entries
  typedApp.get(
    '/takedowns',
    {
      schema: { querystring: listTakedownsQuerySchema, tags: ['Admin'], description: 'List copyright takedown blocklist entries', security: [{ bearerAuth: [] }] },
    },
    async (request, reply) => {
      const result = await takedownsService.listTakedowns(request.query.page, request.query.limit);
      return reply.send({ success: true, data: result.items, meta: result.meta });
    },
  );
};

export default adminRoutes;
