-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('buyer', 'seller', 'both');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'suspended', 'banned', 'deleted');

-- CreateEnum
CREATE TYPE "BudgetType" AS ENUM ('range', 'open', 'fixed');

-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('asap', 'within_24_hours', 'within_3_days', 'within_1_week', 'flexible', 'specific_date');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('draft', 'active', 'filled', 'expired', 'cancelled', 'archived');

-- CreateEnum
CREATE TYPE "OfferType" AS ENUM ('service', 'product', 'job_application', 'inventory');

-- CreateEnum
CREATE TYPE "PricingType" AS ENUM ('flat_rate', 'hourly', 'quote', 'fixed');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('pending', 'accepted', 'declined', 'withdrawn', 'expired', 'counter_offered', 'needs_reconfirmation');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('service', 'product_shipped', 'product_local_cash', 'product_local_platform', 'job_milestone', 'inventory');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('held', 'released', 'refunded', 'frozen');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('in_progress', 'scheduled', 'on_the_way', 'started', 'awaiting_approval', 'changes_requested', 'approved', 'cancelled', 'disputed', 'preparing_shipment', 'shipped', 'in_transit', 'delivered', 'pending_meetup', 'meetup_scheduled', 'meetup_complete', 'qr_scanned', 'completed', 'pending_start', 'in_progress_milestone');

-- CreateEnum
CREATE TYPE "CancelledBy" AS ENUM ('buyer', 'seller', 'admin', 'system');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('approved', 'pending', 'rejected');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('active', 'archived', 'closed');

-- CreateEnum
CREATE TYPE "RequestedResolution" AS ENUM ('full_refund', 'partial_refund', 'no_refund', 'other');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('open', 'under_review', 'resolved', 'appealed', 'closed');

-- CreateEnum
CREATE TYPE "DisputeOutcome" AS ENUM ('full_refund', 'partial_refund', 'no_refund', 'custom');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'in_transit', 'paid', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentIntentQueueStatus" AS ENUM ('queued', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('id', 'ein', 'sales_tax', 'license', 'insurance', 'background_check');

-- CreateEnum
CREATE TYPE "VerificationRequestStatus" AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "SearchType" AS ENUM ('posts', 'sellers');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('user', 'admin', 'system');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('en', 'es', 'zh', 'ar', 'fr', 'pt', 'hi', 'vi', 'ko', 'ja');

-- CreateEnum
CREATE TYPE "MarketplaceContext" AS ENUM ('b2c', 'b2b', 'c2c');

