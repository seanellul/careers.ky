import { getDb } from "@/lib/db";

/**
 * Offshore talent pool search (CEO spec §25 — "Offshore Talent" tab).
 *
 * Mirrors searchTalentRanked() in lib/scoring.js — same scoring weights,
 * block-list enforcement, filters, and enrichment — but restricted to
 * candidates with status = 'overseas' (work permit / sponsorship required).
 * Kept as a separate query function so the core ranked search stays
 * untouched; if the scoring model changes in lib/scoring.js, update the
 * scored CTEs here to match.
 *
 * All offshore candidates share status tier 5, so ordering within the pool
 * is effectively total_score DESC, created_at DESC — consistent with the
 * platform-wide status-tier + score ordering.
 */
export async function searchOffshoreTalent(params = {}) {
  const sql = getDb();
  const {
    ciscoCode = null,
    skillIds = [],
    educationCode = null,
    experienceCode = null,
    locationCode = null,
    availability = null,
    salaryMin = null,
    salaryMax = null,
    page = 1,
    pageSize = 20,
    // employers.id of the searching employer — enforces candidate block lists
    employerId = null,
    // "Immediate start" filter: notice period of immediate or 1 week
    immediateStart = false,
    // salary stripped when the tier lacks salary_visibility
    includeSalary = true,
  } = params;

  const offset = (page - 1) * pageSize;
  const targetEdu = educationCode ? parseInt(educationCode, 10) : null;
  const targetExp = experienceCode ? parseInt(experienceCode, 10) : null;

  // Get CISCO skills for the target code (for skill overlap scoring)
  let targetSkillIds = [];
  if (ciscoCode) {
    const ciscoSkillRows = await sql`
      SELECT skill_id FROM cisco_skills WHERE cisco_code = ${ciscoCode}
    `;
    targetSkillIds = ciscoSkillRows.map((r) => r.skill_id);
  }

  const allTargetSkillIds = [...new Set([...skillIds, ...targetSkillIds])];

  const rows = await sql`
    WITH candidate_base AS (
      SELECT c.id, c.education_code, c.experience_code, c.location_code,
             c.availability, c.is_caymanian, c.bio, c.created_at,
             c.salary_min, c.status, c.status_verified, c.notice_period,
             5 as status_tier
      FROM candidates c
      WHERE c.profile_type != 'closed'
        AND c.status = 'overseas'
        AND (${employerId}::int IS NULL OR NOT EXISTS (
          SELECT 1 FROM candidate_blocked_employers be
          WHERE be.candidate_id = c.id AND be.employer_id = ${employerId}::int
        ))
        AND (${locationCode || null}::text IS NULL OR c.location_code = ${locationCode || null})
        AND (${immediateStart ? true : null}::boolean IS NULL
             OR c.notice_period IN ('immediate', '1_week'))
    ),
    cisco_score AS (
      SELECT cb.id as candidate_id,
        COALESCE(MAX(CASE
          WHEN ${ciscoCode || null}::text IS NULL THEN 0
          WHEN ci.cisco_code = ${ciscoCode || null} THEN 35
          WHEN LEFT(ci.cisco_code, 3) = LEFT(${ciscoCode || null}::text, 3) THEN 26
          WHEN LEFT(ci.cisco_code, 2) = LEFT(${ciscoCode || null}::text, 2) THEN 17
          WHEN LEFT(ci.cisco_code, 1) = LEFT(${ciscoCode || null}::text, 1) THEN 8
          ELSE 0
        END), 0) as score
      FROM candidate_base cb
      LEFT JOIN candidate_interests ci ON cb.id = ci.candidate_id
      GROUP BY cb.id
    ),
    skill_score AS (
      SELECT cb.id as candidate_id,
        CASE
          WHEN ${allTargetSkillIds.length}::int = 0 THEN 0
          ELSE LEAST(25, ROUND(
            COUNT(cs.skill_id) FILTER (WHERE cs.skill_id = ANY(${allTargetSkillIds}::int[]))
            * 25.0 / ${allTargetSkillIds.length}::int
          ))
        END as score
      FROM candidate_base cb
      LEFT JOIN candidate_skills cs ON cb.id = cs.candidate_id
      GROUP BY cb.id
    ),
    scored AS (
      SELECT
        cb.*,
        COALESCE(cis.score, 0) as cisco_score,
        COALESCE(ss.score, 0) as skill_score,
        CASE
          WHEN ${targetEdu}::int IS NULL OR cb.education_code IS NULL THEN 0
          ELSE GREATEST(0, 10 - ABS(cb.education_code::int - ${targetEdu}::int) * 3)
        END as education_score,
        CASE
          WHEN ${targetExp}::int IS NULL OR cb.experience_code IS NULL THEN 0
          ELSE GREATEST(0, 10 - ABS(cb.experience_code::int - ${targetExp}::int) * 3)
        END as experience_score,
        CASE
          WHEN ${salaryMin}::numeric IS NULL AND ${salaryMax}::numeric IS NULL THEN 0
          WHEN cb.salary_min IS NULL THEN 0
          WHEN cb.salary_min <= COALESCE(${salaryMax}::numeric, cb.salary_min) THEN 10
          WHEN cb.salary_min <= COALESCE(${salaryMax}::numeric, cb.salary_min) * 1.2 THEN 5
          ELSE 0
        END as salary_score,
        CASE cb.availability
          WHEN 'actively_looking' THEN 5
          WHEN 'open_to_offers' THEN 3
          ELSE 0
        END as availability_score,
        CASE WHEN cb.is_caymanian THEN 5 ELSE 0 END as caymanian_score
      FROM candidate_base cb
      LEFT JOIN cisco_score cis ON cb.id = cis.candidate_id
      LEFT JOIN skill_score ss ON cb.id = ss.candidate_id
    ),
    final AS (
      SELECT *,
        (cisco_score + skill_score + education_score + experience_score +
         salary_score + availability_score + caymanian_score) as total_score
      FROM scored
      WHERE (${availability || null}::text IS NULL OR availability = ${availability || null})
    )
    SELECT *, COUNT(*) OVER() as _total_count
    FROM final
    ORDER BY status_tier ASC, total_score DESC, created_at DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  const total = rows.length > 0 ? Number(rows[0]._total_count) : 0;

  // Enrich with interests and skills (batched — one query each for the whole page)
  const candidateIds = rows.map((r) => r.id);
  const interestsByCandidate = new Map();
  const skillsByCandidate = new Map();
  if (candidateIds.length) {
    const interestRows = await sql`
      SELECT ci.candidate_id, ci.cisco_code, cu.title
      FROM candidate_interests ci
      LEFT JOIN cisco_units cu ON ci.cisco_code = cu.cisco_code
      WHERE ci.candidate_id = ANY(${candidateIds}::int[])
    `;
    for (const { candidate_id, ...interest } of interestRows) {
      if (!interestsByCandidate.has(candidate_id)) interestsByCandidate.set(candidate_id, []);
      interestsByCandidate.get(candidate_id).push(interest);
    }
    const skillRows = await sql`
      SELECT cs.candidate_id, s.id, s.name, s.category
      FROM candidate_skills cs
      JOIN skills s ON cs.skill_id = s.id
      WHERE cs.candidate_id = ANY(${candidateIds}::int[])
    `;
    for (const { candidate_id, ...skill } of skillRows) {
      if (!skillsByCandidate.has(candidate_id)) skillsByCandidate.set(candidate_id, []);
      skillsByCandidate.get(candidate_id).push(skill);
    }
  }

  const enriched = [];
  for (const row of rows) {
    const { _total_count, ...candidate } = row;
    if (!includeSalary) {
      delete candidate.salary_min;
    }
    enriched.push({
      ...candidate,
      interests: interestsByCandidate.get(row.id) || [],
      skills: skillsByCandidate.get(row.id) || [],
      scores: {
        cisco: Number(row.cisco_score),
        skill: Number(row.skill_score),
        education: Number(row.education_score),
        experience: Number(row.experience_score),
        salary: Number(row.salary_score),
        availability: Number(row.availability_score),
        caymanian: Number(row.caymanian_score),
        total: Number(row.total_score),
      },
    });
  }

  return { candidates: enriched, total, page, pageSize };
}
