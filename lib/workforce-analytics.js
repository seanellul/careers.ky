import { getDb } from "@/lib/db";

// Workforce analytics for the employer compliance roll-up (CEO spec §24):
// 12-month trend + platform benchmark behind the paid `audit_export`
// entitlement. All queries are read-only aggregates.
//
// Data honesty notes:
// - "Considered" = introductions created in the month (same definition as
//   lib/compliance.js). Candidate status tiers use the status enum with the
//   is_caymanian back-compat fallback, matching the roll-up.
// - "Direct interest" = job_interests rows whose job_id resolves to one of
//   this employer's postings (job_postings.employer_id). Interests recorded
//   only against an employer_name string (employer not on platform when the
//   interest was expressed) are not attributable and are excluded.
// - "Hires" are dated by the first activity_log `stage_changed` entry whose
//   target stage is 'hired'. Introductions currently at stage 'hired' with no
//   such log entry (pre-pipeline data, seeds) fall back to the introduction's
//   created_at month. The current stage alone can't date a hire.

const MONTHS_BACK = 12;

function lastMonths(n) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push(d.toISOString().slice(0, 7)); // YYYY-MM
  }
  return out;
}

function indexByMonth(rows) {
  const map = {};
  for (const row of rows) map[row.month] = row;
  return map;
}

export async function getWorkforceTrend(employerAccountId, employerId) {
  const sql = getDb();

  const [introRows, interestRows, hireRows] = await Promise.all([
    // Introductions created per month, by candidate status tier
    sql`
      SELECT to_char(date_trunc('month', i.created_at), 'YYYY-MM') AS month,
             COUNT(*) AS total,
             COUNT(*) FILTER (WHERE COALESCE(c.status = 'caymanian', c.is_caymanian) = TRUE) AS caymanian,
             COUNT(*) FILTER (WHERE c.status IN ('pr', 'rerc')) AS pr_rerc,
             COUNT(*) FILTER (WHERE c.status IN ('dependant', 'overseas')) AS work_permit,
             COUNT(*) FILTER (
               WHERE c.status IS NULL AND COALESCE(c.is_caymanian, FALSE) = FALSE
             ) AS undeclared
      FROM introductions i
      JOIN candidates c ON c.id = i.candidate_id
      WHERE i.employer_account_id = ${employerAccountId}
        AND i.created_at >= date_trunc('month', NOW()) - INTERVAL '11 months'
      GROUP BY 1
    `,
    // Candidate-initiated Express Interest on this employer's postings
    sql`
      SELECT to_char(date_trunc('month', ji.created_at), 'YYYY-MM') AS month,
             COUNT(*) AS total,
             COUNT(*) FILTER (WHERE COALESCE(c.status = 'caymanian', c.is_caymanian) = TRUE) AS caymanian
      FROM job_interests ji
      JOIN job_postings jp ON jp.job_id = ji.job_id AND jp.employer_id = ${employerId}
      JOIN candidates c ON c.id = ji.candidate_id
      WHERE ji.created_at >= date_trunc('month', NOW()) - INTERVAL '11 months'
      GROUP BY 1
    `,
    // Hire events dated from the stage-change audit trail (fallback:
    // introduction created_at when no stage_changed→hired entry exists)
    sql`
      WITH hire_events AS (
        SELECT COALESCE(
                 (SELECT MIN(al.created_at)
                  FROM activity_log al
                  WHERE al.introduction_id = i.id
                    AND al.action = 'stage_changed'
                    AND al.details ->> 'to' = 'hired'),
                 CASE WHEN i.stage = 'hired' THEN i.created_at END
               ) AS hired_at,
               COALESCE(c.status = 'caymanian', c.is_caymanian) AS is_caymanian
        FROM introductions i
        JOIN candidates c ON c.id = i.candidate_id
        WHERE i.employer_account_id = ${employerAccountId}
      )
      SELECT to_char(date_trunc('month', hired_at), 'YYYY-MM') AS month,
             COUNT(*) AS total,
             COUNT(*) FILTER (WHERE is_caymanian = TRUE) AS caymanian
      FROM hire_events
      WHERE hired_at IS NOT NULL
        AND hired_at >= date_trunc('month', NOW()) - INTERVAL '11 months'
      GROUP BY 1
    `,
  ]);

  const intros = indexByMonth(introRows);
  const interests = indexByMonth(interestRows);
  const hires = indexByMonth(hireRows);

  const months = lastMonths(MONTHS_BACK).map((month) => {
    const i = intros[month];
    const ji = interests[month];
    const h = hires[month];
    const hireTotal = h ? Number(h.total) : 0;
    const hireCaymanian = h ? Number(h.caymanian) : 0;
    return {
      month,
      considered: {
        total: i ? Number(i.total) : 0,
        caymanian: i ? Number(i.caymanian) : 0,
        prRerc: i ? Number(i.pr_rerc) : 0,
        workPermit: i ? Number(i.work_permit) : 0,
        undeclared: i ? Number(i.undeclared) : 0,
      },
      interests: {
        total: ji ? Number(ji.total) : 0,
        caymanian: ji ? Number(ji.caymanian) : 0,
      },
      hires: {
        total: hireTotal,
        caymanian: hireCaymanian,
        nonCaymanian: hireTotal - hireCaymanian,
      },
    };
  });

  return {
    months,
    notes: {
      considered: "Introductions created in the month, by declared candidate status",
      interests:
        "Candidate-initiated Express Interest on this employer's postings (attributable via job posting only)",
      hires:
        "Dated by the first pipeline stage change to 'hired'; hires without a stage-change record use the introduction date",
    },
  };
}

