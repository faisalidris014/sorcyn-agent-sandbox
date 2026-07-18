-- Additive, forward-compatible migration (canary rule): one new nullable column.
-- No existing columns modified, no default needed — NULL means "no reminder sent
-- yet" for this credential's current expiry.
-- #382 PR2: the daily credential-expiry sweep records the smallest reminder
-- window (in days: 30/7/1) it has already sent for a request's current expiry, so
-- each window fires at most once. Reset to NULL on re-approval to re-arm reminders.
ALTER TABLE "verification_requests" ADD COLUMN "expiry_reminder_stage" SMALLINT;
