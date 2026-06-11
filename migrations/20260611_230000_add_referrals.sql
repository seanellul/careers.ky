-- Recommend-a-friend (MVP #23, spec 8.10): every candidate gets a
-- shareable link (?ref=CODE); the referred friend is attributed at
-- profile completion. Codes are generated lazily on first dashboard view.

-- UP
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS referral_code VARCHAR(12) UNIQUE;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS referred_by INTEGER REFERENCES candidates(id);
CREATE INDEX IF NOT EXISTS idx_candidates_referred_by
  ON candidates (referred_by) WHERE referred_by IS NOT NULL;

-- DOWN
-- ALTER TABLE candidates DROP COLUMN IF EXISTS referred_by;
-- ALTER TABLE candidates DROP COLUMN IF EXISTS referral_code;
