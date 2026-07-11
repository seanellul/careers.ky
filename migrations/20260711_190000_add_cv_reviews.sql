-- Free CV review loop (CEO spec §19, ClickUp 86baw8qx7): candidates with an
-- uploaded CV (candidate_documents, doc_type 'cv') can request a free review;
-- admins work a queue at /admin/cv-reviews and deliver written feedback back
-- to the candidate (in-app notification + email). Requests are sequential —
-- the partial unique index enforces one open request per candidate; a new
-- request is allowed once the previous one is completed or declined.
--
-- NOTE: not yet applied. The local dev DATABASE_URL points at the production
-- Neon database (single `main` branch), so this must be applied on deploy:
--   psql "$DATABASE_URL" -f migrations/20260711_190000_add_cv_reviews.sql
-- (or run the UP section via the Neon console / MCP).
-- Until applied, the app feature-detects (error 42P01) and hides the feature.

-- UP
CREATE TABLE IF NOT EXISTS cv_review_requests (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  document_id INTEGER NOT NULL REFERENCES candidate_documents(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'declined')),
  feedback TEXT,
  requested_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_cv_review_requests_candidate
  ON cv_review_requests (candidate_id);
CREATE INDEX IF NOT EXISTS idx_cv_review_requests_pending
  ON cv_review_requests (status) WHERE status = 'pending';
-- One open request at a time per candidate (spec: unlimited but sequential)
CREATE UNIQUE INDEX IF NOT EXISTS idx_cv_review_requests_one_open
  ON cv_review_requests (candidate_id) WHERE status = 'pending';

-- DOWN
-- DROP INDEX IF EXISTS idx_cv_review_requests_one_open;
-- DROP INDEX IF EXISTS idx_cv_review_requests_pending;
-- DROP INDEX IF EXISTS idx_cv_review_requests_candidate;
-- DROP TABLE IF EXISTS cv_review_requests;
