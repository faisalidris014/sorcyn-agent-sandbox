-- Per-participant inbox hide for Messages Edit-mode "Delete".
-- Additive / forward-compatible: nullable columns only (no drops, no NOT NULL).
-- IF NOT EXISTS keeps it idempotent — the columns may already be present on
-- environments that were synced via `prisma db push` during development.
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "hidden_at_p1" TIMESTAMP(3);
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "hidden_at_p2" TIMESTAMP(3);
