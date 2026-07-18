import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { redis } from '../../config/redis.js';
import { PaymentsService } from '../payments/payments.service.js';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../../common/utils/errors.js';
import {
  getBadgeField,
  calculateVerificationTier,
} from '../../common/utils/verification.js';
import { grantCategoryAccess } from '../sellers/category-grant.js';
import { recordCategoryRequestOutcome } from '../../common/middleware/metrics.js';
import type { PaginationMeta } from '../../common/types/api.js';
import type {
  ListUsersQuery,
  SuspendUserInput,
  BanUserInput,
  ListVerificationsQuery,
  ReviewVerificationInput,
  ListCategoryRequestsQuery,
  ReviewCategoryRequestInput,
  ListDisputesQuery,
  ResolveDisputeInput,
  ListFlaggedContentQuery,
  ModerateContentInput,
  ListTransactionsQuery,
  ListAuditLogsQuery,
} from './admin.schemas.js';

export class AdminService {
  // ── Dashboard Stats ──────────────────────────────────────

  async getStats() {
    const [
      totalUsers,
      activeUsers,
      totalSellers,
      totalTransactions,
      revenueResult,
      pendingVerifications,
      openDisputes,
      flaggedReviews,
      flaggedMessages,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { status: 'active', deletedAt: null } }),
      prisma.sellerProfile.count({ where: { deletedAt: null } }),
      prisma.transaction.count(),
      prisma.transaction.aggregate({
        _sum: { platformFee: true },
        where: { status: 'completed' },
      }),
      prisma.verificationRequest.count({
        where: { status: 'pending', deletedAt: null },
      }),
      prisma.dispute.count({
        where: { status: { in: ['open', 'under_review'] }, deletedAt: null },
      }),
      prisma.review.count({
        where: { flagged: true, moderationStatus: 'pending', deletedAt: null },
      }),
      prisma.message.count({
        where: { flagged: true, moderationStatus: 'pending', deletedAt: null },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalSellers,
      totalTransactions,
      totalRevenue: revenueResult._sum.platformFee?.toNumber() ?? 0,
      pendingVerifications,
      openDisputes,
      flaggedReviews,
      flaggedMessages,
    };
  }

  // ── User Management ──────────────────────────────────────

  async listUsers(
    query: ListUsersQuery,
  ): Promise<{ users: any[]; meta: PaginationMeta }> {
    const { page, limit, status, accountType, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = { deletedAt: null };
    if (status) where.status = status;
    if (accountType) where.accountType = accountType;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          accountType: true,
          status: true,
          isAdmin: true,
          emailVerified: true,
          locationCity: true,
          locationState: true,
          createdAt: true,
          lastLoginAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUserDetail(userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        sellerProfile: {
          include: {
            verificationRequests: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        },
        transactionsAsBuyer: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!user) throw new NotFoundError('User', userId);

    // Exclude sensitive fields
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async suspendUser(
    adminId: string,
    userId: string,
    input: SuspendUserInput,
  ): Promise<void> {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) throw new NotFoundError('User', userId);
    if (user.status === 'suspended') {
      throw new ConflictError('User is already suspended');
    }
    if (user.isAdmin) {
      throw new ValidationError('Cannot suspend an admin user');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: 'suspended', sessionVersion: { increment: 1 } },
    });

    await this.invalidateUserSessions(userId);
    await this.logAction({
      userId: adminId,
      action: 'user_suspended',
      resourceType: 'user',
      resourceId: userId,
      details: { reason: input.reason },
    });
  }

