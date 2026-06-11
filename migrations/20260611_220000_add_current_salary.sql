-- Salary assessment (MVP #9 / SA-01..05): candidates share their current
-- salary (anonymous, feeds the salary-band data asset) and get an instant
-- market assessment computed from real WORC posting data — not the spec's
-- hardcoded bands.

-- UP
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS current_salary NUMERIC;

-- DOWN
-- ALTER TABLE candidates DROP COLUMN IF EXISTS current_salary;
