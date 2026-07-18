import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// #193 — storage.ts must source every public URL from R2_PUBLIC_URL and fail
// loud when it is unset (the stale `https://<bucket>.r2.dev` fallback is gone).
// We mock the env module so these assertions don't depend on .env/.env.test.

const BASE_ENV = {
  R2_BUCKET_NAME: 'reverse-marketplace',
  R2_ACCOUNT_ID: undefined as string | undefined,
  R2_ACCESS_KEY_ID: undefined as string | undefined,
  R2_SECRET_ACCESS_KEY: undefined as string | undefined,
  R2_PUBLIC_URL: undefined as string | undefined,
};

async function loadStorageWith(envOverrides: Partial<typeof BASE_ENV>) {
  vi.resetModules();
  vi.doMock('../src/config/env.js', () => ({
    env: { ...BASE_ENV, ...envOverrides },
  }));
  return import('../src/common/utils/storage.js');
}

afterEach(() => {
  vi.doUnmock('../src/config/env.js');
  vi.resetModules();
});

describe('storage public URL (#193)', () => {
  it('composes the presigned publicUrl from R2_PUBLIC_URL', async () => {
    const storage = await loadStorageWith({ R2_PUBLIC_URL: 'https://cdn.sorcyn.test' });
    const { publicUrl, key } = await storage.generatePresignedUploadUrl(
      'photo.jpg',
      'image/jpeg',
      'post-photos',
      'user-1',
    );
    expect(publicUrl).toBe(`https://cdn.sorcyn.test/${key}`);
    expect(publicUrl).not.toContain('r2.dev');
  });

  it('trims a trailing slash on R2_PUBLIC_URL', async () => {
    const storage = await loadStorageWith({ R2_PUBLIC_URL: 'http://localhost:9000/reverse-marketplace/' });
    const { publicUrl, key } = await storage.generatePresignedUploadUrl(
      'doc.pdf',
      'application/pdf',
      'verification-docs',
      'user-2',
    );
    expect(publicUrl).toBe(`http://localhost:9000/reverse-marketplace/${key}`);
  });

  it('fails loud when R2_PUBLIC_URL is unset instead of emitting a dead r2.dev link', async () => {
    const storage = await loadStorageWith({ R2_PUBLIC_URL: undefined });
    await expect(
      storage.generatePresignedUploadUrl('photo.jpg', 'image/jpeg', 'post-photos', 'user-3'),
    ).rejects.toThrow(/R2_PUBLIC_URL is not set/);
  });

  it('urlToKey round-trips an R2_PUBLIC_URL-based URL', async () => {
    const storage = await loadStorageWith({ R2_PUBLIC_URL: 'https://cdn.sorcyn.test' });
    const key = 'post-photos/user-1/abc.webp';
    expect(storage.urlToKey(`https://cdn.sorcyn.test/${key}`)).toBe(key);
  });

  it('urlToKey no longer recognizes legacy bucket.r2.dev URLs', async () => {
    const storage = await loadStorageWith({ R2_PUBLIC_URL: 'https://cdn.sorcyn.test' });
    expect(
      storage.urlToKey('https://reverse-marketplace.r2.dev/post-photos/user-1/abc.webp'),
    ).toBeNull();
  });
});
