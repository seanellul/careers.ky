-- Preference form completion (spec 7 / MVP #8, #17):
--   notice_period — powers the employer "immediate start" filter
--   salary_target + salary_negotiable — complete the salary expectation
--     (salary_min already existed)

-- UP
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS notice_period VARCHAR(20)
  CHECK (notice_period IN ('immediate', '1_week', '2_weeks', '1_month', '2_months', '3_months', '3_plus_months'));

ALTER TABLE candidates ADD COLUMN IF NOT EXISTS salary_target NUMERIC;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS salary_negotiable BOOLEAN DEFAULT FALSE;

-- DOWN
-- ALTER TABLE candidates DROP COLUMN IF EXISTS salary_negotiable;
-- ALTER TABLE candidates DROP COLUMN IF EXISTS salary_target;
-- ALTER TABLE candidates DROP COLUMN IF EXISTS notice_period;
