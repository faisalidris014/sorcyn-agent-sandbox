import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import sharp from 'sharp';
import type { FastifyInstance } from 'fastify';
import { prisma } from '../src/config/database.js';
import {
  createTestUser,
  makeAdmin,
  authHeaders,
  cleanupTestData,
  type TestUser,
} from './helpers.js';

process.env.NODE_ENV = 'test';

// Storage is mocked so the takedown/staydown flow never touches R2. `getObjectBuffer`
// returns whatever bytes the current test staged (see `stagedImage`), `urlToKey`
// treats the URL itself as the key, and the presign/delete calls are no-ops.
const staged = vi.hoisted(() => ({ image: Buffer.alloc(0) }));
vi.mock('../src/common/utils/storage.js', () => ({
  getObjectBuffer: vi.fn(async () => staged.image),
  deleteFile: vi.fn().mockResolvedValue(undefined),
  urlToKey: (url: string) => url,
  generatePresignedUploadUrl: vi.fn().mockResolvedValue({
    uploadUrl: 'https://mock/upload',
    key: 'post-photos/mock/mock.jpg',
    publicUrl: 'https://cdn.example.com/post-photos/mock/mock.jpg',
  }),
  maxUploadSizeForCategory: () => 10 * 1024 * 1024,
}));

// Build a smooth low-frequency test image (survives resize; non-degenerate hash).
async function testImage(xCycles: number, yCycles: number, phase = 0): Promise<Buffer> {
  const width = 64;
  const height = 64;
  const channels = 3;
  const data = Buffer.alloc(width * height * channels);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = Math.round(
        128 +
          80 * Math.sin((2 * Math.PI * xCycles * x) / width + phase) +
          40 * Math.sin((2 * Math.PI * yCycles * y) / height),
      );
      const c = Math.max(0, Math.min(255, v));
      const idx = (y * width + x) * channels;
      data[idx] = c;
      data[idx + 1] = c;
      data[idx + 2] = c;
    }
  }
  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}

const CLEANUP = 'takedowntest';

let app: FastifyInstance;
let admin: TestUser;
let adminToken: string;
let buyer: TestUser;
let categoryId: string;

async function createPostWithPhoto(buyerId: string, imageUrl: string): Promise<string> {
  const post = await prisma.post.create({
    data: {
      buyerId,
      categoryId,
      title: 'Takedown test post',
      description: 'A post used to exercise copyright takedown.',
      photos: [imageUrl],
    },
    select: { id: true },
  });
  return post.id;
}

beforeAll(async () => {
  const { buildApp } = await import('../src/app.js');
  app = await buildApp();
  await app.ready();

  await cleanupTestData([CLEANUP]);

  admin = await createTestUser(app, { email: `${CLEANUP}_admin@example.com`, accountType: 'both' });
  adminToken = await makeAdmin(app, admin);
  buyer = await createTestUser(app, { email: `${CLEANUP}_buyer@example.com`, accountType: 'buyer' });

  const category = await prisma.category.findFirst({ where: { parentCategoryId: null }, select: { id: true } });
  categoryId = category!.id;
});

afterAll(async () => {
  await prisma.imageTakedown.deleteMany({ where: { uploaderUserId: buyer.userId } });
  await cleanupTestData([CLEANUP]);
  await app.close();
});

describe('Copyright takedown (#313)', () => {
  it('takes down an image: removes it, blocklists it, strikes the uploader, and audits', async () => {
    const imageUrl = 'https://cdn.example.com/post-photos/buyer/takedown-1.png';
    staged.image = await testImage(1.5, 1.2);
    const postId = await createPostWithPhoto(buyer.userId, imageUrl);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/takedowns',
      headers: authHeaders(adminToken),
      payload: { postId, imageUrl, reason: 'DMCA notice' },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().data).toMatchObject({ strikeCount: 1, suspended: false });

    const post = await prisma.post.findUnique({ where: { id: postId }, select: { photos: true } });
    expect(post!.photos).toEqual([]);

    const blocklist = await prisma.imageTakedown.findMany({ where: { uploaderUserId: buyer.userId } });
    expect(blocklist).toHaveLength(1);
    expect(blocklist[0].imageKey).toBe(imageUrl);

    const user = await prisma.user.findUnique({ where: { id: buyer.userId }, select: { strikeCount: true } });
    expect(user!.strikeCount).toBe(1);

    const audit = await prisma.auditLog.findFirst({
      where: { action: 'image_takedown', userId: admin.userId },
      orderBy: { createdAt: 'desc' },
    });
    expect(audit).not.toBeNull();
  });

  it('rejects taking down an image that is not attached to the post', async () => {
    const postId = await createPostWithPhoto(buyer.userId, 'https://cdn.example.com/a.png');
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/takedowns',
      headers: authHeaders(adminToken),
      payload: { postId, imageUrl: 'https://cdn.example.com/not-here.png' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('requires admin', async () => {
    const postId = await createPostWithPhoto(buyer.userId, 'https://cdn.example.com/b.png');
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/takedowns',
      headers: authHeaders(buyer.token),
      payload: { postId, imageUrl: 'https://cdn.example.com/b.png' },
    });
    expect(res.statusCode).toBe(403);
  });

  describe('staydown blocklist matching', () => {
    it('matches the same image and a resized copy, but not a different image', async () => {
      const { TakedownsService } = await import('../src/modules/admin/takedowns.service.js');
      const { computeDhash } = await import('../src/common/utils/phash.js');
      const svc = new TakedownsService();

      // The first test already blocklisted testImage(1.5, 1.2). Re-derive it and a
      // resized/re-saved copy; both should match. A different image should not.
      const original = await testImage(1.5, 1.2);
      const resaved = await sharp(original).resize(200, 150, { fit: 'fill' }).jpeg({ quality: 82 }).toBuffer();
      const different = await testImage(5, 4, Math.PI / 2);

      expect(await svc.checkBlocklist(await computeDhash(original))).not.toBeNull();
      expect(await svc.checkBlocklist(await computeDhash(resaved))).not.toBeNull();
      expect(await svc.checkBlocklist(await computeDhash(different))).toBeNull();
    });
  });

  describe('repeat-infringer enforcement', () => {
    it('suspends the uploader at 3 strikes and hard-blocks further uploads', async () => {
      // Strike 1 already landed above. Take down two more distinct images → strike 3.
      for (const [i, freq] of [[2, 2.2], [3, 3.1]].entries()) {
        const imageUrl = `https://cdn.example.com/post-photos/buyer/strike-${i + 2}.png`;
        staged.image = await testImage(freq as number, 1.7 + i);
        const postId = await createPostWithPhoto(buyer.userId, imageUrl);
        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/admin/takedowns',
          headers: authHeaders(adminToken),
          payload: { postId, imageUrl },
        });
        expect(res.statusCode).toBe(201);
      }

      const suspended = await prisma.user.findUnique({
        where: { id: buyer.userId },
        select: { strikeCount: true, status: true },
      });
      expect(suspended!.strikeCount).toBeGreaterThanOrEqual(3);
      expect(suspended!.status).toBe('suspended');

      // Hard-block: the uploads service refuses a suspended account.
      const { UploadsService } = await import('../src/modules/uploads/uploads.service.js');
      const uploads = new UploadsService();
      await expect(
        uploads.generatePresignedUrl(buyer.userId, {
          filename: 'x.jpg',
          contentType: 'image/jpeg',
          category: 'post-photos',
          contentLength: 1024,
        }),
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });
});
