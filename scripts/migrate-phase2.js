import { neon } from "@neondatabase/serverless";

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set.");
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  console.log("Running Phase 2 migrations...\n");

  // === 1. Candidate enrichment columns ===
  console.log("1. Adding candidate enrichment columns...");
  await sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS salary_min NUMERIC`;
  await sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS salary_max NUMERIC`;
  await sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS work_type_preferences TEXT[] DEFAULT '{}'`;
  await sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500)`;
  await sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS resume_summary TEXT`;
  console.log("   Done.\n");

  // === 2. Shortlists ===
  console.log("2. Creating shortlists tables...");
  await sql`
    CREATE TABLE IF NOT EXISTS shortlists (
      id SERIAL PRIMARY KEY,
      employer_account_id INTEGER NOT NULL REFERENCES employer_accounts(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      job_id VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_shortlists_employer ON shortlists(employer_account_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS shortlist_candidates (
      id SERIAL PRIMARY KEY,
      shortlist_id INTEGER NOT NULL REFERENCES shortlists(id) ON DELETE CASCADE,
      candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      notes TEXT,
      added_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(shortlist_id, candidate_id)
    )
  `;
  console.log("   Done.\n");

  // === 3. Introduction templates ===
  console.log("3. Creating intro_templates table...");
  await sql`
    CREATE TABLE IF NOT EXISTS intro_templates (
      id SERIAL PRIMARY KEY,
      employer_account_id INTEGER NOT NULL REFERENCES employer_accounts(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("   Done.\n");

  // === 4. Pipeline stages on introductions ===
  console.log("4. Adding pipeline columns to introductions...");
  await sql`ALTER TABLE introductions ADD COLUMN IF NOT EXISTS stage VARCHAR(50) DEFAULT 'outreach'`;
  await sql`ALTER TABLE introductions ADD COLUMN IF NOT EXISTS employer_notes TEXT`;
  console.log("   Done.\n");

  // === 5. Saved searches ===
  console.log("5. Creating saved_searches table...");
  await sql`
    CREATE TABLE IF NOT EXISTS saved_searches (
      id SERIAL PRIMARY KEY,
      employer_account_id INTEGER NOT NULL REFERENCES employer_accounts(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      filters JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("   Done.\n");

  // === 6. Activity log ===
  console.log("6. Creating activity_log table...");
  await sql`
    CREATE TABLE IF NOT EXISTS activity_log (
      id SERIAL PRIMARY KEY,
      employer_account_id INTEGER NOT NULL REFERENCES employer_accounts(id) ON DELETE CASCADE,
      action VARCHAR(100) NOT NULL,
      details JSONB DEFAULT '{}',
      candidate_id INTEGER,
      introduction_id INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_activity_log_employer ON activity_log(employer_account_id, created_at DESC)`;
  console.log("   Done.\n");

  console.log("All Phase 2 migrations complete!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
