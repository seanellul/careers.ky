import { NextResponse } from "next/server";
import { titleSuggestions } from "@/lib/data";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);

  if (!q.trim()) {
    return NextResponse.json({ suggestions: [] });
  }

  const suggestions = await titleSuggestions(q, limit);
  return NextResponse.json({ suggestions });
}
