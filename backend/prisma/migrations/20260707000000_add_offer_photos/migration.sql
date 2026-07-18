-- Additive, forward-compatible migration (canary rule): new JSONB column with a
-- default so existing rows backfill to an empty array. No existing columns modified.
-- Mirrors Post.photos; sellers can attach optional photos to an offer (issue #312).
ALTER TABLE "offers" ADD COLUMN "photos" JSONB NOT NULL DEFAULT '[]';
