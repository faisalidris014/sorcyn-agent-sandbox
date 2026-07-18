import { Prisma, TransactionType, type OfferType as PrismaOfferType } from '@prisma/client';
import { prisma } from '../../config/database.js';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../../common/utils/errors.js';
import { calculateFees, calculateJobLeadFee, type JobRoleTier } from '../../common/utils/fees.js';
import { haversineDistance } from '../../common/utils/geo.js';
import { env } from '../../config/env.js';
import { EXCLUSIVITY_WINDOW_MS } from '../posts/posts.service.js';
import type {
  CreateOfferInput,
  UpdateOfferInput,
  CounterOfferInput,
  ListMyOffersQuery,
  ListPostOffersQuery,
} from './offers.schemas.js';
import type { PaginationMeta } from '../../common/types/api.js';

const MAX_ACTIVE_OFFERS = 25;
const MAX_OFFERS_PER_POST = 25;
// Max chain length for counter-offers (original + N counters). 5 = original + 4 counters.
const MAX_COUNTER_DEPTH = 5;
const OFFER_EXPIRY_HOURS = 72;
const WITHDRAWAL_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const LOW_BALL_THRESHOLD = 0.7; // Warn if offer < 70% of buyer's minimum budget

export class OffersService {
  // ── Submit Offer ──────────────────────────────────────────────

