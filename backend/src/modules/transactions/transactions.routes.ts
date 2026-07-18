import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { TransactionsService } from './transactions.service.js';
import {
  transactionIdParamsSchema,
  updateTransactionStatusSchema,
  markCompleteSchema,
  approveTransactionSchema,
  requestChangesSchema,
  cancelTransactionSchema,
  listMyTransactionsQuerySchema,
} from './transactions.schemas.js';

const transactionsRoutes: FastifyPluginAsync = async (app) => {
  const transactionsService = new TransactionsService();
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // GET /my-transactions — List user's transactions (auth required)
  typedApp.get(
    '/my-transactions',
    {
      schema: { querystring: listMyTransactionsQuerySchema, tags: ['Transactions'], description: 'List my transactions', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await transactionsService.getMyTransactions(request.user.sub, request.query);
      return reply.send({ success: true, data: result.transactions, meta: result.meta });
    },
  );

  // GET /:transactionId — Transaction detail (auth required)
  typedApp.get(
    '/:transactionId',
    {
      schema: { params: transactionIdParamsSchema, tags: ['Transactions'], description: 'Get transaction details', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const tx = await transactionsService.getTransactionById(request.user.sub, request.params.transactionId);
      return reply.send({ success: true, data: tx });
    },
  );

  // PUT /:transactionId/status — Update status (seller, auth required)
  typedApp.put(
    '/:transactionId/status',
    {
      schema: { params: transactionIdParamsSchema, body: updateTransactionStatusSchema, tags: ['Transactions'], description: 'Update transaction status', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const tx = await transactionsService.updateStatus(request.user.sub, request.params.transactionId, request.body);
      return reply.send({ success: true, data: tx });
    },
  );

  // POST /:transactionId/mark-complete — Mark complete (seller, auth required)
  typedApp.post(
    '/:transactionId/mark-complete',
    {
      schema: { params: transactionIdParamsSchema, body: markCompleteSchema, tags: ['Transactions'], description: 'Mark transaction complete', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const tx = await transactionsService.markComplete(request.user.sub, request.params.transactionId, request.body);
      return reply.send({ success: true, data: tx });
    },
  );

  // POST /:transactionId/approve — Approve & release funds (buyer, auth required)
  typedApp.post(
    '/:transactionId/approve',
    {
      schema: { params: transactionIdParamsSchema, body: approveTransactionSchema, tags: ['Transactions'], description: 'Approve and release funds', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const tx = await transactionsService.approveAndRelease(request.user.sub, request.params.transactionId, request.body);
      return reply.send({ success: true, data: tx });
    },
  );

  // POST /:transactionId/request-changes — Request changes (buyer, auth required)
  typedApp.post(
    '/:transactionId/request-changes',
    {
      schema: { params: transactionIdParamsSchema, body: requestChangesSchema, tags: ['Transactions'], description: 'Request changes', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const tx = await transactionsService.requestChanges(request.user.sub, request.params.transactionId, request.body);
      return reply.send({ success: true, data: tx });
    },
  );

  // PUT /:transactionId/cancel — Cancel transaction (buyer or seller, auth required)
  typedApp.put(
    '/:transactionId/cancel',
    {
      schema: { params: transactionIdParamsSchema, body: cancelTransactionSchema, tags: ['Transactions'], description: 'Cancel transaction', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const tx = await transactionsService.cancelTransaction(request.user.sub, request.params.transactionId, request.body);
      return reply.send({ success: true, data: tx });
    },
  );
};

export default transactionsRoutes;
