import { describe, it, expect } from 'vitest';
import {
  matchIdentity,
  normalizeName,
  DEFAULT_MATCH_THRESHOLD,
} from '../src/modules/sellers/entity-matcher.js';

describe('entity matcher — normalizeName', () => {
  it('lowercases, strips punctuation, and tokenizes', () => {
    expect(normalizeName('John  Smith')).toEqual(['john', 'smith']);
    expect(normalizeName("O'Brien-Jones")).toEqual(['o', 'brien', 'jones']);
  });

  it('reorders "Last, First" → "First Last"', () => {
    expect(normalizeName('Smith, John A')).toEqual(['john', 'a', 'smith']);
  });

  it('drops business entity + generational suffixes', () => {
    expect(normalizeName('Smith Electric LLC')).toEqual(['smith', 'electric']);
    expect(normalizeName('John Smith Jr.')).toEqual(['john', 'smith']);
    expect(normalizeName('ACME Corp, Inc.')).toEqual(['acme']);
  });

  it('handles empty / nullish input', () => {
    expect(normalizeName('')).toEqual([]);
    expect(normalizeName(undefined)).toEqual([]);
    expect(normalizeName(null)).toEqual([]);
  });
});

describe('entity matcher — matchIdentity', () => {
  it('exact match scores 1 and matches', () => {
    const r = matchIdentity('John Smith', 'John Smith');
    expect(r.score).toBe(1);
    expect(r.matched).toBe(true);
  });

  it('is order-independent (Last, First)', () => {
    expect(matchIdentity('John Smith', 'Smith, John').matched).toBe(true);
  });

  it('tolerates a middle initial', () => {
    expect(matchIdentity('John A Smith', 'John Smith').matched).toBe(true);
  });

  it('matches a personal name against a business name containing it', () => {
    // owner_name vs business_name: provider checks both and takes the max.
    expect(matchIdentity('John Smith', 'John Smith Electric LLC').matched).toBe(true);
  });

  it('rejects a clear mismatch', () => {
    const r = matchIdentity('John Smith', 'Maria Garcia');
    expect(r.score).toBe(0);
    expect(r.matched).toBe(false);
  });

  it('queues a single-token first-name typo (below threshold)', () => {
    // {jon,smith} vs {john,smith} → dice 0.5 < 0.6 → caller queues for review.
    expect(matchIdentity('Jon Smith', 'John Smith').matched).toBe(false);
  });

  it('empty input never matches', () => {
    expect(matchIdentity('', 'John Smith').matched).toBe(false);
    expect(matchIdentity('John Smith', undefined).matched).toBe(false);
  });

  it('honors a custom threshold', () => {
    // dice 0.5 passes at a lower threshold
    expect(matchIdentity('Jon Smith', 'John Smith', 0.5).matched).toBe(true);
    expect(DEFAULT_MATCH_THRESHOLD).toBe(0.6);
  });
});
