import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  parseModelAccessors,
  findMissingModelAccessors,
} from '../src/common/utils/prisma-drift.js';

process.env.NODE_ENV = 'test';

// Simulate a STALE generated client (issue #159): the Prisma stub is missing the
// `paymentIntentQueue` accessor, exactly as it would be if `prisma generate` was
// not run after the payment_intent_queue migration. Used by the drain-guard test.
vi.mock('../src/config/database.js', () => ({
  prisma: {
    user: { findMany: () => Promise.resolve([]) },
    // paymentIntentQueue intentionally absent
  },
}));

describe('parseModelAccessors', () => {
  it('lowercases the first character of each model name', () => {
    const schema = `
      model User { id String @id }
      model PaymentIntentQueue { id String @id }
      model SellerProfile {
        id String @id
      }
    `;
    expect(parseModelAccessors(schema)).toEqual(['user', 'paymentIntentQueue', 'sellerProfile']);
  });

  it('ignores datasource / generator / enum blocks', () => {
    const schema = `
      datasource db { provider = "postgresql" }
      generator client { provider = "prisma-client-js" }
      enum Status { active inactive }
      model Post { id String @id }
    `;
    expect(parseModelAccessors(schema)).toEqual(['post']);
  });

  it('parses the real schema.prisma — includes paymentIntentQueue + all models', () => {
    const src = readFileSync(new URL('../prisma/schema.prisma', import.meta.url), 'utf8');
    const accessors = parseModelAccessors(src);
    expect(accessors).toContain('paymentIntentQueue');
    expect(accessors).toContain('user');
    expect(accessors).toContain('sellerProfile');
    expect(accessors).toContain('auditLog');
    expect(accessors.length).toBeGreaterThanOrEqual(17);
  });
});

describe('findMissingModelAccessors', () => {
  const usable = { findMany: () => {} };

  it('flags accessors whose delegate is absent', () => {
    const client = { user: usable, post: usable };
    expect(findMissingModelAccessors(client, ['user', 'post', 'paymentIntentQueue'])).toEqual([
      'paymentIntentQueue',
    ]);
  });

  it('flags accessors present but lacking findMany (not a real delegate)', () => {
    const client = { paymentIntentQueue: {} };
    expect(findMissingModelAccessors(client, ['paymentIntentQueue'])).toEqual([
      'paymentIntentQueue',
    ]);
  });

  it('returns [] when every accessor is usable', () => {
    const client = { user: usable, paymentIntentQueue: usable };
    expect(findMissingModelAccessors(client, ['user', 'paymentIntentQueue'])).toEqual([]);
  });
});

describe('drainPaymentIntentQueue — stale-client guard (issue #159)', () => {
  it('no-ops gracefully (no throw) when the paymentIntentQueue accessor is missing', async () => {
    const { env } = await import('../src/config/env.js');
    const prev = env.STRIPE_DEGRADED;
    env.STRIPE_DEGRADED = false; // must clear the degrade short-circuit to reach the guard
    try {
      const { drainPaymentIntentQueue } = await import(
        '../src/modules/payments/payments.degrade.js'
      );
      const logs: string[] = [];
      const result = await drainPaymentIntentQueue((m) => logs.push(m));

      expect(result).toEqual({ drained: 0, failed: 0 });
      expect(logs.some((l) => l.includes('db:generate'))).toBe(true);
    } finally {
      env.STRIPE_DEGRADED = prev;
    }
  });
});
