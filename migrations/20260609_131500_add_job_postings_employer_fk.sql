-- Add employer_id FK to job_postings so ownership checks use a real
-- relationship instead of LOWER(TRIM(employer)) = LOWER(name) string matching.
-- Backfill uses the exact predicate the old ownership checks used, so no
-- employer loses access to a job report they could previously see.
-- The WORC sync sets employer_id for new rows after each run.

-- UP
ALTER TABLE job_postings
  ADD COLUMN IF NOT EXISTS employer_id INTEGER REFERENCES employers(id);

UPDATE job_postings jp
SET employer_id = e.id
FROM employers e
WHERE jp.employer_id IS NULL
  AND LOWER(TRIM(jp.employer)) = LOWER(e.name);

CREATE INDEX IF NOT EXISTS idx_job_postings_employer_id
  ON job_postings (employer_id);

-- DOWN
-- DROP INDEX IF EXISTS idx_job_postings_employer_id;
-- ALTER TABLE job_postings DROP COLUMN IF EXISTS employer_id;
