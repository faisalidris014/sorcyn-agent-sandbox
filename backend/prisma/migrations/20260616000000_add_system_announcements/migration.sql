-- In-app announcement banner (#85): additive-only.
-- Operator-controlled banner shown app-wide during incidents (docs/RUNBOOK_OPS.md §2, §5).
-- New enum + new table only. No changes to existing columns. Forward-compatible per the
-- forward-compatible-only-migrations rule.

-- CreateEnum
CREATE TYPE "AnnouncementSeverity" AS ENUM ('info', 'warning', 'critical');

-- CreateTable
CREATE TABLE "system_announcements" (
    "announcement_id" UUID NOT NULL,
    "message" VARCHAR(500) NOT NULL,
    "severity" "AnnouncementSeverity" NOT NULL DEFAULT 'info',
    "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ends_at" TIMESTAMP(3),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_announcements_pkey" PRIMARY KEY ("announcement_id")
);

-- CreateIndex
CREATE INDEX "system_announcements_starts_at_idx" ON "system_announcements"("starts_at");

-- CreateIndex
CREATE INDEX "system_announcements_ends_at_idx" ON "system_announcements"("ends_at");
