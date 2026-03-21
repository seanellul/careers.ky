import { neon } from "@neondatabase/serverless";

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set.");
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  console.log("Running Employer Verification & Team Management migrations...\n");

  // === 1. Add domain column to employers ===
  console.log("1. Adding domain column to employers...");
  await sql`ALTER TABLE employers ADD COLUMN IF NOT EXISTS domain VARCHAR(255)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_employers_domain ON employers(domain)`;
  console.log("   Done.\n");

  // === 2. Add role + verification columns to employer_accounts ===
  console.log("2. Adding role + verification columns to employer_accounts...");
  await sql`ALTER TABLE employer_accounts ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'member'`;
  await sql`ALTER TABLE employer_accounts ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'unverified'`;
  await sql`ALTER TABLE employer_accounts ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP`;
  await sql`ALTER TABLE employer_accounts ADD COLUMN IF NOT EXISTS verified_by VARCHAR(50)`;
  await sql`ALTER TABLE employer_accounts ADD COLUMN IF NOT EXISTS invited_by INTEGER`;
  console.log("   Done.\n");

  // === 3. Verification request queue ===
  console.log("3. Creating employer_verification_requests table...");
  await sql`
    CREATE TABLE IF NOT EXISTS employer_verification_requests (
      id SERIAL PRIMARY KEY,
      employer_account_id INTEGER NOT NULL,
      employer_id INTEGER NOT NULL,
      email_domain VARCHAR(255),
      status VARCHAR(20) DEFAULT 'pending',
      reviewed_by VARCHAR(255),
      reviewed_at TIMESTAMP,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_evr_status ON employer_verification_requests(status)`;
  console.log("   Done.\n");

  // === 4. Team invitations ===
  console.log("4. Creating employer_invitations table...");
  await sql`
    CREATE TABLE IF NOT EXISTS employer_invitations (
      id SERIAL PRIMARY KEY,
      employer_id INTEGER NOT NULL,
      invited_by INTEGER NOT NULL,
      email VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'member',
      token VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      accepted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_ei_token ON employer_invitations(token)`;
  console.log("   Done.\n");

  // === 5. Back-fill existing verified accounts ===
  console.log("5. Back-filling existing employer accounts as verified owners...");
  const result = await sql`
    UPDATE employer_accounts
    SET verification_status = 'verified', role = 'owner', verified_by = 'legacy'
    WHERE employer_id IS NOT NULL AND verification_status = 'unverified'
  `;
  console.log(`   Updated ${result?.count ?? 'some'} rows.\n`);

  console.log("All Employer Verification & Team Management migrations complete!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
