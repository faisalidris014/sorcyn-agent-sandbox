import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../../common/utils/errors.js';
import { ReviewsService } from '../reviews/reviews.service.js';
import type {
  UpdateTransactionStatusInput,
  MarkCompleteInput,
  ApproveTransactionInput,
  RequestChangesInput,
  CancelTransactionInput,
  ListMyTransactionsQuery,
} from './transactions.schemas.js';
import type { PaginationMeta } from '../../common/types/api.js';
import { PaymentsService } from '../payments/payments.service.js';

// Valid status transitions per transaction type
const SERVICE_STATUSES = ['scheduled', 'on_the_way', 'started', 'awaiting_approval'];
const SHIPPED_STATUSES = ['preparing_shipment', 'shipped', 'in_transit'];
const MEETUP_STATUSES = ['pending_meetup', 'meetup_scheduled'];
const FINALIZED_STATUSES = ['completed', 'cancelled', 'disputed'];
const MAX_CHANGE_REQUESTS = 2;

interface TimelineEntry {
  event: string;
  timestamp: string;
  actorId: string;
  note: string | null;
}

// Seller fields surfaced on transaction responses. Mirrors the offers endpoint's
// seller shape (shared `SellerSummary` mobile model) and adds `userId`, which the
// mobile model requires non-null — without it `SellerSummary.fromJson` throws and
// both transaction-detail screens render an error instead of content (#289).
const SELLER_SUMMARY_SELECT = {
  id: true,
  userId: true,
  businessName: true,
  rating: true,
  totalReviews: true,
  totalCompleted: true,
  verificationBadges: true,
  ratingBadge: true,
  user: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.SellerProfileSelect;

export class TransactionsService {
  // ── Get My Transactions ───────────────────────────────────────

  async getMyTransactions(userId: string, query: ListMyTransactionsQuery) {
    let where: Prisma.TransactionWhereInput;

    if (query.role === 'seller') {
      const seller = await this.getSellerProfile(userId);
      where = { sellerId: seller.id, deletedAt: null };
    } else {
      where = { buyerId: userId, deletedAt: null };
    }

    if (query.status) where.status = query.status;

    const orderBy: Prisma.TransactionOrderByWithRelationInput =
      query.sort === 'oldest'
        ? { createdAt: 'asc' }
        : { createdAt: 'desc' };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          post: { select: { id: true, title: true, categoryId: true } },
          offer: { select: { id: true, offerType: true, message: true } },
          buyer: { select: { id: true, firstName: true, lastName: true } },
          seller: { select: SELLER_SUMMARY_SELECT },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    const meta: PaginationMeta = {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    };

    return {
      transactions: transactions.map((tx) => this.toTransactionResponse(tx)),
      meta,
    };
  }

  // ── Get Transaction by ID ─────────────────────────────────────

  async getTransactionById(userId: string, transactionId: string) {
    const tx = await prisma.transaction.findFirst({
      where: { id: transactionId, deletedAt: null },
      include: {
        post: { select: { id: true, title: true, categoryId: true, locationCity: true, locationState: true } },
        offer: { select: { id: true, offerType: true, message: true, quoteAmount: true } },
        buyer: { select: { id: true, firstName: true, lastName: true, email: true } },
        seller: { select: SELLER_SUMMARY_SELECT },
      },
    });
    if (!tx) throw new NotFoundError('Transaction', transactionId);

    // Access: buyer or seller
    const sellerProfile = await prisma.sellerProfile.findFirst({
      where: { userId, deletedAt: null },
    });
    const isBuyer = tx.buyerId === userId;
    const isSeller = sellerProfile && sellerProfile.id === tx.sellerId;
    if (!isBuyer && !isSeller) throw new ForbiddenError('You do not have access to this transaction');

    return this.toTransactionResponse(tx);
  }

  // ── Update Status (Seller) ────────────────────────────────────

  async updateStatus(userId: string, transactionId: string, input: UpdateTransactionStatusInput) {
    const seller = await this.getSellerProfile(userId);

    const tx = await prisma.transaction.findFirst({
      where: { id: transactionId, deletedAt: null },
    });
    if (!tx) throw new NotFoundError('Transaction', transactionId);
    if (tx.sellerId !== seller.id) throw new ForbiddenError('Only the seller can update transaction status');
    if (FINALIZED_STATUSES.includes(tx.status)) throw new ConflictError('Transaction is already finalized');

    // Validate transition for transaction type
    this.validateStatusTransition(tx.transactionType, input.status);

    const data: Prisma.TransactionUpdateInput = {
      status: input.status,
    };

    // Scheduling fields
    if (input.scheduledDate !== undefined) data.scheduledDate = new Date(input.scheduledDate);
    if (input.scheduledTime !== undefined) data.scheduledTime = input.scheduledTime;
    if (input.specialInstructions !== undefined) data.specialInstructions = input.specialInstructions;

    // Shipping fields
    if (input.trackingNumber !== undefined) data.trackingNumber = input.trackingNumber;
    if (input.carrier !== undefined) data.carrier = input.carrier;
    if (input.estimatedDeliveryDate !== undefined) data.estimatedDeliveryDate = new Date(input.estimatedDeliveryDate);
    if (input.status === 'shipped') data.shippedAt = new Date();

    // Meetup fields
    if (input.meetupLocation !== undefined) data.meetupLocation = input.meetupLocation;
    if (input.meetupDate !== undefined) data.meetupDate = new Date(input.meetupDate);
    if (input.meetupTime !== undefined) data.meetupTime = input.meetupTime;

    // Timeline
    const timeline = this.addTimelineEvent(
      tx.timeline,
      `status_${input.status}`,
      userId,
      input.note ?? null,
    );
    data.timeline = timeline as unknown as Prisma.InputJsonValue;

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data,
      include: {
        post: { select: { id: true, title: true } },
      },
    });

    return this.toTransactionResponse(updated);
  }

  // ── Mark Complete (Seller) ────────────────────────────────────

  async markComplete(userId: string, transactionId: string, input: MarkCompleteInput) {
    const seller = await this.getSellerProfile(userId);

    const tx = await prisma.transaction.findFirst({
      where: { id: transactionId, deletedAt: null },
    });
    if (!tx) throw new NotFoundError('Transaction', transactionId);
    if (tx.sellerId !== seller.id) throw new ForbiddenError('Only the seller can mark this complete');
    if (FINALIZED_STATUSES.includes(tx.status)) throw new ConflictError('Transaction is already finalized');
    if (tx.status === 'awaiting_approval') throw new ConflictError('Transaction is already awaiting approval');

    const timeline = this.addTimelineEvent(
      tx.timeline,
      'marked_complete',
      userId,
      input.completionNotes ?? null,
    );

    const data: Prisma.TransactionUpdateInput = {
      status: 'awaiting_approval',
      afterPhotos: input.afterPhotos as unknown as Prisma.InputJsonValue,
      // SEC-M8 (#268): beforePhotos is now required by markCompleteSchema (min 1).
      beforePhotos: input.beforePhotos as unknown as Prisma.InputJsonValue,
      workSummary: input.workSummary ?? null,
      completionNotes: input.completionNotes ?? null,
      timeline: timeline as unknown as Prisma.InputJsonValue,
      // Auto-release in 7 days
      autoReleaseAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data,
      include: {
        post: { select: { id: true, title: true } },
      },
    });

    // Notify buyer that work is complete and the 7-day auto-release clock has started
    try {
      const { NotificationsService } = await import('../notifications/notifications.service.js');
      const notifSvc = new NotificationsService();
      await notifSvc.createNotification({
        userId: updated.buyerId,
        type: 'transaction_marked_complete',
        title: 'Work marked complete',
        message: `The seller marked the work on "${updated.post?.title ?? 'your transaction'}" as complete. Review the before/after photos and approve to release payment. Auto-release in 7 days.`,
        data: {
          transactionId: updated.id,
          postId: updated.postId,
          autoReleaseAt: updated.autoReleaseAt?.toISOString() ?? null,
        },
        channels: ['push', 'in_app'],
        actionUrl: `/transactions/${updated.id}`,
      });
    } catch {
      // Non-critical: never fail markComplete on notification errors
    }

    return this.toTransactionResponse(updated);
  }

  // ── Approve & Release (Buyer) ─────────────────────────────────

  async approveAndRelease(userId: string, transactionId: string, input: ApproveTransactionInput) {
    const tx = await prisma.transaction.findFirst({
      where: { id: transactionId, deletedAt: null },
    });
    if (!tx) throw new NotFoundError('Transaction', transactionId);
    if (tx.buyerId !== userId) throw new ForbiddenError('Only the buyer can approve this transaction');
    if (tx.status !== 'awaiting_approval') throw new ConflictError('Transaction is not awaiting approval');
    // SEC-C1 (#255): never optimistically mark a card transaction released/completed unless the
    // charge was actually captured (`stripeChargeId` set by the verified payment webhook).
    // `product_local_cash` settles offline and has no charge.
    if (tx.transactionType !== 'product_local_cash' && !tx.stripeChargeId) {
      throw new ConflictError('Payment has not been captured for this transaction');
    }

    const isCardTransaction =
      !!tx.stripePaymentIntentId && tx.transactionType !== 'product_local_cash';

    // SEC-M1 (#261): release escrow BEFORE marking the transaction completed. releaseEscrow
    // atomically flips escrowStatus 'held'→'released' (the authoritative gate) and then transfers
    // to the seller. If a concurrent refund/cancel already returned the funds to the buyer it
    // returns false; we abort the approval rather than double-spending (buyer refunded AND seller
    // paid). A transient Stripe failure throws *after* the escrow CAS has committed, so we swallow
    // it and still complete — the transfer is retried by the auto-release sweep.
    if (isCardTransaction) {
      let released = true;
      try {
        const paymentsService = new PaymentsService();
        released = await paymentsService.releaseEscrow(transactionId);
      } catch (err) {
        // Log but don't fail the approval — the escrow was already claimed; the transfer retries.
        console.error('Escrow release failed, will need manual retry:', err);
      }
      if (!released) {
        throw new ConflictError(
          'Escrow is no longer held — the transaction may have been refunded or cancelled',
        );
      }
    }

    const timeline = this.addTimelineEvent(
      tx.timeline,
      'approved',
      userId,
      input.note ?? null,
    );

    // For card transactions the escrow fields (escrowStatus/escrowReleasedAt/releaseReason) were
    // already set atomically by releaseEscrow above — do NOT re-write them here (avoids clobbering
    // the authoritative state). Local-cash settles offline and has no Stripe escrow, so mark its
    // notional escrow released here.
    const data: Prisma.TransactionUpdateInput = {
      status: 'completed',
      completedAt: new Date(),
      autoReleaseAt: null,
      timeline: timeline as unknown as Prisma.InputJsonValue,
    };
    if (!isCardTransaction) {
      data.escrowStatus = 'released';
      data.escrowReleasedAt = new Date();
      data.releaseReason = 'buyer_approved';
    }

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data,
      include: {
        post: { select: { id: true, title: true } },
        seller: { select: SELLER_SUMMARY_SELECT },
      },
    });

    // Increment seller's totalCompleted
    await prisma.sellerProfile.update({
      where: { id: updated.sellerId },
      data: { totalCompleted: { increment: 1 } },
    });

    // Lock the conversation now that the transaction is complete — thread stays visible
    // but read-only (#305). Non-blocking: never reverse a completed/released transaction.
    try {
      const { MessagesService } = await import('../messages/messages.service.js');
      await new MessagesService().lockConversationByTransactionId(transactionId);
    } catch (err) {
      console.error('[CONVO LOCK ERROR]', err);
    }

    // Notify seller that escrow has been released (fire-and-forget)
    try {
      const { NotificationsService } = await import('../notifications/notifications.service.js');
      const notifSvc = new NotificationsService();
      await notifSvc.createNotification({
        userId: updated.seller.user.id,
        type: 'transaction_completed',
        title: 'Payment released',
        message: `The buyer approved your work on "${updated.post?.title ?? 'the transaction'}" and released $${Number(updated.sellerPayoutAmount ?? 0).toFixed(2)} from escrow. The payout will appear in your Stripe account shortly.`,
        data: {
          transactionId: updated.id,
          postId: updated.postId,
          escrowReleased: true,
          payoutAmount: Number(updated.sellerPayoutAmount ?? 0),
        },
        channels: ['push', 'in_app', 'email'],
        actionUrl: `/transactions/${updated.id}`,
      });
    } catch {
      // Non-critical: never fail approve on notification errors
    }

    // Schedule review reminders (async, non-blocking)
    const reviewsService = new ReviewsService();
    reviewsService.scheduleReviewReminders(
      updated.id,
      updated.buyerId,
      updated.sellerId,
    ).catch((err) => console.error('[REVIEW REMINDER ERROR]', err));

    return this.toTransactionResponse(updated);
  }

  // ── Request Changes (Buyer) ───────────────────────────────────

  async requestChanges(userId: string, transactionId: string, input: RequestChangesInput) {
    const tx = await prisma.transaction.findFirst({
      where: { id: transactionId, deletedAt: null },
    });
    if (!tx) throw new NotFoundError('Transaction', transactionId);
    if (tx.buyerId !== userId) throw new ForbiddenError('Only the buyer can request changes');
    if (tx.status !== 'awaiting_approval') throw new ConflictError('Transaction is not awaiting approval');

    // Count existing change requests from timeline
    const entries = Array.isArray(tx.timeline) ? tx.timeline as unknown as TimelineEntry[] : [];
    const changesCount = entries.filter((e) => e.event === 'changes_requested').length;
    if (changesCount >= MAX_CHANGE_REQUESTS) {
      throw new ConflictError(`Maximum ${MAX_CHANGE_REQUESTS} change requests allowed per transaction`);
    }

    const timeline = this.addTimelineEvent(
      tx.timeline,
      'changes_requested',
      userId,
      input.reason,
    );

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'changes_requested',
        autoReleaseAt: null, // pause auto-release
        timeline: timeline as unknown as Prisma.InputJsonValue,
      },
      include: {
        post: { select: { id: true, title: true } },
      },
    });

    return this.toTransactionResponse(updated);
  }

  // ── Cancel Transaction ────────────────────────────────────────

  async cancelTransaction(userId: string, transactionId: string, input: CancelTransactionInput) {
    const tx = await prisma.transaction.findFirst({
      where: { id: transactionId, deletedAt: null },
    });
    if (!tx) throw new NotFoundError('Transaction', transactionId);

    // Determine who is cancelling
    let cancelledBy: 'buyer' | 'seller';
    if (tx.buyerId === userId) {
      cancelledBy = 'buyer';
    } else {
      const seller = await prisma.sellerProfile.findFirst({
        where: { userId, deletedAt: null },
      });
      if (seller && seller.id === tx.sellerId) {
        cancelledBy = 'seller';
      } else {
        throw new ForbiddenError('You do not have access to this transaction');
      }
    }

    if (FINALIZED_STATUSES.includes(tx.status)) {
      throw new ConflictError('Cannot cancel a finalized transaction');
    }

    const timeline = this.addTimelineEvent(
      tx.timeline,
      'cancelled',
      userId,
      input.reason,
    );

    const data: Prisma.TransactionUpdateInput = {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelledBy,
      cancellationReason: input.reason,
      autoReleaseAt: null,
      timeline: timeline as unknown as Prisma.InputJsonValue,
    };

    // SEC-M1 (#261): atomically claim the escrow refund. Only one of refund/release may flip out
    // of 'held'. If this compare-and-swap matches a row we own the refund; if it matches 0 the
    // escrow was already released (seller paid) or refunded, so we cancel WITHOUT issuing a
    // (double) refund. This makes cancel-refund and approve-release mutually exclusive.
    const claimed = await prisma.transaction.updateMany({
      where: { id: tx.id, escrowStatus: 'held' },
      data: { escrowStatus: 'refunded' },
    });
    if (claimed.count === 1) {
      data.escrowStatus = 'refunded';
      data.refundedAt = new Date();
      data.refundAmount = tx.totalCharged;

      // Process Stripe refund if payment was collected (escrow already claimed above).
      if (tx.stripePaymentIntentId) {
        try {
          const paymentsService = new PaymentsService();
          await paymentsService.refundPaymentIntent(transactionId);
        } catch (err) {
          console.error('Stripe refund failed, will need manual retry:', err);
        }
      }
    }

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data,
      include: {
        post: { select: { id: true, title: true } },
      },
    });

    return this.toTransactionResponse(updated);
  }

  // ── Private Helpers ───────────────────────────────────────────

  private async getSellerProfile(userId: string) {
    const seller = await prisma.sellerProfile.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!seller) throw new NotFoundError('Seller profile');
    return seller;
  }

  private validateStatusTransition(transactionType: string, newStatus: string) {
    let validStatuses: string[];

    switch (transactionType) {
      case 'service':
      case 'job_milestone':
        validStatuses = SERVICE_STATUSES;
        break;
      case 'product_shipped':
        validStatuses = SHIPPED_STATUSES;
        break;
      case 'product_local_cash':
      case 'product_local_platform':
        validStatuses = MEETUP_STATUSES;
        break;
      default:
        validStatuses = SERVICE_STATUSES;
    }

    if (!validStatuses.includes(newStatus)) {
      throw new ConflictError(
        `Invalid status '${newStatus}' for transaction type '${transactionType}'. Valid: ${validStatuses.join(', ')}`,
      );
    }
  }

  private addTimelineEvent(
    existing: unknown,
    event: string,
    actorId: string,
    note: string | null,
  ): TimelineEntry[] {
    const entries = Array.isArray(existing) ? [...existing] as TimelineEntry[] : [];
    entries.push({
      event,
      timestamp: new Date().toISOString(),
      actorId,
      note,
    });
    return entries;
  }

  private toTransactionResponse(tx: {
    id: string;
    postId: string;
    offerId: string;
    buyerId: string;
    sellerId: string;
    transactionType: string;
    quoteAmount: unknown;
    buyerFee: unknown;
    stripeFee: unknown;
    totalCharged: unknown;
    platformFee: unknown;
    platformFeePercentage: unknown;
    sellerPayoutAmount: unknown;
    shippingCost: unknown;
    currency: string;
    escrowStatus: string;
    escrowReleasedAt: Date | null;
    releaseReason: string | null;
    status: string;
    beforePhotos: unknown;
    progressPhotos: unknown;
    afterPhotos: unknown;
    completionNotes: string | null;
    workSummary: string | null;
    completedAt: Date | null;
    trackingNumber: string | null;
    carrier: string | null;
    shippedAt: Date | null;
    deliveredAt: Date | null;
    estimatedDeliveryDate: Date | null;
    shippingAddress: unknown;
    meetupLocation: string | null;
    meetupDate: Date | null;
    meetupTime: string | null;
    meetupConfirmedBySeller: boolean;
    meetupConfirmedByBuyer: boolean;
    qrScannedAt: Date | null;
    scheduledDate: Date | null;
    scheduledTime: string | null;
    specialInstructions: string | null;
    cancelledAt: Date | null;
    cancelledBy: string | null;
    cancellationReason: string | null;
    timeline: unknown;
    autoReleaseAt: Date | null;
    refundAmount: unknown;
    refundedAt: Date | null;
    stripePaymentIntentId: string | null;
    stripeRefundId: string | null;
    createdAt: Date;
    updatedAt: Date;
    post?: { id: string; title: string; [key: string]: unknown } | null;
    offer?: { id: string; [key: string]: unknown } | null;
    buyer?: { id: string; firstName: string; lastName: string; [key: string]: unknown } | null;
    seller?: {
      id: string;
      userId: string;
      businessName: string | null;
      rating?: unknown;
      totalReviews?: number;
      totalCompleted?: number;
      verificationBadges?: unknown;
      ratingBadge?: string | null;
      user?: { id?: string; firstName: string; lastName: string; [key: string]: unknown } | null;
      [key: string]: unknown;
    } | null;
  }) {
    return {
      id: tx.id,
      postId: tx.postId,
      offerId: tx.offerId,
      buyerId: tx.buyerId,
      sellerId: tx.sellerId,
      transactionType: tx.transactionType,
      quoteAmount: Number(tx.quoteAmount),
      buyerFee: tx.buyerFee ? Number(tx.buyerFee) : null,
      stripeFee: tx.stripeFee ? Number(tx.stripeFee) : null,
      totalCharged: tx.totalCharged ? Number(tx.totalCharged) : null,
      platformFee: tx.platformFee ? Number(tx.platformFee) : null,
      platformFeePercentage: tx.platformFeePercentage ? Number(tx.platformFeePercentage) : null,
      sellerPayoutAmount: tx.sellerPayoutAmount ? Number(tx.sellerPayoutAmount) : null,
      shippingCost: tx.shippingCost ? Number(tx.shippingCost) : null,
      currency: tx.currency,
      escrowStatus: tx.escrowStatus,
      escrowReleasedAt: tx.escrowReleasedAt,
      releaseReason: tx.releaseReason,
      status: tx.status,
      beforePhotos: tx.beforePhotos,
      progressPhotos: tx.progressPhotos,
      afterPhotos: tx.afterPhotos,
      completionNotes: tx.completionNotes,
      workSummary: tx.workSummary,
      completedAt: tx.completedAt,
      trackingNumber: tx.trackingNumber,
      carrier: tx.carrier,
      shippedAt: tx.shippedAt,
      deliveredAt: tx.deliveredAt,
      estimatedDeliveryDate: tx.estimatedDeliveryDate,
      shippingAddress: tx.shippingAddress,
      meetupLocation: tx.meetupLocation,
      meetupDate: tx.meetupDate,
      meetupTime: tx.meetupTime,
      meetupConfirmedBySeller: tx.meetupConfirmedBySeller,
      meetupConfirmedByBuyer: tx.meetupConfirmedByBuyer,
      qrScannedAt: tx.qrScannedAt,
      scheduledDate: tx.scheduledDate,
      scheduledTime: tx.scheduledTime,
      specialInstructions: tx.specialInstructions,
      cancelledAt: tx.cancelledAt,
      cancelledBy: tx.cancelledBy,
      cancellationReason: tx.cancellationReason,
      timeline: tx.timeline,
      autoReleaseAt: tx.autoReleaseAt,
      refundAmount: tx.refundAmount ? Number(tx.refundAmount) : null,
      refundedAt: tx.refundedAt,
      stripePaymentIntentId: tx.stripePaymentIntentId,
      stripeRefundId: tx.stripeRefundId,
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt,
      post: tx.post ? { id: tx.post.id, title: tx.post.title } : undefined,
      offer: tx.offer ? { id: tx.offer.id } : undefined,
      buyer: tx.buyer ? { id: tx.buyer.id, firstName: tx.buyer.firstName, lastName: tx.buyer.lastName } : undefined,
      // #289: the mobile `SellerSummary` model requires a non-null `userId`; emit
      // the full offers-endpoint seller shape so both transaction-detail screens parse.
      seller: tx.seller ? {
        id: tx.seller.id,
        userId: tx.seller.userId,
        businessName: tx.seller.businessName,
        rating: tx.seller.rating != null ? Number(tx.seller.rating) : null,
        totalReviews: tx.seller.totalReviews ?? 0,
        totalCompleted: tx.seller.totalCompleted ?? 0,
        verificationBadges: tx.seller.verificationBadges ?? [],
        ratingBadge: tx.seller.ratingBadge ?? null,
        user: tx.seller.user
          ? { firstName: tx.seller.user.firstName, lastName: tx.seller.user.lastName }
          : undefined,
      } : undefined,
    };
  }
}
