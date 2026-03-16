import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { searchTalent } from "@/lib/data";

export async function GET(request) {
  const session = await getSession();
  if (!session?.employerAccountId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filters = {
    ciscoCode: searchParams.get("ciscoCode") || undefined,
    educationCode: searchParams.get("educationCode") || undefined,
    experienceCode: searchParams.get("experienceCode") || undefined,
    locationCode: searchParams.get("locationCode") || undefined,
    availability: searchParams.get("availability") || undefined,
  };

  try {
    const candidates = await searchTalent(filters);
    return NextResponse.json({ candidates });
  } catch (error) {
    console.error("Talent search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
