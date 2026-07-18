-- AlterEnum: PricingType — add 'per_item' and 'custom' (Submit Offer form, issue #304)
-- Additive migration — new enum values only. Forward-compatible: no DROP/RENAME/SET NOT NULL.
-- Per-item line-item details (unitPrice, quantity) and custom pricing notes are
-- stored in the existing offers.category_specific JSONB; no column changes needed.
ALTER TYPE "PricingType" ADD VALUE IF NOT EXISTS 'per_item';
ALTER TYPE "PricingType" ADD VALUE IF NOT EXISTS 'custom';
