import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import {
  deleteFile,
  getObjectBuffer,
  urlToKey,
} from '../../common/utils/storage.js';
import { computeDhash, hammingDistance, HASH_ALGO } from '../../common/utils/phash.js';
import { revokeUserSessions } from '../../common/utils/sessions.js';
import {
  STRIKE_THRESHOLD,
  PHASH_HAMMING_THRESHOLD,
} from '../../common/constants/moderation.js';
import { NotFoundError, ValidationError } from '../../common/utils/errors.js';
import { NotificationsService } from '../notifications/notifications.service.js';

export interface TakeDownImageInput {
  postId: string;
  imageUrl: string;
  reason?: string;
}

interface RecordTakedownParams {
  perceptualHash: string;
  imageKey: string;
  uploaderUserId: string;
  takenDownBy: string;
  reason?: string | null;
  sourcePostId?: string | null;
  sourceOfferId?: string | null;
  auditAction: 'image_takedown' | 'staydown_block';
}

/**
 * Copyright takedown + perceptual-hash staydown + repeat-infringer enforcement (#313).
 *
 * - Admin takedown: remove an infringing image from a post, delete the R2 object,
 *   fingerprint it onto the blocklist, and strike the uploader.
 * - Staydown: on re-upload, the scan worker fingerprints the new image and calls
 *   `checkBlocklist` — a match reuses `recordTakedown` (no fresh admin action).
 * - Enforcement: STRIKE_THRESHOLD strikes → suspend + hard-block uploads.
 */
export class TakedownsService {
  private notifications = new NotificationsService();

  /**
   * Fuzzy blocklist lookup. MVP is a linear scan + Hamming-distance check — the
   * list stays small; revisit a BK-tree / chunked index if it grows. Returns the
   * first matching entry within PHASH_HAMMING_THRESHOLD (with the admin who
   * originally took it down, so a staydown block can be attributed), or null.
   */
  async checkBlocklist(
    perceptualHash: string,
  ): Promise<{ id: string; takenDownBy: string } | null> {
    const entries = await prisma.imageTakedown.findMany({
      where: { hashAlgo: HASH_ALGO },
      select: { id: true, perceptualHash: true, takenDownBy: true },
    });
    for (const entry of entries) {
      if (hammingDistance(perceptualHash, entry.perceptualHash) <= PHASH_HAMMING_THRESHOLD) {
        return { id: entry.id, takenDownBy: entry.takenDownBy };
      }
    }
    return null;
  }

