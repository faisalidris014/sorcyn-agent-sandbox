import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} from '../../common/utils/errors.js';
import type {
  CreatePostInput,
  UpdatePostInput,
  ListMyPostsQuery,
  FeedQuery,
  SearchPostsQuery,
  DiscoverFeedQuery,
  CreateFromOfferInput,
} from './posts.schemas.js';
import type { PaginationMeta } from '../../common/types/api.js';
import { haversineDistance } from '../../common/utils/geo.js';
import { isFreeEmailDomain } from '../../common/utils/email-domain.js';
import { enqueueImageScan } from '../../config/bullmq.js';

const MAX_ACTIVE_POSTS = 10;
const EXTENSION_DAYS = 3;
const MAX_EXTENSIONS = 1;
const TOP_JOB_MATCH_LIMIT = 25;
// Private-offer exclusivity window: how long after a post goes active that
// sellers' offers stay private to the buyer before the post is visible to all.
export const EXCLUSIVITY_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours

export class PostsService {
  // ── Create Post ───────────────────────────────────────────────

  async createPost(userId: string, input: CreatePostInput, requestContext?: 'b2c' | 'b2b' | 'c2c') {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) throw new NotFoundError('User');

    // Email must be verified for active posts (not drafts)
    if (input.status === 'active' && !user.emailVerified) {
      throw new ForbiddenError('Email must be verified before posting');
    }

    // v2.2: Business accounts cannot publish listings until EIN and sales-tax
    // certificate are uploaded AND at least pending verification (manual admin
    // review in MVP per PRD §11.1.460).
    if (input.status === 'active' && user.isBusiness) {
      const sp = await prisma.sellerProfile.findUnique({
        where: { userId },
        select: {
          id: true,
          einVerified: true,
          salesTaxVerified: true,
          salesTaxCertificateUrl: true,
        },
      });
      const allVerified = !!sp && sp.einVerified && sp.salesTaxVerified;
      if (!allVerified) {
        const hasEinUpload = !!user.ein;
        const hasCertUpload = !!sp?.salesTaxCertificateUrl;

        let einPending = sp?.einVerified ?? false;
        let salesTaxPending = sp?.salesTaxVerified ?? false;

        if (sp && (!einPending || !salesTaxPending)) {
          const pendingReqs = await prisma.verificationRequest.findMany({
            where: {
              sellerId: sp.id,
              verificationType: { in: ['ein', 'sales_tax'] },
              status: { in: ['pending', 'under_review', 'approved'] },
              deletedAt: null,
            },
            select: { verificationType: true },
          });
          for (const r of pendingReqs) {
            if (r.verificationType === 'ein') einPending = true;
            if (r.verificationType === 'sales_tax') salesTaxPending = true;
          }
        }

        if (!hasEinUpload || !hasCertUpload || !einPending || !salesTaxPending) {
          throw new ForbiddenError(
            'BUSINESS_VERIFICATION_REQUIRED: Business accounts must upload EIN and sales-tax certificate AND submit them for verification before publishing listings.',
          );
        }
      }
    }

    // Max 10 active posts
    if (input.status === 'active') {
      const activeCount = await prisma.post.count({
        where: { buyerId: userId, status: 'active', deletedAt: null },
      });
      if (activeCount >= MAX_ACTIVE_POSTS) {
        throw new ConflictError(`Maximum ${MAX_ACTIVE_POSTS} active posts allowed`);
      }
    }