-- CreateTable
CREATE TABLE "users" (
    "user_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "account_type" "AccountType" NOT NULL DEFAULT 'buyer',
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "profile_photo_url" TEXT,
    "location_city" VARCHAR(100),
    "location_state" VARCHAR(50),
    "location_zip" VARCHAR(10),
    "location_country" VARCHAR(50) NOT NULL DEFAULT 'US',
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "bio" TEXT,
    "notification_preferences" JSONB NOT NULL DEFAULT '{"email_offers": true, "sms_offers": false, "push_messages": true}',
    "rating" DECIMAL(3,2),
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "total_transactions" INTEGER NOT NULL DEFAULT 0,
    "stripe_customer_id" VARCHAR(100),
    "ein" VARCHAR(10),
    "is_business" BOOLEAN NOT NULL DEFAULT false,
    "fcm_token" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "session_version" INTEGER NOT NULL DEFAULT 0,
    "preferred_language" "Language" NOT NULL DEFAULT 'en',
    "active_marketplace" "MarketplaceContext" NOT NULL DEFAULT 'b2c',
    "marketplace_contexts" JSONB NOT NULL DEFAULT '["b2c"]',
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "seller_profiles" (
    "seller_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "business_name" VARCHAR(255),
    "profile_photo_url" TEXT,
    "service_radius_miles" INTEGER NOT NULL DEFAULT 25,
    "categories" JSONB NOT NULL DEFAULT '[]',
    "subcategories" JSONB NOT NULL DEFAULT '[]',
    "bio" TEXT,
    "years_experience" INTEGER,
    "portfolio_photos" JSONB NOT NULL DEFAULT '[]',
    "business_website" TEXT,
    "business_hours" JSONB,
    "verification_tier" INTEGER NOT NULL DEFAULT 1,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "id_verified" BOOLEAN NOT NULL DEFAULT false,
    "ein_verified" BOOLEAN NOT NULL DEFAULT false,
    "license_verified" BOOLEAN NOT NULL DEFAULT false,
    "insurance_verified" BOOLEAN NOT NULL DEFAULT false,
    "background_check_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_badges" JSONB NOT NULL DEFAULT '[]',
    "license_number" VARCHAR(100),
    "license_state" VARCHAR(50),
    "license_expiry" DATE,
    "insurance_provider" VARCHAR(255),
    "insurance_policy_number" VARCHAR(100),
    "insurance_expiry" DATE,
    "stripe_account_id" VARCHAR(100),
    "stripe_onboarding_status" VARCHAR(50) NOT NULL DEFAULT 'not_started',
    "stripe_charges_enabled" BOOLEAN NOT NULL DEFAULT false,
    "stripe_payouts_enabled" BOOLEAN NOT NULL DEFAULT false,
    "marketplace_contexts" JSONB NOT NULL DEFAULT '["b2c"]',
    "business_type" VARCHAR(50),
    "sales_tax_certificate_url" TEXT,
    "sales_tax_verified" BOOLEAN NOT NULL DEFAULT false,
    "profile_strength" INTEGER NOT NULL DEFAULT 0,
    "max_bid_amount" DECIMAL(10,2) NOT NULL DEFAULT 500.00,
    "rating" DECIMAL(3,2),
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "total_completed" INTEGER NOT NULL DEFAULT 0,
    "total_active_offers" INTEGER NOT NULL DEFAULT 0,
    "acceptance_rate" DECIMAL(5,2),
    "response_time_hours" DECIMAL(5,2),
    "rating_badge" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "seller_profiles_pkey" PRIMARY KEY ("seller_id")
);

-- CreateTable
CREATE TABLE "categories" (
    "category_id" UUID NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(50),
    "parent_category_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "enabled_in_mvp" BOOLEAN NOT NULL DEFAULT false,
    "marketplace_contexts" JSONB NOT NULL DEFAULT '["b2c", "b2b", "c2c"]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "posts" (
    "post_id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "subcategory_id" UUID,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "photos" JSONB NOT NULL DEFAULT '[]',
    "videos" JSONB NOT NULL DEFAULT '[]',
    "budget_min" DECIMAL(10,2),
    "budget_max" DECIMAL(10,2),
    "budget_type" "BudgetType" NOT NULL DEFAULT 'range',
    "location_address" TEXT,
    "location_city" VARCHAR(100),
    "location_state" VARCHAR(50),
    "location_zip" VARCHAR(10),
    "location_country" VARCHAR(50) NOT NULL DEFAULT 'US',
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "urgency" "Urgency",
    "preferred_date" DATE,
    "preferred_time" VARCHAR(50),
    "category_specific" JSONB NOT NULL DEFAULT '{}',
    "requirements" JSONB NOT NULL DEFAULT '{}',
    "marketplace_context" "MarketplaceContext" NOT NULL DEFAULT 'b2c',
    "status" "PostStatus" NOT NULL DEFAULT 'active',
    "offer_count" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3),
    "public_after" TIMESTAMP(3),
    "filled_at" TIMESTAMP(3),
    "bumped_at" TIMESTAMP(3),
    "extended_count" INTEGER NOT NULL DEFAULT 0,
    "is_seed" BOOLEAN NOT NULL DEFAULT false,
    "search_vector" tsvector,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "posts_pkey" PRIMARY KEY ("post_id")
);

