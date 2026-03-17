import { neon } from "@neondatabase/serverless";

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set.");
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  console.log("Running Phase 6 (Admin + Pitch Tracking) migrations...\n");

  // === 1. pitch_views table ===
  console.log("1. Creating pitch_views table...");
  await sql`
    CREATE TABLE IF NOT EXISTS pitch_views (
      id SERIAL PRIMARY KEY,
      employer_slug TEXT NOT NULL,
      viewed_at TIMESTAMPTZ DEFAULT NOW(),
      referrer TEXT,
      ip_hash TEXT
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_pitch_views_slug ON pitch_views(employer_slug)`;
  console.log("   Done.\n");

  // === 2. employer_outreach table ===
  console.log("2. Creating employer_outreach table...");
  await sql`
    CREATE TABLE IF NOT EXISTS employer_outreach (
      id SERIAL PRIMARY KEY,
      employer_slug TEXT NOT NULL UNIQUE,
      status TEXT DEFAULT 'not_contacted',
      contacted_at TIMESTAMPTZ,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log("   Done.\n");

  console.log("All Phase 6 (Admin + Pitch Tracking) migrations complete!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
