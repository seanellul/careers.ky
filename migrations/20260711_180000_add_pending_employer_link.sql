-- Two-phase employer claim (ClickUp 86baw8qw0): step 1 of the setup wizard
-- records the selection as pending_employer_id only; employer_id (and
-- employers.claimed) is set when the wizard completes — or immediately on
-- domain-match auto-verification. Prevents half-finished registrations from
-- attaching companies to dashboards.
--
-- NOTE: not yet applied. The local dev DATABASE_URL points at the production
-- Neon database (single `main` branch), so this must be applied on deploy:
--   psql "$DATABASE_URL" -f migrations/20260711_180000_add_pending_employer_link.sql
-- (or run the UP section via the Neon console / MCP).

-- UP
ALTER TABLE employer_accounts
  ADD COLUMN IF NOT EXISTS pending_employer_id INTEGER REFERENCES employers(id);
ALTER TABLE employer_accounts
  ADD COLUMN IF NOT EXISTS pending_claimed_at TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_employer_accounts_pending
  ON employer_accounts (pending_employer_id) WHERE pending_employer_id IS NOT NULL;

-- DOWN
-- DROP INDEX IF EXISTS idx_employer_accounts_pending;
-- ALTER TABLE employer_accounts DROP COLUMN IF EXISTS pending_claimed_at;
-- ALTER TABLE employer_accounts DROP COLUMN IF EXISTS pending_employer_id;