  /**
   * Remove an image URL from a post's `photos` array. Returns true if it was
   * present (and removed), false otherwise. No-op-safe for concurrent removals.
   */
  private async detachPhoto(postId: string, imageUrl: string): Promise<boolean> {
    const post = await prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
      select: { photos: true },
    });
    if (!post) return false;
    const photos = Array.isArray(post.photos) ? (post.photos as unknown[]) : [];
    if (!photos.includes(imageUrl)) return false;

    await prisma.post.update({
      where: { id: postId },
      data: { photos: photos.filter((p) => p !== imageUrl) as Prisma.InputJsonValue },
    });
    return true;
  }

  /**
   * List blocklist entries, newest first (admin moderation view).
   */
  async listTakedowns(page: number, limit: number) {
    const [items, total] = await Promise.all([
      prisma.imageTakedown.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.imageTakedown.count(),
    ]);
    return {
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Admin action: take down a specific uploaded image on a post. Fetches the bytes
   * (to fingerprint) BEFORE deleting the object, removes it from `post.photos`,
   * records the takedown, and strikes the uploader.
   */
  async takeDownImage(adminId: string, input: TakeDownImageInput) {
    const post = await prisma.post.findFirst({
      where: { id: input.postId, deletedAt: null },
      select: { id: true, buyerId: true, photos: true },
    });
    if (!post) throw new NotFoundError('Post', input.postId);

    const photos = Array.isArray(post.photos) ? (post.photos as unknown[]) : [];
    if (!photos.includes(input.imageUrl)) {
      throw new ValidationError('That image is not attached to the post');
    }

    const key = urlToKey(input.imageUrl);
    if (!key) {
      throw new ValidationError('Could not resolve a storage key for that image URL');
    }

    // Fingerprint from the stored bytes BEFORE deleting the object.
    const buf = await getObjectBuffer(key);
    const perceptualHash = await computeDhash(buf);

    await this.detachPhoto(post.id, input.imageUrl);

    const result = await this.recordTakedown({
      perceptualHash,
      imageKey: key,
      uploaderUserId: post.buyerId,
      takenDownBy: adminId,
      reason: input.reason ?? null,
      sourcePostId: post.id,
      auditAction: 'image_takedown',
    });

    // Best-effort object delete — the DB record + strike are the source of truth.
    try {
      await deleteFile(key);
    } catch {
      // Object may already be gone; the takedown/strike already landed.
    }

    return result;
  }

  /**
   * Shared enforcement core, used by both the admin takedown and the staydown
   * worker: insert the blocklist row, increment the uploader's strike count, write
   * an audit-log entry, and — at the threshold — suspend the account + revoke
   * sessions. Notifies the uploader. Returns the new strike count and whether the
   * account was suspended by this strike.
   */
  async recordTakedown(params: RecordTakedownParams): Promise<{
    strikeCount: number;
    suspended: boolean;
  }> {
    const { strikeCount, suspended } = await prisma.$transaction(async (tx) => {
      await tx.imageTakedown.create({
        data: {
          perceptualHash: params.perceptualHash,
          hashAlgo: HASH_ALGO,
          imageKey: params.imageKey,
          sourcePostId: params.sourcePostId ?? null,
          sourceOfferId: params.sourceOfferId ?? null,
          uploaderUserId: params.uploaderUserId,
          takenDownBy: params.takenDownBy,
          reason: params.reason ?? null,
        },
      });

      const user = await tx.user.update({
        where: { id: params.uploaderUserId },
        data: { strikeCount: { increment: 1 } },
        select: { strikeCount: true, status: true, isAdmin: true },
      });

      // Suspend at the threshold — but never lock out an admin account, and don't
      // re-suspend an already-suspended/banned user.
      const shouldSuspend =
        user.strikeCount >= STRIKE_THRESHOLD &&
        user.status === 'active' &&
        !user.isAdmin;

      if (shouldSuspend) {
        await tx.user.update({
          where: { id: params.uploaderUserId },
          data: { status: 'suspended', sessionVersion: { increment: 1 } },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: params.takenDownBy,
          actorType: 'admin',
          action: params.auditAction,
          resourceType: 'image',
          resourceId: params.sourcePostId ?? null,
          details: {
            uploaderUserId: params.uploaderUserId,
            imageKey: params.imageKey,
            perceptualHash: params.perceptualHash,
            reason: params.reason ?? null,
            strikeCount: user.strikeCount,
            suspended: shouldSuspend,
          } as Prisma.InputJsonValue,
          success: true,
        },
      });

      return { strikeCount: user.strikeCount, suspended: shouldSuspend };
    });

    // Post-commit side effects (Redis + notifications) — never inside the tx.
    if (suspended) {
      await revokeUserSessions(params.uploaderUserId);
    }

    await this.notifyUploader(params.uploaderUserId, strikeCount, suspended);

    return { strikeCount, suspended };
  }

  /**
   * Staydown enforcement (called by the image-scan worker on a blocklist match):
   * detach the re-uploaded copy from its post, delete the R2 object, and record a
   * fresh strike attributed to the admin who originally took the image down. No
   * new admin notice is needed for repeat copies (#313).
   */
  async applyStaydownBlock(params: {
    postId: string;
    imageUrl: string;
    imageKey: string;
    uploaderUserId: string;
    perceptualHash: string;
    matchedAdminId: string;
  }): Promise<{ strikeCount: number; suspended: boolean }> {
    await this.detachPhoto(params.postId, params.imageUrl);

    const result = await this.recordTakedown({
      perceptualHash: params.perceptualHash,
      imageKey: params.imageKey,
      uploaderUserId: params.uploaderUserId,
      takenDownBy: params.matchedAdminId,
      reason: 'staydown: matched a taken-down image',
      sourcePostId: params.postId,
      auditAction: 'staydown_block',
    });

    try {
      await deleteFile(params.imageKey);
    } catch {
      // Object may already be gone; the block/strike already landed.
    }

    return result;
  }

  private async notifyUploader(
    userId: string,
    strikeCount: number,
    suspended: boolean,
  ): Promise<void> {
    try {
      if (suspended) {
        await this.notifications.createNotification({
          userId,
          type: 'account_suspended',
          title: 'Account suspended',
          message:
            'Your account has been suspended after repeated copyright takedowns and can no longer upload images.',
          data: { strikeCount },
          channels: ['push', 'email', 'in_app'],
        });
      } else {
        await this.notifications.createNotification({
          userId,
          type: 'image_taken_down',
          title: 'Image removed',
          message: `An image you uploaded was removed for a copyright issue. Strike ${strikeCount} of ${STRIKE_THRESHOLD}.`,
          data: { strikeCount },
          channels: ['push', 'in_app'],
        });
      }
    } catch {
      // Notification delivery is best-effort; the takedown itself already landed.
    }
  }
}
