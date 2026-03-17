export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { loadEducationTypes, loadExperienceTypes, loadLocationTypes } from "@/lib/data";
import { getDb } from "@/lib/db";
import ShortlistDetailClient from "./ShortlistDetailClient";

export default async function ShortlistDetailPage({ params }) {
  const session = await getSession();
  const { id } = await params;
  const sql = getDb();

  const shortlist = await sql`
    SELECT * FROM shortlists WHERE id = ${id} AND employer_account_id = ${session.employerAccountId}
  `;
  if (!shortlist.length) notFound();

  const candidates = await sql`
    SELECT sc.*, c.education_code, c.experience_code, c.location_code,
           c.availability, c.is_caymanian, c.bio
    FROM shortlist_candidates sc
    JOIN candidates c ON sc.candidate_id = c.id
    WHERE sc.shortlist_id = ${id}
    ORDER BY sc.added_at DESC
  `;

  // Enrich
  const enriched = [];
  for (const row of candidates) {
    const interests = await sql`
      SELECT ci.cisco_code, cu.title
      FROM candidate_interests ci
      LEFT JOIN cisco_units cu ON ci.cisco_code = cu.cisco_code
      WHERE ci.candidate_id = ${row.candidate_id}
    `;
    const skills = await sql`
      SELECT s.id, s.name, s.category
      FROM candidate_skills cs
      JOIN skills s ON cs.skill_id = s.id
      WHERE cs.candidate_id = ${row.candidate_id}
    `;
    enriched.push({ ...row, interests, skills });
  }

  const [eduTypes, expTypes, locTypes] = await Promise.all([
    loadEducationTypes(),
    loadExperienceTypes(),
    loadLocationTypes(),
  ]);

  return (
    <ShortlistDetailClient
      shortlist={shortlist[0]}
      candidates={enriched}
      eduTypes={Object.fromEntries(eduTypes)}
      expTypes={Object.fromEntries(expTypes)}
      locTypes={Object.fromEntries(locTypes)}
    />
  );
}
