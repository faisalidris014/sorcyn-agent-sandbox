import { prisma } from '../../config/database.js';
import {
  NotFoundError,
  ConflictError,
} from '../../common/utils/errors.js';
import type { ListSavedSellersQuery } from './saved-sellers.schemas.js';
import type { PaginationMeta } from '../../common/types/api.js';

export class SavedSellersService {
  async saveSeller(userId: string, sellerProfileId: string) {
    // Verify seller exists
    const seller = await prisma.sellerProfile.findFirst({
      where: { id: sellerProfileId, deletedAt: null },
    });
    if (!seller) throw new NotFoundError('Seller profile', sellerProfileId);

    // Prevent saving own profile
    if (seller.userId === userId) {
      throw new ConflictError('You cannot save your own seller profile');
    }

    // Check for duplicate
    const existing = await prisma.savedSeller.findUnique({
      where: { userId_sellerProfileId: { userId, sellerProfileId } },
    });
    if (existing) throw new ConflictError('Seller already saved');

    const saved = await prisma.savedSeller.create({
      data: { userId, sellerProfileId },
    });

    return { id: saved.id, sellerProfileId, savedAt: saved.createdAt };
  }

  async unsaveSeller(userId: string, sellerProfileId: string) {
    const existing = await prisma.savedSeller.findUnique({
      where: { userId_sellerProfileId: { userId, sellerProfileId } },
    });
    if (!existing) throw new NotFoundError('Saved seller');

    await prisma.savedSeller.delete({
      where: { id: existing.id },
    });
  }

  async listSavedSellers(userId: string, query: ListSavedSellersQuery) {
    const [savedSellers, total] = await Promise.all([
      prisma.savedSeller.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          sellerProfile: {
            select: {
              id: true,
              businessName: true,
              profilePhotoUrl: true,
              bio: true,
              categories: true,
              rating: true,
              totalReviews: true,
              totalCompleted: true,
              verificationTier: true,
              verificationBadges: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profilePhotoUrl: true,
                  locationCity: true,
                  locationState: true,
                },
              },
            },
          },
        },
      }),
      prisma.savedSeller.count({ where: { userId } }),
    ]);

    const meta: PaginationMeta = {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    };

    return {
      sellers: savedSellers.map((s) => ({
        savedAt: s.createdAt,
        seller: {
          id: s.sellerProfile.id,
          businessName: s.sellerProfile.businessName,
          profilePhotoUrl: s.sellerProfile.profilePhotoUrl,
          bio: s.sellerProfile.bio,
          categories: s.sellerProfile.categories,
          rating: s.sellerProfile.rating ? Number(s.sellerProfile.rating) : null,
          totalReviews: s.sellerProfile.totalReviews,
          totalCompleted: s.sellerProfile.totalCompleted,
          verificationTier: s.sellerProfile.verificationTier,
          verificationBadges: s.sellerProfile.verificationBadges,
          user: {
            id: s.sellerProfile.user.id,
            firstName: s.sellerProfile.user.firstName,
            lastName: s.sellerProfile.user.lastName,
            profilePhotoUrl: s.sellerProfile.user.profilePhotoUrl,
            locationCity: s.sellerProfile.user.locationCity,
            locationState: s.sellerProfile.user.locationState,
          },
        },
      })),
      meta,
    };
  }

  async isSaved(userId: string, sellerProfileId: string): Promise<boolean> {
    const count = await prisma.savedSeller.count({
      where: { userId, sellerProfileId },
    });
    return count > 0;
  }
}
