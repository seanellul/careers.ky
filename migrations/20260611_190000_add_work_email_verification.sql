-- Work-email verification: decouples domain proof from login identity.
-- Employers sign in with any OAuth account (e.g. personal Gmail when their
-- firm is a Microsoft shop), then prove their corporate address via a
-- one-time link sent to it. A verified work email whose domain matches the
-- claimed employer auto-approves the pending verification request.
--   employer_accounts.work_email / work_email_verified_at — the proof
--   auth_tokens.account_id — links a work_email token to the requesting account

-- UP
ALTER TABLE employer_accounts ADD COLUMN IF NOT EXISTS work_email VARCHAR(255);
ALTER TABLE employer_accounts ADD COLUMN IF NOT EXISTS work_email_verified_at TIMESTAMP;
ALTER TABLE auth_tokens ADD COLUMN IF NOT EXISTS account_id INTEGER;

-- DOWN
-- ALTER TABLE auth_tokens DROP COLUMN IF EXISTS account_id;
-- ALTER TABLE employer_accounts DROP COLUMN IF EXISTS work_email_verified_at;
-- ALTER TABLE employer_accounts DROP COLUMN IF EXISTS work_email;
