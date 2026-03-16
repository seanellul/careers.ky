import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { searchTalentRanked } from "@/lib/scoring";

export async function GET(request) {
  const session = await getSession();
  if (!session?.employerAccountId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const skillIdsParam = searchParams.get("skillIds");
  const skillIds = skillIdsParam
    ? skillIdsParam.split(",").map(Number).filter(Boolean)
    : [];

  const params = {
    ciscoCode: searchParams.get("ciscoCode") || undefined,
    skillIds,
    educationCode: searchParams.get("educationCode") || undefined,
    experienceCode: searchParams.get("experienceCode") || undefined,
    locationCode: searchParams.get("locationCode") || undefined,
    availability: searchParams.get("availability") || undefined,
    isCaymanian: searchParams.get("isCaymanian") === "true" || undefined,
    page: parseInt(searchParams.get("page") || "1", 10),
    pageSize: Math.min(parseInt(searchParams.get("pageSize") || "20", 10), 50),
  };

  try {
    const result = await searchTalentRanked(params);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Talent search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
