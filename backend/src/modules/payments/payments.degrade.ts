import type { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { isHighValueTransaction } from '../../common/utils/fees.js';
import { ServiceUnavailableError } from '../../common/utils/errors.js';
import { findMissingModelAccessors } from '../../common/utils/prisma-drift.js';
import type { CreatePaymentIntentInput } from './payments.schemas.js';

/**
 * Payment-processor outage behavior (RUNBOOK_OPS.md §2 / issue #84).
 *
 * When `STRIPE_DEGRADED=true`, payment endpoints honor the locked behavior
 * matrix instead of calling the payment processor:
 *
 *  | Transaction type           | Behavior                                      |
 *  |----------------------------|-----------------------------------------------|
 *  | Local cash                 | Unaffected (no processor involvement)         |
 *  | Standard (< $500)          | Offer saved; payment-intent queued for retry  |
 *  | High-value (>= $500)       | Blocked — 503, user told to retry later       |
 *  | In-flight escrow           | Unaffected (funds already held)               |
 *
 * User-facing wording rule: never say "Stripe" — always "our payment processor".
 */

// ── Locked §2 user-facing copy ──────────────────────────────────────────────
// These strings are the source of truth the Flutter banner mirrors. Do NOT
// introduce the word "Stripe" here — a CI grep check enforces this.

/** Standard (< $500) — offer saved, payment queued. Returned with HTTP 202. */
export const PAYMENT_QUEUED_MESSAGE =
  'Our payment processor is currently unavailable. Your offer is saved — ' +
  "we'll process your payment once our payment processor is back online.";

/** High-value (>= $500) — acceptance blocked. Returned with HTTP 503. */
export const PAYMENT_BLOCKED_MESSAGE =
  "We're currently experiencing an outage with our payment processor. " +
  'High-value transactions are paused. Please try again shortly or contact support.';

/** Refunds are paused entirely during an outage. Returned with HTTP 503. */
export const REFUND_BLOCKED_MESSAGE =
  'Our payment processor is temporarily unavailable, so refunds cannot be ' +
  'processed right now. Please try again shortly.';

// Stable RFC 7807 `type` URNs so clients can branch on the degrade case without
// string-matching the human-readable copy.
export const DEGRADE_BLOCKED_TYPE = 'urn:sorcyn:payments:processor-degraded-blocked';
export const DEGRADE_REFUND_TYPE = 'urn:sorcyn:payments:processor-degraded-refund';

/**
 * preHandler for `POST /payments/create-intent`. No-op when the flag is off.
 * When degraded, applies the matrix: high-value → 503; sub-threshold → queue +
 * short-circuit with 202; local cash / already-paid → fall through to the
 * normal handler (which behaves exactly as it does outside an outage).
 */
export async function createIntentDegradeGuard(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!env.STRIPE_DEGRADED) return;

  const { transactionId } = request.body as CreatePaymentIntentInput;
  const tx = await prisma.transaction.findFirst({
    where: { id: transactionId, deletedAt: null },
    select: {
      id: true,
      buyerId: true,
      totalCharged: true,
      currency: true,
      transactionType: true,
      stripePaymentIntentId: true,
    },
  });

  // Unknown tx or already-paid (in-flight escrow): let the normal handler run so
  // its 404 / 409 responses stay identical to non-degraded behavior.
  if (!tx) return;
  if (tx.stripePaymentIntentId) return;
  // Local cash never touches the payment processor — fully unaffected.
  if (tx.transactionType === 'product_local_cash') return;
  // Only the buyer may pay; defer that ownership check to the normal handler.
  if (tx.buyerId !== request.user.sub) return;

  const totalCharged = Number(tx.totalCharged ?? 0);

  if (isHighValueTransaction(totalCharged)) {
    throw new ServiceUnavailableError(PAYMENT_BLOCKED_MESSAGE, DEGRADE_BLOCKED_TYPE);
  }

  // Sub-threshold: queue the intent for retry (idempotent on transactionId) and
  // short-circuit. The buyer's card is NOT charged now.
  await prisma.paymentIntentQueue.upsert({
    where: { transactionId: tx.id },
    create: {
      transactionId: tx.id,
      buyerId: tx.buyerId,
      totalCharged: tx.totalCharged ?? 0,
      currency: tx.currency,
      status: 'queued',
    },
    // Re-queue if a prior drain attempt had failed; otherwise leave as-is.
    update: { status: 'queued', lastError: null },
  });

  await reply.status(202).send({
    success: true,
    data: {
      status: 'queued',
      transactionId: tx.id,
      message: PAYMENT_QUEUED_MESSAGE,
    },
  });
}

