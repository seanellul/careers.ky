import { neon } from "@neondatabase/serverless";

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set.");
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  console.log("Running Phase 4 (Pipeline) migrations...\n");

  // === 1. Direction tracking ===
  console.log("1. Adding initiated_by column to introductions...");
  await sql`ALTER TABLE introductions ADD COLUMN IF NOT EXISTS initiated_by VARCHAR(20) DEFAULT 'employer'`;
  console.log("   Done.\n");

  // === 2. Rejection fields ===
  console.log("2. Adding rejection fields to introductions...");
  await sql`ALTER TABLE introductions ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(100)`;
  await sql`ALTER TABLE introductions ADD COLUMN IF NOT EXISTS rejection_notes TEXT`;
  console.log("   Done.\n");

  // === 3. Messages table ===
  console.log("3. Creating introduction_messages table...");
  await sql`
    CREATE TABLE IF NOT EXISTS introduction_messages (
      id SERIAL PRIMARY KEY,
      introduction_id INTEGER NOT NULL REFERENCES introductions(id) ON DELETE CASCADE,
      sender_type VARCHAR(20) NOT NULL,
      sender_id INTEGER NOT NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_intro_messages_intro
      ON introduction_messages(introduction_id, created_at ASC)
  `;
  console.log("   Done.\n");

  // === 4. Update unique indexes to include initiated_by ===
  console.log("4. Updating unique indexes to include initiated_by...");
  await sql`DROP INDEX IF EXISTS uq_intro_employer_candidate_job`;
  await sql`
    CREATE UNIQUE INDEX uq_intro_employer_candidate_job
      ON introductions(employer_account_id, candidate_id, job_id, initiated_by)
      WHERE job_id IS NOT NULL
  `;

  await sql`DROP INDEX IF EXISTS uq_intro_employer_candidate_general`;
  await sql`
    CREATE UNIQUE INDEX uq_intro_employer_candidate_general
      ON introductions(employer_account_id, candidate_id, initiated_by)
      WHERE job_id IS NULL
  `;
  console.log("   Done.\n");

  console.log("All Phase 4 (Pipeline) migrations complete!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
