-- Additive, forward-compatible migration (canary rule): one new nullable-safe
-- column with a default + one new table. No existing columns modified.
-- Copyright takedown + perceptual-hash staydown + repeat-infringer enforcement (#313).

-- Denormalized strike counter for fast repeat-infringer enforcement. Defaults 0,
-- so existing rows need no backfill.
ALTER TABLE "users" ADD COLUMN "strike_count" INTEGER NOT NULL DEFAULT 0;

-- Perceptual-hash blocklist. Lookup is fuzzy (Hamming distance on perceptual_hash),
-- so there is intentionally no unique index on the hash — it is a linear scan.
CREATE TABLE "image_takedowns" (
    "takedown_id" UUID NOT NULL,
    "perceptual_hash" VARCHAR(16) NOT NULL,
    "hash_algo" VARCHAR(20) NOT NULL DEFAULT 'dhash-64',
    "image_key" VARCHAR(500) NOT NULL,
    "source_post_id" UUID,
    "source_offer_id" UUID,
    "uploader_user_id" UUID NOT NULL,
    "taken_down_by" UUID NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "image_takedowns_pkey" PRIMARY KEY ("takedown_id")
);

CREATE INDEX "image_takedowns_uploader_user_id_idx" ON "image_takedowns"("uploader_user_id");
CREATE INDEX "image_takedowns_created_at_idx" ON "image_takedowns"("created_at" DESC);
