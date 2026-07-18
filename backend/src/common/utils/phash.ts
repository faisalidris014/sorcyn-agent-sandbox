import sharp from 'sharp';

/**
 * Perceptual image hashing for the copyright staydown blocklist (#313).
 *
 * We use dHash ("difference hash"): reduce the image to a tiny greyscale grid and
 * encode, per row, whether each pixel is brighter than its right-hand neighbour.
 * The result is a 64-bit fingerprint that stays stable across resizing, re-saving,
 * and mild recompression — so a resized copy of a taken-down image still matches,
 * which a byte/crypto hash (SHA-256) would not. Matching is fuzzy: two hashes are
 * "the same image" when their Hamming distance is within a threshold.
 */

// 9x8 greyscale grid → 8 comparisons per row × 8 rows = 64 bits.
const WIDTH = 9;
const HEIGHT = 8;
const HASH_HEX_LEN = 16; // 64 bits / 4 bits per hex char

export const HASH_ALGO = 'dhash-64';

/**
 * Compute the 64-bit dHash of an image, returned as a 16-char lowercase hex string.
 * Throws if the buffer is not a decodable image.
 */
export async function computeDhash(buf: Buffer): Promise<string> {
  // Normalize to a fixed-size greyscale grid. `fit: 'fill'` ignores aspect ratio so
  // the fingerprint is scale-invariant; greyscale drops colour so a recolour/re-save
  // still matches. Raw single-channel pixels come back as one byte per cell.
  const pixels = await sharp(buf)
    .greyscale()
    .resize(WIDTH, HEIGHT, { fit: 'fill' })
    .raw()
    .toBuffer();

  let bits = 0n;
  let bitIndex = 0n;
  for (let row = 0; row < HEIGHT; row++) {
    for (let col = 0; col < WIDTH - 1; col++) {
      const left = pixels[row * WIDTH + col];
      const right = pixels[row * WIDTH + col + 1];
      if (left > right) {
        bits |= 1n << bitIndex;
      }
      bitIndex++;
    }
  }

  return bits.toString(16).padStart(HASH_HEX_LEN, '0');
}

/**
 * Hamming distance between two 64-bit hex hashes (count of differing bits).
 * Returns Infinity if either input is not a well-formed 16-char hex hash, so a
 * malformed stored value can never be mistaken for a close match.
 */
export function hammingDistance(a: string, b: string): number {
  if (!isValidHash(a) || !isValidHash(b)) return Infinity;
  let xor = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
  let dist = 0;
  while (xor > 0n) {
    dist += Number(xor & 1n);
    xor >>= 1n;
  }
  return dist;
}

function isValidHash(h: string): boolean {
  return typeof h === 'string' && /^[0-9a-f]{16}$/.test(h);
}
