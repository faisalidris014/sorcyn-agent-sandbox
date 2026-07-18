/**
 * Unit tier coverage — bounded JSON validation for post JSONB (SEC-H5 #259).
 *
 * Tier classification: tests/unit/ → pure schema tests, no DB/Redis/network.
 * Exercises `boundedJsonObjectSchema`, which constrains the free-form
 * `categorySpecific` / `requirements` fields against the stored-XSS amplifier
 * and storage/DoS payloads described in #259.
 */
import { describe, it, expect } from 'vitest';
import {
  boundedJsonObjectSchema,
  createPostSchema,
  JSON_MAX_DEPTH,
  JSON_MAX_STRING_LENGTH,
  JSON_MAX_KEYS_PER_OBJECT,
  JSON_MAX_ARRAY_LENGTH,
  JSON_MAX_TOTAL_NODES,
} from '../../src/modules/posts/posts.schemas.js';

function nestObject(depth: number): Record<string, unknown> {
  let node: Record<string, unknown> = { leaf: 'value' };
  for (let i = 0; i < depth; i++) {
    node = { nested: node };
  }
  return node;
}

describe('boundedJsonObjectSchema', () => {
  it('accepts a normal flat object of scalars', () => {
    const ok = boundedJsonObjectSchema.safeParse({
      condition: 'good',
      brand: 'Acme',
      qty: 3,
      fragile: true,
      notes: null,
      tags: ['a', 'b', 'c'],
    });
    expect(ok.success).toBe(true);
  });

  it('accepts an empty object', () => {
    expect(boundedJsonObjectSchema.safeParse({}).success).toBe(true);
  });

  it('accepts nesting up to the depth limit', () => {
    // depth budget: top-level object is level 1, so a chain of (MAX_DEPTH-1)
    // additional nested objects plus a leaf stays within bounds.
    const ok = boundedJsonObjectSchema.safeParse(nestObject(JSON_MAX_DEPTH - 2));
    expect(ok.success).toBe(true);
  });

  it('rejects nesting beyond the depth limit', () => {
    const bad = boundedJsonObjectSchema.safeParse(nestObject(JSON_MAX_DEPTH + 3));
    expect(bad.success).toBe(false);
  });

  it('rejects an over-long string value', () => {
    const bad = boundedJsonObjectSchema.safeParse({
      note: 'x'.repeat(JSON_MAX_STRING_LENGTH + 1),
    });
    expect(bad.success).toBe(false);
  });

  it('accepts a string value at exactly the length limit', () => {
    const ok = boundedJsonObjectSchema.safeParse({
      note: 'x'.repeat(JSON_MAX_STRING_LENGTH),
    });
    expect(ok.success).toBe(true);
  });

  it('rejects too many keys in an object', () => {
    const obj: Record<string, unknown> = {};
    for (let i = 0; i <= JSON_MAX_KEYS_PER_OBJECT; i++) obj[`k${i}`] = i;
    expect(boundedJsonObjectSchema.safeParse(obj).success).toBe(false);
  });

  it('rejects an over-long array', () => {
    const bad = boundedJsonObjectSchema.safeParse({
      items: new Array(JSON_MAX_ARRAY_LENGTH + 1).fill(1),
    });
    expect(bad.success).toBe(false);
  });

  it('rejects payloads exceeding the total node budget', () => {
    // A wide tree of nested objects, each within per-object limits, that still
    // blows past the total-node cap (storage/DoS amplification guard).
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < JSON_MAX_KEYS_PER_OBJECT; i++) {
      const inner: Record<string, unknown> = {};
      for (let j = 0; j < JSON_MAX_KEYS_PER_OBJECT; j++) inner[`j${j}`] = j;
      obj[`i${i}`] = inner;
    }
    const bad = boundedJsonObjectSchema.safeParse(obj);
    expect(bad.success).toBe(false);
    expect(JSON_MAX_TOTAL_NODES).toBeLessThan(JSON_MAX_KEYS_PER_OBJECT * JSON_MAX_KEYS_PER_OBJECT);
  });

  it('rejects non-finite numbers', () => {
    expect(boundedJsonObjectSchema.safeParse({ n: Infinity }).success).toBe(false);
    expect(boundedJsonObjectSchema.safeParse({ n: NaN }).success).toBe(false);
  });
});

describe('createPostSchema with bounded JSONB', () => {
  const base = {
    categoryId: '11111111-1111-4111-8111-111111111111',
    subcategoryId: '22222222-2222-4222-8222-222222222222',
    title: 'Need a plumber for a leak',
    description: 'My kitchen sink is leaking and I need it fixed soon please.',
  };

  it('requires a subcategoryId (#321)', () => {
    const { subcategoryId: _omit, ...withoutSubcategory } = base;
    expect(createPostSchema.safeParse(withoutSubcategory).success).toBe(false);
  });

  it('defaults categorySpecific/requirements to {}', () => {
    const parsed = createPostSchema.parse(base);
    expect(parsed.categorySpecific).toEqual({});
    expect(parsed.requirements).toEqual({});
  });

  it('accepts a reasonable categorySpecific payload', () => {
    const parsed = createPostSchema.parse({
      ...base,
      categorySpecific: { condition: 'good', brand: 'Moen' },
    });
    expect(parsed.categorySpecific).toEqual({ condition: 'good', brand: 'Moen' });
  });

  it('rejects an oversized categorySpecific string (DoS / XSS amplifier)', () => {
    const result = createPostSchema.safeParse({
      ...base,
      categorySpecific: { note: 'a'.repeat(JSON_MAX_STRING_LENGTH + 1) },
    });
    expect(result.success).toBe(false);
  });
});
