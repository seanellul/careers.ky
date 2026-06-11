-- Agency block (MVP #2, platform rule 2): recruitment agencies cannot
-- register as employers. A declaration is required at claim time and an
-- admin-maintained blacklist (emails + domains) hard-blocks repeat
-- attempts. Legal posture of the policy is with the lawyer (Phase 0).

-- UP
CREATE TABLE IF NOT EXISTS agency_blacklist (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255),
  domain VARCHAR(255),
  reason TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agency_blacklist_email ON agency_blacklist (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_agency_blacklist_domain ON agency_blacklist (LOWER(domain));

ALTER TABLE employer_accounts ADD COLUMN IF NOT EXISTS agency_declaration VARCHAR(20);

-- DOWN
-- ALTER TABLE employer_accounts DROP COLUMN IF EXISTS agency_declaration;
-- DROP TABLE IF EXISTS agency_blacklist;
