import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

// Mock the storage utility directly
vi.mock('../src/common/utils/storage.js', () => ({
  generatePresignedUploadUrl: vi.fn().mockImplementation(
    (filename: string, _contentType: string, category: string, userId: string) => {
      const key = `${category}/${userId}/mock-uuid.jpg`;
      return Promise.resolve({
        uploadUrl: 'https://mock-presigned-url.example.com/upload',
        key,
        publicUrl: `https://cdn.example.com/${key}`,
      });
    },
  ),
  // Real per-category caps so contentLength validation is exercised end-to-end.
  maxUploadSizeForCategory: (category: string) => {
    if (category === 'verification-docs') return 25 * 1024 * 1024;
    if (category === 'post-videos') return 100 * 1024 * 1024;
    return 10 * 1024 * 1024;
  },
  deleteFile: vi.fn().mockResolvedValue(undefined),
  uploadFile: vi.fn(),
  generatePresignedDownloadUrl: vi.fn(),
  urlToKey: vi.fn(),
}));

process.env.NODE_ENV = 'test';

let app: FastifyInstance;
let buyerToken: string;
let buyerUserId: string;

const BUYER = {
  email: 'upload-buyer@example.com',
  password: 'TestPass123!',
  firstName: 'Upload',
  lastName: 'Buyer',
  accountType: 'buyer' as const,
  agreeToTerms: true as const,
  agreeToPrivacy: true as const,
};

function buyerHeaders() {
  return { authorization: `Bearer ${buyerToken}` };
}

beforeAll(async () => {
  const { buildApp } = await import('../src/app.js');
  app = await buildApp();
  await app.ready();

  const { prisma } = await import('../src/config/database.js');

  // Clean up
  await prisma.user.deleteMany({ where: { email: BUYER.email } });

  // Register + verify + login
  const regRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: BUYER,
  });
  buyerUserId = regRes.json().data.user.id;
  await prisma.user.update({ where: { id: buyerUserId }, data: { emailVerified: true } });
  const loginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: BUYER.email, password: BUYER.password },
  });
  buyerToken = loginRes.json().data.tokens.accessToken;
});

afterAll(async () => {
  const { prisma } = await import('../src/config/database.js');
  await prisma.user.deleteMany({ where: { email: BUYER.email } });
  await app.close();
});

