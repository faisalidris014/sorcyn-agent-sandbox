-- AddTable: upload_hashes
-- Additive migration — new table only, no existing columns modified.
CREATE TABLE "upload_hashes" (
    "upload_hash_id" UUID NOT NULL,
    "user_id"        UUID NOT NULL,
    "category"       VARCHAR(50) NOT NULL,
    "content_hash"   VARCHAR(64) NOT NULL,
    "key"            VARCHAR(500) NOT NULL,
    "public_url"     VARCHAR(1000) NOT NULL,
    "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upload_hashes_pkey" PRIMARY KEY ("upload_hash_id")
);

-- UniqueConstraint: one hash per user+category
ALTER TABLE "upload_hashes"
    ADD CONSTRAINT "upload_hashes_user_id_category_content_hash_key"
    UNIQUE ("user_id", "category", "content_hash");

-- Index for fast lookup
CREATE INDEX "upload_hashes_user_id_category_content_hash_idx"
    ON "upload_hashes" ("user_id", "category", "content_hash");

-- FK to users
ALTER TABLE "upload_hashes"
    ADD CONSTRAINT "upload_hashes_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users" ("user_id")
    ON DELETE CASCADE ON UPDATE CASCADE;
