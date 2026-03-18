import { getDb } from "../../../lib/db.js";

const MIGRATION_NAME = "add_sales_pipeline_table";

export async function migrate() {
  const sql = getDb();

  try {
    // Check if migration already ran
    const result = await sql(
      "SELECT 1 FROM pg_tables WHERE tablename = 'migrations' LIMIT 1"
    );

    if (result.length === 0) {
      // Create migrations tracking table
      await sql(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
    }

    // Check if this specific migration has run
    const migrationRecord = await sql(
      "SELECT 1 FROM migrations WHERE name = $1",
      [MIGRATION_NAME]
    );

    if (migrationRecord.length > 0) {
      console.log(`Migration ${MIGRATION_NAME} already applied`);
      return { success: true, alreadyApplied: true };
    }

    // Create sales_pipeline table
    await sql(`
      CREATE TABLE IF NOT EXISTS sales_pipeline (
        id SERIAL PRIMARY KEY,
        employer_name VARCHAR(255) NOT NULL UNIQUE,
        slug VARCHAR(255),
        priority_rank INTEGER,
        score INTEGER CHECK (score >= 0 AND score <= 100),
        segment VARCHAR(255),
        industry VARCHAR(255),
        total_jobs INTEGER DEFAULT 0,
        active_jobs INTEGER DEFAULT 0,
        avg_salary INTEGER DEFAULT 0,
        recommended_tier VARCHAR(50),
        suggested_hook TEXT,
        status VARCHAR(50) DEFAULT 'not_contacted' CHECK (status IN ('not_contacted', 'contacted', 'demo_scheduled', 'trial_active', 'paying', 'rejected')),
        last_contacted TIMESTAMP,
        next_followup TIMESTAMP,
        notes TEXT,
        response_received TEXT,
        contact_person VARCHAR(255),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indices for common queries
    await sql(`
      CREATE INDEX idx_sales_pipeline_score_desc ON sales_pipeline (score DESC)
    `);

    await sql(`
      CREATE INDEX idx_sales_pipeline_status ON sales_pipeline (status)
    `);

    await sql(`
      CREATE INDEX idx_sales_pipeline_segment ON sales_pipeline (segment)
    `);

    await sql(`
      CREATE INDEX idx_sales_pipeline_priority_rank ON sales_pipeline (priority_rank)
    `);

    // Create contact_log table for tracking outreach activities
    await sql(`
      CREATE TABLE IF NOT EXISTS contact_log (
        id SERIAL PRIMARY KEY,
        employer_id INTEGER NOT NULL REFERENCES sales_pipeline(id) ON DELETE CASCADE,
        activity_type VARCHAR(100) NOT NULL CHECK (activity_type IN ('email_sent', 'call_made', 'response_received', 'demo_scheduled', 'meeting_completed', 'trial_started', 'payment_received', 'note_added')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        created_by VARCHAR(255)
      )
    `);

    await sql(`
      CREATE INDEX idx_contact_log_employer_id ON contact_log (employer_id)
    `);

    await sql(`
      CREATE INDEX idx_contact_log_created_at ON contact_log (created_at DESC)
    `);

    // Record migration as completed
    await sql("INSERT INTO migrations (name) VALUES ($1)", [MIGRATION_NAME]);

    console.log(`✓ Migration ${MIGRATION_NAME} applied successfully`);
    return { success: true, alreadyApplied: false };
  } catch (error) {
    console.error(`✗ Migration ${MIGRATION_NAME} failed:`, error.message);
    throw error;
  }
}

// Auto-run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate()
    .then((result) => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
