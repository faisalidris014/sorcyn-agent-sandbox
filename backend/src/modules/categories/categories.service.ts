import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../common/utils/errors.js';
import type {
  ListCategoriesQuery,
  CategoryResponse,
  CategoryWithChildren,
  CategoryTreeNode,
} from './categories.schemas.js';

export class CategoriesService {
  async listCategories(query: ListCategoriesQuery): Promise<CategoryResponse[]> {
    const where: Prisma.CategoryWhereInput = {};

    if (query.parentId) {
      where.parentCategoryId = query.parentId;
    } else {
      where.parentCategoryId = null; // top-level only by default
    }

    if (query.activeOnly) {
      where.isActive = true;
    }

    if (query.mvpOnly) {
      where.enabledInMvp = true;
    }

    // Filter by marketplace context (JSON array contains the value)
    if (query.context) {
      where.marketplaceContexts = {
        array_contains: [query.context],
      };
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    return categories.map(this.toCategoryResponse);
  }

  async getCategoryBySlug(slug: string): Promise<CategoryWithChildren> {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        children: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundError('Category');
    }

    return {
      ...this.toCategoryResponse(category),
      children: category.children.map(this.toCategoryResponse),
    };
  }

  async getCategoryTree(context?: 'b2c' | 'b2b' | 'c2c'): Promise<CategoryTreeNode[]> {
    const topLevelWhere: Prisma.CategoryWhereInput = {
      parentCategoryId: null,
      isActive: true,
    };
    const childWhere: Prisma.CategoryWhereInput = {
      isActive: true,
    };

    // Filter by marketplace context if provided
    if (context) {
      topLevelWhere.marketplaceContexts = { array_contains: [context] };
      childWhere.marketplaceContexts = { array_contains: [context] };
    }

    const topLevel = await prisma.category.findMany({
      where: topLevelWhere,
      include: {
        children: {
          where: childWhere,
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return topLevel.map((cat) => ({
      ...this.toCategoryResponse(cat),
      children: cat.children.map(this.toCategoryResponse),
    }));
  }

  private toCategoryResponse(category: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    icon: string | null;
    parentCategoryId: string | null;
    sortOrder: number;
    isActive: boolean;
    enabledInMvp: boolean;
  }): CategoryResponse {
    return {
      id: category.id,
      slug: category.slug,
      name: category.name,
      description: category.description,
      icon: category.icon,
      parentCategoryId: category.parentCategoryId,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      enabledInMvp: category.enabledInMvp,
    };
  }
}
