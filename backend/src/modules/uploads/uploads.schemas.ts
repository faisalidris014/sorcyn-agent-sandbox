import { z } from 'zod';

export const presignedUrlSchema = z.object({
  filename: z.string().min(1).max(255).describe('Original filename with extension (e.g. photo.jpg)'),
  contentType: z.string().min(1).describe('MIME type (e.g. image/jpeg, application/pdf)'),
  contentLength: z.number().int().positive()
    .describe('Exact byte size of the file. Signed into the presigned URL so R2 rejects a body of any other size (prevents storage/cost DoS via oversized PUT).'),
  category: z.enum([
    'profile-photos',
    'portfolio',
    'post-photos',
    'post-videos',
    'offer-photos',
    'transaction-photos',
    'verification-docs',
    'message-attachments',
  ]).describe('Upload category determines storage path and validation rules'),
  contentHash: z.string().length(64).regex(/^[0-9a-f]+$/).optional()
    .describe('SHA-256 hex digest of the file bytes — enables server-side dedup'),
});

export const deleteUploadQuerySchema = z.object({
  key: z.string().min(1).describe('The R2 object key to delete (e.g. post-photos/userId/uuid.jpg)'),
});

export type PresignedUrlInput = z.infer<typeof presignedUrlSchema>;
export type DeleteUploadQuery = z.infer<typeof deleteUploadQuerySchema>;
