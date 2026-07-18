-- Forward-compatible additive change: read-only lock timestamp for conversations.
-- Set when the linked transaction completes; cleared when a dispute reopens the thread.
ALTER TABLE "conversations" ADD COLUMN "locked_at" TIMESTAMP(3);
