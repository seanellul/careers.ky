import { neon } from "@neondatabase/serverless";

const FIRST_NAMES = [
  "Alicia", "Marcus", "Tanya", "Devon", "Keisha", "Jordan", "Renee", "Dwayne",
  "Natasha", "Andre", "Simone", "Kareem", "Bianca", "Trevor", "Camille", "Rashid",
  "Monique", "Adrian", "Sasha", "Darren", "Tamara", "Corey", "Nicole", "Jamal",
  "Gabrielle", "Wayne", "Crystal", "Terrence", "Latoya", "Ryan",
];

const LAST_NAMES = [
  "Ebanks", "Bodden", "McLaughlin", "Whittaker", "Rankine", "Wood", "Panton",
  "Bush", "Tibbetts", "Scott", "Frederick", "Jackson", "Thompson", "Rivers",
  "Williams", "Hurlston", "Conolly", "Watler", "Solomon", "Levy",
];

const BIOS = [
  "Experienced professional looking for new opportunities in the Cayman Islands.",
  "Recently relocated to Grand Cayman, eager to contribute to the local economy.",
  "Caymanian with a passion for finance and technology.",
  "Dedicated team player with strong analytical and communication skills.",
  "Self-motivated individual seeking growth in a dynamic environment.",
  "Detail-oriented professional with experience in compliance and operations.",
  "Creative problem solver with a background in hospitality and customer service.",
  "Motivated graduate looking for an entry-level position to build my career.",
  "Seasoned manager with 10+ years of leadership experience.",
  "Bilingual professional fluent in English and Spanish.",
];

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set.");
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  console.log("Seeding dev candidates...\n");

  // Get available CISCO codes and skills
  const ciscos = await sql`SELECT cisco_code FROM cisco_units WHERE LENGTH(cisco_code) = 4 ORDER BY RANDOM() LIMIT 40`;
  const skills = await sql`SELECT id FROM skills ORDER BY RANDOM() LIMIT 30`;

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const pickN = (arr, n) => {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  };

  const COUNT = 25;

  for (let i = 0; i < COUNT; i++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const email = `dev-candidate-${i + 1}@test.careers.ky`;
    const isCaymanian = Math.random() < 0.6; // 60% Caymanian
    const eduCode = String(Math.floor(Math.random() * 8));
    const expCode = String(Math.floor(Math.random() * 8));
    const locCode = String(Math.floor(Math.random() * 10));
    const availability = pick(["actively_looking", "actively_looking", "open_to_offers"]);
    const bio = pick(BIOS);
    const salaryMin = (30000 + Math.floor(Math.random() * 40000));
    const salaryMax = salaryMin + 10000 + Math.floor(Math.random() * 30000);

    // Upsert candidate
    const rows = await sql`
      INSERT INTO candidates (email, name, is_caymanian, education_code, experience_code, location_code,
        availability, is_discoverable, bio, salary_min, salary_max, work_type_preferences)
      VALUES (${email}, ${first + " " + last}, ${isCaymanian}, ${eduCode}, ${expCode}, ${locCode},
              ${availability}, TRUE, ${bio}, ${salaryMin}, ${salaryMax}, ${"{}"}::text[])
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name, is_caymanian = EXCLUDED.is_caymanian,
        education_code = EXCLUDED.education_code, experience_code = EXCLUDED.experience_code,
        location_code = EXCLUDED.location_code, availability = EXCLUDED.availability,
        is_discoverable = TRUE, bio = EXCLUDED.bio,
        salary_min = EXCLUDED.salary_min, salary_max = EXCLUDED.salary_max
      RETURNING id
    `;
    const candidateId = rows[0].id;

    // Add 1-3 CISCO interests
    await sql`DELETE FROM candidate_interests WHERE candidate_id = ${candidateId}`;
    const interests = pickN(ciscos, 1 + Math.floor(Math.random() * 3));
    for (const c of interests) {
      await sql`INSERT INTO candidate_interests (candidate_id, cisco_code) VALUES (${candidateId}, ${c.cisco_code}) ON CONFLICT DO NOTHING`;
    }

    // Add 2-5 skills
    await sql`DELETE FROM candidate_skills WHERE candidate_id = ${candidateId}`;
    const candidateSkills = pickN(skills, 2 + Math.floor(Math.random() * 4));
    for (const s of candidateSkills) {
      await sql`INSERT INTO candidate_skills (candidate_id, skill_id) VALUES (${candidateId}, ${s.id}) ON CONFLICT DO NOTHING`;
    }

    console.log(`  ${i + 1}. ${first} ${last} (${isCaymanian ? "Caymanian" : "Non-Caymanian"}) — ${email}`);
  }

  console.log(`\nSeeded ${COUNT} dev candidates. All discoverable.`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
