import { neon } from "@neondatabase/serverless";

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set.");
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  console.log("Running Phase 3 (Compliance) migrations...\n");

  // === 1. Add job_id + score columns to introductions ===
  console.log("1. Adding job_id and score columns to introductions...");
  await sql`ALTER TABLE introductions ADD COLUMN IF NOT EXISTS job_id VARCHAR(50)`;
  await sql`ALTER TABLE introductions ADD COLUMN IF NOT EXISTS match_score NUMERIC`;
  await sql`ALTER TABLE introductions ADD COLUMN IF NOT EXISTS match_breakdown JSONB`;
  await sql`CREATE INDEX IF NOT EXISTS idx_introductions_job ON introductions(job_id)`;
  console.log("   Done.\n");

  // === 2. Swap UNIQUE constraint to partial indexes ===
  console.log("2. Replacing unique constraint with partial indexes...");
  await sql`ALTER TABLE introductions DROP CONSTRAINT IF EXISTS introductions_employer_account_id_candidate_id_key`;

  // One intro per employer-candidate-job triple
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_intro_employer_candidate_job
      ON introductions(employer_account_id, candidate_id, job_id)
      WHERE job_id IS NOT NULL
  `;

  // Preserve one-per-pair for general (no-job) intros
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_intro_employer_candidate_general
      ON introductions(employer_account_id, candidate_id)
      WHERE job_id IS NULL
  `;
  console.log("   Done.\n");

  // === 3. Add job_id to activity_log ===
  console.log("3. Adding job_id column to activity_log...");
  await sql`ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS job_id VARCHAR(50)`;
  console.log("   Done.\n");

  console.log("All Phase 3 (Compliance) migrations complete!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
