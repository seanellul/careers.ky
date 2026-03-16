import { NextResponse } from "next/server";
import { getActiveJobPostingsPaginated } from "@/lib/data";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "12", 10)));

  const filters = {
    search: searchParams.get("search") || undefined,
    location: searchParams.get("location") || undefined,
    workType: searchParams.get("workType") || undefined,
    employer: searchParams.get("employer") || undefined,
    sort: searchParams.get("sort") || undefined,
  };

  try {
    const result = await getActiveJobPostingsPaginated(page, pageSize, filters);
    return NextResponse.json({
      jobs: result.jobs,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
    });
  } catch (error) {
    console.error("Jobs API error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}