-- CreateTable
CREATE TABLE "offers" (
    "offer_id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "offer_type" "OfferType" NOT NULL,
    "quote_amount" DECIMAL(10,2) NOT NULL,
    "pricing_type" "PricingType",
    "estimated_hours" DECIMAL(5,2),
    "message" TEXT NOT NULL,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "terms" TEXT,
    "warranty" TEXT,
    "can_start" VARCHAR(100),
    "specific_date" DATE,
    "completion_time" VARCHAR(100),
    "category_specific" JSONB NOT NULL DEFAULT '{}',
    "marketplace_context" "MarketplaceContext" NOT NULL DEFAULT 'b2c',
    "estimated_payout" DECIMAL(10,2),
    "platform_fee" DECIMAL(10,2),
    "status" "OfferStatus" NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "declined_at" TIMESTAMP(3),
    "withdrawn_at" TIMESTAMP(3),
    "counter_offered_at" TIMESTAMP(3),
    "counter_amount" DECIMAL(10,2),
    "counter_message" TEXT,
    "counter_terms" TEXT,
    "parent_offer_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "offers_pkey" PRIMARY KEY ("offer_id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "transaction_id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "offer_id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "transaction_type" "TransactionType" NOT NULL,
    "quote_amount" DECIMAL(10,2) NOT NULL,
    "buyer_fee" DECIMAL(10,2),
    "stripe_fee" DECIMAL(10,2),
    "total_charged" DECIMAL(10,2),
    "platform_fee" DECIMAL(10,2),
    "platform_fee_percentage" DECIMAL(5,2),
    "seller_payout_amount" DECIMAL(10,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "shipping_cost" DECIMAL(10,2),
    "stripe_charge_id" VARCHAR(100),
    "stripe_payment_intent_id" VARCHAR(100),
    "payment_method_last4" VARCHAR(4),
    "payment_method_brand" VARCHAR(30),
    "escrow_status" "EscrowStatus" NOT NULL DEFAULT 'held',
    "escrow_released_at" TIMESTAMP(3),
    "release_reason" VARCHAR(50),
    "auto_release_at" TIMESTAMP(3),
    "status" "TransactionStatus" NOT NULL DEFAULT 'in_progress',
    "before_photos" JSONB NOT NULL DEFAULT '[]',
    "progress_photos" JSONB NOT NULL DEFAULT '[]',
    "after_photos" JSONB NOT NULL DEFAULT '[]',
    "completion_notes" TEXT,
    "work_summary" TEXT,
    "completed_at" TIMESTAMP(3),
    "tracking_number" VARCHAR(100),
    "carrier" VARCHAR(50),
    "shipped_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "estimated_delivery_date" DATE,
    "shipping_address" JSONB,
    "meetup_location" TEXT,
    "meetup_date" DATE,
    "meetup_time" VARCHAR(20),
    "meetup_confirmed_by_seller" BOOLEAN NOT NULL DEFAULT false,
    "meetup_confirmed_by_buyer" BOOLEAN NOT NULL DEFAULT false,
    "qr_scanned_at" TIMESTAMP(3),
    "scheduled_date" DATE,
    "scheduled_time" VARCHAR(50),
    "special_instructions" TEXT,
    "cancelled_at" TIMESTAMP(3),
    "cancelled_by" "CancelledBy",
    "cancellation_reason" TEXT,
    "timeline" JSONB NOT NULL DEFAULT '[]',
    "stripe_refund_id" VARCHAR(100),
    "refund_amount" DECIMAL(10,2),
    "refunded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "review_id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "overall_rating" INTEGER NOT NULL,
    "category_ratings" JSONB NOT NULL DEFAULT '{}',
    "written_review" TEXT,
    "would_recommend" BOOLEAN NOT NULL,
    "verified_completion" BOOLEAN NOT NULL DEFAULT true,
    "completion_photos" JSONB NOT NULL DEFAULT '[]',
    "seller_response_text" TEXT,
    "seller_responded_at" TIMESTAMP(3),
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "flag_reason" VARCHAR(50),
    "flagged_at" TIMESTAMP(3),
    "moderation_status" "ModerationStatus" NOT NULL DEFAULT 'approved',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("review_id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "conversation_id" UUID NOT NULL,
    "post_id" UUID,
    "offer_id" UUID,
    "transaction_id" UUID,
    "participant_1_id" UUID NOT NULL,
    "participant_2_id" UUID NOT NULL,
    "status" "ConversationStatus" NOT NULL DEFAULT 'active',
    "last_message_at" TIMESTAMP(3),
    "unread_count_p1" INTEGER NOT NULL DEFAULT 0,
    "unread_count_p2" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("conversation_id")
);

-- CreateTable
CREATE TABLE "messages" (
    "message_id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "message_text" TEXT NOT NULL,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "flag_reason" VARCHAR(50),
    "moderation_status" "ModerationStatus" NOT NULL DEFAULT 'approved',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "dispute_id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "opened_by_id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "dispute_type" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "requested_resolution" "RequestedResolution",
    "requested_amount" DECIMAL(10,2),
    "buyer_evidence" JSONB NOT NULL DEFAULT '[]',
    "seller_evidence" JSONB NOT NULL DEFAULT '[]',
    "tier" INTEGER NOT NULL DEFAULT 1,
    "assigned_agent_id" UUID,
    "arbitrator_name" VARCHAR(255),
    "ai_confidence_score" INTEGER,
    "ai_recommended_outcome" VARCHAR(50),
    "ai_recommended_amount" DECIMAL(10,2),
    "ai_reasoning" TEXT,
    "status" "DisputeStatus" NOT NULL DEFAULT 'open',
    "outcome" "DisputeOutcome",
    "refund_amount" DECIMAL(10,2),
    "seller_payout_amount" DECIMAL(10,2),
    "resolution_summary" TEXT,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evidence_deadline" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "estimated_resolution_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("dispute_id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "payout_id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "gross_amount" DECIMAL(10,2) NOT NULL,
    "platform_fee" DECIMAL(10,2) NOT NULL,
    "platform_fee_percentage" DECIMAL(5,2) NOT NULL,
    "net_payout" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "stripe_transfer_id" VARCHAR(100),
    "stripe_payout_id" VARCHAR(100),
    "bank_account_last4" VARCHAR(4),
    "bank_name" VARCHAR(255),
    "status" "PayoutStatus" NOT NULL DEFAULT 'pending',
    "initiated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estimated_arrival" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "receipt_url" TEXT,
    "invoice_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("payout_id")
);

-- CreateTable
CREATE TABLE "payment_intent_queue" (
    "queue_id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "total_charged" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "status" "PaymentIntentQueueStatus" NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "queued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_intent_queue_pkey" PRIMARY KEY ("queue_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "notification_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "channels" JSONB NOT NULL DEFAULT '["push"]',
    "push_sent" BOOLEAN NOT NULL DEFAULT false,
    "push_sent_at" TIMESTAMP(3),
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "email_sent_at" TIMESTAMP(3),
    "sms_sent" BOOLEAN NOT NULL DEFAULT false,
    "sms_sent_at" TIMESTAMP(3),
    "read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "action_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "verification_requests" (
    "verification_request_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "verification_type" "VerificationType" NOT NULL,
    "tier" INTEGER NOT NULL,
    "documents" JSONB NOT NULL DEFAULT '[]',
    "status" "VerificationRequestStatus" NOT NULL DEFAULT 'pending',
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "notes" TEXT,
    "expires_at" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "verification_requests_pkey" PRIMARY KEY ("verification_request_id")
);

-- CreateTable
CREATE TABLE "saved_searches" (
    "saved_search_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "search_type" "SearchType" NOT NULL,
    "filters" JSONB NOT NULL,
    "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_notified_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("saved_search_id")
);

-- CreateTable
CREATE TABLE "saved_sellers" (
    "saved_seller_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "seller_profile_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_sellers_pkey" PRIMARY KEY ("saved_seller_id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "log_id" UUID NOT NULL,
    "user_id" UUID,
    "actor_type" "ActorType",
    "action" VARCHAR(100) NOT NULL,
    "resource_type" VARCHAR(50) NOT NULL,
    "resource_id" UUID,
    "details" JSONB NOT NULL DEFAULT '{}',
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_active_marketplace_idx" ON "users"("active_marketplace");

-- CreateIndex
CREATE UNIQUE INDEX "seller_profiles_user_id_key" ON "seller_profiles"("user_id");

-- CreateIndex
CREATE INDEX "seller_profiles_user_id_idx" ON "seller_profiles"("user_id");

-- CreateIndex
CREATE INDEX "seller_profiles_rating_idx" ON "seller_profiles"("rating" DESC);

-- CreateIndex
CREATE INDEX "seller_profiles_verification_tier_idx" ON "seller_profiles"("verification_tier");

-- CreateIndex
CREATE INDEX "seller_profiles_stripe_account_id_idx" ON "seller_profiles"("stripe_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_slug_idx" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parent_category_id_idx" ON "categories"("parent_category_id");

-- CreateIndex
CREATE INDEX "categories_is_active_enabled_in_mvp_idx" ON "categories"("is_active", "enabled_in_mvp");

-- CreateIndex
CREATE INDEX "posts_buyer_id_idx" ON "posts"("buyer_id");

-- CreateIndex
CREATE INDEX "posts_category_id_subcategory_id_idx" ON "posts"("category_id", "subcategory_id");

-- CreateIndex
CREATE INDEX "posts_status_idx" ON "posts"("status");

-- CreateIndex
CREATE INDEX "posts_budget_min_budget_max_idx" ON "posts"("budget_min", "budget_max");

-- CreateIndex
CREATE INDEX "posts_urgency_idx" ON "posts"("urgency");

-- CreateIndex
CREATE INDEX "posts_expires_at_idx" ON "posts"("expires_at");

-- CreateIndex
CREATE INDEX "posts_public_after_idx" ON "posts"("public_after");

-- CreateIndex
CREATE INDEX "posts_is_seed_idx" ON "posts"("is_seed");

-- CreateIndex
CREATE INDEX "posts_marketplace_context_status_idx" ON "posts"("marketplace_context", "status");

-- CreateIndex
CREATE INDEX "offers_post_id_idx" ON "offers"("post_id");

-- CreateIndex
CREATE INDEX "offers_seller_id_idx" ON "offers"("seller_id");

-- CreateIndex
CREATE INDEX "offers_status_idx" ON "offers"("status");

-- CreateIndex
CREATE INDEX "offers_parent_offer_id_idx" ON "offers"("parent_offer_id");

-- CreateIndex
CREATE INDEX "transactions_post_id_idx" ON "transactions"("post_id");

-- CreateIndex
CREATE INDEX "transactions_offer_id_idx" ON "transactions"("offer_id");

-- CreateIndex
CREATE INDEX "transactions_buyer_id_idx" ON "transactions"("buyer_id");

-- CreateIndex
CREATE INDEX "transactions_seller_id_idx" ON "transactions"("seller_id");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_escrow_status_idx" ON "transactions"("escrow_status");

-- CreateIndex
CREATE INDEX "transactions_auto_release_at_idx" ON "transactions"("auto_release_at");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_transaction_id_key" ON "reviews"("transaction_id");

-- CreateIndex
CREATE INDEX "reviews_seller_id_idx" ON "reviews"("seller_id");

-- CreateIndex
CREATE INDEX "reviews_buyer_id_idx" ON "reviews"("buyer_id");

-- CreateIndex
CREATE INDEX "reviews_overall_rating_idx" ON "reviews"("overall_rating");

-- CreateIndex
CREATE INDEX "reviews_moderation_status_idx" ON "reviews"("moderation_status");

-- CreateIndex
CREATE INDEX "reviews_created_at_idx" ON "reviews"("created_at" DESC);

-- CreateIndex
CREATE INDEX "conversations_participant_1_id_idx" ON "conversations"("participant_1_id");

-- CreateIndex
CREATE INDEX "conversations_participant_2_id_idx" ON "conversations"("participant_2_id");

-- CreateIndex
CREATE INDEX "conversations_post_id_idx" ON "conversations"("post_id");

-- CreateIndex
CREATE INDEX "conversations_transaction_id_idx" ON "conversations"("transaction_id");

-- CreateIndex
CREATE INDEX "conversations_status_idx" ON "conversations"("status");

-- CreateIndex
CREATE INDEX "conversations_last_message_at_idx" ON "conversations"("last_message_at" DESC);

-- CreateIndex
CREATE INDEX "messages_conversation_id_idx" ON "messages"("conversation_id");

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");

-- CreateIndex
CREATE INDEX "messages_read_idx" ON "messages"("read");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at" DESC);

-- CreateIndex
CREATE INDEX "disputes_transaction_id_idx" ON "disputes"("transaction_id");

-- CreateIndex
CREATE INDEX "disputes_buyer_id_idx" ON "disputes"("buyer_id");

-- CreateIndex
CREATE INDEX "disputes_seller_id_idx" ON "disputes"("seller_id");

-- CreateIndex
CREATE INDEX "disputes_status_idx" ON "disputes"("status");

-- CreateIndex
CREATE INDEX "disputes_tier_idx" ON "disputes"("tier");

-- CreateIndex
CREATE INDEX "disputes_opened_at_idx" ON "disputes"("opened_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "payouts_transaction_id_key" ON "payouts"("transaction_id");

-- CreateIndex
CREATE INDEX "payouts_seller_id_idx" ON "payouts"("seller_id");

-- CreateIndex
CREATE INDEX "payouts_status_idx" ON "payouts"("status");

-- CreateIndex
CREATE INDEX "payouts_stripe_transfer_id_idx" ON "payouts"("stripe_transfer_id");

-- CreateIndex
CREATE INDEX "payouts_initiated_at_idx" ON "payouts"("initiated_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "payment_intent_queue_transaction_id_key" ON "payment_intent_queue"("transaction_id");

-- CreateIndex
CREATE INDEX "payment_intent_queue_status_idx" ON "payment_intent_queue"("status");

-- CreateIndex
CREATE INDEX "payment_intent_queue_queued_at_idx" ON "payment_intent_queue"("queued_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_read_idx" ON "notifications"("read");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at" DESC);

-- CreateIndex
CREATE INDEX "verification_requests_seller_id_idx" ON "verification_requests"("seller_id");

-- CreateIndex
CREATE INDEX "verification_requests_status_idx" ON "verification_requests"("status");

-- CreateIndex
CREATE INDEX "verification_requests_verification_type_idx" ON "verification_requests"("verification_type");

-- CreateIndex
CREATE INDEX "verification_requests_created_at_idx" ON "verification_requests"("created_at" DESC);

-- CreateIndex
CREATE INDEX "saved_searches_user_id_idx" ON "saved_searches"("user_id");

-- CreateIndex
CREATE INDEX "saved_searches_is_active_idx" ON "saved_searches"("is_active");

-- CreateIndex
CREATE INDEX "saved_sellers_user_id_idx" ON "saved_sellers"("user_id");

-- CreateIndex
CREATE INDEX "saved_sellers_seller_profile_id_idx" ON "saved_sellers"("seller_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_sellers_user_id_seller_profile_id_key" ON "saved_sellers"("user_id", "seller_profile_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_resource_type_resource_id_idx" ON "audit_logs"("resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "seller_profiles" ADD CONSTRAINT "seller_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "categories"("category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "categories"("category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("post_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller_profiles"("seller_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_parent_offer_id_fkey" FOREIGN KEY ("parent_offer_id") REFERENCES "offers"("offer_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("post_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("offer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller_profiles"("seller_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("transaction_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller_profiles"("seller_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("post_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("offer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("transaction_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_participant_1_id_fkey" FOREIGN KEY ("participant_1_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_participant_2_id_fkey" FOREIGN KEY ("participant_2_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("conversation_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("transaction_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("post_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_opened_by_id_fkey" FOREIGN KEY ("opened_by_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller_profiles"("seller_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("transaction_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller_profiles"("seller_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller_profiles"("seller_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_sellers" ADD CONSTRAINT "saved_sellers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_sellers" ADD CONSTRAINT "saved_sellers_seller_profile_id_fkey" FOREIGN KEY ("seller_profile_id") REFERENCES "seller_profiles"("seller_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
