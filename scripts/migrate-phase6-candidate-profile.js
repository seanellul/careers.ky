import { neon } from "@neondatabase/serverless";

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set.");
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  console.log("Running Phase 6 (Candidate Profile Enhancement) migrations...\n");

  console.log("1. Adding new columns to candidates...");
  await sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS profile_picture_url TEXT`;
  await sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS headline VARCHAR(200)`;
  await sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS phone VARCHAR(50)`;
  await sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS portfolio_url TEXT`;
  await sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS years_of_experience INTEGER`;
  await sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS preferred_industries TEXT[] DEFAULT '{}'`;
  await sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS willing_to_relocate BOOLEAN DEFAULT FALSE`;
  console.log("   Done.\n");

  console.log("All Phase 6 (Candidate Profile Enhancement) migrations complete!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