  async submitOffer(userId: string, input: CreateOfferInput) {
    const seller = await this.getSellerProfile(userId);

    // Load post
    const post = await prisma.post.findFirst({
      where: { id: input.postId, deletedAt: null },
    });
    if (!post) throw new NotFoundError('Post', input.postId);
    if (post.status !== 'active') throw new ConflictError('Post is not accepting offers');
    if (post.expiresAt && post.expiresAt < new Date()) throw new ConflictError('Post has expired');
    if (post.buyerId === userId) throw new ForbiddenError('Cannot offer on your own post');

    // Max 25 offers per post
    const postOfferCount = await prisma.offer.count({
      where: { postId: input.postId, status: { in: ['pending', 'accepted'] }, deletedAt: null },
    });
    if (postOfferCount >= MAX_OFFERS_PER_POST) {
      throw new ConflictError(`This post has reached the maximum of ${MAX_OFFERS_PER_POST} offers`);
    }

    // Max 25 active offers per seller across all posts
    const activeCount = await prisma.offer.count({
      where: { sellerId: seller.id, status: { in: ['pending'] }, deletedAt: null },
    });
    if (activeCount >= MAX_ACTIVE_OFFERS) {
      throw new ConflictError(`Maximum ${MAX_ACTIVE_OFFERS} active offers allowed`);
    }

    // Check for existing offer on this post
    const existing = await prisma.offer.findFirst({
      where: { postId: input.postId, sellerId: seller.id },
    });

    // A seller may resubmit on a post when their prior offer was declined —
    // resubmitting restarts the buyer's private-offer exclusivity window below.
    let isResubmitAfterDecline = false;
    if (existing) {
      if (existing.status === 'withdrawn') {
        // Check 24h cooldown
        if (existing.withdrawnAt && (Date.now() - existing.withdrawnAt.getTime()) < WITHDRAWAL_COOLDOWN_MS) {
          throw new ConflictError('Must wait 24 hours after withdrawing before re-submitting on this post');
        }
        // Soft-delete the old withdrawn offer
        await prisma.offer.update({
          where: { id: existing.id },
          data: { deletedAt: new Date() },
        });
      } else if (existing.status === 'declined' && existing.deletedAt === null) {
        // Soft-delete the declined offer so the new one is the live offer.
        await prisma.offer.update({
          where: { id: existing.id },
          data: { deletedAt: new Date() },
        });
        isResubmitAfterDecline = true;
      } else if (existing.deletedAt === null) {
        throw new ConflictError('You already have an offer on this post');
      }
    }

    // Calculate fee preview
    const txType = this.offerTypeToTransactionType(input.offerType);
    const fees = calculateFees(txType, input.quoteAmount);

    const offer = await prisma.offer.create({
      data: {
        postId: input.postId,
        sellerId: seller.id,
        offerType: input.offerType,
        quoteAmount: input.quoteAmount,
        pricingType: input.pricingType ?? null,
        estimatedHours: input.estimatedHours ?? null,
        canStart: input.canStart ?? null,
        specificDate: input.specificDate ? new Date(input.specificDate) : null,
        completionTime: input.completionTime ?? null,
        message: input.message ?? '',
        attachments: input.attachments as Prisma.InputJsonValue,
        photos: input.photos as Prisma.InputJsonValue,
        terms: input.terms ?? null,
        warranty: input.warranty ?? null,
        categorySpecific: input.categorySpecific as Prisma.InputJsonValue,
        marketplaceContext: post.marketplaceContext,
        estimatedPayout: fees.sellerPayoutAmount,
        platformFee: fees.platformFee,
        expiresAt: new Date(Date.now() + OFFER_EXPIRY_HOURS * 60 * 60 * 1000),
        status: 'pending',
      },
      include: {
        seller: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    // Increment post offer count. On a resubmit after decline, also restart the
    // buyer's private-offer exclusivity window from now (product decision).
    await prisma.post.update({
      where: { id: input.postId },
      data: {
        offerCount: { increment: 1 },
        ...(isResubmitAfterDecline
          ? { publicAfter: new Date(Date.now() + EXCLUSIVITY_WINDOW_MS) }
          : {}),
      },
    });

    // Notify buyer that a new offer has arrived on their post (fire-and-forget).
    //
    // Seeded discovery posts (#37) have a synthetic buyer that NEVER acts and must
    // never be contacted. Suppress every buyer-directed side effect here: no
    // notification, no email, no message thread, no "offer received" event, nothing
    // referencing a buyer contact. The seller's own normal submission response is
    // unaffected, and we never reveal to the seller that the post is seeded. The
    // only effects of an offer on a seeded post are: the offer row is recorded
    // (above) and the post becomes discovery-eligible (isSeed + >=1 active offer).
    if (!post.isSeed) {
      try {
        const { NotificationsService } = await import('../notifications/notifications.service.js');
        const notifSvc = new NotificationsService();
        const sellerName = offer.seller.user.firstName ?? 'A seller';
        await notifSvc.createNotification({
          userId: post.buyerId,
          type: 'offer_received',
          title: 'New offer received',
          message: `${sellerName} sent you an offer of $${Number(offer.quoteAmount).toFixed(2)} on "${post.title}".`,
          data: { offerId: offer.id, postId: post.id, sellerId: seller.id },
          channels: ['push', 'in_app'],
          actionUrl: `/offers/${offer.id}`,
        });
      } catch {
        // Non-critical: never fail offer submission on a notification error
      }

      // Open the buyer↔seller chat thread, seeded with the seller's pitch (#305).
      // Idempotent on (post, participant pair) so resubmitting after a decline reuses
      // the same thread. Never fail offer submission on a messaging error.
      try {
        const { MessagesService } = await import('../messages/messages.service.js');
        await new MessagesService().findOrCreateOfferConversation({
          buyerUserId: post.buyerId,
          sellerUserId: userId,
          postId: post.id,
          offerId: offer.id,
          firstMessage: offer.message || null,
        });
      } catch {
        // Non-critical: never fail offer submission on a conversation/message error
      }
    }

    // Collect warnings
    const warnings: Array<{ type: string; message: string }> = [];

    // Low-ball warning
    if (
      post.budgetMin &&
      Number(post.budgetMin) > 0 &&
      input.quoteAmount < Number(post.budgetMin) * LOW_BALL_THRESHOLD
    ) {
      warnings.push({
        type: 'low_ball',
        message: 'Your offer is significantly below the buyer\'s budget range. There\'s a high chance it will be declined.',
      });
    }

    // Category verification warning
    try {
      const { getMissingVerifications } = await import('../../common/config/category-verification.js');
      const postCategory = post.subcategoryId
        ? await prisma.category.findUnique({ where: { id: post.subcategoryId }, select: { slug: true } })
        : await prisma.category.findUnique({ where: { id: post.categoryId }, select: { slug: true } });

      if (postCategory) {
        const missing = getMissingVerifications(postCategory.slug, seller);
        if (missing) {
          warnings.push({
            type: 'missing_verification',
            message: `This category recommends: ${missing.missing.join(', ')}. Your offer may be less competitive without these verifications.`,
          });
        }
      }
    } catch {
      // Non-critical: don't fail offer submission if verification check errors
    }

    return {
      ...this.toOfferResponse(offer),
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  // ── Get My Offers ─────────────────────────────────────────────

  async getMyOffers(userId: string, query: ListMyOffersQuery) {
    const seller = await this.getSellerProfile(userId);

    const where: Prisma.OfferWhereInput = {
      sellerId: seller.id,
      deletedAt: null,
    };
    if (query.status) where.status = query.status;

    const orderBy: Prisma.OfferOrderByWithRelationInput = (() => {
      switch (query.sort) {
        case 'oldest': return { createdAt: 'asc' as const };
        case 'price_low': return { quoteAmount: 'asc' as const };
        case 'price_high': return { quoteAmount: 'desc' as const };
        case 'newest':
        default: return { createdAt: 'desc' as const };
      }
    })();

    const [offers, total] = await Promise.all([
      prisma.offer.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          post: {
            select: {
              id: true,
              title: true,
              status: true,
              categoryId: true,
              locationCity: true,
              locationState: true,
              urgency: true,
            },
          },
          seller: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      prisma.offer.count({ where }),
    ]);

    const meta: PaginationMeta = {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    };

    return {
      offers: offers.map((o) => this.toOfferResponse(o)),
      meta,
    };
  }

  // ── Get Offer by ID ───────────────────────────────────────────

  async getOfferById(userId: string, offerId: string) {
    const offer = await prisma.offer.findFirst({
      where: { id: offerId, deletedAt: null },
      include: {
        post: { select: { id: true, title: true, buyerId: true, status: true } },
        seller: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!offer) throw new NotFoundError('Offer', offerId);

    // Access: seller owner or post buyer
    const sellerProfile = await prisma.sellerProfile.findFirst({
      where: { userId, deletedAt: null },
    });
    const isSellerOwner = sellerProfile && sellerProfile.id === offer.sellerId;
    const isPostBuyer = offer.post.buyerId === userId;

    if (!isSellerOwner && !isPostBuyer) {
      throw new ForbiddenError('You do not have access to this offer');
    }

    return this.toOfferResponse(offer);
  }

  // ── Update Offer ──────────────────────────────────────────────

  async updateOffer(userId: string, offerId: string, input: UpdateOfferInput) {
    const seller = await this.getSellerProfile(userId);

    const offer = await prisma.offer.findFirst({
      where: { id: offerId, deletedAt: null },
    });
    if (!offer) throw new NotFoundError('Offer', offerId);
    if (offer.sellerId !== seller.id) throw new ForbiddenError('You can only edit your own offers');
    if (offer.status !== 'pending') throw new ConflictError('Can only edit pending offers');

    const data: Prisma.OfferUpdateInput = {};

    if (input.quoteAmount !== undefined) data.quoteAmount = input.quoteAmount;
    if (input.pricingType !== undefined) data.pricingType = input.pricingType;
    if (input.estimatedHours !== undefined) data.estimatedHours = input.estimatedHours;
    if (input.canStart !== undefined) data.canStart = input.canStart;
    if (input.specificDate !== undefined) {
      data.specificDate = input.specificDate ? new Date(input.specificDate) : null;
    }
    if (input.completionTime !== undefined) data.completionTime = input.completionTime;
    // message column is NOT NULL — coerce an explicit null clear to empty string
    if (input.message !== undefined) data.message = input.message ?? '';
    if (input.attachments !== undefined) data.attachments = input.attachments as Prisma.InputJsonValue;
    if (input.photos !== undefined) data.photos = input.photos as Prisma.InputJsonValue;
    if (input.terms !== undefined) data.terms = input.terms;
    if (input.warranty !== undefined) data.warranty = input.warranty;
    if (input.categorySpecific !== undefined) data.categorySpecific = input.categorySpecific as Prisma.InputJsonValue;

    // Recalculate fees if quote changed
    if (input.quoteAmount !== undefined) {
      const txType = this.offerTypeToTransactionType(offer.offerType);
      const fees = calculateFees(txType, input.quoteAmount);
      data.estimatedPayout = fees.sellerPayoutAmount;
      data.platformFee = fees.platformFee;
    }

    const updated = await prisma.offer.update({
      where: { id: offerId },
      data,
      include: {
        seller: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return this.toOfferResponse(updated);
  }

  // ── Withdraw Offer ────────────────────────────────────────────

  async withdrawOffer(userId: string, offerId: string) {
    const seller = await this.getSellerProfile(userId);

    const offer = await prisma.offer.findFirst({
      where: { id: offerId, deletedAt: null },
    });
    if (!offer) throw new NotFoundError('Offer', offerId);
    if (offer.sellerId !== seller.id) throw new ForbiddenError('You can only withdraw your own offers');
    if (offer.status !== 'pending') throw new ConflictError('Can only withdraw pending offers');

    await prisma.offer.update({
      where: { id: offerId },
      data: { status: 'withdrawn', withdrawnAt: new Date() },
    });

    // Decrement post offer count
    await prisma.post.update({
      where: { id: offer.postId },
      data: { offerCount: { decrement: 1 } },
    });
  }

  // ── Accept Offer ──────────────────────────────────────────────

  async acceptOffer(userId: string, offerId: string) {
    const offer = await prisma.offer.findFirst({
      where: { id: offerId, deletedAt: null },
      include: {
        post: true,
        seller: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!offer) throw new NotFoundError('Offer', offerId);
    // HARD GUARDRAIL (#37): a seeded discovery post is never a real counterparty.
    // No accept / escrow / transaction may ever touch it. The only action a buyer
    // can take from discovery is cloning to their own real post. This blocks even
    // the synthetic buyer account from accepting, defense-in-depth.
    if (offer.post.isSeed) {
      throw new ForbiddenError(
        'This offer is from a discovery listing and cannot be accepted directly. Request your own quote to proceed.',
      );
    }
    if (offer.post.buyerId !== userId) throw new ForbiddenError('Only the post buyer can accept offers');
    if (offer.status !== 'pending') throw new ConflictError('Offer is no longer available');
    if (offer.post.status !== 'active') throw new ConflictError('Post is no longer accepting offers');

    const transactionType = this.offerTypeToTransactionType(offer.offerType) as TransactionType;

    // For paid transactions, verify seller has completed Stripe onboarding
    if (transactionType !== 'product_local_cash' && env.NODE_ENV === 'production') {
      const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { id: offer.sellerId },
      });
      if (!sellerProfile?.stripeChargesEnabled) {
        throw new ConflictError('Seller has not completed Stripe onboarding. Cannot accept paid offers.');
      }
    }

    const fees = calculateFees(transactionType, Number(offer.quoteAmount));

    // Phase 3 plan 07: for job_milestone transactions, override platformFee
    // with the flat lead fee scaled by the post's buyer-selected roleTier.
    let platformFee = fees.platformFee;
    let platformFeePercentage = fees.platformFeePercentage;
    if (transactionType === 'job_milestone') {
      const cs = (offer.post.categorySpecific ?? {}) as Record<string, unknown>;
      const tier = cs['roleTier'];
      if (tier === 'entry' || tier === 'mid' || tier === 'specialized_senior') {
        platformFee = calculateJobLeadFee(tier as JobRoleTier);
        platformFeePercentage = 0; // flat-fee, not percentage-based
      }
    }

    const sellerUserId = offer.seller.user.id;

    // Capture losing-offer seller user IDs BEFORE the transaction so we can
    // notify them after the updateMany (which doesn't return rows).
    const losingOffers = await prisma.offer.findMany({
      where: {
        postId: offer.postId,
        id: { not: offerId },
        status: 'pending',
        deletedAt: null,
      },
      include: {
        seller: {
          select: {
            user: { select: { id: true } },
          },
        },
      },
    });
    const losingSellerUserIds = losingOffers.map((o) => o.seller.user.id);

    // Atomic: accept offer, decline others, fill post, create transaction.
    // The buyer↔seller conversation already exists (created at offer submit, #305);
    // it is linked to this transaction after the commit below.
    const [updatedOffer, , , transaction] = await prisma.$transaction([
      // Accept this offer
      prisma.offer.update({
        where: { id: offerId },
        data: { status: 'accepted', acceptedAt: new Date() },
        include: {
          seller: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      // Decline all other pending offers on this post
      prisma.offer.updateMany({
        where: {
          postId: offer.postId,
          id: { not: offerId },
          status: 'pending',
          deletedAt: null,
        },
        data: { status: 'declined', declinedAt: new Date() },
      }),
      // Mark post as filled
      prisma.post.update({
        where: { id: offer.postId },
        data: { status: 'filled', filledAt: new Date() },
      }),
      // Create transaction
      prisma.transaction.create({
        data: {
          postId: offer.postId,
          offerId: offerId,
          buyerId: userId,
          sellerId: offer.sellerId,
          transactionType,
          quoteAmount: offer.quoteAmount,
          buyerFee: fees.buyerFee,
          stripeFee: fees.stripeFee,
          totalCharged: fees.totalCharged,
          platformFee,
          platformFeePercentage,
          sellerPayoutAmount: fees.sellerPayoutAmount,
          escrowStatus: 'held',
          status: 'in_progress',
          timeline: [{
            event: 'created',
            timestamp: new Date().toISOString(),
            actorId: userId,
            note: 'Transaction created on offer acceptance',
          }] as unknown as Prisma.InputJsonValue,
        },
        include: {
          post: { select: { id: true, title: true } },
        },
      }),
    ]);

    // Link the existing conversation (seeded at offer submit) to this transaction so
    // completion can later lock it by transactionId. Fallback-create for legacy offers
    // that predate offer-submit conversation seeding. Non-critical: never reverse an
    // accepted offer over a conversation-linkage error.
    try {
      const convo = await prisma.conversation.findFirst({
        where: { postId: offer.postId, offerId, deletedAt: null },
        select: { id: true },
      });
      if (convo) {
        await prisma.conversation.update({
          where: { id: convo.id },
          data: { transactionId: transaction.id },
        });
      } else {
        await prisma.conversation.create({
          data: {
            participant1Id: userId,
            participant2Id: sellerUserId,
            postId: offer.postId,
            offerId,
            transactionId: transaction.id,
            status: 'active',
          },
        });
      }
    } catch {
      // Non-critical: conversation linkage must never fail offer acceptance
    }

    // Notify winning seller + losing sellers (post-commit, non-blocking)
    try {
      const { NotificationsService } = await import('../notifications/notifications.service.js');
      const notifSvc = new NotificationsService();
      await notifSvc.createNotification({
        userId: sellerUserId,
        type: 'offer_accepted',
        title: 'Your offer was accepted',
        message: `The buyer accepted your offer on "${offer.post.title}". Get ready to start the work.`,
        data: { offerId, postId: offer.postId, transactionId: transaction.id },
        channels: ['push', 'in_app'],
        actionUrl: `/transactions/${transaction.id}`,
      });
      await Promise.all(
        losingSellerUserIds.map((uid) =>
          notifSvc.createNotification({
            userId: uid,
            type: 'offer_declined',
            title: 'Offer not selected',
            message: `The buyer chose another seller for "${offer.post.title}".`,
            data: { postId: offer.postId },
            channels: ['in_app'],
          }),
        ),
      );
    } catch {
      // Non-critical: never fail acceptance on notification errors
    }

    return {
      offer: this.toOfferResponse(updatedOffer),
      transaction: {
        id: transaction.id,
        postId: transaction.postId,
        offerId: transaction.offerId,
        buyerId: transaction.buyerId,
        sellerId: transaction.sellerId,
        transactionType: transaction.transactionType,
        quoteAmount: Number(transaction.quoteAmount),
        buyerFee: transaction.buyerFee ? Number(transaction.buyerFee) : null,
        stripeFee: transaction.stripeFee ? Number(transaction.stripeFee) : null,
        totalCharged: transaction.totalCharged ? Number(transaction.totalCharged) : null,
        platformFee: transaction.platformFee ? Number(transaction.platformFee) : null,
        sellerPayoutAmount: transaction.sellerPayoutAmount ? Number(transaction.sellerPayoutAmount) : null,
        escrowStatus: transaction.escrowStatus,
        status: transaction.status,
        createdAt: transaction.createdAt,
      },
    };
  }

  // ── Decline Offer (Buyer) ─────────────────────────────────────

  async declineOffer(userId: string, offerId: string) {
    const offer = await prisma.offer.findFirst({
      where: { id: offerId, deletedAt: null },
      include: {
        post: { select: { id: true, buyerId: true, title: true } },
        seller: {
          select: {
            user: { select: { id: true } },
          },
        },
      },
    });
    if (!offer) throw new NotFoundError('Offer', offerId);
    if (offer.post.buyerId !== userId) {
      throw new ForbiddenError('Only the post buyer can decline an offer');
    }
    if (offer.status !== 'pending') {
      throw new ConflictError('Can only decline a pending offer');
    }

    await prisma.offer.update({
      where: { id: offerId },
      data: { status: 'declined', declinedAt: new Date() },
    });

    // Notify the seller their offer was declined (fire-and-forget)
    try {
      const { NotificationsService } = await import('../notifications/notifications.service.js');
      const notifSvc = new NotificationsService();
      await notifSvc.createNotification({
        userId: offer.seller.user.id,
        type: 'offer_declined',
        title: 'Offer declined',
        message: `The buyer declined your offer on "${offer.post.title}".`,
        data: { offerId, postId: offer.post.id },
        channels: ['in_app'],
      });
    } catch {
      // Non-critical: never fail the decline action on a notification error
    }
  }

  // ── Counter-Offer (Buyer) ─────────────────────────────────────

  async counterOffer(userId: string, offerId: string, input: CounterOfferInput) {
    // Load offer with post and seller
    const offer = await prisma.offer.findFirst({
      where: { id: offerId, deletedAt: null },
      include: {
        post: { select: { id: true, buyerId: true, title: true, status: true } },
        seller: {
          select: {
            id: true,
            user: { select: { id: true, firstName: true } },
          },
        },
      },
    });

    if (!offer) throw new NotFoundError('Offer', offerId);
    if (offer.post.buyerId !== userId) throw new ForbiddenError('Only the post buyer can counter an offer');
    if (offer.status !== 'pending') throw new ConflictError('Can only counter a pending offer');
    if (offer.post.status !== 'active') throw new ConflictError('Post is no longer active');

    // Walk parentOfferId chain to compute current depth (chain length including this offer).
    // Reject if appending another counter would exceed MAX_COUNTER_DEPTH (5 = original + 4 counters).
    let chainLength = 1;
    let cursorParentId: string | null = offer.parentOfferId ?? null;
    while (cursorParentId && chainLength < MAX_COUNTER_DEPTH) {
      chainLength++;
      const parent: { parentOfferId: string | null } | null = await prisma.offer.findUnique({
        where: { id: cursorParentId },
        select: { parentOfferId: true },
      });
      if (!parent) break;
      cursorParentId = parent.parentOfferId;
    }
    if (chainLength >= MAX_COUNTER_DEPTH) {
      throw new ConflictError(
        `Counter-offer chain has reached the maximum of ${MAX_COUNTER_DEPTH} rounds`,
      );
    }

    const now = new Date();

    // Atomic: update original offer to counter_offered + create counter-offer record
    const [updatedOriginal, counterOffer] = await prisma.$transaction([
      // Mark original as counter_offered
      prisma.offer.update({
        where: { id: offerId },
        data: {
          status: 'counter_offered',
          counterOfferedAt: now,
          counterAmount: input.counterAmount,
          counterMessage: input.counterMessage ?? null,
          counterTerms: input.counterTerms ?? null,
        },
      }),
      // Create new pending offer with buyer's counter terms, linked to parent
      prisma.offer.create({
        data: {
          postId: offer.postId,
          sellerId: offer.sellerId,
          offerType: offer.offerType,
          quoteAmount: input.counterAmount,
          pricingType: offer.pricingType,
          estimatedHours: offer.estimatedHours,
          message: input.counterMessage ?? offer.message,
          attachments: offer.attachments ?? [],
          photos: offer.photos ?? [],
          terms: input.counterTerms ?? offer.terms,
          warranty: offer.warranty,
          canStart: offer.canStart,
          specificDate: offer.specificDate,
          completionTime: offer.completionTime,
          categorySpecific: offer.categorySpecific ?? {},
          marketplaceContext: offer.marketplaceContext,
          status: 'pending',
          expiresAt: new Date(now.getTime() + OFFER_EXPIRY_HOURS * 60 * 60 * 1000),
          parentOfferId: offerId,
        },
        include: {
          post: { select: { id: true, title: true } },
          seller: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
            },
          },
        },
      }),
    ]);

    // Notify seller about the counter-offer
    try {
      const { NotificationsService } = await import('../notifications/notifications.service.js');
      const notifSvc = new NotificationsService();
      await notifSvc.createNotification({
        userId: offer.seller.user.id,
        type: 'counter_offer_received',
        title: 'Counter-Offer Received',
        message: `The buyer has countered your offer on "${offer.post.title}" with $${input.counterAmount}.`,
        data: { offerId: counterOffer.id, originalOfferId: offerId, postId: offer.postId },
        channels: ['push', 'in_app'],
        actionUrl: `/offers/${counterOffer.id}`,
      });
    } catch {
      // Non-critical: don't fail the counter-offer if notification fails
    }

    return this.toOfferResponse(counterOffer);
  }

  // ── Get Post Offers (Buyer View) ──────────────────────────────

  async getPostOffers(userId: string, postId: string, query: ListPostOffersQuery) {
    const post = await prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
    });
    if (!post) throw new NotFoundError('Post', postId);
    if (post.buyerId !== userId) throw new ForbiddenError('Only the post owner can view offers');

    const where: Prisma.OfferWhereInput = {
      postId,
      deletedAt: null,
      status: { in: ['pending', 'accepted', 'declined', 'needs_reconfirmation'] },
    };

    const [offers, total] = await Promise.all([
      prisma.offer.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          seller: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  locationCity: true,
                  locationState: true,
                  latitude: true,
                  longitude: true,
                },
              },
            },
          },
        },
      }),
      prisma.offer.count({ where }),
    ]);

    const meta: PaginationMeta = {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    };

    // Compute best match scores
    const scored = offers.map((offer) => ({
      offer,
      score: this.computeBestMatchScore(offer, offers, post),
    }));
    scored.sort((a, b) => b.score - a.score);

    const bestMatchId = scored.length > 0 ? scored[0].offer.id : null;

    // Apply sort
    let sorted = scored;
    switch (query.sort) {
      case 'price_low':
        sorted = scored.sort((a, b) => Number(a.offer.quoteAmount) - Number(b.offer.quoteAmount));
        break;
      case 'price_high':
        sorted = scored.sort((a, b) => Number(b.offer.quoteAmount) - Number(a.offer.quoteAmount));
        break;
      case 'newest':
        sorted = scored.sort((a, b) => b.offer.createdAt.getTime() - a.offer.createdAt.getTime());
        break;
      case 'best_match':
      default:
        // Already sorted by score
        break;
    }

    return {
      offers: sorted.map((s) => ({
        ...this.toOfferResponse(s.offer),
        isBestMatch: s.offer.id === bestMatchId,
        matchScore: Math.round(s.score * 100),
      })),
      meta,
    };
  }

  // ── Best Match Algorithm ──────────────────────────────────────

  private computeBestMatchScore(
    offer: { quoteAmount: unknown; seller: { rating: unknown; responseTimeHours: unknown; acceptanceRate: unknown; user: { latitude: unknown; longitude: unknown } } },
    allOffers: Array<{ quoteAmount: unknown }>,
    post: { latitude: unknown; longitude: unknown },
  ): number {
    // Rating score (40%)
    const rating = offer.seller.rating ? Number(offer.seller.rating) : 3.0;
    const ratingScore = (rating / 5) * 0.4;

    // Price competitiveness (30%) — lower price = higher score
    const quotes = allOffers.map((o) => Number(o.quoteAmount));
    const minQuote = Math.min(...quotes);
    const maxQuote = Math.max(...quotes);
    const thisQuote = Number(offer.quoteAmount);
    const priceScore = maxQuote === minQuote
      ? 0.3
      : ((maxQuote - thisQuote) / (maxQuote - minQuote)) * 0.3;

    // Distance (15%) — closer = higher score
    let distanceScore = 0.075; // neutral default
    const sellerLat = offer.seller.user.latitude ? Number(offer.seller.user.latitude) : null;
    const sellerLng = offer.seller.user.longitude ? Number(offer.seller.user.longitude) : null;
    const postLat = post.latitude ? Number(post.latitude) : null;
    const postLng = post.longitude ? Number(post.longitude) : null;

    if (sellerLat && sellerLng && postLat && postLng) {
      const dist = this.haversineDistance(sellerLat, sellerLng, postLat, postLng);
      // Normalize: 0 miles = 1.0, 50+ miles = 0.0
      distanceScore = Math.max(0, 1 - dist / 50) * 0.15;
    }

    // Response time (10%) — faster = higher score
    const responseHours = offer.seller.responseTimeHours ? Number(offer.seller.responseTimeHours) : 24;
    const responseScore = Math.max(0, 1 - responseHours / 48) * 0.1;

    // Completion rate (5%)
    const completionRate = offer.seller.acceptanceRate ? Number(offer.seller.acceptanceRate) : 50;
    const completionScore = (completionRate / 100) * 0.05;

    return ratingScore + priceScore + distanceScore + responseScore + completionScore;
  }

  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    return haversineDistance(lat1, lng1, lat2, lng2);
  }

  // ── Reconfirm Offer (Seller) ───────────────────────────────────

  async reconfirmOffer(userId: string, offerId: string) {
    const seller = await this.getSellerProfile(userId);

    const offer = await prisma.offer.findFirst({
      where: { id: offerId, deletedAt: null },
    });
    if (!offer) throw new NotFoundError('Offer', offerId);
    if (offer.sellerId !== seller.id) throw new ForbiddenError('You can only reconfirm your own offers');
    if (offer.status !== 'needs_reconfirmation') {
      throw new ConflictError('Only offers needing reconfirmation can be reconfirmed');
    }

    const updated = await prisma.offer.update({
      where: { id: offerId },
      data: { status: 'pending' },
    });

    return this.toOfferResponse(updated);
  }

  // ── Private Helpers ───────────────────────────────────────────

  private async getSellerProfile(userId: string) {
    const seller = await prisma.sellerProfile.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!seller) throw new NotFoundError('Seller profile');
    return seller;
  }

