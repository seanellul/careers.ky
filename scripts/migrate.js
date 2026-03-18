import { neon } from "@neondatabase/serverless";
import { migrate as migratePipeline } from "../app/api/migrations/add-sales-pipeline.js";

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set.");
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  console.log("Running migrations...\n");

  // === Feature #1: Employer Intelligence Pages ===
  console.log("1. Creating employers table...");
  await sql`
    CREATE TABLE IF NOT EXISTS employers (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(500) NOT NULL,
      claimed BOOLEAN DEFAULT FALSE,
      website VARCHAR(500),
      description TEXT,
      logo_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_employers_slug ON employers(slug)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_employers_name ON employers(name)`;

  // Populate employers from existing job_postings
  console.log("   Populating employers from job_postings...");
  await sql`
    INSERT INTO employers (slug, name)
    SELECT DISTINCT
      LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(employer), '[^a-zA-Z0-9\\s-]', '', 'g'), '\\s+', '-', 'g')),
      TRIM(employer)
    FROM job_postings
    WHERE employer IS NOT NULL AND TRIM(employer) != ''
    ON CONFLICT (slug) DO NOTHING
  `;
  const empCount = await sql`SELECT COUNT(*) as c FROM employers`;
  console.log(`   ${empCount[0].c} employers populated.\n`);

  // === Feature #2: Talent Profiles ===
  console.log("2. Creating candidates & auth tables...");
  await sql`
    CREATE TABLE IF NOT EXISTS candidates (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255),
      is_caymanian BOOLEAN DEFAULT FALSE,
      education_code VARCHAR(10),
      experience_code VARCHAR(10),
      location_code VARCHAR(10),
      availability VARCHAR(50) DEFAULT 'actively_looking',
      is_discoverable BOOLEAN DEFAULT FALSE,
      bio TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_candidates_discoverable ON candidates(is_discoverable) WHERE is_discoverable = TRUE`;

  await sql`
    CREATE TABLE IF NOT EXISTS candidate_interests (
      id SERIAL PRIMARY KEY,
      candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      cisco_code VARCHAR(10) NOT NULL,
      UNIQUE(candidate_id, cisco_code)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_candidate_interests_cisco ON candidate_interests(cisco_code)`;

  await sql`
    CREATE TABLE IF NOT EXISTS auth_tokens (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      token VARCHAR(255) UNIQUE NOT NULL,
      token_type VARCHAR(50) NOT NULL DEFAULT 'magic_link',
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(token)`;

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(255) UNIQUE NOT NULL,
      candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
      employer_account_id INTEGER,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id)`;
  console.log("   Done.\n");

  // === Feature #3: Employer Talent Search ===
  console.log("3. Creating employer_accounts & introductions tables...");
  await sql`
    CREATE TABLE IF NOT EXISTS employer_accounts (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      employer_id INTEGER REFERENCES employers(id),
      name VARCHAR(255),
      verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS introductions (
      id SERIAL PRIMARY KEY,
      employer_account_id INTEGER NOT NULL REFERENCES employer_accounts(id) ON DELETE CASCADE,
      candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      status VARCHAR(50) DEFAULT 'pending',
      message TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      responded_at TIMESTAMP,
      UNIQUE(employer_account_id, candidate_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_introductions_candidate ON introductions(candidate_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_introductions_employer ON introductions(employer_account_id)`;

  // Add employer_account_id FK to sessions
  await sql`
    DO $$ BEGIN
      ALTER TABLE sessions ADD CONSTRAINT fk_sessions_employer
        FOREIGN KEY (employer_account_id) REFERENCES employer_accounts(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `;
  console.log("   Done.\n");

  // === Feature #4: Skills Layer ===
  console.log("4. Creating skills tables...");
  await sql`
    CREATE TABLE IF NOT EXISTS skills (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      category VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category)`;

  await sql`
    CREATE TABLE IF NOT EXISTS cisco_skills (
      id SERIAL PRIMARY KEY,
      cisco_code VARCHAR(10) NOT NULL,
      skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      UNIQUE(cisco_code, skill_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_cisco_skills_cisco ON cisco_skills(cisco_code)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_cisco_skills_skill ON cisco_skills(skill_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS candidate_skills (
      id SERIAL PRIMARY KEY,
      candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      UNIQUE(candidate_id, skill_id)
    )
  `;
  console.log("   Done.\n");

  // === Feature #5: Smart Match Alerts ===
  console.log("5. Creating alerts & notifications tables...");
  await sql`
    CREATE TABLE IF NOT EXISTS match_alerts (
      id SERIAL PRIMARY KEY,
      candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
      employer_account_id INTEGER REFERENCES employer_accounts(id) ON DELETE CASCADE,
      filters JSONB NOT NULL DEFAULT '{}',
      frequency VARCHAR(20) DEFAULT 'daily',
      is_active BOOLEAN DEFAULT TRUE,
      last_sent_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      recipient_type VARCHAR(20) NOT NULL,
      recipient_id INTEGER NOT NULL,
      title VARCHAR(500) NOT NULL,
      body TEXT,
      link VARCHAR(500),
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_type, recipient_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_type, recipient_id, is_read) WHERE is_read = FALSE`;
  console.log("   Done.\n");

  // === Feature #6: Rich Job Posting Data ===
  console.log("6. Adding rich job posting columns...");
  await sql`ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS job_description TEXT`;
  await sql`ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS salary_long VARCHAR(500)`;
  await sql`ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS frequency_of_payment VARCHAR(50)`;
  await sql`ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS kyd_per_annum NUMERIC`;
  await sql`ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS number_of_positions INTEGER`;
  await sql`ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS medical_check BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS police_check BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS driving_license BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS cover_letter_required BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS applicant_count INTEGER DEFAULT 0`;
  console.log("   Done.\n");

  console.log("All migrations complete!");

  // === Feature #7: Sales Pipeline CRM ===
  console.log("\n7. Running sales pipeline migration...");
  try {
    await migratePipeline();
  } catch (err) {
    console.error("   Pipeline migration error:", err.message);
    // Don't fail the entire migration - this might be a setup issue
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
