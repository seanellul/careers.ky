import fs from "fs";
import path from "path";
import { getDb } from "../lib/db.js";
import { migrate } from "../app/api/migrations/add-sales-pipeline.js";

const CSV_PATH =
  "/home/node/.openclaw/workspace/careers-ky/content/sales-pipeline-500-scored.csv";

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function seedPipeline() {
  const sql = getDb();

  try {
    console.log("🚀 Starting pipeline seed...\n");

    // Run migration first
    console.log("📦 Running database migration...");
    await migrate();
    console.log("✓ Migration complete\n");

    // Check if data already seeded
    const existingCount = await sql(
      "SELECT COUNT(*) as count FROM sales_pipeline"
    );
    if (existingCount[0].count > 0) {
      console.log(
        `⏭️  Pipeline already seeded (${existingCount[0].count} records). Skipping...\n`
      );
      return { success: true, skipped: true, count: existingCount[0].count };
    }

    // Read CSV
    console.log(`📄 Reading CSV from ${CSV_PATH}...`);
    if (!fs.existsSync(CSV_PATH)) {
      throw new Error(`CSV file not found at ${CSV_PATH}`);
    }

    const csvContent = fs.readFileSync(CSV_PATH, "utf-8");
    const lines = csvContent.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      throw new Error("CSV file is empty or invalid");
    }

    // Parse header
    const header = lines[0].split(",").map((h) => h.trim());
    console.log(`✓ Found header with ${header.length} columns\n`);

    // Parse rows
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Handle CSV parsing (simple split - assumes no commas in values)
      const values = line.split(",").map((v) => v.trim());

      if (values.length < header.length) {
        console.warn(`⚠️  Skipping row ${i} (incomplete data)`);
        continue;
      }

      const row = {};
      for (let j = 0; j < header.length; j++) {
        row[header[j]] = values[j] || null;
      }
      rows.push(row);
    }

    console.log(`✓ Parsed ${rows.length} records from CSV\n`);

    // Seed data
    console.log("💾 Inserting records into database...");
    let inserted = 0;
    let failed = 0;

    for (const row of rows) {
      try {
        const slug = slugify(row.name);
        const totalJobs = parseInt(row.total_jobs) || 0;
        const activeJobs = parseInt(row.active_jobs) || 0;
        const avgSalary = parseInt(row.avg_salary) || 0;
        const score = parseInt(row.score) || 0;
        const priorityRank = parseInt(row.priority_rank) || 0;

        await sql(
          `
          INSERT INTO sales_pipeline (
            employer_name,
            slug,
            priority_rank,
            score,
            segment,
            industry,
            total_jobs,
            active_jobs,
            avg_salary,
            recommended_tier,
            suggested_hook,
            status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `,
          [
            row.name,
            slug,
            priorityRank,
            score,
            row.segment,
            row.industry,
            totalJobs,
            activeJobs,
            avgSalary,
            row.recommended_tier,
            row.suggested_hook,
            "not_contacted",
          ]
        );

        inserted++;
        if (inserted % 100 === 0) {
          console.log(`  ✓ ${inserted} records inserted...`);
        }
      } catch (error) {
        failed++;
        if (failed <= 5) {
          console.error(`  ✗ Error inserting ${row.name}:`, error.message);
        }
      }
    }

    console.log(`\n✓ Seeding complete!`);
    console.log(`  - Inserted: ${inserted} records`);
    console.log(`  - Failed: ${failed} records`);
    console.log(`  - Total: ${inserted + failed} records processed\n`);

    return { success: true, inserted, failed, total: inserted + failed };
  } catch (error) {
    console.error("✗ Seeding failed:", error.message);
    throw error;
  }
}

// Auto-run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedPipeline()
    .then((result) => {
      console.log("🎉 Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedPipeline };
