-- Phase 4 staging anonymization.
-- Run AFTER restoring a prod pg_dump into staging.
-- Pseudonymizes user PII so load tests + chaos drills don't expose real data.
-- T-04-07-03 mitigation: emails → loadtest+{user_id}@sorcyn.test, NULLs Stripe IDs,
-- redacts bio/phone, replaces post addresses, truncates messages.
-- IMPORTANT: This script MUST be run before any load test using staging data
-- that was cloned from a production database backup.
-- Matches DEC-soft-delete-email-prefix shape.

BEGIN;

-- Pseudonymize user PII
UPDATE users SET
  email       = 'loadtest+' || id || '@sorcyn.test',
  phone       = NULL,
  first_name  = 'LoadFirst' || LEFT(REPLACE(id::text, '-', ''), 6),
  last_name   = 'LoadLast'  || LEFT(REPLACE(id::text, '-', ''), 6);

-- Pseudonymize seller profiles
UPDATE seller_profiles SET
  bio               = 'lorem ipsum dolor sit amet — anonymized for staging.',
  business_name     = 'LoadCo ' || LEFT(REPLACE(id::text, '-', ''), 6),
  stripe_customer_id = NULL,
  stripe_account_id  = NULL,
  stripe_charges_enabled = false,
  stripe_payouts_enabled = false;

-- Redact address-level PII on posts (keep category + budget intact for realistic load)
UPDATE posts SET
  location_address = '123 Loadtest Ln, Dallas, TX 75201'
WHERE location_address IS NOT NULL;

-- Truncate message bodies to non-PII placeholder
UPDATE messages SET
  body        = '[anonymized for staging]',
  attachments = '[]'::jsonb
WHERE body IS NOT NULL;

-- Wipe sensitive review content
UPDATE reviews SET
  comment = '[anonymized for staging]'
WHERE comment IS NOT NULL;

-- Wipe dispute evidence
UPDATE disputes SET
  description = '[anonymized for staging]'
WHERE description IS NOT NULL;

-- Nullify personal notification data
UPDATE notifications SET
  data = '{}'::jsonb
WHERE data IS NOT NULL;

COMMIT;

-- Verify: confirm no real emails remain (should return 0)
SELECT COUNT(*) AS non_loadtest_emails
FROM users
WHERE email NOT LIKE 'loadtest+%@sorcyn.test'
  AND deleted_at IS NULL;