    // Validate category exists and is MVP-enabled
    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
    });
    if (!category) throw new NotFoundError('Category');
    if (!category.enabledInMvp) {
      throw new ValidationError('This category is not available yet');
    }

    // Validate subcategory — required on every post (#321) and must belong to the category
    const sub = await prisma.category.findUnique({
      where: { id: input.subcategoryId },
    });
    if (!sub) throw new NotFoundError('Subcategory');
    if (sub.parentCategoryId !== input.categoryId) {
      throw new ValidationError('Subcategory does not belong to the selected category');
    }

    // Jobs category gate (Phase 3 plan 07): block free-email-domain users from
    // creating Jobs posts. Enforced at post creation, not registration — free-email
    // users can still register and post Services/Products.
    const isJobsPost = await this.isJobsCategory(input.categoryId, input.subcategoryId);
    if (isJobsPost) {
      if (isFreeEmailDomain(user.email)) {
        throw new ForbiddenError(
          'Jobs posts require a company email. Free email providers (gmail, yahoo, etc.) are not supported for employer postings.',
        );
      }
      // Validate roleTier is present and one of the allowed values
      const cs = (input.categorySpecific ?? {}) as Record<string, unknown>;
      const tier = cs['roleTier'];
      if (tier !== 'entry' && tier !== 'mid' && tier !== 'specialized_senior') {
        throw new ValidationError(
          'Jobs posts require categorySpecific.roleTier to be one of: entry, mid, specialized_senior',
        );
      }
    }

    // Validate product-specific fields when category is under "Products"
    if (await this.isProductCategory(input.categoryId, input.subcategoryId)) {
      const { productCategorySpecificSchema } = await import('./posts.schemas.js');
      const result = productCategorySpecificSchema.safeParse(input.categorySpecific);
      if (!result.success) {
        throw new ValidationError(
          `Product posts require a condition field (new, like_new, excellent, good, fair, poor). ${result.error.issues.map((i) => i.message).join(', ')}`,
        );
      }
    }

    // Calculate expiry and exclusivity window (drafts don't expire)
    const expiresAt =
      input.status === 'active'
        ? new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000)
        : null;
    const publicAfter =
      input.status === 'active'
        ? new Date(Date.now() + EXCLUSIVITY_WINDOW_MS) // private-offer exclusivity window
        : null;

    // Resolve marketplace context: explicit input > request header > user default
    const marketplaceContext = input.marketplaceContext ?? requestContext ?? 'b2c';

    const post = await prisma.post.create({
      data: {
        buyerId: userId,
        categoryId: input.categoryId,
        subcategoryId: input.subcategoryId,
        title: input.title,
        description: input.description,
        photos: input.photos,
        videos: input.videos,
        budgetMin: input.budgetMin ?? null,
        budgetMax: input.budgetMax ?? null,
        budgetType: input.budgetType,
        locationAddress: input.locationAddress ?? null,
        locationCity: input.locationCity ?? null,
        locationState: input.locationState ?? null,
        locationZip: input.locationZip ?? null,
        locationCountry: input.locationCountry,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        urgency: input.urgency ?? null,
        preferredDate: input.preferredDate ? new Date(input.preferredDate) : null,
        preferredTime: input.preferredTime ?? null,
        categorySpecific: input.categorySpecific as Prisma.InputJsonValue,
        requirements: input.requirements as Prisma.InputJsonValue,
        marketplaceContext,
        status: input.status,
        expiresAt,
        publicAfter,
      },
      include: {
        category: { select: { id: true, slug: true, name: true } },
        subcategory: { select: { id: true, slug: true, name: true } },
      },
    });

    // Copyright staydown: fingerprint each uploaded image against the takedown
    // blocklist server-side (#313). Fire-and-forget — never blocks post creation.
    void enqueueImageScan(input.photos, userId, { postId: post.id });

    const postResponse = this.toPostResponse(post);
    if (isJobsPost && post.status === 'active') {
      void this.notifyTopMatchedJobSellers(post.id, post.categoryId);
    }
    return postResponse;
  }

  // ── Get Post by ID ────────────────────────────────────────────

  async getPostById(postId: string, requestingUserId?: string) {
    const post = await prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
      include: {
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
            rating: true,
            totalReviews: true,
            emailVerified: true,
            locationCity: true,
            locationState: true,
            email: true,
            accountType: true,
            createdAt: true,
          },
        },
        category: { select: { id: true, slug: true, name: true } },
        subcategory: { select: { id: true, slug: true, name: true } },
      },
    });

    if (!post) throw new NotFoundError('Post', postId);

    // Drafts are only visible to the owner
    if (post.status === 'draft' && post.buyerId !== requestingUserId) {
      throw new NotFoundError('Post', postId);
    }

    // Posts in the exclusivity window are private to the buyer owner — plus any
    // seller who already has a live offer on the post (so a seller who offered,
    // incl. after a resubmit that restarts the window, can still view it).
    if (
      post.publicAfter &&
      post.publicAfter > new Date() &&
      post.buyerId !== requestingUserId
    ) {
      const hasOffer = requestingUserId
        ? await prisma.offer.findFirst({
            where: {
              postId,
              deletedAt: null,
              seller: { userId: requestingUserId },
            },
            select: { id: true },
          })
        : null;
      if (!hasOffer) {
        throw new NotFoundError('Post', postId);
      }
    }

    // Increment view count for non-owners
    if (requestingUserId !== post.buyerId) {
      await prisma.post.update({
        where: { id: postId },
        data: { viewCount: { increment: 1 } },
      });
    }

    const funded = await this.isFundedRequester(post.id, post.buyerId, requestingUserId);

    return {
      ...this.redactPiiIfUnfunded(
        this.stripBudgetForNonOwner(this.toPostResponse(post), requestingUserId),
        funded,
      ),
      buyer: {
        id: post.buyer.id,
        firstName: post.buyer.firstName,
        lastName: post.buyer.lastName,
        profilePhotoUrl: post.buyer.profilePhotoUrl,
        rating: post.buyer.rating ? Number(post.buyer.rating) : null,
        totalReviews: post.buyer.totalReviews,
        emailVerified: post.buyer.emailVerified,
        locationCity: post.buyer.locationCity,
        locationState: post.buyer.locationState,
        email: funded ? post.buyer.email : null,
        accountType: post.buyer.accountType,
        createdAt: post.buyer.createdAt,
      },
      isOwner: requestingUserId === post.buyerId,
      canEdit: post.buyerId === requestingUserId && post.status !== 'cancelled',
      canExtend: post.buyerId === requestingUserId && post.status === 'active' && post.extendedCount < MAX_EXTENSIONS,
    };
  }

  // ── Get My Posts ──────────────────────────────────────────────

  async getMyPosts(userId: string, query: ListMyPostsQuery) {
    const where: Prisma.PostWhereInput = {
      buyerId: userId,
      deletedAt: null,
    };

    if (query.status) where.status = query.status;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.marketplaceContext) where.marketplaceContext = query.marketplaceContext;

    const orderBy: Prisma.PostOrderByWithRelationInput = (() => {
      switch (query.sort) {
        case 'oldest': return { createdAt: 'asc' as const };
        case 'expiring_soon': return { expiresAt: 'asc' as const };
        case 'most_offers': return { offerCount: 'desc' as const };
        case 'newest':
        default: return { createdAt: 'desc' as const };
      }
    })();

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          category: { select: { id: true, slug: true, name: true } },
          subcategory: { select: { id: true, slug: true, name: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);

    const meta: PaginationMeta = {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    };

    return {
      posts: posts.map(this.toPostResponse),
      meta,
    };
  }

  // ── Update Post ───────────────────────────────────────────────

  async updatePost(userId: string, postId: string, input: UpdatePostInput) {
    const post = await prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
    });
    if (!post) throw new NotFoundError('Post', postId);
    if (post.buyerId !== userId) throw new ForbiddenError('You can only edit your own posts');
    if (post.status === 'cancelled') throw new ConflictError('Cannot edit a cancelled post');

    // Block editing if post has an active (non-terminal) transaction
    const activeTransaction = await prisma.transaction.findFirst({
      where: {
        postId,
        status: { notIn: ['approved', 'cancelled', 'disputed'] },
        deletedAt: null,
      },
    });
    if (activeTransaction) {
      throw new ConflictError('Cannot edit a post with an active transaction');
    }

    // If publishing a draft, check active post limit and email verification
    if (input.status === 'active' && post.status === 'draft') {
      const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
      if (!user?.emailVerified) {
        throw new ForbiddenError('Email must be verified before posting');
      }
      const activeCount = await prisma.post.count({
        where: { buyerId: userId, status: 'active', deletedAt: null },
      });
      if (activeCount >= MAX_ACTIVE_POSTS) {
        throw new ConflictError(`Maximum ${MAX_ACTIVE_POSTS} active posts allowed`);
      }
    }

    // Validate category/subcategory consistency when either is changing (#321).
    // Subcategory is required on every post; an update may not clear it or leave it
    // mismatched against the (possibly new) top-level category.
    if (input.categoryId !== undefined || input.subcategoryId !== undefined) {
      const effectiveCategoryId = input.categoryId ?? post.categoryId;
      const effectiveSubcategoryId = input.subcategoryId ?? post.subcategoryId;
      if (!effectiveSubcategoryId) {
        throw new ValidationError('A subcategory is required for this post');
      }
      const sub = await prisma.category.findUnique({ where: { id: effectiveSubcategoryId } });
      if (!sub) throw new NotFoundError('Subcategory');
      if (sub.parentCategoryId !== effectiveCategoryId) {
        throw new ValidationError('Subcategory does not belong to the selected category');
      }
    }

    const data: Prisma.PostUpdateInput = {};

    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.categoryId !== undefined) data.category = { connect: { id: input.categoryId } };
    if (input.subcategoryId !== undefined) {
      data.subcategory = { connect: { id: input.subcategoryId } };
    }
    if (input.photos !== undefined) data.photos = input.photos;
    if (input.videos !== undefined) data.videos = input.videos;
    if (input.budgetMin !== undefined) data.budgetMin = input.budgetMin;
    if (input.budgetMax !== undefined) data.budgetMax = input.budgetMax;
    if (input.budgetType !== undefined) data.budgetType = input.budgetType;
    if (input.locationAddress !== undefined) data.locationAddress = input.locationAddress;
    if (input.locationCity !== undefined) data.locationCity = input.locationCity;
    if (input.locationState !== undefined) data.locationState = input.locationState;
    if (input.locationZip !== undefined) data.locationZip = input.locationZip;
    if (input.locationCountry !== undefined) data.locationCountry = input.locationCountry;
    if (input.latitude !== undefined) data.latitude = input.latitude;
    if (input.longitude !== undefined) data.longitude = input.longitude;
    if (input.urgency !== undefined) data.urgency = input.urgency;
    if (input.preferredDate !== undefined) {
      data.preferredDate = input.preferredDate ? new Date(input.preferredDate) : null;
    }
    if (input.preferredTime !== undefined) data.preferredTime = input.preferredTime;
    if (input.categorySpecific !== undefined) data.categorySpecific = input.categorySpecific as Prisma.InputJsonValue;
    if (input.requirements !== undefined) data.requirements = input.requirements as Prisma.InputJsonValue;

    // Publishing a draft — set expiresAt and exclusivity window
    if (input.status === 'active' && post.status === 'draft') {
      data.status = 'active';
      data.expiresAt = new Date(Date.now() + 720 * 60 * 60 * 1000); // 30 days
      data.publicAfter = new Date(Date.now() + EXCLUSIVITY_WINDOW_MS); // private-offer exclusivity
    } else if (input.status !== undefined) {
      data.status = input.status;
    }

    const updated = await prisma.post.update({
      where: { id: postId },
      data,
      include: {
        category: { select: { id: true, slug: true, name: true } },
        subcategory: { select: { id: true, slug: true, name: true } },
      },
    });

    // Copyright staydown: scan only the newly added images (#313). Fire-and-forget.
    if (input.photos !== undefined) {
      const existing = Array.isArray(post.photos) ? (post.photos as string[]) : [];
      const added = input.photos.filter((url) => !existing.includes(url));
      void enqueueImageScan(added, userId, { postId });
    }

    // If post had pending offers, mark them as needing reconfirmation and notify sellers
    if (post.offerCount > 0 && post.status === 'active') {
      const pendingOffers = await prisma.offer.findMany({
        where: { postId, status: 'pending', deletedAt: null },
        select: { id: true, seller: { select: { userId: true } } },
      });

      if (pendingOffers.length > 0) {
        await prisma.offer.updateMany({
          where: { postId, status: 'pending', deletedAt: null },
          data: { status: 'needs_reconfirmation' },
        });

        // Notify each seller (fire-and-forget)
        const { NotificationsService } = await import('../notifications/notifications.service.js');
        const notificationsService = new NotificationsService();
        await Promise.allSettled(
          pendingOffers.map((offer) =>
            notificationsService.createNotification({
              userId: offer.seller.userId,
              type: 'post_edited',
              title: 'Post Updated',
              message: `The buyer updated "${updated.title}". Please review the changes and reconfirm your offer.`,
              data: { postId, offerId: offer.id },
              channels: ['push', 'in_app'],
              actionUrl: `/posts/${postId}`,
            }),
          ),
        );
      }
    }

    return this.toPostResponse(updated);
  }

  // ── Delete Post ───────────────────────────────────────────────

  async deletePost(userId: string, postId: string) {
    const post = await prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
    });
    if (!post) throw new NotFoundError('Post', postId);
    if (post.buyerId !== userId) throw new ForbiddenError('You can only delete your own posts');

    await prisma.post.update({
      where: { id: postId },
      data: { status: 'cancelled', deletedAt: new Date() },
    });
  }

  // ── Archive Post ──────────────────────────────────────────────

  async archivePost(userId: string, postId: string) {
    const post = await prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
    });
    if (!post) throw new NotFoundError('Post', postId);
    if (post.buyerId !== userId) throw new ForbiddenError('You can only archive your own posts');
    if (!['expired', 'filled', 'cancelled'].includes(post.status)) {
      throw new ConflictError('Can only archive expired, filled, or cancelled posts');
    }

    await prisma.post.update({
      where: { id: postId },
      data: { status: 'archived' },
    });

    return { postId, status: 'archived' };
  }

  // ── Extend Post ───────────────────────────────────────────────

  async extendPost(userId: string, postId: string) {
    const post = await prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
    });
    if (!post) throw new NotFoundError('Post', postId);
    if (post.buyerId !== userId) throw new ForbiddenError('You can only extend your own posts');
    if (post.status !== 'active') throw new ConflictError('Can only extend active posts');
    if (post.extendedCount >= MAX_EXTENSIONS) {
      throw new ConflictError('Post has already been extended the maximum number of times');
    }

    const currentExpiry = post.expiresAt ?? new Date();
    const newExpiry = new Date(currentExpiry.getTime() + EXTENSION_DAYS * 24 * 60 * 60 * 1000);

    const updated = await prisma.post.update({
      where: { id: postId },
      data: {
        expiresAt: newExpiry,
        extendedCount: { increment: 1 },
      },
    });

    return {
      postId: updated.id,
      newExpiresAt: updated.expiresAt,
      extensionsRemaining: MAX_EXTENSIONS - updated.extendedCount,
    };
  }

  // ── Mark Filled ───────────────────────────────────────────────

  async markFilled(userId: string, postId: string) {
    const post = await prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
    });
    if (!post) throw new NotFoundError('Post', postId);
    if (post.buyerId !== userId) throw new ForbiddenError('You can only modify your own posts');
    if (post.status !== 'active') throw new ConflictError('Can only mark active posts as filled');

    await prisma.post.update({
      where: { id: postId },
      data: { status: 'filled', filledAt: new Date() },
    });

    return { postId, status: 'filled' };
  }

  // ── Repost ────────────────────────────────────────────────────

  async repost(userId: string, postId: string) {
    const original = await prisma.post.findFirst({
      where: { id: postId, buyerId: userId, deletedAt: null },
    });
    if (!original) throw new NotFoundError('Post', postId);

    // Check active post limit
    const activeCount = await prisma.post.count({
      where: { buyerId: userId, status: 'active', deletedAt: null },
    });
    if (activeCount >= MAX_ACTIVE_POSTS) {
      throw new ConflictError(`Maximum ${MAX_ACTIVE_POSTS} active posts allowed`);
    }

    const newPost = await prisma.post.create({
      data: {
        buyerId: userId,
        categoryId: original.categoryId,
        subcategoryId: original.subcategoryId,
        title: original.title,
        description: original.description,
        photos: original.photos as Prisma.JsonArray,
        videos: original.videos as Prisma.JsonArray,
        budgetMin: original.budgetMin,
        budgetMax: original.budgetMax,
        budgetType: original.budgetType,
        locationAddress: original.locationAddress,
        locationCity: original.locationCity,
        locationState: original.locationState,
        locationZip: original.locationZip,
        locationCountry: original.locationCountry,
        latitude: original.latitude,
        longitude: original.longitude,
        urgency: original.urgency,
        preferredDate: original.preferredDate,
        preferredTime: original.preferredTime,
        categorySpecific: original.categorySpecific as Prisma.JsonObject,
        requirements: original.requirements as Prisma.JsonObject,
        marketplaceContext: original.marketplaceContext,
        status: 'active',
        expiresAt: new Date(Date.now() + 720 * 60 * 60 * 1000), // 30 days
        publicAfter: new Date(Date.now() + EXCLUSIVITY_WINDOW_MS), // private-offer exclusivity
      },
      include: {
        category: { select: { id: true, slug: true, name: true } },
        subcategory: { select: { id: true, slug: true, name: true } },
      },
    });

    return this.toPostResponse(newPost);
  }

  // ── Feed (Public) ─────────────────────────────────────────────

  async getFeed(query: FeedQuery, requestContext?: 'b2c' | 'b2b' | 'c2c', requestingUserId?: string) {
    // Targeted-seller carve-out (Addendum A-03): resolve seller categories so
    // category-matched sellers can see in-window posts during the exclusivity window.
    // Also fetch seller's lat/lng + serviceRadiusMiles to auto-apply as geo defaults
    // when the caller does not supply explicit lat/lng params (REQ-seller-feed).
    let sellerCategories: string[] | null = null;
    let isSeller = false;
    // True when the caller is an authenticated PURE-seller account that has no
    // seller profile row yet. The frontend onboarding gate normally prevents
    // this from ever reaching the feed, but we fail CLOSED here as
    // defense-in-depth so a profile-less seller never falls open onto an
    // unscoped feed (the case-1 bug). Deliberately scoped to accountType
    // 'seller' only: a 'both' account may be browsing this endpoint as a buyer,
    // so it stays unscoped for them (the gate covers their seller-mode case).
    let sellerNoProfile = false;
    let sellerLat: number | undefined;
    let sellerLng: number | undefined;
    let sellerRadius: number | undefined;

    if (requestingUserId) {
      const [seller, sellerUser] = await Promise.all([
        prisma.sellerProfile.findFirst({
          where: { userId: requestingUserId, deletedAt: null },
          select: { categories: true, serviceRadiusMiles: true },
        }),
        prisma.user.findFirst({
          where: { id: requestingUserId, deletedAt: null },
          select: { latitude: true, longitude: true, accountType: true },
        }),
      ]);
      if (seller) {
        isSeller = true;
        const cats = seller.categories;
        sellerCategories = Array.isArray(cats) && cats.length > 0 ? (cats as string[]) : null;
        sellerRadius = seller.serviceRadiusMiles;
      } else if (sellerUser?.accountType === 'seller') {
        sellerNoProfile = true;
      }
      if (sellerUser?.latitude && sellerUser?.longitude) {
        sellerLat = Number(sellerUser.latitude);
        sellerLng = Number(sellerUser.longitude);
      }
    }

    const where: Prisma.PostWhereInput = {
      status: 'active',
      deletedAt: null,
      // Always scope feed to a marketplace context
      marketplaceContext: query.marketplaceContext ?? requestContext ?? 'b2c',
      // Show posts past the exclusivity window, PLUS in-window posts for
      // category-matched (targeted) sellers.
      OR: [
        { publicAfter: null },
        { publicAfter: { lte: new Date() } },
        ...(sellerCategories && sellerCategories.length > 0
          ? [{ AND: [{ publicAfter: { gt: new Date() } }, { categoryId: { in: sellerCategories } }] }]
          : []),
      ],
    };

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.subcategoryId) where.subcategoryId = query.subcategoryId;
    if (query.urgency) where.urgency = query.urgency;
    if (query.city) where.locationCity = { equals: query.city, mode: 'insensitive' };
    if (query.state) where.locationState = { equals: query.state, mode: 'insensitive' };

    // Combine all AND-of-ORs filters into one array (Prisma overwrites a repeated key).
    const andConditions: Prisma.PostWhereInput[] = [];

    // Auto-scope the seller feed to the seller's profile categories (#301a). Applies
    // to any caller with a seller profile who hasn't passed an explicit category
    // filter. Match either the post's parent category or its subcategory so it works
    // whether the seller stored a parent or a subcategory id (#301b). Fail CLOSED:
    // a seller with no granted categories scopes to an empty set (`in: []` matches no
    // rows) → empty feed, rather than falling open and seeing every post. Buyers /
    // unauthenticated callers have no seller profile (isSeller=false) → unscoped.
    const hasExplicitCategoryFilter =
      query.categoryId !== undefined || query.subcategoryId !== undefined;
    if (isSeller && !hasExplicitCategoryFilter) {
      const scopeIds = sellerCategories ?? [];
      andConditions.push({
        OR: [
          { categoryId: { in: scopeIds } },
          { subcategoryId: { in: scopeIds } },
        ],
      });
    } else if (sellerNoProfile && !hasExplicitCategoryFilter) {
      // Pure-seller account with no profile → no granted categories → empty
      // feed (in: [] matches no rows). Same fail-closed shape as a seller with
      // zero granted categories above.
      andConditions.push({
        OR: [
          { categoryId: { in: [] } },
          { subcategoryId: { in: [] } },
        ],
      });
    }

    if (query.minBudget !== undefined || query.maxBudget !== undefined) {
      // NULL bounds mean "unbounded" and must not be excluded (the top-level OR is
      // already taken by visibility, so combine budget filters via AND-of-ORs).
      if (query.minBudget !== undefined) {
        // budgetMax NULL = no upper bound → satisfies any requested minimum
        andConditions.push({ OR: [{ budgetMax: null }, { budgetMax: { gte: query.minBudget } }] });
      }
      if (query.maxBudget !== undefined) {
        // budgetMin NULL = open to any minimum → satisfies any requested maximum
        andConditions.push({ OR: [{ budgetMin: null }, { budgetMin: { lte: query.maxBudget } }] });
      }
    }

    if (andConditions.length > 0) where.AND = andConditions;

    const orderBy: Prisma.PostOrderByWithRelationInput = (() => {
      switch (query.sort) {
        case 'expiring_soon': return { expiresAt: 'asc' as const };
        case 'budget_high': return { budgetMax: 'desc' as const };
        case 'budget_low': return { budgetMin: 'asc' as const };
        case 'closest': return { createdAt: 'desc' as const }; // in-memory re-sort applied after geo filter
        case 'newest':
        default: return { createdAt: 'desc' as const };
      }
    })();

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          buyer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePhotoUrl: true,
              rating: true,
              totalReviews: true,
              emailVerified: true,
            },
          },
          category: { select: { id: true, slug: true, name: true } },
          subcategory: { select: { id: true, slug: true, name: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);

    const meta: PaginationMeta = {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    };

    // Effective geo: caller-provided takes priority; fall back to seller's profile geo.
    // This ensures authenticated sellers see only posts within their service radius
    // without needing to pass lat/lng/radius on every request (REQ-seller-feed).
    const effLat = query.latitude ?? sellerLat;
    const effLng = query.longitude ?? sellerLng;
    const effRadius = query.radiusMiles ?? sellerRadius ?? 25;
    const hasGeo = effLat !== undefined && effLng !== undefined;

    // Apply geo radius filter post-fetch (Prisma can't do computed columns)
    let filteredPosts = posts;
    if (hasGeo) {
      filteredPosts = posts.filter((p) => {
        if (!p.latitude || !p.longitude) return false;
        return haversineDistance(effLat!, effLng!, Number(p.latitude), Number(p.longitude)) <= effRadius;
      });
    }

    // sort=closest: in-memory ascending distance sort after radius filter
    if (query.sort === 'closest' && hasGeo) {
      filteredPosts = [...filteredPosts].sort((a, b) => {
        const da = (a.latitude && a.longitude) ? haversineDistance(effLat!, effLng!, Number(a.latitude), Number(a.longitude)) : Infinity;
        const db = (b.latitude && b.longitude) ? haversineDistance(effLat!, effLng!, Number(b.latitude), Number(b.longitude)) : Infinity;
        return da - db;
      });
    }

    // PII gate: precompute the set of postIds the requestingUserId has funded transactions on.
    // Owners are always treated as funded for their own posts.
    let fundedPostIds = new Set<string>();
    if (requestingUserId && filteredPosts.length > 0) {
      const txs = await prisma.transaction.findMany({
        where: {
          postId: { in: filteredPosts.map((p) => p.id) },
          seller: { userId: requestingUserId, deletedAt: null },
          escrowStatus: { in: ['held', 'released'] },
          deletedAt: null,
        },
        select: { postId: true },
      });
      fundedPostIds = new Set(txs.map((t) => t.postId));
    }

    return {
      posts: filteredPosts.map((post) => {
        const distanceMiles = hasGeo && post.latitude && post.longitude
          ? Math.round(haversineDistance(effLat!, effLng!, Number(post.latitude), Number(post.longitude)) * 10) / 10
          : undefined;
        const isOwner = requestingUserId !== undefined && post.buyerId === requestingUserId;
        const funded = isOwner || fundedPostIds.has(post.id);
        return {
          ...this.redactPiiIfUnfunded(
            this.stripBudgetForNonOwner(this.toPostResponse(post)),
            funded,
          ),
          buyer: {
            id: post.buyer.id,
            firstName: post.buyer.firstName,
            lastName: post.buyer.lastName,
            profilePhotoUrl: post.buyer.profilePhotoUrl,
            rating: post.buyer.rating ? Number(post.buyer.rating) : null,
            totalReviews: post.buyer.totalReviews,
            emailVerified: post.buyer.emailVerified,
          },
          ...(distanceMiles !== undefined ? { distanceMiles } : {}),
        };
      }),
      meta: {
        ...meta,
        // Adjust total when geo filtering reduces results
        ...(hasGeo ? { total: filteredPosts.length, totalPages: Math.ceil(filteredPosts.length / query.limit) } : {}),
      },
    };
  }

  // ── Search Posts (Full-Text) ──────────────────────────────────

  async searchPosts(query: SearchPostsQuery, requestContext?: 'b2c' | 'b2b' | 'c2c') {
    // SAFETY: $queryRawUnsafe is used here for dynamic WHERE clause construction with
    // PostgreSQL full-text search (search_vector @@ plainto_tsquery). All user inputs are
    // passed as parameterized arguments via ...params (never string-interpolated), and every
    // input is Zod-validated in posts.schemas.ts (UUID, max-length strings, coerced numbers).
    // The whereClause is built from hardcoded column-name fragments with numeric $N placeholders.

    // Build WHERE clauses for additional filters
    const marketplaceCtx = query.marketplaceContext ?? requestContext ?? 'b2c';
    const conditions: string[] = [
      `p.deleted_at IS NULL`,
      `p.status = 'active'`,
      `p.search_vector @@ plainto_tsquery('english', $1)`,
      `p.marketplace_context = $2`,
      `(p.public_after IS NULL OR p.public_after <= NOW())`,
    ];
    const params: unknown[] = [query.q, marketplaceCtx];
    let paramIdx = 3;

    if (query.categoryId) {
      conditions.push(`p.category_id = $${paramIdx}`);
      params.push(query.categoryId);
      paramIdx++;
    }
    if (query.minBudget !== undefined) {
      // A NULL budget_max means "no upper bound" — such posts satisfy any minimum,
      // so include them rather than silently dropping them (NULL >= n is NULL/false).
      conditions.push(`(p.budget_max IS NULL OR p.budget_max >= $${paramIdx})`);
      params.push(query.minBudget);
      paramIdx++;
    }
    if (query.maxBudget !== undefined) {
      // A NULL budget_min means "open to any minimum" — include those too.
      conditions.push(`(p.budget_min IS NULL OR p.budget_min <= $${paramIdx})`);
      params.push(query.maxBudget);
      paramIdx++;
    }
    // Geo radius filter (Haversine) — when provided, replaces city/state exact-match
    const hasGeo = query.latitude !== undefined && query.longitude !== undefined;
    if (hasGeo) {
      const radius = query.radiusMiles ?? 25;
      const lat = query.latitude as number;
      const lng = query.longitude as number;
      conditions.push(`p.latitude IS NOT NULL`);
      conditions.push(`p.longitude IS NOT NULL`);
      // Cheap bounding-box pre-filter (SEC-M4 #264): btree-comparable lat/lng range
      // predicates prune rows before the per-row Haversine trig (acos/cos/radians)
      // runs, bounding DB CPU on unauthenticated geo searches. ~69 miles per degree
      // of latitude; longitude degrees shrink by cos(lat). The box is a strict
      // superset of the radius circle so no in-radius post is excluded — we use the
      // box edge nearest the pole (smallest cos → widest box) to stay conservative.
      const latDelta = radius / 69.0;
      const cosLat = Math.cos((Math.min(Math.abs(lat) + latDelta, 90) * Math.PI) / 180);
      const lonDelta = Math.abs(cosLat) < 1e-6 ? 180 : radius / (69.0 * Math.abs(cosLat));
      conditions.push(`p.latitude BETWEEN $${paramIdx} AND $${paramIdx + 1}`);
      conditions.push(`p.longitude BETWEEN $${paramIdx + 2} AND $${paramIdx + 3}`);
      params.push(lat - latDelta, lat + latDelta, lng - lonDelta, lng + lonDelta);
      paramIdx += 4;
      conditions.push(
        `(3959 * acos(LEAST(1.0, cos(radians($${paramIdx})) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians($${paramIdx + 1})) + sin(radians($${paramIdx})) * sin(radians(p.latitude))))) <= $${paramIdx + 2}`,
      );
      params.push(lat, lng, radius);
      paramIdx += 3;
    } else {
      if (query.city) {
        conditions.push(`LOWER(p.location_city) = LOWER($${paramIdx})`);
        params.push(query.city);
        paramIdx++;
      }
      if (query.state) {
        conditions.push(`LOWER(p.location_state) = LOWER($${paramIdx})`);
        params.push(query.state);
        paramIdx++;
      }
    }

    const whereClause = conditions.join(' AND ');
    const offset = (query.page - 1) * query.limit;

    // Count query
    const countResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
      `SELECT COUNT(*) as count FROM posts p WHERE ${whereClause}`,
      ...params,
    );
    const total = Number(countResult[0].count);

    // Search query with ranking (+ distance when geo params provided)
    const distanceExpr = hasGeo
      ? `, (3959 * acos(LEAST(1.0, cos(radians($${paramIdx})) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians($${paramIdx + 1})) + sin(radians($${paramIdx})) * sin(radians(p.latitude))))) as distance_miles`
      : '';
    const orderByClause = hasGeo
      ? 'ORDER BY distance_miles ASC, rank DESC'
      : 'ORDER BY rank DESC, p.created_at DESC';

    // For geo distance in SELECT, reuse the same lat/lng params
    if (hasGeo) {
      params.push(query.latitude, query.longitude);
      paramIdx += 2;
    }

    const posts = await prisma.$queryRawUnsafe<Array<{
      post_id: string;
      buyer_id: string;
      category_id: string;
      subcategory_id: string | null;
      title: string;
      description: string;
      photos: unknown;
      videos: unknown;
      location_city: string | null;
      location_state: string | null;
      location_zip: string | null;
      urgency: string | null;
      status: string;
      offer_count: number;
      view_count: number;
      expires_at: Date | null;
      public_after: Date | null;
      created_at: Date;
      rank: number;
      distance_miles?: number;
    }>>(
      `SELECT p.post_id, p.buyer_id, p.category_id, p.subcategory_id,
              p.title, p.description, p.photos, p.videos,
              p.location_city, p.location_state, p.location_zip,
              p.urgency, p.status, p.offer_count, p.view_count,
              p.expires_at, p.public_after, p.created_at,
              ts_rank(p.search_vector, plainto_tsquery('english', $1)) as rank
              ${distanceExpr}
       FROM posts p
       WHERE ${whereClause}
       ${orderByClause}
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      ...params,
      query.limit,
      offset,
    );

    const meta: PaginationMeta = {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    };

    return {
      posts: posts.map((p) => ({
        id: p.post_id,
        buyerId: p.buyer_id,
        categoryId: p.category_id,
        subcategoryId: p.subcategory_id,
        title: p.title,
        description: p.description,
        photos: p.photos,
        videos: p.videos,
        budgetMin: null,
        budgetMax: null,
        budgetType: null,
        locationCity: p.location_city,
        locationState: p.location_state,
        locationZip: p.location_zip,
        urgency: p.urgency,
        status: p.status,
        offerCount: p.offer_count,
        viewCount: p.view_count,
        expiresAt: p.expires_at,
        publicAfter: p.public_after,
        createdAt: p.created_at,
        ...(p.distance_miles !== undefined ? { distanceMiles: Math.round(Number(p.distance_miles) * 10) / 10 } : {}),
      })),
      meta,
    };
  }

  // ── Private Helpers ───────────────────────────────────────────

  private toPostResponse(post: {
    id: string;
    buyerId: string;
    categoryId: string;
    subcategoryId: string | null;
    title: string;
    description: string;
    photos: unknown;
    videos: unknown;
    budgetMin: unknown;
    budgetMax: unknown;
    budgetType: string;
    locationAddress: string | null;
    locationCity: string | null;
    locationState: string | null;
    locationZip: string | null;
    locationCountry: string;
    latitude: unknown;
    longitude: unknown;
    urgency: string | null;
    preferredDate: Date | null;
    preferredTime: string | null;
    categorySpecific: unknown;
    requirements: unknown;
    marketplaceContext: string;
    status: string;
    offerCount: number;
    viewCount: number;
    expiresAt: Date | null;
    publicAfter?: Date | null;
    bumpedAt?: Date | null;
    filledAt: Date | null;
    extendedCount: number;
    isSeed?: boolean;
    createdAt: Date;
    updatedAt: Date;
    category?: { id: string; slug: string; name: string } | null;
    subcategory?: { id: string; slug: string; name: string } | null;
  }) {
    return {
      id: post.id,
      buyerId: post.buyerId,
      categoryId: post.categoryId,
      subcategoryId: post.subcategoryId,
      title: post.title,
      description: post.description,
      photos: post.photos,
      videos: post.videos,
      budgetMin: post.budgetMin ? Number(post.budgetMin) : null,
      budgetMax: post.budgetMax ? Number(post.budgetMax) : null,
      budgetType: post.budgetType,
      locationAddress: post.locationAddress,
      locationCity: post.locationCity,
      locationState: post.locationState,
      locationZip: post.locationZip,
      locationCountry: post.locationCountry,
      latitude: post.latitude ? Number(post.latitude) : null,
      longitude: post.longitude ? Number(post.longitude) : null,
      urgency: post.urgency,
      preferredDate: post.preferredDate,
      preferredTime: post.preferredTime,
      categorySpecific: post.categorySpecific,
      requirements: post.requirements,
      marketplaceContext: post.marketplaceContext,
      status: post.status,
      offerCount: post.offerCount,
      viewCount: post.viewCount,
      expiresAt: post.expiresAt,
      publicAfter: post.publicAfter ?? null,
      bumpedAt: post.bumpedAt ?? null,
      filledAt: post.filledAt,
      extendedCount: post.extendedCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      category: post.category ?? undefined,
      subcategory: post.subcategory ?? undefined,
    };
  }

  // ── Discovery feed + clone-to-real-post (cold-start, #37) ─────

  /**
   * Buyer-facing discovery / "For You" feed (#37, #315).
   *
   * Surfaces BOTH seeded posts and real buyer posts that have attracted at least
   * one active (pending) real seller offer, so a buyer can browse live requests
   * and the offers competing on them. Real posts only appear once they are
   * publicly visible (past the exclusivity window — `publicAfter` null or
   * <= now); seeded posts carry no exclusivity hold. Each post is returned with
   * its pending offers nested underneath.
   *
   * Excludes any post the viewer authored (server-side, auth-gated) or already
   * has an active offer on, so a viewer never sees (or engages) their own offered
   * post. `isSeed` is NEVER serialized — the response exposes only the post (via
   * toPostResponse) and the real offers on it, so seeded and real posts are
   * indistinguishable. Posts are ordered newest-offer-first (freshest seller
   * activity on top); offers within each post are ordered oldest-first so the
   * earliest seller keeps the top slot (#315).
   */
  async getDiscoveryFeed(query: DiscoverFeedQuery, requestingUserId: string) {
    // Resolve, in parallel: (a) the viewer's seller profile — to exclude posts they've
    // offered on; (b) the viewer's saved lat/lng — the geo fallback for foryou/nearby
    // when the request carries no explicit center; (c) the viewer's posted-category set
    // — the affinity signal for foryou ranking (#323).
    const [viewerSeller, viewerUser, affinityRows] = await Promise.all([
      prisma.sellerProfile.findFirst({
        where: { userId: requestingUserId, deletedAt: null },
        select: { id: true },
      }),
      prisma.user.findFirst({
        where: { id: requestingUserId, deletedAt: null },
        select: { latitude: true, longitude: true },
      }),
      prisma.post.findMany({
        where: { buyerId: requestingUserId, deletedAt: null },
        select: { categoryId: true, subcategoryId: true },
        distinct: ['categoryId', 'subcategoryId'],
        take: 200,
      }),
    ]);

    // Effective geo center for foryou/nearby: explicit query params win, else the
    // buyer's saved location. Mirrors the seller feed's auto-geo default (getFeed).
    const viewerLat = query.latitude ?? (viewerUser?.latitude ? Number(viewerUser.latitude) : undefined);
    const viewerLng = query.longitude ?? (viewerUser?.longitude ? Number(viewerUser.longitude) : undefined);
    // Categories the buyer has posted in — the foryou affinity boost set.
    const affinityCategoryIds = new Set<string>();
    for (const r of affinityRows) {
      affinityCategoryIds.add(r.categoryId);
      if (r.subcategoryId) affinityCategoryIds.add(r.subcategoryId);
    }

    const where: Prisma.PostWhereInput = {
      status: 'active',
      deletedAt: null,
      buyerId: { not: requestingUserId },
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      // Only publicly-visible posts: seeded (no hold) or real posts past the exclusivity window
      // exclusivity window. Mirrors the seller feed's visibility gate (getFeed),
      // minus the seller-only in-window targeted carve-out.
      OR: [{ publicAfter: null }, { publicAfter: { lte: new Date() } }],
      // Must have >=1 active offer (the real seller lead this listing showcases).
      offers: { some: { status: 'pending', deletedAt: null } },
      // Exclude posts the viewer already has an active offer on.
      ...(viewerSeller
        ? { NOT: { offers: { some: { sellerId: viewerSeller.id, status: 'pending', deletedAt: null } } } }
        : {}),
    };

    // Cold-start volume is small (only seeded posts that have drawn a real offer),
    // so fetch the eligible set and order newest-offer-first in memory, then
    // paginate. Avoids a relation max-date ordering Prisma can't express directly.
    const SAFETY_CAP = 500;
    const posts = await prisma.post.findMany({
      where,
      take: SAFETY_CAP,
      include: {
        category: { select: { id: true, slug: true, name: true } },
        subcategory: { select: { id: true, slug: true, name: true } },
        offers: {
          where: { status: 'pending', deletedAt: null },
          // Oldest-first: the earliest seller to bid keeps the top slot (#315).
          orderBy: { createdAt: 'asc' },
          include: {
            seller: {
              select: {
                id: true,
                businessName: true,
                rating: true,
                totalReviews: true,
                totalCompleted: true,
                verificationBadges: true,
                ratingBadge: true,
                user: { select: { firstName: true } },
              },
            },
          },
        },
      },
    });

    // Newest offer time per post — computed as the MAX over all offers so it stays
    // correct even though the offers array is ordered oldest-first for display (#315).
    const latestOfferAt = (p: (typeof posts)[number]) =>
      p.offers.length > 0 ? Math.max(...p.offers.map((o) => o.createdAt.getTime())) : 0;
    // Distance in miles from the viewer to a post, or null when either side lacks geo.
    const distanceOf = (p: (typeof posts)[number]): number | null => {
      if (viewerLat === undefined || viewerLng === undefined || !p.latitude || !p.longitude) return null;
      return haversineDistance(viewerLat, viewerLng, Number(p.latitude), Number(p.longitude));
    };

    // Mode-aware ranking (#323) over the eligible set, applied in memory before
    // pagination (same cold-start-friendly approach as the base #315 feed).
    let ranked: typeof posts;
    switch (query.mode) {
      case 'nearby': {
        // Keep only posts within radius of the viewer, closest first. Posts without
        // resolvable geo are dropped (mirrors the seller feed radius filter).
        const radius = query.radiusMiles ?? 25;
        ranked = posts
          .map((p) => ({ p, d: distanceOf(p) }))
          .filter((x): x is { p: (typeof posts)[number]; d: number } => x.d !== null && x.d <= radius)
          .sort((a, b) => a.d - b.d || latestOfferAt(b.p) - latestOfferAt(a.p))
          .map((x) => x.p);
        break;
      }
      case 'trending': {
        // Most competing offers right now; tie-break on freshest offer activity.
        ranked = [...posts].sort(
          (a, b) => b.offers.length - a.offers.length || latestOfferAt(b) - latestOfferAt(a),
        );
        break;
      }
      case 'foryou':
      default: {
        // Composite score: category-affinity boost + proximity, with a recency
        // component so the feed is never empty for a geo-less / affinity-less viewer
        // (degrades to newest-offer-first). Higher score ranks first.
        const AFFINITY_WEIGHT = 1_000_000; // dominates: matched categories float up
        const scoreOf = (p: (typeof posts)[number]) => {
          const affinity =
            affinityCategoryIds.has(p.categoryId) || (p.subcategoryId && affinityCategoryIds.has(p.subcategoryId))
              ? AFFINITY_WEIGHT
              : 0;
          const d = distanceOf(p);
          // Closer = higher. Null distance contributes nothing (neither helps nor hurts).
          const proximity = d === null ? 0 : Math.max(0, 500 - d) * 100;
          return affinity + proximity + latestOfferAt(p) / 1e7; // recency tiebreak
        };
        ranked = [...posts].sort((a, b) => scoreOf(b) - scoreOf(a));
        break;
      }
    }

    const total = ranked.length;
    const start = (query.page - 1) * query.limit;
    const pageItems = ranked.slice(start, start + query.limit);

    const meta: PaginationMeta = {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    };

    const data = pageItems.map((post) => ({
      // toPostResponse omits isSeed and provenance — seeded status never leaks.
      // Discovery viewers are by definition unfunded on a seed post, so the PII
      // gate is mandatory here too (SEC-M6 #266 — shares the redactor with #258).
      ...this.redactPiiIfUnfunded(this.toPostResponse(post), false),
      offers: post.offers.map((o) => ({
        id: o.id,
        sellerId: o.sellerId,
        offerType: o.offerType,
        quoteAmount: Number(o.quoteAmount),
        message: o.message,
        createdAt: o.createdAt,
        seller: {
          id: o.seller.id,
          businessName: o.seller.businessName,
          firstName: o.seller.user?.firstName ?? null,
          rating: o.seller.rating !== null ? Number(o.seller.rating) : null,
          totalReviews: o.seller.totalReviews,
          totalCompleted: o.seller.totalCompleted,
          verificationBadges: o.seller.verificationBadges,
          ratingBadge: o.seller.ratingBadge,
        },
      })),
    }));

    return { posts: data, meta };
  }

  /**
   * Clone-to-real-post: a buyer engages a seller's offer from discovery
   * ("Request a quote like this"). Creates a NEW real post owned by the buyer in
   * the SAME category as the seed post (category is authoritative from the seed,
   * never client-supplied), pre-filled title, with the buyer's own specifics.
   *
   * The seeded post is never touched and is never a counterparty — no quote is
   * carried over; the seller's seeded offer is a lead only. The new real post is
   * immediately public (no exclusivity hold) so all matching sellers can compete,
   * and the referred seller is notified + deep-linked to re-offer.
   */
  async createFromSeedOffer(
    userId: string,
    input: CreateFromOfferInput,
    requestContext?: 'b2c' | 'b2b' | 'c2c',
  ) {
    const offer = await prisma.offer.findFirst({
      where: { id: input.offerId, deletedAt: null },
      include: { post: { select: { id: true, isSeed: true, categoryId: true, subcategoryId: true, title: true } } },
    });
    if (!offer) throw new NotFoundError('Offer', input.offerId);
    if (!offer.post.isSeed) {
      throw new ValidationError('This offer is not from a discovery listing');
    }
    if (offer.status !== 'pending') {
      throw new ConflictError('This discovery offer is no longer available');
    }

    // Every real post must carry a subcategory (#321). Seed posts created going
    // forward always have one; for any legacy seed post that doesn't, fall back to
    // the first active subcategory of its top-level category so the listing stays
    // cloneable rather than failing the now-required subcategory check.
    let subcategoryId = offer.post.subcategoryId;
    if (!subcategoryId) {
      const fallbackSub = await prisma.category.findFirst({
        where: { parentCategoryId: offer.post.categoryId, isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true },
      });
      if (!fallbackSub) {
        throw new ValidationError('This listing cannot be duplicated (no subcategory available)');
      }
      subcategoryId = fallbackSub.id;
    }

    // Delegate to createPost so ALL category validation (jobs company-email +
    // roleTier, product condition, MVP gating, active-post cap) is reused. Category
    // is inherited from the seed post and cannot be overridden by the caller.
    const created = await this.createPost(
      userId,
      {
        categoryId: offer.post.categoryId,
        subcategoryId,
        title: input.title ?? offer.post.title,
        description: input.description,
        photos: input.photos,
        videos: input.videos,
        budgetMin: input.budgetMin,
        budgetMax: input.budgetMax,
        budgetType: input.budgetType,
        locationAddress: input.locationAddress,
        locationCity: input.locationCity,
        locationState: input.locationState,
        locationZip: input.locationZip,
        locationCountry: input.locationCountry,
        latitude: input.latitude,
        longitude: input.longitude,
        urgency: input.urgency,
        preferredDate: input.preferredDate,
        preferredTime: input.preferredTime,
        categorySpecific: input.categorySpecific,
        requirements: input.requirements,
        marketplaceContext: input.marketplaceContext,
        status: 'active',
        expiresInHours: input.expiresInHours,
      },
      requestContext,
    );

    // Stamp provenance and drop any exclusivity hold so the post is immediately
    // visible to ALL matching sellers (competition stays open — the referred
    // seller gets no exclusivity, only a head-start notification).
    const finalized = await prisma.post.update({
      where: { id: created.id },
      data: {
        referredSellerId: offer.sellerId,
        sourceSeedPostId: offer.postId,
        publicAfter: null,
      },
      include: {
        category: { select: { id: true, slug: true, name: true } },
        subcategory: { select: { id: true, slug: true, name: true } },
      },
    });

    // Notify the referred seller and deep-link them to re-offer on the real post.
    // Never reveal that the lead originated from a seeded post.
    void this.notifyReferredSeller(offer.sellerId, finalized.id);

    return this.toPostResponse(finalized);
  }

  /** Notify the seller whose discovery lead a buyer engaged (fire-and-forget). */
  private async notifyReferredSeller(sellerId: string, postId: string): Promise<void> {
    try {
      const seller = await prisma.sellerProfile.findUnique({
        where: { id: sellerId },
        select: { userId: true },
      });
      if (!seller) return;
      const { NotificationsService } = await import('../notifications/notifications.service.js');
      const notifService = new NotificationsService();
      await notifService.createNotification({
        userId: seller.userId,
        type: 'referral_lead',
        title: 'A buyer wants a quote like yours',
        message: 'A buyer started a request based on your offer. Send them a quote now.',
        data: { postId },
        channels: ['push', 'in_app'],
        actionUrl: `/posts/${postId}`,
      });
    } catch {
      // Non-critical: never fail the clone on a notification error.
    }
  }

  // ── Jobs Category Detection (Phase 3 plan 07) ─────────────────

  private async isJobsCategory(categoryId: string, subcategoryId?: string | null): Promise<boolean> {
    const targetId = subcategoryId ?? categoryId;
    const cat = await prisma.category.findUnique({
      where: { id: targetId },
      select: { slug: true, parentCategoryId: true },
    });
    if (!cat) return false;
    if (cat.slug === 'jobs') return true;
    if (cat.parentCategoryId) {
      const parent = await prisma.category.findUnique({
        where: { id: cat.parentCategoryId },
        select: { slug: true },
      });
      if (parent?.slug === 'jobs') return true;
    }
    return false;
  }

  // ── Product Category Detection ───────────────────────────────

  private async isProductCategory(categoryId: string, subcategoryId?: string | null): Promise<boolean> {
    const targetId = subcategoryId ?? categoryId;
    const cat = await prisma.category.findUnique({
      where: { id: targetId },
      select: { slug: true, parentCategoryId: true },
    });
    if (!cat) return false;
    if (cat.slug === 'products') return true;
    if (cat.parentCategoryId) {
      const parent = await prisma.category.findUnique({
        where: { id: cat.parentCategoryId },
        select: { slug: true },
      });
      return parent?.slug === 'products';
    }
    return false;
  }

  // ── Budget Stripping Helper ───────────────────────────────────

  private stripBudgetForNonOwner(
    postResponse: ReturnType<typeof PostsService.prototype.toPostResponse>,
    requestingUserId?: string,
  ) {
    if (requestingUserId && postResponse.buyerId === requestingUserId) {
      return postResponse;
    }
    return {
      ...postResponse,
      budgetMin: null,
      budgetMax: null,
      budgetType: null,
    };
  }

  /**
   * True if the requesting user is the post owner OR has a funded transaction
   * (escrowStatus held|released) on this post. Used to gate PII (locationAddress).
   */
  private async isFundedRequester(
    postId: string,
    postBuyerId: string,
    requestingUserId?: string,
  ): Promise<boolean> {
    if (!requestingUserId) return false;
    if (requestingUserId === postBuyerId) return true;
    const funded = await prisma.transaction.findFirst({
      where: {
        postId,
        buyerId: postBuyerId,
        seller: { userId: requestingUserId, deletedAt: null },
        escrowStatus: { in: ['held', 'released'] },
        deletedAt: null,
      },
      select: { id: true },
    });
    return !!funded;
  }

  /**
   * Redacts precise-location PII from non-funded requesters (SEC-H3/H4 #258).
   * Nulls locationAddress AND the exact coordinates (latitude/longitude) and
   * locationZip — a raw lat/lng reverse-geocodes the buyer's home to within
   * meters, which is strictly worse than the street string. locationCity/
   * locationState remain visible (coarse, not street-level PII). A coarsened
   * distanceMiles is added separately by feed callers when geo is requested.
   * Anonymous callers are always unfunded, so they receive the redacted shape.
   */
  private redactPiiIfUnfunded<
    T extends {
      locationAddress: string | null;
      locationZip: string | null;
      latitude: number | null;
      longitude: number | null;
    },
  >(post: T, funded: boolean): T {
    if (funded) return post;
    return {
      ...post,
      locationAddress: null,
      locationZip: null,
      latitude: null,
      longitude: null,
    };
  }

  // ── Ranked Jobs notification (Phase 3 plan 07) ──────────────────

  private async notifyTopMatchedJobSellers(postId: string, categoryId: string): Promise<void> {
    try {
      const sellers = await prisma.sellerProfile.findMany({
        where: {
          deletedAt: null,
          categories: { array_contains: categoryId },
        },
        orderBy: { rating: 'desc' },
        take: TOP_JOB_MATCH_LIMIT,
        select: { userId: true },
      });
      if (sellers.length === 0) return;
      const { NotificationsService } = await import('../notifications/notifications.service.js');
      const notifService = new NotificationsService();
      await Promise.allSettled(
        sellers.map((s) =>
          notifService.createNotification({
            userId: s.userId,
            type: 'job_match',
            title: 'New Job Posting Matched',
            message: 'A new job posting matches your profile. View it now.',
            data: { postId },
            channels: ['push', 'in_app'],
            actionUrl: `/posts/${postId}`,
          }),
        ),
      );
    } catch {
      // Notification failure must not surface to caller
    }
  }
}
