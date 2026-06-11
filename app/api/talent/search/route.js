import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { searchTalentRanked } from "@/lib/scoring";
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

  const { searchParams } = new URL(request.url);

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
    includeOverseas: hasFeature(tier, "overseas_talent"),
    includeSalary: hasFeature(tier, "salary_visibility"),
  };

  try {
    const result = await searchTalentRanked(params);
    return NextResponse.json({
      ...result,
      tier,
      overseasHidden: !hasFeature(tier, "overseas_talent"),
    });
  } catch (error) {
    console.error("Talent search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
