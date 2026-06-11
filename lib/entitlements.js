import { getDb } from "@/lib/db";

// Tier entitlements (D3): free / pro / enterprise / government.
// Government is permanently free with full access (platform rule).
// Pricing is case-by-case B2B — tiers are assigned by admin, no
// self-serve billing (Phase 5 records the commercial side).

export const TIERS = ["free", "pro", "enterprise", "government"];

const FEATURES = {
  // Per-posting audit-trail CSV export — the paid compliance feature (D3)
  audit_export: ["pro", "enterprise", "government"],
  // Overseas / work-permit candidates in talent search (spec rule 6)
  overseas_talent: ["pro", "enterprise", "government"],
  // Candidate salary expectations visible in search results (spec 7)
  salary_visibility: ["pro", "enterprise", "government"],
};

export function hasFeature(tier, feature) {
  return (FEATURES[feature] || []).includes(tier);
}

export async function getEmployerTier(employerId) {
  if (!employerId) return "free";
  const sql = getDb();
  const rows = await sql`SELECT tier FROM employers WHERE id = ${employerId}`;
  return rows[0]?.tier || "free";
}

export async function setEmployerTier(employerId, tier, notes = null) {
  if (!TIERS.includes(tier)) return null;
  const sql = getDb();
  const rows = await sql`
    UPDATE employers
    SET tier = ${tier}, tier_notes = COALESCE(${notes}, tier_notes), tier_updated_at = NOW()
    WHERE id = ${employerId}
    RETURNING id, name, tier
  `;
  return rows[0] || null;
}
