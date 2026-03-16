import { getDb } from "@/lib/db";

/**
 * Ranked talent search with scoring algorithm.
 * Total: 100 points.
 *
 * | Component           | Points |
 * |---------------------|--------|
 * | CISCO hierarchy     | 0-35   |
 * | Skill overlap       | 0-25   |
 * | Education proximity | 0-10   |
 * | Experience proximity| 0-10   |
 * | Salary alignment    | 0-10   |
 * | Availability bonus  | 0-5    |
 * | Caymanian bonus     | 0-5    |
 */
export async function searchTalentRanked(params = {}) {
  const sql = getDb();
  const {
    ciscoCode = null,
    skillIds = [],
    educationCode = null,
    experienceCode = null,
    locationCode = null,
    availability = null,
    isCaymanian = false,
    salaryMin = null,
    salaryMax = null,
    page = 1,
    pageSize = 20,
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
    targetSkillIds = ciscoSkillRows.map(r => r.skill_id);
  }

  // Skill IDs to match against: union of explicit skillIds + cisco skill IDs
  const allTargetSkillIds = [...new Set([...skillIds, ...targetSkillIds])];

  // Build the scored query
  const rows = await sql`
    WITH candidate_base AS (
      SELECT c.id, c.education_code, c.experience_code, c.location_code,
             c.availability, c.is_caymanian, c.bio, c.created_at,
             c.salary_min, c.salary_max
      FROM candidates c
      WHERE c.is_discoverable = TRUE
        AND (${locationCode || null}::text IS NULL OR c.location_code = ${locationCode || null})
        AND (${isCaymanian ? true : null}::boolean IS NULL OR c.is_caymanian = TRUE)
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
          WHEN cb.salary_min IS NULL AND cb.salary_max IS NULL THEN 0
          WHEN cb.salary_min <= COALESCE(${salaryMax}::numeric, cb.salary_min)
               AND cb.salary_max >= COALESCE(${salaryMin}::numeric, cb.salary_max) THEN 10
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
    ORDER BY total_score DESC, created_at DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  const total = rows.length > 0 ? Number(rows[0]._total_count) : 0;

  // Enrich with interests and skills
  const enriched = [];
  for (const row of rows) {
    const interests = await sql`
      SELECT ci.cisco_code, cu.title
      FROM candidate_interests ci
      LEFT JOIN cisco_units cu ON ci.cisco_code = cu.cisco_code
      WHERE ci.candidate_id = ${row.id}
    `;
    const skills = await sql`
      SELECT s.id, s.name, s.category
      FROM candidate_skills cs
      JOIN skills s ON cs.skill_id = s.id
      WHERE cs.candidate_id = ${row.id}
    `;
    const { _total_count, ...candidate } = row;
    enriched.push({
      ...candidate,
      interests,
      skills,
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

/**
 * Match candidates to a specific job posting.
 * Resolves job -> occupation -> CISCO code, then runs ranked search.
 */
export async function matchCandidatesToJob(jobId) {
  const sql = getDb();

  const jobRows = await sql`
    SELECT jp.occupation_code, jp.education, jp.experience, jp.location,
           jp.min_salary, jp.max_salary, oc.cisco_code
    FROM job_postings jp
    LEFT JOIN occupation_cisco oc ON jp.occupation_code = oc.occupation_code
    WHERE jp.job_id = ${jobId}
  `;

  if (!jobRows.length) return null;
  const job = jobRows[0];

  return searchTalentRanked({
    ciscoCode: job.cisco_code || null,
    educationCode: job.education || null,
    experienceCode: job.experience || null,
    locationCode: job.location || null,
    salaryMin: job.min_salary ? Number(job.min_salary) : null,
    salaryMax: job.max_salary ? Number(job.max_salary) : null,
    page: 1,
    pageSize: 20,
  });
}
