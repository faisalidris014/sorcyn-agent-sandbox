/**
 * Payment-processor outage threshold (RUNBOOK_OPS.md §2 / issue #84).
 *
 * During a payment-processor outage (`STRIPE_DEGRADED=true`), transactions whose
 * total charged amount is BELOW this threshold have their payment-intent creation
 * queued for retry, while transactions AT or ABOVE it are blocked outright.
 *
 * $500 is a placeholder for the v1.1 launch — see PRD Open Question O9. The
 * threshold compares against the buyer's total charged amount (quote + fees),
 * i.e. what actually hits the card, not the raw quote.
 */
export const HIGH_VALUE_THRESHOLD_USD = 500;

/**
 * Returns true when a transaction's total charged amount is "high value" for the
 * purposes of payment-processor degrade behavior — i.e. at or above
 * {@link HIGH_VALUE_THRESHOLD_USD}. High-value transactions are blocked during an
 * outage; everything below is queued for retry.
 */
export function isHighValueTransaction(totalChargedUsd: number): boolean {
  return totalChargedUsd >= HIGH_VALUE_THRESHOLD_USD;
}

export interface FeeBreakdown {
  quoteAmount: number;
  shippingCost: number;
  buyerFee: number;
  stripeFee: number;
  totalCharged: number;
  platformFee: number;
  platformFeePercentage: number;
  sellerPayoutAmount: number;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calculateFees(
  transactionType: 'service' | 'product_shipped' | 'product_local_cash' | 'product_local_platform' | 'job_milestone' | 'inventory',
  quoteAmount: number,
  shippingCost = 0,
): FeeBreakdown {
  switch (transactionType) {
    case 'service':
    case 'job_milestone': {
      const buyerFee = round(quoteAmount * 0.05);
      const subtotal = round(quoteAmount + buyerFee);
      const stripeFee = round(subtotal * 0.029 + 0.30);
      const totalCharged = round(subtotal + stripeFee);
      const sellerPayoutAmount = round(quoteAmount * 0.92);
      const platformFee = round(totalCharged - sellerPayoutAmount - stripeFee);
      return {
        quoteAmount,
        shippingCost: 0,
        buyerFee,
        stripeFee,
        totalCharged,
        platformFee,
        platformFeePercentage: 8,
        sellerPayoutAmount,
      };
    }

    case 'product_shipped': {
      const base = quoteAmount + shippingCost;
      const buyerFee = round(base * 0.05);
      const subtotal = round(base * 1.05);
      const stripeFee = round(subtotal * 0.029 + 0.30);
      const totalCharged = round(subtotal + stripeFee);
      const sellerPayoutAmount = round(base * 0.94);
      const platformFee = round(totalCharged - sellerPayoutAmount - stripeFee);
      return {
        quoteAmount,
        shippingCost,
        buyerFee,
        stripeFee,
        totalCharged,
        platformFee,
        platformFeePercentage: 6,
        sellerPayoutAmount,
      };
    }

    case 'product_local_cash': {
      return {
        quoteAmount,
        shippingCost: 0,
        buyerFee: 0,
        stripeFee: 0,
        totalCharged: quoteAmount,
        platformFee: 0,
        platformFeePercentage: 0,
        sellerPayoutAmount: quoteAmount,
      };
    }

    case 'product_local_platform': {
      // Local transactions: buyer pays 5%, seller pays 5% platform fee
      const buyerFee = round(quoteAmount * 0.05);
      const subtotal = round(quoteAmount + buyerFee);
      const stripeFee = round(subtotal * 0.029 + 0.30);
      const totalCharged = round(subtotal + stripeFee);
      const sellerPayoutAmount = round(quoteAmount * 0.95);
      const platformFee = round(totalCharged - sellerPayoutAmount - stripeFee);
      return {
        quoteAmount,
        shippingCost: 0,
        buyerFee,
        stripeFee,
        totalCharged,
        platformFee,
        platformFeePercentage: 5,
        sellerPayoutAmount,
      };
    }

    case 'inventory': {
      const buyerFee = round(quoteAmount * 0.03);
      const subtotal = round(quoteAmount * 1.03);
      const stripeFee = round(subtotal * 0.029 + 0.30);
      const totalCharged = round(subtotal + stripeFee);
      const sellerPayoutAmount = round(quoteAmount * 0.97);
      const platformFee = round(totalCharged - sellerPayoutAmount - stripeFee);
      return {
        quoteAmount,
        shippingCost: 0,
        buyerFee,
        stripeFee,
        totalCharged,
        platformFee,
        platformFeePercentage: 3,
        sellerPayoutAmount,
      };
    }
  }
}

/**
 * Job lead-fee pricing (Phase 3 plan 07).
 * Returns the flat platform fee in USD that the company pays per matched lead,
 * scaled by the buyer-selected role tier (per Addendum A-05). Used when a
 * transaction's transactionType is 'job_milestone' instead of the percentage-based
 * fee in calculateFees.
 */
export type JobRoleTier = 'entry' | 'mid' | 'specialized_senior';

export function calculateJobLeadFee(roleTier: JobRoleTier): number {
  switch (roleTier) {
    case 'entry':
      return 10;
    case 'mid':
      return 50;
    case 'specialized_senior':
      return 500;
  }
}
