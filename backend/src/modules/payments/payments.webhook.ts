import type { FastifyPluginAsync } from 'fastify';
import { verifyWebhookSignature } from '../../config/stripe.js';
import { prisma } from '../../config/database.js';
import { PaymentsService } from './payments.service.js';

const webhookRoute: FastifyPluginAsync = async (app) => {
  const paymentsService = new PaymentsService();

  // Override content type parser to preserve raw body for signature verification.
  // Must remove inherited parser first (parent registers a custom JSON parser).
  app.removeContentTypeParser('application/json');
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    (_req, body, done) => {
      done(null, body);
    },
  );

  // POST /webhook — Stripe webhook (no auth, signature-verified)
  // Disable rate limiting — Stripe retries on 429 and we don't want to drop events
  app.post('/webhook', { config: { rateLimit: false } }, async (request, reply) => {
    const signature = request.headers['stripe-signature'] as string;
    if (!signature) {
      return reply.status(400).send({
        success: false,
        error: { detail: 'Missing stripe-signature header' },
      });
    }

    let event;
    try {
      event = verifyWebhookSignature(request.body as Buffer, signature);
    } catch {
      request.log.error('Webhook signature verification failed');
      return reply.status(400).send({
        success: false,
        error: { detail: 'Invalid webhook signature' },
      });
    }

    // Deduplicate against a durable DB ledger (SEC-H2 #257). The prior Redis
    // SETNX was best-effort (lost on Redis restart) and marked events processed
    // BEFORE handling, so a handler failure silently dropped Stripe's retry.
    const alreadyProcessed = await prisma.processedWebhookEvent.findUnique({
      where: { eventId: event.id },
    });
    if (alreadyProcessed) {
      return reply.status(200).send({ received: true });
    }

    // Process FIRST, record AFTER. If the handler throws we return a non-2xx so
    // Stripe retries; handlers are internally idempotent so re-running is safe.
    try {
      await paymentsService.handleWebhookEvent(event);
    } catch (err) {
      request.log.error(
        { err, eventId: event.id, eventType: event.type },
        'Webhook handler failed — returning 500 so Stripe retries',
      );
      return reply.status(500).send({
        success: false,
        error: { detail: 'Webhook processing failed' },
      });
    }

    // Mark as processed only on success. A unique-violation here means a
    // concurrent delivery of the same event already recorded it — safe to ignore.
    try {
      await prisma.processedWebhookEvent.create({
        data: { eventId: event.id, eventType: event.type },
      });
    } catch (err) {
      request.log.warn(
        { err, eventId: event.id },
        'Could not record processed webhook event (likely concurrent duplicate)',
      );
    }

    return reply.status(200).send({ received: true });
  });
};

export default webhookRoute;
