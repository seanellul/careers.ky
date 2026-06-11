-- Candidate status enum: Caymanian / PR / RERC / Dependant / Overseas.
-- Replaces the is_caymanian boolean as the source of truth for ranking;
-- is_caymanian is kept in sync (status = 'caymanian') for back-compat with
-- existing queries until they migrate to status.
-- NULL status = candidate has not yet declared; UI prompts on next visit.

-- UP
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS status VARCHAR(20)
  CHECK (status IN ('caymanian', 'pr', 'rerc', 'dependant', 'overseas'));

UPDATE candidates SET status = 'caymanian'
WHERE is_caymanian = TRUE AND status IS NULL;

CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates (status);

-- DOWN
-- DROP INDEX IF EXISTS idx_candidates_status;
-- ALTER TABLE candidates DROP COLUMN IF EXISTS status;