describe('Uploads Module', () => {
  describe('POST /api/v1/uploads', () => {
    it('should generate presigned URL for image upload', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/uploads',
        headers: buyerHeaders(),
        payload: {
          filename: 'photo.jpg',
          contentType: 'image/jpeg',
          category: 'post-photos',
          contentLength: 1024,
        },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.uploadUrl).toBeDefined();
      expect(body.data.key).toContain('post-photos/');
      expect(body.data.publicUrl).toBeDefined();
    });

    it('should generate presigned URL for offer-photos category (#312)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/uploads',
        headers: buyerHeaders(),
        payload: {
          filename: 'after.jpg',
          contentType: 'image/jpeg',
          category: 'offer-photos',
          contentLength: 1024,
        },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.uploadUrl).toBeDefined();
      expect(body.data.key).toContain('offer-photos/');
    });

    it('should reject invalid content type for image category', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/uploads',
        headers: buyerHeaders(),
        payload: {
          filename: 'document.pdf',
          contentType: 'application/pdf',
          category: 'post-photos',
          contentLength: 1024,
        },
      });

      expect(res.statusCode).toBe(400);
    });

    it('should allow PDF for verification-docs category', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/uploads',
        headers: buyerHeaders(),
        payload: {
          filename: 'license.pdf',
          contentType: 'application/pdf',
          category: 'verification-docs',
          contentLength: 1024,
        },
      });

      expect(res.statusCode).toBe(201);
      expect(res.json().data.key).toContain('verification-docs/');
    });

    it('should generate presigned URL for video/mp4 (post-videos category)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/uploads',
        headers: buyerHeaders(),
        payload: {
          filename: 'clip.mp4',
          contentType: 'video/mp4',
          category: 'post-videos',
          contentLength: 5 * 1024 * 1024,
        },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.uploadUrl).toBeDefined();
      expect(body.data.key).toContain('post-videos/');
    });

    it('should generate presigned URL for video/quicktime (post-videos category)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/uploads',
        headers: buyerHeaders(),
        payload: {
          filename: 'clip.mov',
          contentType: 'video/quicktime',
          category: 'post-videos',
          contentLength: 5 * 1024 * 1024,
        },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.key).toContain('post-videos/');
    });

    it('should reject non-video MIME for post-videos category', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/uploads',
        headers: buyerHeaders(),
        payload: {
          filename: 'photo.jpg',
          contentType: 'image/jpeg',
          category: 'post-videos',
          contentLength: 1024,
        },
      });

      expect(res.statusCode).toBe(400);
    });

    it('should reject invalid category', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/uploads',
        headers: buyerHeaders(),
        payload: {
          filename: 'photo.jpg',
          contentType: 'image/jpeg',
          category: 'invalid-category',
          contentLength: 1024,
        },
      });

      expect(res.statusCode).toBe(400);
    });

    it('should require authentication', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/uploads',
        payload: {
          filename: 'photo.jpg',
          contentType: 'image/jpeg',
          category: 'post-photos',
          contentLength: 1024,
        },
      });

      expect(res.statusCode).toBe(401);
    });

    it('should return a new presigned URL when contentHash is provided for the first time', async () => {
      const hash = 'a'.repeat(64);
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/uploads',
        headers: buyerHeaders(),
        payload: {
          filename: 'unique.jpg',
          contentType: 'image/jpeg',
          category: 'post-photos',
          contentLength: 1024,
          contentHash: hash,
        },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.data.isDuplicate).toBe(false);
      expect(body.data.uploadUrl).toBeDefined();
      expect(body.data.key).toBeDefined();
      expect(body.data.publicUrl).toBeDefined();
    });

    it('should return isDuplicate=true and existing URL on second upload of same hash', async () => {
      const hash = 'b'.repeat(64);

      // First upload — registers the hash
      const first = await app.inject({
        method: 'POST',
        url: '/api/v1/uploads',
        headers: buyerHeaders(),
        payload: {
          filename: 'dupe.jpg',
          contentType: 'image/jpeg',
          category: 'post-photos',
          contentLength: 1024,
          contentHash: hash,
        },
      });
      expect(first.statusCode).toBe(201);
      const firstData = first.json().data;
      expect(firstData.isDuplicate).toBe(false);

      // Second upload — same hash, same user, same category
      const second = await app.inject({
        method: 'POST',
        url: '/api/v1/uploads',
        headers: buyerHeaders(),
        payload: {
          filename: 'dupe-again.jpg',
          contentType: 'image/jpeg',
          category: 'post-photos',
          contentLength: 1024,
          contentHash: hash,
        },
      });
      expect(second.statusCode).toBe(201);
      const secondData = second.json().data;
      expect(secondData.isDuplicate).toBe(true);
      expect(secondData.publicUrl).toBe(firstData.publicUrl);
      expect(secondData.key).toBe(firstData.key);
      expect(secondData.uploadUrl).toBeUndefined();
    });

    it('should not dedup the same hash across different categories', async () => {
      const hash = 'c'.repeat(64);

      await app.inject({
        method: 'POST',
        url: '/api/v1/uploads',
        headers: buyerHeaders(),
        payload: { filename: 'photo.jpg', contentType: 'image/jpeg', category: 'post-photos', contentLength: 1024, contentHash: hash },
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/uploads',
        headers: buyerHeaders(),
        payload: { filename: 'photo.jpg', contentType: 'image/jpeg', category: 'profile-photos', contentLength: 1024, contentHash: hash },
      });

      expect(res.statusCode).toBe(201);
      expect(res.json().data.isDuplicate).toBe(false);
    });

    it('should reject contentHash that is not 64 hex characters', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/uploads',
        headers: buyerHeaders(),
        payload: {
          filename: 'photo.jpg',
          contentType: 'image/jpeg',
          category: 'post-photos',
          contentLength: 1024,
          contentHash: 'not-a-valid-hash',
        },
      });

      expect(res.statusCode).toBe(400);
    });

    it('should reject a request with no contentLength', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/uploads',
        headers: buyerHeaders(),
        payload: {
          filename: 'photo.jpg',
          contentType: 'image/jpeg',
          category: 'post-photos',
        },
      });

      expect(res.statusCode).toBe(400);
    });

    it('should reject a non-positive contentLength', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/uploads',
        headers: buyerHeaders(),
        payload: {
          filename: 'photo.jpg',
          contentType: 'image/jpeg',
          category: 'post-photos',
          contentLength: 0,
        },
      });

      expect(res.statusCode).toBe(400);
    });

    it('should reject an image larger than the 10MB image cap', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/uploads',
        headers: buyerHeaders(),
        payload: {
          filename: 'huge.jpg',
          contentType: 'image/jpeg',
          category: 'post-photos',
          contentLength: 10 * 1024 * 1024 + 1,
        },
      });

      expect(res.statusCode).toBe(400);
    });

    it('should reject a video larger than the 100MB video cap', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/uploads',
        headers: buyerHeaders(),
        payload: {
          filename: 'huge.mp4',
          contentType: 'video/mp4',
          category: 'post-videos',
          contentLength: 100 * 1024 * 1024 + 1,
        },
      });

      expect(res.statusCode).toBe(400);
    });

    it('should accept a video that fits the 100MB cap but exceeds the 10MB image cap', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/uploads',
        headers: buyerHeaders(),
        payload: {
          filename: 'clip.mp4',
          contentType: 'video/mp4',
          category: 'post-videos',
          contentLength: 50 * 1024 * 1024,
        },
      });

      expect(res.statusCode).toBe(201);
    });
  });

  describe('DELETE /api/v1/uploads', () => {
    it('should delete own uploaded file', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/uploads?key=post-photos/${buyerUserId}/test-uuid.jpg`,
        headers: buyerHeaders(),
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().success).toBe(true);
    });

    it('should reject deleting another user\'s file', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/uploads?key=post-photos/different-user-id/test-uuid.jpg',
        headers: buyerHeaders(),
      });

      expect(res.statusCode).toBe(403);
    });

    it('should require authentication for delete', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/uploads?key=post-photos/user-id/test.jpg',
      });

      expect(res.statusCode).toBe(401);
    });
  });
});
