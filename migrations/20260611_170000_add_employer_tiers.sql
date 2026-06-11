-- Employer tiers (D3, June 11): free / pro / enterprise / government.
-- No public pricing — tiers are assigned by admin (B2B case-by-case);
-- billing is off-platform for now (Phase 5). Entitlement logic lives in
-- lib/entitlements.js. tier_notes records the commercial context
-- (contract value, contact, renewal) for the admin view.

-- UP
ALTER TABLE employers ADD COLUMN IF NOT EXISTS tier VARCHAR(20) NOT NULL DEFAULT 'free'
  CHECK (tier IN ('free', 'pro', 'enterprise', 'government'));
ALTER TABLE employers ADD COLUMN IF NOT EXISTS tier_notes TEXT;
ALTER TABLE employers ADD COLUMN IF NOT EXISTS tier_updated_at TIMESTAMP;

-- DOWN
-- ALTER TABLE employers DROP COLUMN IF EXISTS tier_updated_at;
-- ALTER TABLE employers DROP COLUMN IF EXISTS tier_notes;
-- ALTER TABLE employers DROP COLUMN IF EXISTS tier;
