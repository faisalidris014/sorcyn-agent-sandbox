import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../../common/utils/errors.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import type { PaginationMeta } from '../../common/types/api.js';
import type {
  CreateDisputeInput,
  ListMyDisputesQuery,
  SubmitEvidenceInput,
  AppealDisputeInput,
} from './disputes.schemas.js';

const EVIDENCE_DEADLINE_DAYS = 7;

export class DisputesService {
  private notificationsService = new NotificationsService();

  // ── Create Dispute ─────────────────────────────────────────

  async createDispute(userId: string, input: CreateDisputeInput) {
    // Load transaction with seller user info
    const transaction = await prisma.transaction.findFirst({
      where: { id: input.transactionId, deletedAt: null },
      include: {
        seller: { include: { user: { select: { id: true } } } },
        post: { select: { id: true, title: true } },
      },
    });
    if (!transaction) throw new NotFoundError('Transaction', input.transactionId);

    // Determine caller's role
    const isBuyer = transaction.buyerId === userId;
    let isSeller = false;
    if (!isBuyer) {
      try {
        const sellerProfile = await this.getSellerProfile(userId);
        isSeller = sellerProfile.id === transaction.sellerId;
      } catch {
        // Not a seller
      }
    }
    if (!isBuyer && !isSeller) {
      throw new ForbiddenError('Only the buyer or seller on this transaction can file a dispute');
    }

    // Check for existing active dispute
    const existingDispute = await prisma.dispute.findFirst({
      where: {
        transactionId: input.transactionId,
        status: { in: ['open', 'under_review'] },
        deletedAt: null,
      },
    });
    if (existingDispute) {
      throw new ConflictError('An active dispute already exists for this transaction');
    }

    // Build evidence
    const evidenceJson = input.evidence as unknown as Prisma.InputJsonValue;
    const evidenceDeadline = new Date();
    evidenceDeadline.setDate(evidenceDeadline.getDate() + EVIDENCE_DEADLINE_DAYS);

    // Create dispute
    const dispute = await prisma.dispute.create({
      data: {
        transactionId: input.transactionId,
        postId: transaction.postId,
        openedById: userId,
        buyerId: transaction.buyerId,
        sellerId: transaction.sellerId,
        disputeType: input.disputeType,
        description: input.description,
        requestedResolution: input.requestedResolution,
        requestedAmount: input.requestedAmount,
        buyerEvidence: isBuyer ? evidenceJson : Prisma.JsonNull,
        sellerEvidence: isSeller ? evidenceJson : Prisma.JsonNull,
        evidenceDeadline,
      },
      include: {
        transaction: { select: { id: true, transactionType: true, status: true } },
        post: { select: { id: true, title: true } },
      },
    });

    // Update transaction status to disputed
    await prisma.transaction.update({
      where: { id: input.transactionId },
      data: { status: 'disputed' },
    });

    // Notify the other party
    const recipientId = isBuyer ? transaction.seller.user.id : transaction.buyerId;
    this.notificationsService.createNotification({
      userId: recipientId,
      type: 'dispute_opened',
      title: 'Dispute Filed',
      message: `A dispute has been filed on transaction for "${transaction.post.title}"`,
      data: { disputeId: dispute.id, transactionId: input.transactionId },
      channels: ['push', 'email', 'in_app'],
    }).catch(() => {}); // fire-and-forget

    return this.toDisputeResponse(dispute);
  }

  // ── List My Disputes ───────────────────────────────────────

  async listMyDisputes(userId: string, query: ListMyDisputesQuery) {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    // Find disputes where user is buyer, seller's user, or opener
    let sellerProfileId: string | undefined;
    try {
      const sellerProfile = await this.getSellerProfile(userId);
      sellerProfileId = sellerProfile.id;
    } catch {
      // Not a seller — that's fine
    }

    const where: Prisma.DisputeWhereInput = {
      deletedAt: null,
      ...(status && { status }),
      OR: [
        { buyerId: userId },
        { openedById: userId },
        ...(sellerProfileId ? [{ sellerId: sellerProfileId }] : []),
      ],
    };

    const [items, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        include: {
          transaction: { select: { id: true, transactionType: true, status: true } },
          post: { select: { id: true, title: true } },
        },
        orderBy: { openedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.dispute.count({ where }),
    ]);

    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    return {
      disputes: items.map((d) => this.toDisputeResponse(d)),
      meta,
    };
  }

  // ── Get Dispute Detail ─────────────────────────────────────

