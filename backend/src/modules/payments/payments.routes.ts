import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { PaymentsService } from './payments.service.js';
import {
  createPaymentIntentSchema,
  refundPaymentSchema,
} from './payments.schemas.js';
import {
  createIntentDegradeGuard,
  refundDegradeGuard,
} from './payments.degrade.js';

const paymentsRoutes: FastifyPluginAsync = async (app) => {
  const paymentsService = new PaymentsService();
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // POST /create-intent — create Stripe PaymentIntent for a transaction
  typedApp.post(
    '/create-intent',
    {
      schema: { body: createPaymentIntentSchema, tags: ['Payments'], description: 'Create Stripe payment intent', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
      // Payment-processor outage matrix (issue #84): queue <$500, block >=$500.
      preHandler: [createIntentDegradeGuard],
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const result = await paymentsService.createPaymentIntent(request.user.sub, request.body);
      return reply.status(201).send({ success: true, data: result });
    },
  );

  // POST /refund — refund a transaction payment
  typedApp.post(
    '/refund',
    {
      schema: { body: refundPaymentSchema, tags: ['Payments'], description: 'Refund a payment', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
      // Refunds are paused during a payment-processor outage (issue #84).
      preHandler: [refundDegradeGuard],
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const result = await paymentsService.processRefund(request.user.sub, request.body);
      return reply.send({ success: true, data: result });
    },
  );

  // POST /seller/onboard — start Stripe Connect onboarding
  typedApp.post(
    '/seller/onboard',
    {
      schema: { tags: ['Payments'], description: 'Start Stripe Connect seller onboarding', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
      config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
    },
    async (request, reply) => {
      const result = await paymentsService.startSellerOnboarding(request.user.sub);
      return reply.send({ success: true, data: result });
    },
  );

  // GET /seller/status — check seller's Stripe account status
  typedApp.get(
    '/seller/status',
    {
      schema: { tags: ['Payments'], description: 'Check seller Stripe account status', security: [{ bearerAuth: [] }] },
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await paymentsService.getSellerStripeStatus(request.user.sub);
      return reply.send({ success: true, data: result });
    },
  );
};

export default paymentsRoutes;
