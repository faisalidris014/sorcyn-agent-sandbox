import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Guards the committed DFW zip dataset that cold-start generation depends on (#207).
 * No DB — pure asset validation, so it can't silently rot (wrong coords / OK leakage
 * / shrunk coverage would break seed-post geo placement).
 */
const data = JSON.parse(
  readFileSync(fileURLToPath(new URL('../scripts/data/dfw-zips.json', import.meta.url)), 'utf8'),
) as { _meta: Record<string, unknown>; zips: Array<{ zip: string; lat: number; lng: number; city: string }> };

describe('DFW cold-start zip dataset (#207)', () => {
  it('carries the ZCTA provenance + non-USPS warning', () => {
    expect(String(data._meta.source)).toMatch(/Census/i);
    expect(String(data._meta.warning)).toMatch(/not.*identical to USPS/i);
  });

  it('has >=350 DFW zips, all unique', () => {
    expect(data.zips.length).toBeGreaterThanOrEqual(350);
    expect(new Set(data.zips.map((z) => z.zip)).size).toBe(data.zips.length);
  });

  it('contains only DFW TX prefixes (75xxx/76xxx) — no Oklahoma/out-of-region leakage', () => {
    expect(data.zips.every((z) => /^7[56]\d{3}$/.test(z.zip))).toBe(true);
  });

  it('every record has a valid DFW-area centroid + city label', () => {
    for (const z of data.zips) {
      expect(z.lat).toBeGreaterThan(31.5);
      expect(z.lat).toBeLessThan(34.5);
      expect(z.lng).toBeGreaterThan(-99);
      expect(z.lng).toBeLessThan(-95);
      expect(typeof z.city).toBe('string');
      expect(z.city.length).toBeGreaterThan(0);
    }
  });
});
