/**
 * Phase 4 B-2 — Unit tier coverage file.
 *
 * Tier classification: tests/unit/ → pure function tests with no DB/Redis/network.
 * These exercise fee calculation, free-email detection, and other pure-function
 * modules in src/common/utils/.
 *
 * Coverage threshold for this tier: lines ≥ 80% (B-2 enforcement).
 *
 * NOTE: calculateFees() signature is (transactionType, quoteAmount, shippingCost?)
 * and returns FeeBreakdown { quoteAmount, shippingCost, buyerFee, stripeFee,
 * totalCharged, platformFee, platformFeePercentage, sellerPayoutAmount }.
 *
 * calculateJobLeadFee() accepts 'entry' | 'mid' | 'specialized_senior'.
 */
import { describe, it, expect } from 'vitest';
import { calculateFees, calculateJobLeadFee } from '../../src/common/utils/fees.js';
import { isFreeEmailDomain } from '../../src/common/utils/email-domain.js';

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── Fee calculation (pure functions) ────────────────────────────────────────

describe('Unit: calculateFees — service transactions (buyer +5%, seller payout 92%)', () => {
  it('computes correct fee breakdown for service at $200', () => {
    const result = calculateFees('service', 200);
    expect(result.quoteAmount).toBe(200);
    expect(result.buyerFee).toBe(round(200 * 0.05));           // $10
    expect(result.platformFeePercentage).toBe(8);
    expect(result.sellerPayoutAmount).toBe(round(200 * 0.92)); // $184
  });

  it('computes correct fees for shipped product ($100 base)', () => {
    const result = calculateFees('product_shipped', 100);
    expect(result.platformFeePercentage).toBe(6);
    expect(result.buyerFee).toBe(round(100 * 0.05));           // $5
    expect(result.sellerPayoutAmount).toBe(round(100 * 0.94)); // $94
  });

  it('computes zero fees for local cash transaction', () => {
    const result = calculateFees('product_local_cash', 150);
    expect(result.buyerFee).toBe(0);
    expect(result.stripeFee).toBe(0);
    expect(result.totalCharged).toBe(150);
    expect(result.platformFee).toBe(0);
    expect(result.platformFeePercentage).toBe(0);
    expect(result.sellerPayoutAmount).toBe(150);
  });

  it('computes correct fees for local platform transaction (buyer +5%, seller payout 95%)', () => {
    const result = calculateFees('product_local_platform', 100);
    expect(result.platformFeePercentage).toBe(5);
    expect(result.buyerFee).toBe(round(100 * 0.05));           // $5
    expect(result.sellerPayoutAmount).toBe(round(100 * 0.95)); // $95
  });

  it('includes shipping cost in shipped product fee base', () => {
    const result = calculateFees('product_shipped', 100, 20);
    expect(result.quoteAmount).toBe(100);
    expect(result.shippingCost).toBe(20);
    const base = 120;
    expect(result.buyerFee).toBe(round(base * 0.05));
    expect(result.sellerPayoutAmount).toBe(round(base * 0.94));
  });

  it('computes job_milestone fees identically to service fees', () => {
    const service = calculateFees('service', 300);
    const job = calculateFees('job_milestone', 300);
    expect(job.buyerFee).toBe(service.buyerFee);
    expect(job.platformFeePercentage).toBe(service.platformFeePercentage);
    expect(job.sellerPayoutAmount).toBe(service.sellerPayoutAmount);
  });

  it('applies correct Stripe fee formula (2.9% + $0.30) on the subtotal', () => {
    const result = calculateFees('service', 200);
    const subtotal = round(200 + round(200 * 0.05)); // 200 + 10 = 210
    const expectedStripeFee = round(subtotal * 0.029 + 0.30);
    expect(result.stripeFee).toBe(expectedStripeFee);
  });
});

describe('Unit: calculateJobLeadFee', () => {
  it('returns $10 for entry-level roles', () => {
    expect(calculateJobLeadFee('entry')).toBe(10);
  });

  it('returns $50 for mid-level roles', () => {
    expect(calculateJobLeadFee('mid')).toBe(50);
  });

  it('returns $500 for specialized/senior roles', () => {
    expect(calculateJobLeadFee('specialized_senior')).toBe(500);
  });
});

describe('Unit: isFreeEmailDomain', () => {
  it('identifies gmail.com as free email domain', () => {
    expect(isFreeEmailDomain('test@gmail.com')).toBe(true);
  });

  it('identifies yahoo.com as free email domain', () => {
    expect(isFreeEmailDomain('test@yahoo.com')).toBe(true);
  });

  it('allows custom business domains through', () => {
    expect(isFreeEmailDomain('contact@niftybyte.com')).toBe(false);
  });

  it('allows custom TLD domains through', () => {
    expect(isFreeEmailDomain('hr@acmecorp.io')).toBe(false);
  });
});
