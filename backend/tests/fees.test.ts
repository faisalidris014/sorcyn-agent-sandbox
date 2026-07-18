import { describe, it, expect } from 'vitest';
import {
  calculateJobLeadFee,
  HIGH_VALUE_THRESHOLD_USD,
  isHighValueTransaction,
} from '../src/common/utils/fees.js';
import { isFreeEmailDomain, FREE_EMAIL_DOMAINS } from '../src/common/utils/email-domain.js';

describe('HIGH_VALUE_THRESHOLD_USD — Stripe degrade (issue #84)', () => {
  it('is the locked $500 v1.1 placeholder', () => {
    expect(HIGH_VALUE_THRESHOLD_USD).toBe(500);
  });

  it('treats amounts below the threshold as standard (queued)', () => {
    expect(isHighValueTransaction(0)).toBe(false);
    expect(isHighValueTransaction(50)).toBe(false);
    expect(isHighValueTransaction(499.99)).toBe(false);
  });

  it('treats amounts at or above the threshold as high-value (blocked)', () => {
    expect(isHighValueTransaction(500)).toBe(true); // boundary is inclusive
    expect(isHighValueTransaction(500.01)).toBe(true);
    expect(isHighValueTransaction(5000)).toBe(true);
  });
});

describe('calculateJobLeadFee — Phase 3 plan 07', () => {
  it('returns 10 USD for entry tier', () => {
    expect(calculateJobLeadFee('entry')).toBe(10);
  });
  it('returns 50 USD for mid tier', () => {
    expect(calculateJobLeadFee('mid')).toBe(50);
  });
  it('returns 500 USD for specialized_senior tier', () => {
    expect(calculateJobLeadFee('specialized_senior')).toBe(500);
  });
});

describe('isFreeEmailDomain — Phase 3 plan 07', () => {
  it.each([
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'aol.com',
    'icloud.com',
    'proton.me',
    'protonmail.com',
  ])('flags %s as free', (domain) => {
    expect(isFreeEmailDomain(`alice@${domain}`)).toBe(true);
  });

  it.each(['acme.com', 'bigcorp.io', 'company.co.uk', 'startup.dev'])(
    'does NOT flag %s as free',
    (domain) => {
      expect(isFreeEmailDomain(`alice@${domain}`)).toBe(false);
    },
  );

  it('is case-insensitive on the domain', () => {
    expect(isFreeEmailDomain('ALICE@GMAIL.COM')).toBe(true);
  });

  it('returns false on empty/malformed input', () => {
    expect(isFreeEmailDomain('')).toBe(false);
    expect(isFreeEmailDomain('not-an-email')).toBe(false);
    expect(isFreeEmailDomain('alice@')).toBe(false);
  });

  it('exports the expected FREE_EMAIL_DOMAINS set', () => {
    expect(FREE_EMAIL_DOMAINS.has('gmail.com')).toBe(true);
    expect(FREE_EMAIL_DOMAINS.has('acme.com')).toBe(false);
  });
});