  private offerTypeToTransactionType(offerType: string | PrismaOfferType): 'service' | 'product_shipped' | 'product_local_cash' | 'product_local_platform' | 'job_milestone' | 'inventory' {
    switch (offerType) {
      case 'service': return 'service';
      case 'job_application': return 'job_milestone';
      case 'product': return 'product_local_platform';
      case 'inventory': return 'inventory';
      default: return 'service';
    }
  }

  private toOfferResponse(offer: {
    id: string;
    postId: string;
    sellerId: string;
    offerType: string;
    quoteAmount: unknown;
    pricingType: string | null;
    estimatedHours: unknown;
    canStart: string | null;
    specificDate: Date | null;
    completionTime: string | null;
    message: string;
    attachments: unknown;
    photos: unknown;
    terms: string | null;
    warranty: string | null;
    categorySpecific: unknown;
    estimatedPayout: unknown;
    platformFee: unknown;
    status: string;
    expiresAt: Date | null;
    acceptedAt: Date | null;
    declinedAt: Date | null;
    withdrawnAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    post?: { id: string; title: string; [key: string]: unknown } | null;
    seller?: {
      id: string;
      userId: string;
      businessName: string | null;
      rating: unknown;
      totalReviews: number;
      totalCompleted: number;
      verificationBadges: unknown;
      ratingBadge: string | null;
      user?: { firstName: string; lastName: string; [key: string]: unknown } | null;
      [key: string]: unknown;
    } | null;
  }) {
    return {
      id: offer.id,
      postId: offer.postId,
      sellerId: offer.sellerId,
      offerType: offer.offerType,
      quoteAmount: Number(offer.quoteAmount),
      pricingType: offer.pricingType,
      estimatedHours: offer.estimatedHours ? Number(offer.estimatedHours) : null,
      canStart: offer.canStart,
      specificDate: offer.specificDate,
      completionTime: offer.completionTime,
      message: offer.message,
      attachments: offer.attachments,
      photos: offer.photos,
      terms: offer.terms,
      warranty: offer.warranty,
      categorySpecific: offer.categorySpecific,
      estimatedPayout: offer.estimatedPayout ? Number(offer.estimatedPayout) : null,
      platformFee: offer.platformFee ? Number(offer.platformFee) : null,
      status: offer.status,
      expiresAt: offer.expiresAt,
      acceptedAt: offer.acceptedAt,
      declinedAt: offer.declinedAt,
      withdrawnAt: offer.withdrawnAt,
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt,
      post: offer.post ? {
        id: offer.post.id,
        title: offer.post.title,
        ...('status' in offer.post ? { status: offer.post.status } : {}),
        ...('locationCity' in offer.post ? { locationCity: offer.post.locationCity } : {}),
        ...('locationState' in offer.post ? { locationState: offer.post.locationState } : {}),
      } : undefined,
      seller: offer.seller ? {
        id: offer.seller.id,
        userId: offer.seller.userId,
        businessName: offer.seller.businessName,
        rating: offer.seller.rating ? Number(offer.seller.rating) : null,
        totalReviews: offer.seller.totalReviews,
        totalCompleted: offer.seller.totalCompleted,
        verificationBadges: offer.seller.verificationBadges,
        ratingBadge: offer.seller.ratingBadge,
        user: offer.seller.user ? {
          firstName: offer.seller.user.firstName,
          lastName: offer.seller.user.lastName,
        } : undefined,
      } : undefined,
    };
  }
}
