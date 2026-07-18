import {
  generatePresignedUploadUrl,
  deleteFile,
  maxUploadSizeForCategory,
} from '../../common/utils/storage.js';
import { ForbiddenError, ValidationError } from '../../common/utils/errors.js';
import { prisma } from '../../config/database.js';
import type { PresignedUrlInput } from './uploads.schemas.js';

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];
const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
];
const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
];

type UploadCategory = PresignedUrlInput['category'];

export class UploadsService {

  // ── Generate Presigned Upload URL ──────────────────────────

  async generatePresignedUrl(userId: string, input: PresignedUrlInput) {
    // Repeat-infringer hard-block (#313): a suspended account cannot upload. Covers
    // both copyright auto-suspension (STRIKE_THRESHOLD strikes) and admin suspends.
    const uploader = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true },
    });
    if (uploader?.status === 'suspended' || uploader?.status === 'banned') {
      throw new ForbiddenError('Your account is suspended and cannot upload files');
    }

    this.validateContentType(input.contentType, input.category);
    this.validateContentLength(input.contentLength, input.category);

    // Dedup: if the client sent a content hash, check for an existing object
    if (input.contentHash) {
      const existing = await prisma.uploadHash.findUnique({
        where: {
          userId_category_contentHash: {
            userId,
            category: input.category,
            contentHash: input.contentHash,
          },
        },
      });

      if (existing) {
        return {
          isDuplicate: true as const,
          key: existing.key,
          publicUrl: existing.publicUrl,
        };
      }
    }

    const result = await generatePresignedUploadUrl(
      input.filename,
      input.contentType,
      input.category,
      userId,
      input.contentLength,
    );

    // Store the hash speculatively so the next identical upload deduplicates.
    // The client is expected to complete the PUT to R2; if it fails, the
    // orphaned record is harmless — the same hash will just resolve to a
    // missing object, which the client handles as a broken-image tile.
    if (input.contentHash) {
      await prisma.uploadHash.create({
        data: {
          userId,
          category: input.category,
          contentHash: input.contentHash,
          key: result.key,
          publicUrl: result.publicUrl,
        },
      });
    }

    return {
      isDuplicate: false as const,
      uploadUrl: result.uploadUrl,
      key: result.key,
      publicUrl: result.publicUrl,
    };
  }

  // ── Delete Uploaded File ───────────────────────────────────

  async deleteUpload(userId: string, key: string) {
    // Verify ownership: key format is {category}/{userId}/{uuid}{ext}
    const parts = key.split('/');
    if (parts.length < 3) {
      throw new ValidationError('Invalid file key format');
    }
    const keyUserId = parts[1];
    if (keyUserId !== userId) {
      throw new ForbiddenError('You can only delete your own files');
    }

    await deleteFile(key);

    // Remove any stored hash record for this key so the slot is freed
    await prisma.uploadHash.deleteMany({ where: { userId, key } });
  }

  // ── Helpers ────────────────────────────────────────────────

  private validateContentLength(contentLength: number, category: UploadCategory) {
    const max = maxUploadSizeForCategory(category);
    if (contentLength > max) {
      throw new ValidationError(
        `File exceeds the maximum size of ${Math.round(max / 1024 / 1024)}MB for ${category}`,
      );
    }
  }

  private validateContentType(contentType: string, category: UploadCategory) {
    if (category === 'verification-docs') {
      if (!ALLOWED_DOC_TYPES.includes(contentType)) {
        throw new ValidationError(
          `File type ${contentType} not allowed for verification documents. Allowed: ${ALLOWED_DOC_TYPES.join(', ')}`,
        );
      }
    } else if (category === 'post-videos') {
      if (!ALLOWED_VIDEO_TYPES.includes(contentType)) {
        throw new ValidationError(
          `File type ${contentType} not allowed for videos. Allowed: ${ALLOWED_VIDEO_TYPES.join(', ')}`,
        );
      }
    } else {
      if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
        throw new ValidationError(
          `File type ${contentType} not allowed for ${category}. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
        );
      }
    }
  }
}
