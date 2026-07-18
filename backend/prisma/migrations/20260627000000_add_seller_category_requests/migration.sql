-- Seller category access — Phase 2 (#336 / epic #334): additive-only.
-- Two new tables backing the seller category-request + verification-router flow.
-- Reuses the existing "VerificationRequestStatus" enum. No changes to existing
-- columns or tables. Forward-compatible per the forward-compatible-only-migrations rule.

-- CreateTable
CREATE TABLE "seller_category_requests" (
    "seller_category_request_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "major_category_id" UUID NOT NULL,
    "subcategory_ids" JSONB NOT NULL DEFAULT '[]',
    "documents" JSONB NOT NULL DEFAULT '[]',
    "license_number" VARCHAR(100),
    "holder_name" VARCHAR(255),
    "required_doc_types" JSONB NOT NULL DEFAULT '[]',
    "status" "VerificationRequestStatus" NOT NULL DEFAULT 'pending',
    "outcome" VARCHAR(50),
    "decision_reason" TEXT,
    "decision_context" JSONB,
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "seller_category_requests_pkey" PRIMARY KEY ("seller_category_request_id")
);

-- CreateTable
CREATE TABLE "category_verification_config" (
    "category_verification_config_id" UUID NOT NULL,
    "subcategory_id" UUID NOT NULL,
    "mode" VARCHAR(20) NOT NULL,
    "is_licensed" BOOLEAN NOT NULL DEFAULT false,
    "license_authority" VARCHAR(50),
    "requires_background_check" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_verification_config_pkey" PRIMARY KEY ("category_verification_config_id")
);

-- CreateIndex
CREATE INDEX "seller_category_requests_seller_id_idx" ON "seller_category_requests"("seller_id");

-- CreateIndex
CREATE INDEX "seller_category_requests_status_idx" ON "seller_category_requests"("status");

-- CreateIndex
CREATE INDEX "seller_category_requests_created_at_idx" ON "seller_category_requests"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "category_verification_config_subcategory_id_key" ON "category_verification_config"("subcategory_id");

-- AddForeignKey
ALTER TABLE "seller_category_requests" ADD CONSTRAINT "seller_category_requests_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller_profiles"("seller_id") ON DELETE CASCADE ON UPDATE CASCADE;
