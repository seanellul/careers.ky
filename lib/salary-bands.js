import { getDb } from "@/lib/db";

// Salary bands computed live from WORC posting data (20k+ postings with
// salary), by CISCO occupation. Minimum 5 data points per band (spec 10:
// protect the data asset, aggregate only).
const MIN_DATA_POINTS = 5;
const MIN_PLAUSIBLE_SALARY = 6000; // filters hourly-rate junk rows

export async function getSalaryBand(ciscoCode) {
  if (!ciscoCode) return null;
  const sql = getDb();
  const rows = await sql`
    WITH band AS (
      SELECT jp.mean_salary
      FROM job_postings jp
      LEFT JOIN occupation_cisco oc ON jp.occupation_code = oc.occupation_code
      WHERE (oc.cisco_code = ${ciscoCode} OR jp.cisco_code = ${ciscoCode})
        AND jp.mean_salary > ${MIN_PLAUSIBLE_SALARY}
    )
    SELECT COUNT(*) as n,
           ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY mean_salary)) as p25,
           ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY mean_salary)) as median,
           ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY mean_salary)) as p75
    FROM band
  `;
  const band = rows[0];
  if (!band || Number(band.n) < MIN_DATA_POINTS) return null;
  return {
    ciscoCode,
    count: Number(band.n),
    p25: Number(band.p25),
    median: Number(band.median),
    p75: Number(band.p75),
  };
}

// Verdict relative to the band: below p25 = possibly underpaid,
// within p25–p75 = at market, above p75 = above market.
export function assessSalary(currentSalary, band) {
  if (!band || !currentSalary) return null;
  if (currentSalary < band.p25) return "below";
  if (currentSalary > band.p75) return "above";
  return "market";
}
