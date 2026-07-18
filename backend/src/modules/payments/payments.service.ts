import type Stripe from 'stripe';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { getStripe } from '../../config/stripe.js';
import { env } from '../../config/env.js';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../../common/utils/errors.js';
import type { CreatePaymentIntentInput, RefundPaymentInput } from './payments.schemas.js';

export class PaymentsService {
  // ── Create Payment Intent ─────────────────────────────────────

  async createPaymentIntent(userId: string, input: CreatePaymentIntentInput) {
    const tx = await prisma.transaction.findFirst({
      where: { id: input.transactionId, deletedAt: null },
    });
    if (!tx) throw new NotFoundError('Transaction', input.transactionId);
    if (tx.buyerId !== userId) throw new ForbiddenError('Only the buyer can create a payment intent');

    if (tx.transactionType === 'product_local_cash') {
      throw new ConflictError('Cash transactions do not require online payment');
    }
    if (tx.stripePaymentIntentId) {
      throw new ConflictError('Payment intent already exists for this transaction');
    }

    // Verify seller has completed Stripe onboarding (skip in dev/test)
    if (env.NODE_ENV === 'production') {
      const seller = await prisma.sellerProfile.findUnique({
        where: { id: tx.sellerId },
      });
      if (!seller?.stripeAccountId || !seller.stripeChargesEnabled) {
        throw new ConflictError('Seller has not completed Stripe onboarding');
      }
    }

    const totalChargedCents = Math.round(Number(tx.totalCharged) * 100);
    const stripe = getStripe();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalChargedCents,
      currency: tx.currency.toLowerCase(),
      // TODO: When adding redirect-based payment methods (Klarna, CashApp, Affirm, etc.),
      // change allow_redirects to 'always' and provide a return_url at confirmation time.
      // See: https://docs.stripe.com/payments/payment-methods/integration-options
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      transfer_group: tx.id,
      metadata: {
        transactionId: tx.id,
        postId: tx.postId,
        buyerId: tx.buyerId,
        sellerId: tx.sellerId,
      },
    }, {
      idempotencyKey: `pi_create_${input.transactionId}`,
    });

    await prisma.transaction.update({
      where: { id: tx.id },
      data: { stripePaymentIntentId: paymentIntent.id },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  // ── Process Refund ────────────────────────────────────────────

  async processRefund(userId: string, input: RefundPaymentInput) {
    const tx = await prisma.transaction.findFirst({
      where: { id: input.transactionId, deletedAt: null },
    });
    if (!tx) throw new NotFoundError('Transaction', input.transactionId);
    if (tx.buyerId !== userId) throw new ForbiddenError('Only the buyer can request a refund');
    if (!tx.stripePaymentIntentId) throw new ConflictError('No payment to refund');
    if (tx.escrowStatus !== 'held') throw new ConflictError('Escrow is not in held status');

    // SEC-M1 (#261): atomically claim the escrow BEFORE refunding the buyer. Mutually exclusive
    // with release — if a concurrent approve/auto-release already flipped 'held'→'released' this
    // matches 0 rows and we reject, rather than refunding a buyer whose seller was just paid
    // (double-spend). Whichever path flips out of 'held' first wins.
    const claimed = await prisma.transaction.updateMany({
      where: { id: tx.id, escrowStatus: 'held' },
      data: { escrowStatus: 'refunded' },
    });
    if (claimed.count === 0) throw new ConflictError('Escrow is not in held status');

    const stripe = getStripe();
    let refund: Stripe.Refund;
    try {
      refund = await stripe.refunds.create({
        payment_intent: tx.stripePaymentIntentId,
      }, {
        idempotencyKey: `refund_${input.transactionId}`,
      });
    } catch (err) {
      // Roll the claim back so the buyer can retry. We still own the 'refunded' state, so no
      // concurrent release could have slipped in between the claim and this rollback.
      await prisma.transaction.updateMany({
        where: { id: tx.id, escrowStatus: 'refunded' },
        data: { escrowStatus: 'held' },
      });
      throw err;
    }

    const updated = await prisma.transaction.update({
      where: { id: tx.id },
      data: {
        stripeRefundId: refund.id,
        refundAmount: tx.totalCharged,
        refundedAt: new Date(),
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy: 'buyer',
        cancellationReason: input.reason ?? 'Buyer requested refund',
      },
    });

    return {
      id: updated.id,
      escrowStatus: updated.escrowStatus,
      stripeRefundId: refund.id,
      refundAmount: Number(updated.refundAmount),
    };
  }

  // ── Release Escrow (internal) ─────────────────────────────────

  /**
   * Release escrow funds to the seller.
   *
   * Returns `true` when the escrow is released (now, or already was) and `false`
   * when it could NOT be released because a concurrent refund/cancel already
   * returned the funds to the buyer (escrowStatus `refunded`/`frozen`) or the
   * charge was never captured. Callers MUST NOT mark the transaction completed
   * when this returns `false`.
   */
  async releaseEscrow(transactionId: string, reason: string = 'buyer_approved'): Promise<boolean> {
    const tx = await prisma.transaction.findFirst({
      where: { id: transactionId, deletedAt: null },
    });
    if (!tx) throw new NotFoundError('Transaction', transactionId);
    if (!tx.stripePaymentIntentId) return true; // no payment to release (e.g. local cash)
    // SEC-C1 (#255): the PaymentIntent id is persisted at intent-CREATION, before the buyer
    // pays. `stripeChargeId` is written ONLY by the signature-verified `payment_intent.succeeded`
    // handler, so it is the one true proof that funds were actually captured into escrow. Never
    // transfer to the seller from the platform balance for a charge that never succeeded.
    if (!tx.stripeChargeId) return false;
    // Idempotency: the payout record is the source of truth for "transfer already happened".
    const existingPayout = await prisma.payout.findFirst({ where: { transactionId: tx.id } });
    if (existingPayout) return true;

    // SEC-M1 (#261): atomically claim the escrow BEFORE moving any money. A concurrent
    // refund/cancel flips escrowStatus 'held'→'refunded'; this compare-and-swap then matches
    // 0 rows and we never pay the seller for funds already returned to the buyer. Refund and
    // release are thus mutually exclusive — whichever flips out of 'held' first wins.
    // `released` stays in the match set so that a retry of a transfer that failed *after* the
    // CAS but *before* the payout record was written can still complete (the payout check
    // above is the dedupe). A `refunded` or `frozen` escrow is never in the set, so the seller
    // can never be paid once the buyer has been refunded or a dispute has frozen the funds.
    const claimed = await prisma.transaction.updateMany({
      where: { id: tx.id, escrowStatus: { in: ['held', 'released'] } },
      data: {
        escrowStatus: 'released',
        escrowReleasedAt: new Date(),
        releaseReason: reason,
      },
    });
    if (claimed.count === 0) return false; // refunded or frozen — never transfer to seller

    const seller = await prisma.sellerProfile.findUnique({
      where: { id: tx.sellerId },
    });
    if (!seller?.stripeAccountId) return true; // escrow released; payout pending manual reconciliation

    const sellerPayoutCents = Math.round(Number(tx.sellerPayoutAmount) * 100);
    const stripe = getStripe();

    const transfer = await stripe.transfers.create({
      amount: sellerPayoutCents,
      currency: tx.currency.toLowerCase(),
      destination: seller.stripeAccountId,
      transfer_group: tx.id,
      metadata: { transactionId: tx.id },
    }, {
      idempotencyKey: `transfer_${transactionId}`,
    });

    // Create Payout record to track seller earnings
    try {
      await prisma.payout.create({
        data: {
          transactionId: tx.id,
          sellerId: tx.sellerId,
          grossAmount: tx.quoteAmount!,
          platformFee: tx.platformFee ?? 0,
          platformFeePercentage: tx.platformFeePercentage ?? 0,
          netPayout: tx.sellerPayoutAmount!,
          currency: tx.currency,
          stripeTransferId: transfer.id,
          status: 'pending',
        },
      });
    } catch (err) {
      // Don't fail the release — report and log for reconciliation
      console.error('Failed to create payout record:', { transactionId: tx.id, sellerId: tx.sellerId, transferId: transfer.id, error: err });
      try {
        const { captureException } = await import('../../config/sentry.js');
        captureException(err, { context: 'payout_creation', transactionId: tx.id, sellerId: tx.sellerId, transferId: transfer.id });
      } catch {
        // Sentry unavailable — already logged above
      }
    }

    return true;
  }

  // ── Refund via Stripe (internal, used by transactions service) ─

  // SEC-M1 (#261): this is the Stripe-side helper only. The escrow state transition
  // ('held'→'refunded') is claimed atomically by the caller (`cancelTransaction`) via a
  // compare-and-swap BEFORE this runs, so there is no `escrowStatus` precondition here — gating
  // on a stale `escrowStatus === 'held'` read would short-circuit the refund after the caller
  // already flipped the row to 'refunded'. The Stripe idempotency key dedupes double-calls.
  async refundPaymentIntent(transactionId: string) {
    const tx = await prisma.transaction.findFirst({
      where: { id: transactionId, deletedAt: null },
    });
    if (!tx) return;
    if (!tx.stripePaymentIntentId) return;

    const stripe = getStripe();
    const refund = await stripe.refunds.create({
      payment_intent: tx.stripePaymentIntentId,
    }, {
      idempotencyKey: `refund_cancel_${transactionId}`,
    });

    await prisma.transaction.update({
      where: { id: tx.id },
      data: {
        stripeRefundId: refund.id,
        refundAmount: tx.totalCharged,
        refundedAt: new Date(),
      },
    });
  }

  // ── Refund via Stripe (admin dispute resolution) ──────────────

  /**
   * Refund the buyer as the outcome of an admin dispute resolution (SEC-H1 #256).
   *
   * Full refund when `amount` is omitted; partial when a positive dollar amount is given.
   * Like every money-moving path this is:
   *  - gated on a captured charge — `stripeChargeId` is written ONLY by the signature-verified
   *    `payment_intent.succeeded` handler, so it is the one true proof funds were collected
   *    (SEC-C1 #255). We never refund the platform balance for a charge that never succeeded.
   *  - mutually exclusive with the seller release — an atomic compare-and-swap claims
   *    escrowStatus 'held'→'refunded' before any Stripe call, so a refund and a release can
   *    never both fire on the same escrow (SEC-M1 #261).
   *  - idempotency-keyed per dispute (`dispute_refund_${disputeId}`) so a retried resolution
   *    never issues a second Stripe refund.
   *
   * Returns a status describing what happened so the caller can decide whether to surface a
   * conflict to the admin:
   *  - `refunded`   — money was returned to the buyer.
   *  - `no_payment` — transaction has no online payment (e.g. local cash); nothing to refund.
   *  - `no_charge`  — a PaymentIntent exists but no charge was ever captured; nothing to refund.
   *  - `conflict`   — escrow was already released to the seller, already refunded, or frozen.
   */
  async refundForDispute(
    disputeId: string,
    transactionId: string,
    amount?: number,
  ): Promise<{ status: 'refunded' | 'no_payment' | 'no_charge' | 'conflict'; stripeRefundId?: string; refundAmount?: number }> {
    const tx = await prisma.transaction.findFirst({
      where: { id: transactionId, deletedAt: null },
    });
    if (!tx) throw new NotFoundError('Transaction', transactionId);
    if (!tx.stripePaymentIntentId) return { status: 'no_payment' };
    if (!tx.stripeChargeId) return { status: 'no_charge' };

    const isPartial = typeof amount === 'number' && amount > 0;

    // SEC-M1 (#261): claim the escrow atomically BEFORE refunding. If a concurrent
    // approve/auto-release already flipped 'held'→'released' (or it was refunded/frozen) this
    // matches 0 rows and we report a conflict instead of double-moving the money.
    const claimed = await prisma.transaction.updateMany({
      where: { id: tx.id, escrowStatus: 'held' },
      data: { escrowStatus: 'refunded' },
    });
    if (claimed.count === 0) return { status: 'conflict' };

    const stripe = getStripe();
    let refund: Stripe.Refund;
    try {
      refund = await stripe.refunds.create({
        payment_intent: tx.stripePaymentIntentId,
        ...(isPartial ? { amount: Math.round(amount * 100) } : {}),
      }, {
        idempotencyKey: `dispute_refund_${disputeId}`,
      });
    } catch (err) {
      // Roll the claim back so the resolution can be retried. We still own the 'refunded' state,
      // so no concurrent release could have slipped in between the claim and this rollback.
      await prisma.transaction.updateMany({
        where: { id: tx.id, escrowStatus: 'refunded' },
        data: { escrowStatus: 'held' },
      });
      throw err;
    }

    const refundedDollars = isPartial ? amount : Number(tx.totalCharged);
    await prisma.transaction.update({
      where: { id: tx.id },
      data: {
        stripeRefundId: refund.id,
        refundAmount: refundedDollars,
        refundedAt: new Date(),
        // A full refund cancels the transaction; a partial leaves it in 'disputed' (the seller's
        // share of the escrow, if any, is reconciled manually — see admin.service.ts).
        ...(isPartial
          ? { status: 'disputed' as const }
          : {
              status: 'cancelled' as const,
              cancelledAt: new Date(),
              cancelledBy: 'admin' as const,
              cancellationReason: 'Dispute resolved: full refund',
            }),
      },
    });

    return { status: 'refunded', stripeRefundId: refund.id, refundAmount: refundedDollars };
  }

  // ── Seller Onboarding ─────────────────────────────────────────

  async startSellerOnboarding(userId: string) {
    const seller = await prisma.sellerProfile.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!seller) throw new NotFoundError('Seller profile');

    const stripe = getStripe();
    let accountId = seller.stripeAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'standard',
        metadata: { sellerId: seller.id, userId },
      }, {
        idempotencyKey: `acct_create_${seller.id}`,
      });
      accountId = account.id;

      await prisma.sellerProfile.update({
        where: { id: seller.id },
        data: { stripeAccountId: accountId },
      });
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: env.STRIPE_CONNECT_REFRESH_URL ?? `${env.FRONTEND_URL}/seller/stripe/refresh`,
      return_url: env.STRIPE_CONNECT_RETURN_URL ?? `${env.FRONTEND_URL}/seller/stripe/complete`,
      type: 'account_onboarding',
    });

    return { url: accountLink.url, accountId };
  }

  // ── Seller Stripe Status ──────────────────────────────────────

  async getSellerStripeStatus(userId: string) {
    const seller = await prisma.sellerProfile.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!seller) throw new NotFoundError('Seller profile');

    if (!seller.stripeAccountId) {
      return {
        onboarded: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        accountId: null,
      };
    }

    return {
      onboarded: true,
      chargesEnabled: seller.stripeChargesEnabled,
      payoutsEnabled: seller.stripePayoutsEnabled,
      accountId: seller.stripeAccountId,
    };
  }

  // ── Webhook Event Handler ─────────────────────────────────────

  async handleWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'account.updated':
        await this.handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      case 'identity.verification_session.verified':
        await this.handleIdentitySessionVerified(
          event.data.object as Stripe.Identity.VerificationSession,
        );
        break;

      case 'identity.verification_session.requires_input':
        await this.handleIdentitySessionRequiresInput(
          event.data.object as Stripe.Identity.VerificationSession,
        );
        break;

      default:
        // Handle transfer/payout events not in the base type enum
        await this.handleExtendedEvent(event);
        break;
    }
  }

  /**
   * Phase 3 plan 06: handle Stripe Identity hosted-flow webhook.
   * On verified, atomically create a VerificationRequest row with type='id'/status='approved'
   * and flip sellerProfile.idVerified to true. Reuses STRIPE_WEBHOOK_SECRET (Pitfall 2).
   */
  private async handleIdentitySessionVerified(
    session: Stripe.Identity.VerificationSession,
  ): Promise<void> {
    const sellerProfileId = session.metadata?.sellerProfileId;
    if (!sellerProfileId) return; // metadata missing — nothing to update

    const profile = await prisma.sellerProfile.findFirst({
      where: { id: sellerProfileId, deletedAt: null },
      select: { id: true, userId: true },
    });
    if (!profile) return;

    await prisma.$transaction([
      prisma.verificationRequest.create({
        data: {
          sellerId: profile.id,
          verificationType: 'id',
          tier: 1,
          status: 'approved',
          documents: [{ stripeIdentitySessionId: session.id }] as Prisma.InputJsonValue,
          reviewedAt: new Date(),
        },
      }),
      prisma.sellerProfile.update({
        where: { id: profile.id },
        data: { idVerified: true },
      }),
    ]);
  }

  private async handleIdentitySessionRequiresInput(
    session: Stripe.Identity.VerificationSession,
  ): Promise<void> {
    const sellerProfileId = session.metadata?.sellerProfileId;
    if (!sellerProfileId) return;

    const profile = await prisma.sellerProfile.findFirst({
      where: { id: sellerProfileId, deletedAt: null },
      select: { id: true },
    });
    if (!profile) return;

    await prisma.verificationRequest.create({
      data: {
        sellerId: profile.id,
        verificationType: 'id',
        tier: 1,
        status: 'rejected',
        documents: [{ stripeIdentitySessionId: session.id }] as Prisma.InputJsonValue,
        reviewedAt: new Date(),
        rejectionReason: session.last_error?.reason ?? 'Identity verification failed',
      },
    });
  }

  private async handleExtendedEvent(event: Stripe.Event) {
    const eventType = event.type as string;
    switch (eventType) {
      case 'transfer.paid':
        await this.handleTransferPaid(event.data.object as unknown as Stripe.Transfer);
        break;
      case 'transfer.failed':
        await this.handleTransferFailed(event.data.object as unknown as Stripe.Transfer);
        break;
      case 'payout.paid':
        await this.handlePayoutPaid(event.data.object as unknown as Stripe.Payout, event.account);
        break;
      case 'payout.failed':
        await this.handlePayoutFailed(event.data.object as unknown as Stripe.Payout, event.account);
        break;
    }
  }

  // ── Webhook Handlers (private) ────────────────────────────────

  private async handlePaymentIntentSucceeded(pi: Stripe.PaymentIntent) {
    const transactionId = pi.metadata?.transactionId;
    if (!transactionId) return;

    const charge = pi.latest_charge;
    let chargeId: string | undefined;
    let last4: string | undefined;
    let brand: string | undefined;

    if (typeof charge === 'string') {
      chargeId = charge;
    } else if (charge && typeof charge === 'object' && 'id' in charge) {
      chargeId = charge.id;
      const pm = (charge as Stripe.Charge).payment_method_details;
      if (pm?.card) {
        last4 = pm.card.last4 ?? undefined;
        brand = pm.card.brand ?? undefined;
      }
    }

    await prisma.transaction.updateMany({
      where: { id: transactionId, stripePaymentIntentId: pi.id },
      data: {
        escrowStatus: 'held',
        ...(chargeId && { stripeChargeId: chargeId }),
        ...(last4 && { paymentMethodLast4: last4 }),
        ...(brand && { paymentMethodBrand: brand }),
      },
    });
  }

  private async handlePaymentIntentFailed(pi: Stripe.PaymentIntent) {
    const transactionId = pi.metadata?.transactionId;
    if (!transactionId) return;

    const tx = await prisma.transaction.findFirst({
      where: { id: transactionId, stripePaymentIntentId: pi.id },
    });
    if (!tx) return;

    const timeline = Array.isArray(tx.timeline) ? [...tx.timeline] : [];
    timeline.push({
      event: 'payment_failed',
      timestamp: new Date().toISOString(),
      actorId: 'system',
      note: pi.last_payment_error?.message ?? 'Payment failed',
    });

    await prisma.transaction.update({
      where: { id: tx.id },
      data: { timeline: timeline as unknown as Prisma.InputJsonValue },
    });
  }

  private async handleChargeRefunded(charge: Stripe.Charge) {
    const piId = typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id;
    if (!piId) return;

    await prisma.transaction.updateMany({
      where: { stripePaymentIntentId: piId },
      data: {
        escrowStatus: 'refunded',
        refundedAt: new Date(),
      },
    });
  }

  private async handleAccountUpdated(account: Stripe.Account) {
    if (!account.id) return;

    await prisma.sellerProfile.updateMany({
      where: { stripeAccountId: account.id },
      data: {
        stripeChargesEnabled: account.charges_enabled ?? false,
        stripePayoutsEnabled: account.payouts_enabled ?? false,
      },
    });
  }

  // ── Transfer/Payout Webhook Handlers ─────────────────────────

  private async handleTransferPaid(transfer: Stripe.Transfer) {
    if (!transfer.id) return;

    await prisma.payout.updateMany({
      where: { stripeTransferId: transfer.id, status: 'pending' },
      data: { status: 'in_transit' },
    });
  }

  private async handleTransferFailed(transfer: Stripe.Transfer) {
    if (!transfer.id) return;

    const failureMessage = (transfer as any).failure_message ?? 'Transfer failed';
    await prisma.payout.updateMany({
      where: { stripeTransferId: transfer.id, status: 'pending' },
      data: {
        status: 'failed',
        failedAt: new Date(),
        failureReason: failureMessage,
      },
    });
  }

  /**
   * SEC-M7 (#267): deterministically map a connected-account-level Stripe payout to
   * the specific Payout record(s) it settles.
   *
   * We use separate charges and transfers, so each escrow release creates a platform
   * `Transfer` (stored as `Payout.stripeTransferId`). On the connected account that
   * transfer lands as a charge whose `source_transfer` points back to our transfer id.
   * A bank `payout.paid`/`failed` event carries only the connected-account payout id, so
   * we list the balance transactions that payout settles, expand their `source`, and read
   * each `source_transfer` to recover the exact set of platform transfer ids in this bank
   * deposit. A single payout can bundle several transfers, so this returns ALL of them —
   * the previous "oldest in_transit" heuristic mislabeled records under concurrent payouts.
   */
  private async resolvePayoutTransferIds(
    payoutId: string,
    connectedAccountId: string,
  ): Promise<string[]> {
    const stripe = getStripe();
    const transferIds = new Set<string>();
    let startingAfter: string | undefined;

    do {
      const page: Stripe.ApiList<Stripe.BalanceTransaction> =
        await stripe.balanceTransactions.list(
          {
            payout: payoutId,
            limit: 100,
            expand: ['data.source'],
            ...(startingAfter ? { starting_after: startingAfter } : {}),
          },
          { stripeAccount: connectedAccountId },
        );

      for (const txn of page.data) {
        const source = txn.source as { source_transfer?: string | { id?: string } } | null;
        const sourceTransfer = source?.source_transfer;
        const transferId =
          typeof sourceTransfer === 'string' ? sourceTransfer : sourceTransfer?.id;
        if (transferId) transferIds.add(transferId);
      }

      startingAfter = page.has_more ? page.data[page.data.length - 1]?.id : undefined;
    } while (startingAfter);

    return [...transferIds];
  }

  private async handlePayoutPaid(payout: Stripe.Payout, connectedAccountId?: string) {
    if (!connectedAccountId || !payout.id) return;

    // Idempotency (SEC-M7 #257): if this Stripe payout was already recorded, do nothing.
    // The `status: 'in_transit'` guard in the updateMany below is the second line of
    // defense, but short-circuiting here avoids a redundant balance-transaction lookup.
    const existing = await prisma.payout.findFirst({
      where: { stripePayoutId: payout.id },
    });
    if (existing) return;

    // SEC-M7 (#267): resolve the exact transfer ids this payout settles and key the
    // update on them — never the "oldest in_transit" record.
    const transferIds = await this.resolvePayoutTransferIds(payout.id, connectedAccountId);
    if (transferIds.length === 0) return;

    await prisma.payout.updateMany({
      where: { stripeTransferId: { in: transferIds }, status: 'in_transit' },
      data: {
        status: 'paid',
        paidAt: new Date(),
        stripePayoutId: payout.id,
        bankAccountLast4: (payout.destination as any)?.last4 ?? null,
        bankName: (payout.destination as any)?.bank_name ?? null,
      },
    });
  }

  private async handlePayoutFailed(payout: Stripe.Payout, connectedAccountId?: string) {
    if (!connectedAccountId || !payout.id) return;

    // Idempotency (SEC-M7 #257): skip if this Stripe payout was already recorded.
    const existing = await prisma.payout.findFirst({
      where: { stripePayoutId: payout.id },
    });
    if (existing) return;

    // SEC-M7 (#267): correlate to the exact transfer(s) this payout covers.
    const transferIds = await this.resolvePayoutTransferIds(payout.id, connectedAccountId);
    if (transferIds.length === 0) return;

    await prisma.payout.updateMany({
      where: { stripeTransferId: { in: transferIds }, status: 'in_transit' },
      data: {
        status: 'failed',
        failedAt: new Date(),
        failureReason: payout.failure_message ?? 'Payout failed',
        stripePayoutId: payout.id,
      },
    });
  }
}
