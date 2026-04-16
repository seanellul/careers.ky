import { neon } from "@neondatabase/serverless";

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set.");
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  console.log("Running Waitlist migration...\n");

  await sql`
    CREATE TABLE IF NOT EXISTS employer_waitlist (
      id         SERIAL PRIMARY KEY,
      name       TEXT,
      email      TEXT NOT NULL,
      company    TEXT NOT NULL,
      size       TEXT,
      hiring_for TEXT,
      source     TEXT,
      status     TEXT NOT NULL DEFAULT 'pending',
      joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      notified_at TIMESTAMPTZ
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_employer_waitlist_email ON employer_waitlist(email)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_employer_waitlist_joined ON employer_waitlist(joined_at DESC)`;

  console.log("employer_waitlist table ready.\n");
  console.log("Done.");
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
