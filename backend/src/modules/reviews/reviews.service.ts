import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../../common/utils/errors.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { reviewReminderQueue } from '../../config/bullmq.js';
import type { PaginationMeta } from '../../common/types/api.js';
import type { CreateReviewInput, ListSellerReviewsQuery } from './reviews.schemas.js';
import type { ReviewReminderJobData } from '../../config/bullmq.js';

export class ReviewsService {
  private notificationsService = new NotificationsService();

  // ── Submit Review ───────────────────────────────────────────

  async submitReview(userId: string, input: CreateReviewInput) {
    // Load transaction and verify ownership
    const transaction = await prisma.transaction.findFirst({
      where: { id: input.transactionId, deletedAt: null },
      include: {
        seller: {
          include: { user: { select: { id: true } } },
        },
      },
    });
    if (!transaction) throw new NotFoundError('Transaction', input.transactionId);
    if (transaction.buyerId !== userId) throw new ForbiddenError('Only the buyer can review this transaction');
    if (transaction.status !== 'completed') throw new ConflictError('Transaction must be completed before reviewing');

    // Check for existing review
    const existing = await prisma.review.findFirst({
      where: { transactionId: input.transactionId, deletedAt: null },
    });
    if (existing) throw new ConflictError('Review already submitted for this transaction');

    // Create review + update seller stats atomically
    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          transactionId: input.transactionId,
          sellerId: transaction.sellerId,
          buyerId: userId,
          overallRating: input.overallRating,
          categoryRatings: input.categoryRatings as Prisma.InputJsonValue,
          writtenReview: input.writtenReview ?? null,
          wouldRecommend: input.wouldRecommend,
          completionPhotos: input.completionPhotos as unknown as Prisma.InputJsonValue,
        },
        include: {
          buyer: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
        },
      });

      // Re-compute seller stats
      const allReviews = await tx.review.findMany({
        where: { sellerId: transaction.sellerId, deletedAt: null },
        select: { overallRating: true },
      });

      const totalReviews = allReviews.length;
      const avgRating = allReviews.reduce((sum, r) => sum + r.overallRating, 0) / totalReviews;
      const roundedRating = Math.round(avgRating * 100) / 100;

      const ratingBadge = this.computeRatingBadge(roundedRating, totalReviews);

      await tx.sellerProfile.update({
        where: { id: transaction.sellerId },
        data: {
          rating: roundedRating,
          totalReviews,
          ratingBadge,
        },
      });

      return newReview;
    });

    // Notify seller (async, non-blocking)
    this.notificationsService.createNotification({
      userId: transaction.seller.user.id,
      type: 'review_received',
      title: 'New Review',
      message: `You received a ${input.overallRating}-star review!`,
      data: { reviewId: review.id, transactionId: input.transactionId, rating: input.overallRating },
      channels: ['push', 'in_app'],
      actionUrl: `/reviews/${review.id}`,
    }).catch((err) => console.error('[NOTIFY ERROR]', err));

    return this.toReviewResponse(review);
  }

  // ── List Seller Reviews ─────────────────────────────────────

  async listSellerReviews(sellerId: string, query: ListSellerReviewsQuery) {
    const seller = await prisma.sellerProfile.findFirst({
      where: { id: sellerId, deletedAt: null },
    });
    if (!seller) throw new NotFoundError('Seller', sellerId);

    const orderBy: Prisma.ReviewOrderByWithRelationInput = (() => {
      switch (query.sort) {
        case 'oldest': return { createdAt: 'asc' as const };
        case 'highest': return { overallRating: 'desc' as const };
        case 'lowest': return { overallRating: 'asc' as const };
        case 'newest':
        default: return { createdAt: 'desc' as const };
      }
    })();

    const where: Prisma.ReviewWhereInput = {
      sellerId,
      deletedAt: null,
      moderationStatus: 'approved',
    };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          buyer: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
          transaction: {
            select: {
              id: true,
              transactionType: true,
              post: { select: { id: true, title: true } },
            },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);

    const meta: PaginationMeta = {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    };

    return {
      reviews: reviews.map((r) => this.toReviewResponse(r, { publicView: true })),
      meta,
      summary: {
        averageRating: seller.rating ? Number(seller.rating) : null,
        totalReviews: seller.totalReviews,
        ratingBadge: seller.ratingBadge,
      },
    };
  }

  // ── Report Review ───────────────────────────────────────────

  async reportReview(userId: string, reviewId: string, input: { reason: string }): Promise<void> {
    const review = await prisma.review.findFirst({
      where: { id: reviewId, deletedAt: null },
    });
    if (!review) throw new NotFoundError('Review', reviewId);

    await prisma.review.update({
      where: { id: reviewId },
      data: {
        flagged: true,
        flagReason: input.reason.substring(0, 50),
        flaggedAt: new Date(),
        moderationStatus: 'pending',
      },
    });
  }

  // ── Schedule Review Reminders ───────────────────────────────
  // Called after transaction is completed (from transactions.service.ts)

  async scheduleReviewReminders(transactionId: string, buyerId: string, sellerId: string): Promise<void> {
    const delays = [
      { type: 'day_7' as const, delay: 7 * 24 * 60 * 60 * 1000 },
      { type: 'day_30' as const, delay: 30 * 24 * 60 * 60 * 1000 },
      { type: 'day_60' as const, delay: 60 * 24 * 60 * 60 * 1000 },
      { type: 'auto_review' as const, delay: 73 * 24 * 60 * 60 * 1000 },
    ];

    for (const { type, delay } of delays) {
      await reviewReminderQueue.add(
        type,
        { transactionId, buyerId, sellerId, reminderType: type },
        {
          delay,
          jobId: `review-${type}-${transactionId}`,
          removeOnComplete: true,
          removeOnFail: { count: 3 },
        },
      );
    }
  }

  // ── Process Review Reminder (BullMQ worker) ─────────────────

  async processReviewReminder(data: ReviewReminderJobData): Promise<void> {
    // Drop stale jobs cleanly: a delayed reminder may outlive its transaction
    // or buyer (e.g. Redis jobs surviving a DB reseed, or a hard-deleted user).
    // Bailing here avoids the notifications_user_id_fkey FK violation that
    // otherwise floods the worker logs on every retry. See #216.
    const transaction = await prisma.transaction.findFirst({
      where: { id: data.transactionId, deletedAt: null },
      select: { id: true, status: true, sellerId: true, buyerId: true },
    });
    if (!transaction) return;

    const buyer = await prisma.user.findFirst({
      where: { id: data.buyerId, deletedAt: null },
      select: { id: true },
    });
    if (!buyer) return;

    // Check if review already exists
    const existing = await prisma.review.findFirst({
      where: { transactionId: data.transactionId, deletedAt: null },
    });
    if (existing) return; // Already reviewed, skip

    if (data.reminderType === 'auto_review') {
      if (transaction.status !== 'completed') return;

      await this.submitAutoReview(transaction);
      return;
    }

    // Day 7/30/60: Send reminder notification
    const channelMap: Record<string, ('push' | 'email' | 'in_app')[]> = {
      day_7: ['push', 'in_app'],
      day_30: ['email', 'in_app'],
      day_60: ['email', 'in_app'],
    };

    await this.notificationsService.createNotification({
      userId: data.buyerId,
      type: 'review_reminder',
      title: 'Leave a Review',
      message: 'How was your experience? Leave a review to help other buyers.',
      data: { transactionId: data.transactionId },
      channels: channelMap[data.reminderType] ?? (['in_app'] as const),
      actionUrl: `/reviews/new?transactionId=${data.transactionId}`,
    });
  }

  // ── Auto Review (Day 73) ────────────────────────────────────

  private async submitAutoReview(transaction: { id: string; sellerId: string; buyerId: string }) {
    await prisma.$transaction(async (tx) => {
      await tx.review.create({
        data: {
          transactionId: transaction.id,
          sellerId: transaction.sellerId,
          buyerId: transaction.buyerId,
          overallRating: 5,
          categoryRatings: { quality: 5, communication: 5, timeliness: 5, professionalism: 5, value: 5 } as unknown as Prisma.InputJsonValue,
          writtenReview: 'Auto-generated 5-star review (buyer did not leave a review within 73 days)',
          wouldRecommend: true,
          verifiedCompletion: true,
        },
      });

      // Re-compute seller stats
      const allReviews = await tx.review.findMany({
        where: { sellerId: transaction.sellerId, deletedAt: null },
        select: { overallRating: true },
      });
      const totalReviews = allReviews.length;
      const avgRating = allReviews.reduce((sum, r) => sum + r.overallRating, 0) / totalReviews;
      const roundedRating = Math.round(avgRating * 100) / 100;

      const ratingBadge = this.computeRatingBadge(roundedRating, totalReviews);

      await tx.sellerProfile.update({
        where: { id: transaction.sellerId },
        data: { rating: roundedRating, totalReviews, ratingBadge },
      });
    });
  }

  // ── Helpers ─────────────────────────────────────────────────

  private computeRatingBadge(rating: number, totalReviews: number): string | null {
    if (rating >= 4.8 && totalReviews >= 5) return 'top_rated';
    if (rating >= 4.5 && totalReviews >= 3) return 'highly_rated';
    if (rating >= 4.0 && totalReviews >= 2) return 'good';
    return null;
  }

  private toReviewResponse(review: Record<string, unknown>, options: { publicView?: boolean } = {}) {
    const base = {
      id: review.id,
      transactionId: review.transactionId,
      sellerId: review.sellerId,
      overallRating: review.overallRating,
      categoryRatings: review.categoryRatings,
      writtenReview: review.writtenReview,
      wouldRecommend: review.wouldRecommend,
      verifiedCompletion: review.verifiedCompletion,
      completionPhotos: review.completionPhotos,
      flagged: review.flagged,
      createdAt: review.createdAt,
      transaction: review.transaction ?? undefined,
    };

    if (options.publicView) {
      // SEC-M3 (#263): the seller-reviews endpoint is unauthenticated, so it
      // must not expose buyer identities tied to specific transactions. Drop
      // the raw buyer id (top-level + nested) and the full last name; return
      // only first name + last initial (e.g. "Jordan M.").
      return {
        ...base,
        buyer: this.toPublicBuyer(review.buyer),
      };
    }

    return {
      ...base,
      buyerId: review.buyerId,
      buyer: review.buyer ?? undefined,
    };
  }

  private toPublicBuyer(
    buyer: unknown,
  ): { displayName: string; profilePhotoUrl: string | null } | undefined {
    if (!buyer || typeof buyer !== 'object') return undefined;
    const b = buyer as {
      firstName?: string | null;
      lastName?: string | null;
      profilePhotoUrl?: string | null;
    };
    const first = (b.firstName ?? '').trim();
    const lastInitial = (b.lastName ?? '').trim().charAt(0);
    const displayName =
      [first, lastInitial ? `${lastInitial}.` : ''].filter(Boolean).join(' ') || 'Anonymous';
    return { displayName, profilePhotoUrl: b.profilePhotoUrl ?? null };
  }
}
