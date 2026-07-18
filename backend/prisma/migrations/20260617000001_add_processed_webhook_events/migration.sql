-- AddTable: processed_webhook_events (SEC-H2 / issue #257)
-- Additive migration — new table only, no existing columns modified.
-- Durable Stripe webhook idempotency ledger; replaces best-effort Redis dedup.
CREATE TABLE "processed_webhook_events" (
    "event_id"     VARCHAR(255) NOT NULL,
    "event_type"   VARCHAR(100) NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_webhook_events_pkey" PRIMARY KEY ("event_id")
);

-- Index for retention sweeps / time-range queries
CREATE INDEX "processed_webhook_events_processed_at_idx"
    ON "processed_webhook_events" ("processed_at");
