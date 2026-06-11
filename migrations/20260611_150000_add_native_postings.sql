-- Two-class job model (D1, ratified June 11): WORC-synced (imported feed)
-- vs native postings (client-created, platform-first).
-- Native rows live in job_postings so all listing/search/alert/compliance
-- queries work unchanged. New columns are NULL for WORC rows.
--   source        — 'worc' | 'native'
--   district      — required at native posting (spec 5.2)
--   seniority     — required at native posting (spec 9.3a)
--   required_qualifications — JSONB array, >=3 enforced at API level
--   posted_by_account_id    — employer account that created the posting
--   public_at     — Caymanian 24h early-access gate: hidden from public
--                   lists until this timestamp; matching Caymanian
--                   candidates see it immediately (spec 10.8)
--   cisco_code    — direct CISCO classification chosen at posting,
--                   bypassing the WORC occupation_code mapping

-- UP
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS source VARCHAR(10) NOT NULL DEFAULT 'worc'
  CHECK (source IN ('worc', 'native'));
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS district VARCHAR(50);
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS seniority VARCHAR(30);
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS required_qualifications JSONB;
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS posted_by_account_id INTEGER REFERENCES employer_accounts(id);
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS public_at TIMESTAMP;
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS cisco_code VARCHAR(10);
CREATE INDEX IF NOT EXISTS idx_job_postings_source ON job_postings (source);
CREATE INDEX IF NOT EXISTS idx_job_postings_cisco ON job_postings (cisco_code) WHERE cisco_code IS NOT NULL;

-- DOWN
-- DROP INDEX IF EXISTS idx_job_postings_cisco;
-- DROP INDEX IF EXISTS idx_job_postings_source;
-- ALTER TABLE job_postings DROP COLUMN IF EXISTS cisco_code;
-- ALTER TABLE job_postings DROP COLUMN IF EXISTS public_at;
-- ALTER TABLE job_postings DROP COLUMN IF EXISTS posted_by_account_id;
-- ALTER TABLE job_postings DROP COLUMN IF EXISTS required_qualifications;
-- ALTER TABLE job_postings DROP COLUMN IF EXISTS seniority;
-- ALTER TABLE job_postings DROP COLUMN IF EXISTS district;
-- ALTER TABLE job_postings DROP COLUMN IF EXISTS source;
