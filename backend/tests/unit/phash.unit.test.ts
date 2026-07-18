import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { computeDhash, hammingDistance } from '../../src/common/utils/phash.js';
import { PHASH_HAMMING_THRESHOLD } from '../../src/common/constants/moderation.js';

// Build a smooth, low-frequency 2D pattern as a PNG. Low frequency survives a
// resize (so a resized copy still hashes close), and it is non-monotonic in x
// (so the dHash is non-degenerate — a mix of set/unset bits).
async function patternPng(
  width: number,
  height: number,
  opts: { xCycles: number; yCycles: number; phase?: number },
): Promise<Buffer> {
  const channels = 3;
  const data = Buffer.alloc(width * height * channels);
  const phase = opts.phase ?? 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const vx = Math.sin((2 * Math.PI * opts.xCycles * x) / width + phase);
      const vy = Math.sin((2 * Math.PI * opts.yCycles * y) / height);
      const v = Math.round(128 + 80 * vx + 40 * vy);
      const clamped = Math.max(0, Math.min(255, v));
      const idx = (y * width + x) * channels;
      data[idx] = clamped;
      data[idx + 1] = clamped;
      data[idx + 2] = clamped;
    }
  }
  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}

describe('phash', () => {
  it('produces a 16-char lowercase hex hash', async () => {
    const img = await patternPng(64, 64, { xCycles: 1.5, yCycles: 1.2 });
    const hash = await computeDhash(img);
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
  });

  it('is deterministic for the same bytes', async () => {
    const img = await patternPng(64, 64, { xCycles: 1.5, yCycles: 1.2 });
    const a = await computeDhash(img);
    const b = await computeDhash(img);
    expect(a).toBe(b);
    expect(hammingDistance(a, b)).toBe(0);
  });

  it('matches a resized/re-saved copy within the staydown threshold', async () => {
    const original = await patternPng(64, 64, { xCycles: 1.5, yCycles: 1.2 });
    // Simulate a re-uploaded copy: scale up, re-encode as JPEG, scale down again.
    const resaved = await sharp(original)
      .resize(220, 180, { fit: 'fill' })
      .jpeg({ quality: 82 })
      .toBuffer();

    const h1 = await computeDhash(original);
    const h2 = await computeDhash(resaved);
    expect(hammingDistance(h1, h2)).toBeLessThanOrEqual(PHASH_HAMMING_THRESHOLD);
  });

  it('does not match a clearly different image', async () => {
    const base = await patternPng(64, 64, { xCycles: 1.5, yCycles: 1.2 });
    const different = await patternPng(64, 64, { xCycles: 5, yCycles: 4, phase: Math.PI / 2 });

    const h1 = await computeDhash(base);
    const h2 = await computeDhash(different);
    expect(hammingDistance(h1, h2)).toBeGreaterThan(PHASH_HAMMING_THRESHOLD);
  });

  it('treats malformed hashes as no match (Infinity distance)', () => {
    expect(hammingDistance('nothex', 'alsobad')).toBe(Infinity);
    expect(hammingDistance('0000000000000000', 'zzzz')).toBe(Infinity);
  });
});