/**
 * preHandler for `POST /payments/refund`. Refunds are paused for all values
 * during an outage (the processor reconciles once back online).
 */
export async function refundDegradeGuard(): Promise<void> {
  if (!env.STRIPE_DEGRADED) return;
  throw new ServiceUnavailableError(REFUND_BLOCKED_MESSAGE, DEGRADE_REFUND_TYPE);
}

/**
 * Drains the payment-intent backlog once the payment processor recovers.
 * No-ops while `STRIPE_DEGRADED=true` so the queue only flushes when it is safe
 * to call the processor again. Invoked on a schedule by the `stripe-retry`
 * BullMQ worker (and directly by tests). Exported so the drain is testable
 * without spinning up the worker runtime.
 *
 * Rows that succeed are marked `completed`; rows whose transaction already has a
 * payment intent (processed out-of-band) are also `completed`; everything else
 * is marked `failed` with the error for manual follow-up (RUNBOOK_OPS.md §2 recovery).
 */
export async function drainPaymentIntentQueue(
  log: (message: string) => void = () => {},
): Promise<{ drained: number; failed: number }> {
  if (env.STRIPE_DEGRADED) {
    log('STRIPE_DEGRADED still true — skipping payment-intent drain');
    return { drained: 0, failed: 0 };
  }

  // Guard against a stale generated client (issue #159): if `prisma generate`
  // was not run after the payment_intent_queue migration, `paymentIntentQueue`
  // is undefined and `.findMany` below throws a cryptic
  // "Cannot read properties of undefined" on every sweep. Fail loud ONCE with an
  // actionable message instead of a 3x-retry crash-loop that buries real errors.
  if (
    findMissingModelAccessors(prisma as unknown as Record<string, unknown>, ['paymentIntentQueue'])
      .length > 0
  ) {
    log(
      'payment_intent_queue accessor missing — Prisma client is out of sync with ' +
        'schema.prisma. Run `npm run db:generate` and restart. Skipping drain.',
    );
    return { drained: 0, failed: 0 };
  }

  const { PaymentsService } = await import('./payments.service.js');

  const queued = await prisma.paymentIntentQueue.findMany({
    where: { status: 'queued' },
    orderBy: { queuedAt: 'asc' },
    take: 100,
  });

  log(`Found ${queued.length} queued payment intents to drain`);

  const paymentsService = new PaymentsService();
  let drained = 0;
  let failed = 0;

  for (const row of queued) {
    try {
      await prisma.paymentIntentQueue.update({
        where: { id: row.id },
        data: { status: 'processing', attempts: { increment: 1 } },
      });

      await paymentsService.createPaymentIntent(row.buyerId, {
        transactionId: row.transactionId,
      });

      await prisma.paymentIntentQueue.update({
        where: { id: row.id },
        data: { status: 'completed', processedAt: new Date(), lastError: null },
      });
      drained += 1;
      log(`Drained queued payment intent for tx ${row.transactionId}`);
    } catch (err) {
      // If the intent already exists (processed out-of-band), treat as done.
      const tx = await prisma.transaction.findUnique({
        where: { id: row.transactionId },
        select: { stripePaymentIntentId: true },
      });
      const alreadyPaid = Boolean(tx?.stripePaymentIntentId);

      await prisma.paymentIntentQueue.update({
        where: { id: row.id },
        data: alreadyPaid
          ? { status: 'completed', processedAt: new Date(), lastError: null }
          : { status: 'failed', lastError: (err as Error).message },
      });

      if (alreadyPaid) {
        drained += 1;
      } else {
        failed += 1;
        const { captureException } = await import('../../config/sentry.js');
        captureException(err, { worker: 'stripe-retry', transactionId: row.transactionId });
        log(`FAILED to drain tx ${row.transactionId}: ${(err as Error).message}`);
      }
    }
  }

  return { drained, failed };
}
