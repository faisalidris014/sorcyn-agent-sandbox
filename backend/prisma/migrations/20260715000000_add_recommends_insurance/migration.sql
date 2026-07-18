-- Additive, forward-compatible migration (canary rule): one new column with a
-- default. No existing columns modified.
-- Optional insurance certificate + "Insured" badge, per-category (#381).

-- When true, the seller add-category flow prompts an OPTIONAL insurance
-- certificate upload for this subcategory (drives the "Insured" badge if
-- provided). Never a hard gate. Defaults false, so existing rows need no backfill.
ALTER TABLE "category_verification_config" ADD COLUMN "recommends_insurance" BOOLEAN NOT NULL DEFAULT false;
