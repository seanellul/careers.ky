import { neon } from "@neondatabase/serverless";

const KNOWN_DOMAINS = [
  { pattern: "ogier", domain: "ogier.com" },
  { pattern: "campbells", domain: "campbells.com.ky" },
  { pattern: "maples", domain: "maples.com" },
  { pattern: "walkers", domain: "walkersglobal.com" },
  { pattern: "harneys", domain: "harneys.com" },
  { pattern: "appleby", domain: "applebyglobal.com" },
  { pattern: "mourant", domain: "mourant.com" },
  { pattern: "kpmg", domain: "kpmg.ky" },
  { pattern: "ernst & young", domain: "ey.com" },
  { pattern: "ey cayman", domain: "ey.com" },
  { pattern: "ernst young", domain: "ey.com" },
  { pattern: "pricewaterhouse", domain: "pwc.com" },
  { pattern: "pwc", domain: "pwc.com" },
  { pattern: "deloitte", domain: "deloitte.com" },
  { pattern: "butterfield", domain: "butterfieldgroup.com" },
  { pattern: "cayman national", domain: "caymannational.com" },
  { pattern: "dart", domain: "dart.ky" },
  { pattern: "cuc", domain: "cuc-cayman.com" },
];

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set.");
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  console.log("Seeding known company domains...\n");

  let updated = 0;
  for (const { pattern, domain } of KNOWN_DOMAINS) {
    const rows = await sql`
      UPDATE employers
      SET domain = ${domain},
          website = COALESCE(website, ${"https://" + domain})
      WHERE LOWER(name) LIKE ${"%" + pattern + "%"}
        AND domain IS NULL
      RETURNING id, name
    `;
    for (const row of rows) {
      console.log(`  ${row.name} → ${domain}`);
      updated++;
    }
  }

  console.log(`\nUpdated ${updated} employers with known domains.`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
