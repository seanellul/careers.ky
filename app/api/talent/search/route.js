import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { searchTalentRanked } from "@/lib/scoring";
import { searchOffshoreTalent } from "@/lib/talent-pools";
import { getEmployerTier, hasFeature } from "@/lib/entitlements";

export async function GET(request) {
  const session = await getSession();
  if (!session?.employerAccountId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }
  // Require a linked employer profile: tier entitlements and candidate
  // block lists both key off employers.id
  if (!session.employerId) {
    return NextResponse.json(
      { error: "Complete your employer profile to search talent" },
      { status: 403 }
    );
  }
  const tier = await getEmployerTier(session.employerId);
  const canSearchOffshore = hasFeature(tier, "overseas_talent");

  const { searchParams } = new URL(request.url);

  // Pool split (CEO spec §25): local (Caymanian/PR/RERC/dependant — default)
  // vs offshore (overseas only, tier-gated). Anything else falls back to
  // local so existing callers keep working.
  const pool = searchParams.get("pool") === "offshore" ? "offshore" : "local";

  const skillIdsParam = searchParams.get("skillIds");
  const skillIds = skillIdsParam ? skillIdsParam.split(",").map(Number).filter(Boolean) : [];

  const params = {
    ciscoCode: searchParams.get("ciscoCode") || undefined,
    skillIds,
    educationCode: searchParams.get("educationCode") || undefined,
    experienceCode: searchParams.get("experienceCode") || undefined,
    locationCode: searchParams.get("locationCode") || undefined,
    availability: searchParams.get("availability") || undefined,
    isCaymanian: searchParams.get("isCaymanian") === "true" || undefined,
    immediateStart: searchParams.get("immediateStart") === "true" || undefined,
    page: parseInt(searchParams.get("page") || "1", 10),
    pageSize: Math.min(parseInt(searchParams.get("pageSize") || "20", 10), 50),
    employerId: session.employerId,
    includeSalary: hasFeature(tier, "salary_visibility"),
  };

  try {
    if (pool === "offshore") {
      // Tier gate — same overseasHidden pattern as before: non-entitled
      // tiers get an empty list plus the flag, never overseas rows.
      if (!canSearchOffshore) {
        return NextResponse.json({
          candidates: [],
          total: 0,
          page: params.page,
          pageSize: params.pageSize,
          tier,
          pool,
          overseasHidden: true,
        });
      }
      const result = await searchOffshoreTalent(params);
      return NextResponse.json({ ...result, tier, pool, overseasHidden: false });
    }

    // Local pool: overseas candidates never blend into this list — they
    // live in the dedicated offshore tab for entitled tiers.
    const result = await searchTalentRanked({ ...params, includeOverseas: false });
    return NextResponse.json({
      ...result,
      tier,
      pool,
      overseasHidden: !canSearchOffshore,
    });
  } catch (error) {
    console.error("Talent search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
