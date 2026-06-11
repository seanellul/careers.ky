-- Candidate document uploads (Vercel Blob-backed) + status verification.
-- status_proof approval grants the WORC Verified badge (candidates.status_verified).
-- Files live in the private blob store careers-ky-documents (store_HBwdAqQgn4B0J0ZQ);
-- blob_pathname is the store key — access only via authenticated server routes.

-- UP
CREATE TABLE IF NOT EXISTS candidate_documents (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  doc_type VARCHAR(30) NOT NULL
    CHECK (doc_type IN ('status_proof', 'cv', 'police_clearance', 'reference')),
  blob_pathname TEXT NOT NULL,
  filename VARCHAR(255),
  content_type VARCHAR(100),
  size_bytes INTEGER,
  review_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending', 'approved', 'rejected')),
  review_notes TEXT,
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidate_documents_candidate
  ON candidate_documents (candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_documents_pending
  ON candidate_documents (review_status) WHERE review_status = 'pending';

ALTER TABLE candidates ADD COLUMN IF NOT EXISTS status_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS status_verified_at TIMESTAMP;

-- DOWN
-- ALTER TABLE candidates DROP COLUMN IF EXISTS status_verified_at;
-- ALTER TABLE candidates DROP COLUMN IF EXISTS status_verified;
-- DROP TABLE IF EXISTS candidate_documents;
