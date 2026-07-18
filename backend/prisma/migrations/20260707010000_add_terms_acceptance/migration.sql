-- Additive, forward-compatible migration (canary rule): two new nullable columns.
-- No existing columns modified. Records the user's Terms of Service acceptance at
-- signup (issue #314); the Terms carry the rights-to-upload representation + indemnity.
ALTER TABLE "users" ADD COLUMN "terms_accepted_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "terms_version" VARCHAR(20);

-- Backfill existing users (epic #310, open question 4): we can only record
-- acceptance going forward, so treat account creation as the acceptance moment
-- and tag it with a sentinel version distinct from any published Terms version.
UPDATE "users"
SET "terms_accepted_at" = "created_at",
    "terms_version" = 'pre-v1'
WHERE "terms_accepted_at" IS NULL;
