import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin-auth";
import { setEmployerTier, TIERS } from "@/lib/entitlements";

// Admin tier assignment — B2B case-by-case pricing means tiers are set
// here (or from the admin UI), not via self-serve billing.
export async function PATCH(request) {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { employerId, tier, notes } = await request.json();
  if (!employerId || !TIERS.includes(tier)) {
    return NextResponse.json(
      { error: `employerId and tier (${TIERS.join("/")}) required` },
      { status: 400 }
    );
  }

  const result = await setEmployerTier(employerId, tier, notes || null);
  if (!result) {
    return NextResponse.json({ error: "Employer not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, employer: result });
}
