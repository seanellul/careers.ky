-- Add indexes to job_postings hot paths.
--
-- The live DB already has (added manually, not via scripts/migrate.js):
--   idx_postings_status        (status, end_date)
--   idx_postings_occupation    (occupation_code)
--   idx_postings_employer      (employer)
--   idx_postings_title_search  gin (title gin_trgm_ops)
--
-- This migration adds the two that were missing:
--   synced_at: WORC sync stale-job marking and "new since" match-alert queries
--   LOWER(TRIM(employer)): employer profile pages and report ownership checks
--     filter on this expression, which the raw idx_postings_employer cannot serve

-- UP
CREATE INDEX IF NOT EXISTS idx_job_postings_synced_at
  ON job_postings (synced_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_postings_employer_lower
  ON job_postings (LOWER(TRIM(employer)));

-- DOWN
-- DROP INDEX IF EXISTS idx_job_postings_synced_at;
-- DROP INDEX IF EXISTS idx_job_postings_employer_lower;
