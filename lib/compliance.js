import { getDb } from "@/lib/db";

// Employer-level compliance roll-up (MVP #21): Caymanian hire rate,
// consideration rate, and sponsorship ratio across all of the employer's
// platform activity. Free basic summary per D3; full audit-trail export
// is the paid feature (Phase 4 entitlements).
export async function getComplianceRollup(employerAccountId, employerId) {
  const sql = getDb();

  const [introStats, hireStats, postingStats] = await Promise.all([
    // All candidates considered (introductions + expressed interest)
    sql`
      SELECT
        COUNT(*) as total_considered,
        COUNT(*) FILTER (WHERE COALESCE(c.status = 'caymanian', c.is_caymanian) = TRUE) as caymanian_considered,
        COUNT(*) FILTER (WHERE c.status IN ('pr', 'rerc')) as no_sponsorship_considered,
        COUNT(*) FILTER (WHERE c.status_verified = TRUE) as verified_considered
      FROM introductions i
      JOIN candidates c ON c.id = i.candidate_id
      WHERE i.employer_account_id = ${employerAccountId}
    `,
    // Hires by candidate status
    sql`
      SELECT
        COUNT(*) as total_hired,
        COUNT(*) FILTER (WHERE COALESCE(c.status = 'caymanian', c.is_caymanian) = TRUE) as caymanian_hired,
        COUNT(*) FILTER (WHERE c.status = 'overseas') as sponsored_hired
      FROM introductions i
      JOIN candidates c ON c.id = i.candidate_id
      WHERE i.employer_account_id = ${employerAccountId} AND i.stage = 'hired'
    `,
    // Posting footprint
    sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'Active' AND end_date > NOW()) as active_postings,
        COUNT(*) FILTER (WHERE source = 'native') as native_postings,
        COUNT(*) as total_postings
      FROM job_postings
      WHERE employer_id = ${employerId}
    `,
  ]);

  const considered = introStats[0];
  const hires = hireStats[0];
  const postings = postingStats[0];

  const totalConsidered = Number(considered.total_considered);
  const totalHired = Number(hires.total_hired);

  return {
    generatedAt: new Date().toISOString(),
    considered: {
      total: totalConsidered,
      caymanian: Number(considered.caymanian_considered),
      noSponsorship: Number(considered.no_sponsorship_considered),
      verified: Number(considered.verified_considered),
      caymanianRate:
        totalConsidered > 0
          ? Math.round((Number(considered.caymanian_considered) / totalConsidered) * 100)
          : null,
    },
    hires: {
      total: totalHired,
      caymanian: Number(hires.caymanian_hired),
      sponsored: Number(hires.sponsored_hired),
      caymanianRate:
        totalHired > 0 ? Math.round((Number(hires.caymanian_hired) / totalHired) * 100) : null,
    },
    postings: {
      active: Number(postings.active_postings),
      native: Number(postings.native_postings),
      total: Number(postings.total_postings),
    },
  };
}
