import { prisma } from '../../config/database.js';
import {
  NotFoundError,
  ForbiddenError,
} from '../../common/utils/errors.js';
import type { PaginationMeta } from '../../common/types/api.js';
import type { ListPayoutsQuery } from './payouts.schemas.js';

export class PayoutsService {

  // ── List Payouts ───────────────────────────────────────────

  async listPayouts(userId: string, query: ListPayoutsQuery) {
    const seller = await this.getSellerProfile(userId);
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where = {
      sellerId: seller.id,
      deletedAt: null,
      ...(status && { status }),
    };

    const [items, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        include: {
          transaction: {
            select: {
              id: true,
              transactionType: true,
              post: { select: { id: true, title: true } },
            },
          },
        },
        orderBy: { initiatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payout.count({ where }),
    ]);

    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    return {
      payouts: items.map((p) => this.toPayoutResponse(p)),
      meta,
    };
  }

  // ── Payout Detail ──────────────────────────────────────────

  async getPayoutDetail(userId: string, payoutId: string) {
    const seller = await this.getSellerProfile(userId);

    const payout = await prisma.payout.findFirst({
      where: { id: payoutId, deletedAt: null },
      include: {
        transaction: {
          select: {
            id: true,
            transactionType: true,
            status: true,
            quoteAmount: true,
            totalCharged: true,
            post: { select: { id: true, title: true } },
          },
        },
      },
    });
    if (!payout) throw new NotFoundError('Payout', payoutId);
    if (payout.sellerId !== seller.id) throw new ForbiddenError('You can only view your own payouts');

    return this.toPayoutResponse(payout);
  }

  // ── Payouts Summary ────────────────────────────────────────

  async getPayoutsSummary(userId: string) {
    const seller = await this.getSellerProfile(userId);
    const baseWhere = { sellerId: seller.id, deletedAt: null };

    const [paid, pending, inTransit, allFees] = await Promise.all([
      prisma.payout.aggregate({
        where: { ...baseWhere, status: 'paid' },
        _sum: { netPayout: true },
        _count: true,
      }),
      prisma.payout.aggregate({
        where: { ...baseWhere, status: 'pending' },
        _sum: { netPayout: true },
        _count: true,
      }),
      prisma.payout.aggregate({
        where: { ...baseWhere, status: 'in_transit' },
        _sum: { netPayout: true },
        _count: true,
      }),
      prisma.payout.aggregate({
        where: { ...baseWhere, status: 'paid' },
        _sum: { platformFee: true },
      }),
    ]);

    return {
      totalEarned: Number(paid._sum.netPayout ?? 0),
      totalPending: Number(pending._sum.netPayout ?? 0),
      totalInTransit: Number(inTransit._sum.netPayout ?? 0),
      totalPlatformFees: Number(allFees._sum.platformFee ?? 0),
      payoutCount: paid._count,
      pendingCount: pending._count,
      inTransitCount: inTransit._count,
      currency: 'USD',
    };
  }

  // ── Private Helpers ────────────────────────────────────────

  private async getSellerProfile(userId: string) {
    const seller = await prisma.sellerProfile.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!seller) throw new NotFoundError('Seller profile');
    return seller;
  }

  private toPayoutResponse(p: any) {
    return {
      id: p.id,
      transactionId: p.transactionId,
      grossAmount: Number(p.grossAmount),
      platformFee: Number(p.platformFee),
      platformFeePercentage: Number(p.platformFeePercentage),
      netPayout: Number(p.netPayout),
      currency: p.currency,
      status: p.status,
      stripeTransferId: p.stripeTransferId ?? null,
      stripePayoutId: p.stripePayoutId ?? null,
      bankAccountLast4: p.bankAccountLast4 ?? null,
      bankName: p.bankName ?? null,
      initiatedAt: p.initiatedAt.toISOString(),
      estimatedArrival: p.estimatedArrival?.toISOString() ?? null,
      paidAt: p.paidAt?.toISOString() ?? null,
      failedAt: p.failedAt?.toISOString() ?? null,
      failureReason: p.failureReason ?? null,
      receiptUrl: p.receiptUrl ?? null,
      transaction: p.transaction ? {
        id: p.transaction.id,
        transactionType: p.transaction.transactionType,
        status: p.transaction.status,
        quoteAmount: p.transaction.quoteAmount ? Number(p.transaction.quoteAmount) : undefined,
        totalCharged: p.transaction.totalCharged ? Number(p.transaction.totalCharged) : undefined,
        post: p.transaction.post,
      } : undefined,
      createdAt: p.createdAt.toISOString(),
    };
  }
}
