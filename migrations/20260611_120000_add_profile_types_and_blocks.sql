-- Three profile types (spec 6.2) + employer hard-block list (spec 7).
--   open      — fully searchable by all registered employers
--   selective — searchable, but the candidate's block list is absolute
--   closed    — hidden from all employer searches; alerts only
-- The block list is enforced at query level for ALL profile types (the
-- preference-form spec says excluded companies can never see the candidate
-- "under any tier"). is_discoverable stays in sync (profile_type != 'closed')
-- for unmigrated queries.

-- UP
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS profile_type VARCHAR(20) NOT NULL DEFAULT 'closed'
  CHECK (profile_type IN ('open', 'selective', 'closed'));

UPDATE candidates SET profile_type =
  CASE WHEN is_discoverable = TRUE THEN 'open' ELSE 'closed' END;

CREATE TABLE IF NOT EXISTS candidate_blocked_employers (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  employer_id INTEGER NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(candidate_id, employer_id)
);

CREATE INDEX IF NOT EXISTS idx_blocked_employers_candidate
  ON candidate_blocked_employers (candidate_id);
CREATE INDEX IF NOT EXISTS idx_blocked_employers_employer
  ON candidate_blocked_employers (employer_id);

-- DOWN
-- DROP TABLE IF EXISTS candidate_blocked_employers;
-- ALTER TABLE candidates DROP COLUMN IF EXISTS profile_type;
