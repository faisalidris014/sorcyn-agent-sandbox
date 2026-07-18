import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { env } from '../../config/env.js';

// Cloudflare R2 uses the S3-compatible API. When R2 isn't configured (local
// dev), fall back to a local MinIO on :9000. MinIO requires path-style
// addressing — virtual-hosted style ("bucket.localhost:9000") doesn't resolve —
// so force it for the fallback only; production R2 keeps the SDK default.
const usingLocalMinio = !env.R2_ACCOUNT_ID;
const s3Client = new S3Client({
  region: 'auto',
  endpoint: usingLocalMinio
    ? 'http://localhost:9000' // fallback for dev/test (MinIO)
    : `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  forcePathStyle: usingLocalMinio,
  credentials: usingLocalMinio
    ? { accessKeyId: 'minioadmin', secretAccessKey: 'minioadmin' }
    : { accessKeyId: env.R2_ACCESS_KEY_ID!, secretAccessKey: env.R2_SECRET_ACCESS_KEY! },
  // AWS SDK v3.729+ adds CRC32 checksums to presigned PutObject URLs by
  // default. Flutter's Dio PUT doesn't compute the header, so MinIO/R2
  // rejects the upload with a 400. Only add checksums when required.
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

const BUCKET = env.R2_BUCKET_NAME;

/**
 * Build the public URL for a stored object's key.
 *
 * `R2_PUBLIC_URL` is the single source of truth for the public base — prod = the
 * R2 public/custom-domain URL, dev = `http://localhost:9000/<bucket>` (MinIO).
 * It must be set whenever uploads are served; there is intentionally no fallback.
 * The old `https://<bucket>.r2.dev` fallback was stale (modern R2 managed URLs are
 * `pub-<hash>.r2.dev`) and silently produced dead links, so we fail loud here
 * instead. See issue #193 and env.ts `validateProductionEnv`.
 */
function publicUrlFor(key: string): string {
  if (!env.R2_PUBLIC_URL) {
    throw new Error(
      'R2_PUBLIC_URL is not set — cannot build a public URL for uploaded files. ' +
        'Set it to the R2 public/custom-domain base in production, or ' +
        'http://localhost:9000/<bucket> for local MinIO dev.',
    );
  }
  return `${env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
}

// Allowed MIME types and max sizes
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
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_DOC_SIZE = 25 * 1024 * 1024; // 25 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

type UploadCategory =
  | 'profile-photos'
  | 'portfolio'
  | 'post-photos'
  | 'post-videos'
  | 'offer-photos'
  | 'transaction-photos'
  | 'verification-docs'
  | 'message-attachments';

/**
 * Maximum object size (bytes) a presigned upload may declare, by category.
 * Mirrors the server-buffer-path limits above. This is the authoritative cap
 * for the presign flow — the value is both validated server-side and signed
 * into the URL's `Content-Length`, so R2/MinIO rejects any body of a different
 * size (see `generatePresignedUploadUrl`).
 */
export function maxUploadSizeForCategory(category: UploadCategory): number {
  if (category === 'verification-docs') return MAX_DOC_SIZE;
  if (category === 'post-videos') return MAX_VIDEO_SIZE;
  return MAX_IMAGE_SIZE;
}

const MAX_IMAGE_WIDTH = 1200;
const THUMB_WIDTH = 400;
const WEBP_QUALITY = 80;

interface UploadResult {
  key: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  contentType: string;
}

/**
 * Upload a file buffer to Cloudflare R2.
 */
export async function uploadFile(
  buffer: Buffer,
  originalFilename: string,
  contentType: string,
  category: UploadCategory,
  userId: string,
): Promise<UploadResult> {
  // Validate content type
  const isImage = ALLOWED_IMAGE_TYPES.includes(contentType);
  const isDoc = ALLOWED_DOC_TYPES.includes(contentType);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(contentType);

  if (category === 'verification-docs') {
    if (!isDoc) {
      throw new Error(`File type ${contentType} not allowed for verification documents`);
    }
    if (buffer.length > MAX_DOC_SIZE) {
      throw new Error(`File exceeds maximum size of ${MAX_DOC_SIZE / 1024 / 1024}MB`);
    }
  } else if (category === 'post-videos') {
    if (!isVideo) {
      throw new Error(`File type ${contentType} not allowed for videos. Allowed: ${ALLOWED_VIDEO_TYPES.join(', ')}`);
    }
    if (buffer.length > MAX_VIDEO_SIZE) {
      throw new Error(`File exceeds maximum size of ${MAX_VIDEO_SIZE / 1024 / 1024}MB`);
    }
  } else {
    if (!isImage) {
      throw new Error(`File type ${contentType} not allowed for ${category}`);
    }
    if (buffer.length > MAX_IMAGE_SIZE) {
      throw new Error(`File exceeds maximum size of ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
    }
  }

  const fileId = randomUUID();
  const isOptimizableImage = isImage && category !== 'verification-docs';

  let optimizedBuffer = buffer;
  let finalContentType = contentType;
  let finalExt = path.extname(originalFilename) || mimeToExt(contentType);
  let thumbnailUrl: string | undefined;

  if (isOptimizableImage) {
    // Optimize: resize to max width, convert to WebP
    optimizedBuffer = await sharp(buffer)
      .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    finalContentType = 'image/webp';
    finalExt = '.webp';

    // Generate and upload thumbnail
    const thumbBuffer = await sharp(buffer)
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    const thumbKey = `${category}/${userId}/${fileId}-thumb.webp`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: thumbKey,
        Body: thumbBuffer,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    thumbnailUrl = publicUrlFor(thumbKey);
  }

  const key = `${category}/${userId}/${fileId}${finalExt}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: optimizedBuffer,
      ContentType: finalContentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );

  const url = publicUrlFor(key);

  return { key, url, thumbnailUrl, size: optimizedBuffer.length, contentType: finalContentType };
}

/**
 * Delete a file from R2 by its key.
 */
export async function deleteFile(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
  );
}

/**
 * Fetch a stored object's bytes into memory. Used by the copyright takedown +
 * staydown flow (#313) to compute a perceptual hash server-side — the presigned
 * upload path means the server never sees the bytes at upload time, so it must
 * read them back from R2 after the object lands. Callers should bound how large
 * an object they pull (images only) since this buffers the whole body.
 */
export async function getObjectBuffer(key: string): Promise<Buffer> {
  const res = await s3Client.send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
  );
  if (!res.Body) {
    throw new Error(`Object ${key} has no body`);
  }
  // The SDK's stream exposes a helper to collect the whole body as bytes.
  const bytes = await res.Body.transformToByteArray();
  return Buffer.from(bytes);
}

/**
 * Generate a pre-signed upload URL for direct client uploads.
 * The client PUTs the file to the returned URL.
 *
 * `contentLength` (exact byte size) is signed into the URL, so it becomes a
 * required, signed `Content-Length` header. R2/MinIO reject any PUT whose body
 * differs from the signed size — closing the "presign a 1KB jpg, PUT a multi-GB
 * body" storage/cost DoS (SEC-M5 #265). The caller MUST validate `contentLength`
 * against the per-category cap (`maxUploadSizeForCategory`) before calling.
 */
export async function generatePresignedUploadUrl(
  originalFilename: string,
  contentType: string,
  category: UploadCategory,
  userId: string,
  contentLength: number,
  expiresIn = 3600,
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  const ext = path.extname(originalFilename) || mimeToExt(contentType);
  const key = `${category}/${userId}/${randomUUID()}${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
    CacheControl: 'public, max-age=31536000, immutable',
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

  const publicUrl = publicUrlFor(key);

  return { uploadUrl, key, publicUrl };
}

/**
 * Generate a pre-signed download URL (for private buckets).
 */
export async function generatePresignedDownloadUrl(
  key: string,
  expiresIn = 3600,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Extract the R2 key from a full URL.
 */
export function urlToKey(url: string): string | null {
  if (env.R2_PUBLIC_URL) {
    const base = env.R2_PUBLIC_URL.replace(/\/$/, '');
    if (url.startsWith(`${base}/`)) {
      return url.slice(base.length + 1);
    }
  }
  return null;
}

function mimeToExt(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/heic': '.heic',
    'image/heif': '.heif',
    'application/pdf': '.pdf',
    'video/mp4': '.mp4',
    'video/quicktime': '.mov',
    'video/webm': '.webm',
  };
  return map[mime] ?? '';
}