// Platform-wide benchmark: this employer's Caymanian consideration / hire
// share vs the median across employers with >= 5 introductions.
//
// Privacy guardrails (small market): only aggregate medians and cohort counts
// leave this function — never another employer's individual numbers — and the
// medians are suppressed (null) when the comparison cohort has < 5 employers.
const MIN_INTROS_PER_EMPLOYER = 5;
const MIN_EMPLOYERS_IN_COHORT = 5;

export async function getPlatformBenchmark(employerId) {
  const sql = getDb();

  const [medianRows, selfRows] = await Promise.all([
    sql`
      WITH per_employer AS (
        SELECT ea.employer_id,
               COUNT(*) AS considered,
               COUNT(*) FILTER (WHERE COALESCE(c.status = 'caymanian', c.is_caymanian) = TRUE) AS caymanian_considered,
               COUNT(*) FILTER (WHERE i.stage = 'hired') AS hired,
               COUNT(*) FILTER (
                 WHERE i.stage = 'hired' AND COALESCE(c.status = 'caymanian', c.is_caymanian) = TRUE
               ) AS caymanian_hired
        FROM introductions i
        JOIN employer_accounts ea ON ea.id = i.employer_account_id
        JOIN candidates c ON c.id = i.candidate_id
        WHERE ea.employer_id IS NOT NULL
        GROUP BY ea.employer_id
        HAVING COUNT(*) >= ${MIN_INTROS_PER_EMPLOYER}
      )
      SELECT COUNT(*) AS employer_count,
             percentile_cont(0.5) WITHIN GROUP (
               ORDER BY caymanian_considered::float / considered
             ) AS median_consideration_share,
             COUNT(*) FILTER (WHERE hired > 0) AS hiring_employer_count,
             percentile_cont(0.5) WITHIN GROUP (
               ORDER BY caymanian_hired::float / NULLIF(hired, 0)
             ) FILTER (WHERE hired > 0) AS median_hire_share
      FROM per_employer
    `,
    // This employer's own shares, summed across all of its accounts so the
    // comparison is employer-vs-employer, not account-vs-employer
    sql`
      SELECT COUNT(*) AS considered,
             COUNT(*) FILTER (WHERE COALESCE(c.status = 'caymanian', c.is_caymanian) = TRUE) AS caymanian_considered,
             COUNT(*) FILTER (WHERE i.stage = 'hired') AS hired,
             COUNT(*) FILTER (
               WHERE i.stage = 'hired' AND COALESCE(c.status = 'caymanian', c.is_caymanian) = TRUE
             ) AS caymanian_hired
      FROM introductions i
      JOIN employer_accounts ea ON ea.id = i.employer_account_id
      JOIN candidates c ON c.id = i.candidate_id
      WHERE ea.employer_id = ${employerId}
    `,
  ]);

  const m = medianRows[0] || {};
  const s = selfRows[0] || {};

  const employerCount = Number(m.employer_count || 0);
  const hiringEmployerCount = Number(m.hiring_employer_count || 0);
  const considerationSuppressed = employerCount < MIN_EMPLOYERS_IN_COHORT;
  const hireSuppressed = hiringEmployerCount < MIN_EMPLOYERS_IN_COHORT;

  const pct = (num, den) => (Number(den) > 0 ? Math.round((Number(num) / Number(den)) * 100) : null);

  return {
    cohort: {
      minIntroductions: MIN_INTROS_PER_EMPLOYER,
      employerCount,
      hiringEmployerCount,
    },
    // Medians only — never individual employers' figures
    medianConsiderationRate:
      !considerationSuppressed && m.median_consideration_share != null
        ? Math.round(Number(m.median_consideration_share) * 100)
        : null,
    medianHireRate:
      !hireSuppressed && m.median_hire_share != null
        ? Math.round(Number(m.median_hire_share) * 100)
        : null,
    suppressed: considerationSuppressed,
    hireSuppressed,
    you: {
      considered: Number(s.considered || 0),
      hired: Number(s.hired || 0),
      considerationRate: pct(s.caymanian_considered, s.considered),
      hireRate: pct(s.caymanian_hired, s.hired),
    },
  };
}

export async function getWorkforceAnalytics(employerAccountId, employerId) {
  const [trend, benchmark] = await Promise.all([
    getWorkforceTrend(employerAccountId, employerId),
    getPlatformBenchmark(employerId),
  ]);
  return { generatedAt: new Date().toISOString(), monthsBack: MONTHS_BACK, trend, benchmark };
}
