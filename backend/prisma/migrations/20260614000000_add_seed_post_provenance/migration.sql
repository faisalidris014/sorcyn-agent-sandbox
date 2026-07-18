-- Cold-start seeded-post provenance (#37): additive-only.
-- referred_seller_id  = seller whose seeded-post offer was the lead for a cloned real post
-- source_seed_post_id = the originating seeded post a real post was cloned from
-- Both nullable; normal posts leave them null. Forward-compatible (nullable columns,
-- SET NULL on delete) per the forward-compatible-only-migrations rule.

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "referred_seller_id" UUID,
ADD COLUMN     "source_seed_post_id" UUID;

-- CreateIndex
CREATE INDEX "posts_source_seed_post_id_idx" ON "posts"("source_seed_post_id");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_referred_seller_id_fkey" FOREIGN KEY ("referred_seller_id") REFERENCES "seller_profiles"("seller_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_source_seed_post_id_fkey" FOREIGN KEY ("source_seed_post_id") REFERENCES "posts"("post_id") ON DELETE SET NULL ON UPDATE CASCADE;
