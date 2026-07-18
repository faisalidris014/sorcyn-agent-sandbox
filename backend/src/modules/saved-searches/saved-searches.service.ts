import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../../common/utils/errors.js';
import type { PaginationMeta } from '../../common/types/api.js';
import type {
  CreateSavedSearchInput,
  UpdateSavedSearchInput,
  ListSavedSearchesQuery,
} from './saved-searches.schemas.js';

const MAX_SAVED_SEARCHES = 25;

export class SavedSearchesService {

  // ── Create Saved Search ────────────────────────────────────

  async createSavedSearch(userId: string, input: CreateSavedSearchInput) {
    // Check limit
    const count = await prisma.savedSearch.count({
      where: { userId, deletedAt: null },
    });
    if (count >= MAX_SAVED_SEARCHES) {
      throw new ConflictError(`Maximum of ${MAX_SAVED_SEARCHES} saved searches allowed`);
    }

    const savedSearch = await prisma.savedSearch.create({
      data: {
        userId,
        name: input.name,
        searchType: input.searchType,
        filters: input.filters as Prisma.InputJsonValue,
        notificationsEnabled: input.notificationsEnabled,
      },
    });

    return this.toResponse(savedSearch);
  }

  // ── List Saved Searches ────────────────────────────────────

  async listSavedSearches(userId: string, query: ListSavedSearchesQuery) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.savedSearch.findMany({
        where: { userId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.savedSearch.count({
        where: { userId, deletedAt: null },
      }),
    ]);

    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    return {
      savedSearches: items.map((s) => this.toResponse(s)),
      meta,
    };
  }

  // ── Update Saved Search ────────────────────────────────────

  async updateSavedSearch(userId: string, searchId: string, input: UpdateSavedSearchInput) {
    const savedSearch = await prisma.savedSearch.findFirst({
      where: { id: searchId, deletedAt: null },
    });
    if (!savedSearch) throw new NotFoundError('Saved search', searchId);
    if (savedSearch.userId !== userId) throw new ForbiddenError('You can only update your own saved searches');

    const updated = await prisma.savedSearch.update({
      where: { id: searchId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.filters !== undefined && { filters: input.filters as Prisma.InputJsonValue }),
        ...(input.notificationsEnabled !== undefined && { notificationsEnabled: input.notificationsEnabled }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });

    return this.toResponse(updated);
  }

  // ── Delete Saved Search (soft) ─────────────────────────────

  async deleteSavedSearch(userId: string, searchId: string) {
    const savedSearch = await prisma.savedSearch.findFirst({
      where: { id: searchId, deletedAt: null },
    });
    if (!savedSearch) throw new NotFoundError('Saved search', searchId);
    if (savedSearch.userId !== userId) throw new ForbiddenError('You can only delete your own saved searches');

    await prisma.savedSearch.update({
      where: { id: searchId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  // ── Response Transformer ───────────────────────────────────

  private toResponse(s: any) {
    return {
      id: s.id,
      name: s.name,
      searchType: s.searchType,
      filters: s.filters,
      notificationsEnabled: s.notificationsEnabled,
      isActive: s.isActive,
      lastNotifiedAt: s.lastNotifiedAt?.toISOString() ?? null,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  }
}