  async getDisputeDetail(userId: string, disputeId: string) {
    const dispute = await prisma.dispute.findFirst({
      where: { id: disputeId, deletedAt: null },
      include: {
        transaction: {
          select: {
            id: true,
            transactionType: true,
            status: true,
            quoteAmount: true,
            totalCharged: true,
          },
        },
        post: { select: { id: true, title: true } },
        openedBy: { select: { id: true, firstName: true, lastName: true } },
        buyer: { select: { id: true, firstName: true, lastName: true } },
        seller: {
          select: {
            id: true,
            businessName: true,
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!dispute) throw new NotFoundError('Dispute', disputeId);

    // Verify participant access
    const isParticipant =
      dispute.buyerId === userId ||
      dispute.openedById === userId ||
      dispute.seller.user.id === userId;
    if (!isParticipant) throw new ForbiddenError('You are not a participant in this dispute');

    return this.toDisputeDetailResponse(dispute);
  }

  // ── Submit Evidence ────────────────────────────────────────

  async submitEvidence(userId: string, disputeId: string, input: SubmitEvidenceInput) {
    const dispute = await prisma.dispute.findFirst({
      where: { id: disputeId, deletedAt: null },
      include: {
        seller: { select: { id: true, user: { select: { id: true } } } },
      },
    });
    if (!dispute) throw new NotFoundError('Dispute', disputeId);

    // Verify participant
    const isBuyer = dispute.buyerId === userId;
    const isSeller = dispute.seller.user.id === userId;
    if (!isBuyer && !isSeller) throw new ForbiddenError('You are not a participant in this dispute');

    // Check dispute is still open for evidence
    if (!['open', 'under_review'].includes(dispute.status)) {
      throw new ConflictError('Evidence can only be submitted for open or under review disputes');
    }

    // Check evidence deadline
    if (dispute.evidenceDeadline && new Date() > dispute.evidenceDeadline) {
      throw new ConflictError('Evidence submission deadline has passed');
    }

    // Append evidence to the appropriate field
    const newEvidence = input.evidence as unknown as Prisma.InputJsonValue[];
    if (isBuyer) {
      const existing = (dispute.buyerEvidence as unknown as any[]) || [];
      await prisma.dispute.update({
        where: { id: disputeId },
        data: {
          buyerEvidence: [...existing, ...newEvidence] as unknown as Prisma.InputJsonValue,
        },
      });
    } else {
      const existing = (dispute.sellerEvidence as unknown as any[]) || [];
      await prisma.dispute.update({
        where: { id: disputeId },
        data: {
          sellerEvidence: [...existing, ...newEvidence] as unknown as Prisma.InputJsonValue,
        },
      });
    }

    return { message: 'Evidence submitted successfully' };
  }

  // ── Appeal Dispute ─────────────────────────────────────────

  async appealDispute(userId: string, disputeId: string, input: AppealDisputeInput) {
    const dispute = await prisma.dispute.findFirst({
      where: { id: disputeId, deletedAt: null },
      include: {
        seller: { select: { id: true, user: { select: { id: true } } } },
        post: { select: { id: true, title: true } },
      },
    });
    if (!dispute) throw new NotFoundError('Dispute', disputeId);

    // Verify participant
    const isBuyer = dispute.buyerId === userId;
    const isSeller = dispute.seller.user.id === userId;
    if (!isBuyer && !isSeller) throw new ForbiddenError('You are not a participant in this dispute');

    // Only resolved disputes can be appealed
    if (dispute.status !== 'resolved') {
      throw new ConflictError('Only resolved disputes can be appealed');
    }

    // Append appeal evidence
    const appealEvidence = input.additionalEvidence as unknown as Prisma.InputJsonValue[];
    const evidenceField = isBuyer ? 'buyerEvidence' : 'sellerEvidence';
    const existing = (dispute[evidenceField] as unknown as any[]) || [];

    const updated = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: 'appealed',
        tier: 2, // Escalate
        [evidenceField]: [...existing, ...appealEvidence] as unknown as Prisma.InputJsonValue,
        resolvedAt: null, // Reset resolution
      },
      include: {
        transaction: { select: { id: true, transactionType: true, status: true } },
        post: { select: { id: true, title: true } },
      },
    });

    // Notify the other party
    const recipientId = isBuyer ? dispute.seller.user.id : dispute.buyerId;
    this.notificationsService.createNotification({
      userId: recipientId,
      type: 'dispute_appealed',
      title: 'Dispute Appealed',
      message: `A dispute appeal has been filed for "${dispute.post.title}"`,
      data: { disputeId: dispute.id },
      channels: ['push', 'email', 'in_app'],
    }).catch(() => {}); // fire-and-forget

    return this.toDisputeResponse(updated);
  }

  // ── Private Helpers ────────────────────────────────────────

  private async getSellerProfile(userId: string) {
    const seller = await prisma.sellerProfile.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!seller) throw new NotFoundError('Seller profile');
    return seller;
  }

  private toDisputeResponse(d: any) {
    return {
      id: d.id,
      transactionId: d.transactionId,
      postId: d.postId,
      openedById: d.openedById,
      disputeType: d.disputeType,
      description: d.description,
      requestedResolution: d.requestedResolution ?? null,
      requestedAmount: d.requestedAmount ? Number(d.requestedAmount) : null,
      status: d.status,
      tier: d.tier,
      outcome: d.outcome ?? null,
      refundAmount: d.refundAmount ? Number(d.refundAmount) : null,
      resolutionSummary: d.resolutionSummary ?? null,
      evidenceDeadline: d.evidenceDeadline?.toISOString() ?? null,
      openedAt: d.openedAt.toISOString(),
      resolvedAt: d.resolvedAt?.toISOString() ?? null,
      transaction: d.transaction ?? undefined,
      post: d.post ?? undefined,
      createdAt: d.createdAt.toISOString(),
    };
  }

  private toDisputeDetailResponse(d: any) {
    return {
      ...this.toDisputeResponse(d),
      buyerId: d.buyerId,
      sellerId: d.sellerId,
      buyerEvidence: d.buyerEvidence,
      sellerEvidence: d.sellerEvidence,
      sellerPayoutAmount: d.sellerPayoutAmount ? Number(d.sellerPayoutAmount) : null,
      assignedAgentId: d.assignedAgentId ?? null,
      estimatedResolutionAt: d.estimatedResolutionAt?.toISOString() ?? null,
      openedBy: d.openedBy,
      buyer: d.buyer,
      seller: d.seller ? {
        id: d.seller.id,
        businessName: d.seller.businessName,
        user: d.seller.user,
      } : undefined,
    };
  }
}
