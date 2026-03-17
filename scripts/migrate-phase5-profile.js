import { neon } from "@neondatabase/serverless";

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set.");
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  console.log("Running Phase 5 (Employer Profile) migrations...\n");

  // === 1. New columns on employers ===
  console.log("1. Adding profile columns to employers...");
  await sql`ALTER TABLE employers ADD COLUMN IF NOT EXISTS cover_url TEXT`;
  await sql`ALTER TABLE employers ADD COLUMN IF NOT EXISTS tagline VARCHAR(200)`;
  await sql`ALTER TABLE employers ADD COLUMN IF NOT EXISTS company_size VARCHAR(20)`;
  await sql`ALTER TABLE employers ADD COLUMN IF NOT EXISTS year_founded INTEGER`;
  await sql`ALTER TABLE employers ADD COLUMN IF NOT EXISTS headquarters VARCHAR(200)`;
  await sql`ALTER TABLE employers ADD COLUMN IF NOT EXISTS industry VARCHAR(200)`;
  await sql`ALTER TABLE employers ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'`;
  await sql`ALTER TABLE employers ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '[]'`;
  await sql`ALTER TABLE employers ADD COLUMN IF NOT EXISTS profile_sections JSONB DEFAULT '{}'`;
  console.log("   Done.\n");

  // === 2. GIN index on benefits for discovery queries ===
  console.log("2. Creating GIN index on benefits...");
  await sql`CREATE INDEX IF NOT EXISTS idx_employers_benefits ON employers USING GIN (benefits)`;
  console.log("   Done.\n");

  console.log("All Phase 5 (Employer Profile) migrations complete!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