  async banUser(
    adminId: string,
    userId: string,
    input: BanUserInput,
  ): Promise<void> {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) throw new NotFoundError('User', userId);
    if (user.status === 'banned') {
      throw new ConflictError('User is already banned');
    }
    if (user.isAdmin) {
      throw new ValidationError('Cannot ban an admin user');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: 'banned', sessionVersion: { increment: 1 } },
    });

    await this.invalidateUserSessions(userId);
    await this.logAction({
      userId: adminId,
      action: 'user_banned',
      resourceType: 'user',
      resourceId: userId,
      details: { reason: input.reason },
    });
  }

  async reactivateUser(adminId: string, userId: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) throw new NotFoundError('User', userId);
    if (user.status === 'active') {
      throw new ConflictError('User is already active');
    }
    if (user.status === 'deleted') {
      throw new ValidationError('Cannot reactivate a deleted account');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: 'active', sessionVersion: { increment: 1 } },
    });

    await this.logAction({
      userId: adminId,
      action: 'user_reactivated',
      resourceType: 'user',
      resourceId: userId,
    });
  }

  async forceLogout(adminId: string, userId: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) throw new NotFoundError('User', userId);

    await this.invalidateUserSessions(userId);
    await this.logAction({
      userId: adminId,
      action: 'force_logout',
      resourceType: 'user',
      resourceId: userId,
    });
  }

  // ── Verification Review ──────────────────────────────────

  async listPendingVerifications(
    query: ListVerificationsQuery,
  ): Promise<{ verifications: any[]; meta: PaginationMeta }> {
    const { page, limit, status, type } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.VerificationRequestWhereInput = { deletedAt: null };
    if (status) {
      where.status = status;
    } else {
      where.status = 'pending';
    }
    if (type) where.verificationType = type;

    const [verifications, total] = await Promise.all([
      prisma.verificationRequest.findMany({
        where,
        include: {
          seller: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.verificationRequest.count({ where }),
    ]);

    return {
      verifications,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async reviewVerification(
    adminId: string,
    verificationId: string,
    input: ReviewVerificationInput,
  ): Promise<void> {
    const verification = await prisma.verificationRequest.findFirst({
      where: { id: verificationId, deletedAt: null },
      include: { seller: true },
    });
    if (!verification) {
      throw new NotFoundError('Verification request', verificationId);
    }
    if (verification.status !== 'pending' && verification.status !== 'under_review') {
      throw new ConflictError(
        `Cannot review a verification with status '${verification.status}'`,
      );
    }

    if (input.action === 'approve') {
      // #382: the admin's expiry is authoritative; falls back to the value the
      // request already carries (seller-claimed at submit, or TDLR-parsed).
      const finalExpiry = input.expiresAt
        ? new Date(input.expiresAt)
        : verification.expiresAt;

      // Update verification request
      await prisma.verificationRequest.update({
        where: { id: verificationId },
        data: {
          status: 'approved',
          reviewedById: adminId,
          reviewedAt: new Date(),
          notes: input.notes ?? null,
          expiresAt: finalExpiry,
          // #382 PR2: re-arm renewal reminders for the (possibly new) expiry so the
          // daily sweep fires 30/7/1-day nudges again from a clean slate.
          expiryReminderStage: null,
        },
      });

      // Update seller badge
      const badgeField = getBadgeField(verification.verificationType);
      const currentBadges = (verification.seller.verificationBadges as string[]) || [];
      const badgeName = `${verification.verificationType}_verified`;
      const updatedBadges = currentBadges.includes(badgeName)
        ? currentBadges
        : [...currentBadges, badgeName];

      // #382: re-sync the profile's credential expiry to the authoritative value
      // so the owner serializer + lapse sweep read the same date. Only license /
      // insurance carry an expiry; guard on a real value to avoid clobbering.
      const expirySync =
        finalExpiry && verification.verificationType === 'license'
          ? { licenseExpiry: finalExpiry }
          : finalExpiry && verification.verificationType === 'insurance'
            ? { insuranceExpiry: finalExpiry }
            : {};

      await prisma.sellerProfile.update({
        where: { id: verification.sellerId },
        data: {
          [badgeField]: true,
          verificationBadges: updatedBadges as any,
          verificationTier: calculateVerificationTier({
            ...verification.seller,
            [badgeField]: true,
          }),
          ...expirySync,
        },
      });
    } else {
      // Reject
      await prisma.verificationRequest.update({
        where: { id: verificationId },
        data: {
          status: 'rejected',
          reviewedById: adminId,
          reviewedAt: new Date(),
          rejectionReason: input.rejectionReason ?? null,
          notes: input.notes ?? null,
        },
      });
    }

    await this.logAction({
      userId: adminId,
      action: `verification_${input.action}d`,
      resourceType: 'verification_request',
      resourceId: verificationId,
      details: {
        sellerId: verification.sellerId,
        type: verification.verificationType,
        rejectionReason: input.rejectionReason,
      },
    });
  }

  // ── Category Access Request Review (#336) ────────────────

  async listCategoryRequests(
    query: ListCategoryRequestsQuery,
  ): Promise<{ requests: any[]; meta: PaginationMeta }> {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SellerCategoryRequestWhereInput = { deletedAt: null };
    where.status = status ?? 'pending';

    const [requests, total] = await Promise.all([
      prisma.sellerCategoryRequest.findMany({
        where,
        include: {
          seller: {
            include: {
              user: {
                select: { id: true, email: true, firstName: true, lastName: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.sellerCategoryRequest.count({ where }),
    ]);

    return {
      requests,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async reviewCategoryRequest(
    adminId: string,
    requestId: string,
    input: ReviewCategoryRequestInput,
  ): Promise<void> {
    const request = await prisma.sellerCategoryRequest.findFirst({
      where: { id: requestId, deletedAt: null },
    });
    if (!request) {
      throw new NotFoundError('Category request', requestId);
    }
    if (request.status !== 'pending' && request.status !== 'under_review') {
      throw new ConflictError(
        `Cannot review a category request with status '${request.status}'`,
      );
    }

    if (input.action === 'approve') {
      // Derive badge flips from the frozen requiredDocTypes snapshot.
      const requiredDocTypes = Array.isArray(request.requiredDocTypes)
        ? (request.requiredDocTypes as string[])
        : [];
      const subcategoryIds = Array.isArray(request.subcategoryIds)
        ? (request.subcategoryIds as string[])
        : [];

      await prisma.$transaction(async (tx) => {
        await tx.sellerCategoryRequest.update({
          where: { id: requestId },
          data: {
            status: 'approved',
            outcome: 'admin_approved',
            decisionReason: 'manual_review',
            reviewedById: adminId,
            reviewedAt: new Date(),
          },
        });
        await grantCategoryAccess(tx, {
          sellerId: request.sellerId,
          subcategoryIds,
          isLicensed: requiredDocTypes.includes('license'),
          requiresBackgroundCheck: requiredDocTypes.includes('background_check'),
        });
      });

      recordCategoryRequestOutcome('auto_approve', 'admin_approved', 'admin');
    } else {
      await prisma.sellerCategoryRequest.update({
        where: { id: requestId },
        data: {
          status: 'rejected',
          outcome: 'admin_rejected',
          decisionReason: input.rejectionReason ?? 'manual_review',
          reviewedById: adminId,
          reviewedAt: new Date(),
        },
      });

      recordCategoryRequestOutcome('auto_reject', 'admin_rejected', 'admin');
    }

    await this.logAction({
      userId: adminId,
      action: `category_request_${input.action}d`,
      resourceType: 'seller_category_request',
      resourceId: requestId,
      details: {
        sellerId: request.sellerId,
        majorCategoryId: request.majorCategoryId,
        rejectionReason: input.rejectionReason,
      },
    });
  }

  // ── Dispute Resolution ───────────────────────────────────

  async listDisputes(
    query: ListDisputesQuery,
  ): Promise<{ disputes: any[]; meta: PaginationMeta }> {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.DisputeWhereInput = { deletedAt: null };
    if (status) where.status = status;

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        include: {
          transaction: {
            select: {
              id: true,
              transactionType: true,
              quoteAmount: true,
              status: true,
              escrowStatus: true,
            },
          },
          openedBy: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          buyer: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
        orderBy: { openedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.dispute.count({ where }),
    ]);

    return {
      disputes,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getDisputeDetail(disputeId: string) {
    const dispute = await prisma.dispute.findFirst({
      where: { id: disputeId, deletedAt: null },
      include: {
        transaction: true,
        openedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        buyer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!dispute) throw new NotFoundError('Dispute', disputeId);
    return dispute;
  }

  async resolveDispute(
    adminId: string,
    disputeId: string,
    input: ResolveDisputeInput,
  ): Promise<void> {
    const dispute = await prisma.dispute.findFirst({
      where: { id: disputeId, deletedAt: null },
    });
    if (!dispute) throw new NotFoundError('Dispute', disputeId);
    if (dispute.status === 'resolved' || dispute.status === 'closed') {
      throw new ConflictError(
        `Dispute is already ${dispute.status}`,
      );
    }

    // SEC-H1 (#256): execute the financial side of the resolution BEFORE recording it. If the
    // money cannot move safely (escrow already released/refunded) we throw and leave the dispute
    // OPEN so the admin can retry — far better than the old behaviour, which recorded a refund
    // outcome while no money ever moved, leaving funds stuck and the buyer told they were repaid.
    const payments = new PaymentsService();
    let financial: Record<string, unknown> = { action: 'none' };

    if (input.outcome === 'full_refund' || input.outcome === 'partial_refund') {
      const isPartial = input.outcome === 'partial_refund';
      if (isPartial && !(input.refundAmount && input.refundAmount > 0)) {
        throw new ValidationError('A positive refundAmount is required for a partial refund');
      }
      const result = await payments.refundForDispute(
        disputeId,
        dispute.transactionId,
        isPartial ? input.refundAmount : undefined,
      );
      if (result.status === 'conflict') {
        throw new ConflictError(
          'Cannot refund: the escrow was already released to the seller, already refunded, or frozen',
        );
      }
      financial = { action: 'refund', ...result };
    } else if (input.outcome === 'no_refund') {
      // Release the escrowed funds to the seller (the buyer's claim was denied).
      const released = await payments.releaseEscrow(dispute.transactionId, 'dispute_no_refund');
      if (!released) {
        throw new ConflictError(
          'Cannot release to the seller: the escrow was already refunded/frozen or the charge was never captured',
        );
      }
      financial = { action: 'release' };
    } else {
      // 'custom': refund the specified amount if one was given, otherwise move no money and
      // freeze the escrow so the auto-release worker cannot pay the seller while an admin
      // settles the remainder out of band.
      if (input.refundAmount && input.refundAmount > 0) {
        const result = await payments.refundForDispute(disputeId, dispute.transactionId, input.refundAmount);
        if (result.status === 'conflict') {
          throw new ConflictError(
            'Cannot refund: the escrow was already released to the seller, already refunded, or frozen',
          );
        }
        financial = { action: 'refund', ...result };
      } else {
        await prisma.transaction.updateMany({
          where: { id: dispute.transactionId, escrowStatus: 'held' },
          data: { status: 'disputed', escrowStatus: 'frozen' },
        });
        financial = { action: 'frozen' };
      }
    }

    await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: 'resolved',
        outcome: input.outcome,
        refundAmount: input.refundAmount ?? null,
        resolutionSummary: input.resolutionSummary,
        resolvedAt: new Date(),
        assignedAgentId: adminId,
      },
    });

    await this.logAction({
      userId: adminId,
      action: 'dispute_resolved',
      resourceType: 'dispute',
      resourceId: disputeId,
      details: {
        outcome: input.outcome,
        refundAmount: input.refundAmount,
        financial,
      },
    });
  }

  // ── Content Moderation ───────────────────────────────────

  async listFlaggedContent(
    query: ListFlaggedContentQuery,
  ): Promise<{ items: any[]; meta: PaginationMeta }> {
    const { page, limit, contentType } = query;

    const items: any[] = [];
    let total = 0;

    if (!contentType || contentType === 'review') {
      const [reviews, reviewCount] = await Promise.all([
        prisma.review.findMany({
          where: {
            flagged: true,
            moderationStatus: 'pending',
            deletedAt: null,
          },
          select: {
            id: true,
            overallRating: true,
            writtenReview: true,
            flagReason: true,
            flaggedAt: true,
            createdAt: true,
            buyer: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { flaggedAt: 'asc' },
        }),
        prisma.review.count({
          where: {
            flagged: true,
            moderationStatus: 'pending',
            deletedAt: null,
          },
        }),
      ]);

      items.push(
        ...reviews.map((r) => ({ type: 'review' as const, ...r })),
      );
      total += reviewCount;
    }

    if (!contentType || contentType === 'message') {
      const [messages, messageCount] = await Promise.all([
        prisma.message.findMany({
          where: {
            flagged: true,
            moderationStatus: 'pending',
            deletedAt: null,
          },
          select: {
            id: true,
            messageText: true,
            flagReason: true,
            moderationStatus: true,
            createdAt: true,
            sender: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.message.count({
          where: {
            flagged: true,
            moderationStatus: 'pending',
            deletedAt: null,
          },
        }),
      ]);

      items.push(
        ...messages.map((m) => ({ type: 'message' as const, ...m })),
      );
      total += messageCount;
    }

    // Apply pagination in memory (both types combined)
    const skip = (page - 1) * limit;
    const paginated = items.slice(skip, skip + limit);

    return {
      items: paginated,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async moderateReview(
    adminId: string,
    reviewId: string,
    input: ModerateContentInput,
  ): Promise<void> {
    const review = await prisma.review.findFirst({
      where: { id: reviewId, deletedAt: null },
    });
    if (!review) throw new NotFoundError('Review', reviewId);

    await prisma.review.update({
      where: { id: reviewId },
      data: {
        moderationStatus: input.action === 'approve' ? 'approved' : 'rejected',
      },
    });

    await this.logAction({
      userId: adminId,
      action: `review_${input.action}d`,
      resourceType: 'review',
      resourceId: reviewId,
      details: { reason: input.reason },
    });
  }

  async moderateMessage(
    adminId: string,
    messageId: string,
    input: ModerateContentInput,
  ): Promise<void> {
    const message = await prisma.message.findFirst({
      where: { id: messageId, deletedAt: null },
    });
    if (!message) throw new NotFoundError('Message', messageId);

    await prisma.message.update({
      where: { id: messageId },
      data: {
        moderationStatus: input.action === 'approve' ? 'approved' : 'rejected',
      },
    });

    await this.logAction({
      userId: adminId,
      action: `message_${input.action}d`,
      resourceType: 'message',
      resourceId: messageId,
      details: { reason: input.reason },
    });
  }

  // ── Transaction Monitoring ───────────────────────────────

  async listAllTransactions(
    query: ListTransactionsQuery,
  ): Promise<{ transactions: any[]; meta: PaginationMeta }> {
    const { page, limit, status, escrowStatus } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = {};
    if (status) where.status = status as any;
    if (escrowStatus) where.escrowStatus = escrowStatus;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          buyer: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          seller: {
            select: {
              id: true,
              businessName: true,
              user: {
                select: { email: true, firstName: true, lastName: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      transactions,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Audit Log ────────────────────────────────────────────

  async listAuditLogs(
    query: ListAuditLogsQuery,
  ): Promise<{ logs: any[]; meta: PaginationMeta }> {
    const { page, limit, action, resourceType, userId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};
    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Private Helpers ──────────────────────────────────────

  private async logAction(params: {
    userId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        actorType: 'admin',
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId ?? null,
        details: (params.details ?? {}) as Prisma.InputJsonValue,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        success: true,
      },
    });
  }

  private async invalidateUserSessions(userId: string): Promise<void> {
    // Scan for all refresh tokens belonging to this user
    let cursor = '0';
    const keysToDelete: string[] = [];
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        'MATCH',
        `auth:refresh:${userId}:*`,
        'COUNT',
        100,
      );
      cursor = nextCursor;
      keysToDelete.push(...keys);
    } while (cursor !== '0');

    if (keysToDelete.length > 0) {
      await redis.del(...keysToDelete);
    }

    // Bump cached session version so in-flight access tokens are rejected
    await redis.incr(`auth:sv:${userId}`);
  }

}
