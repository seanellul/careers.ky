import { NextResponse } from "next/server";
import { verifyMagicLink, createSession } from "@/lib/auth";
import { getCandidateByEmail, upsertCandidate, getEmployerAccountByEmail, upsertEmployerAccount } from "@/lib/data";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request) {
  const ip = getClientIp(request);

  // 10 verification attempts per IP per 15 minutes
  const check = rateLimit(`verify:ip:${ip}`, 10, 15 * 60 * 1000);
  if (check.limited) {
    return NextResponse.redirect(new URL("/?error=too_many_attempts", request.url));
  }

  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const type = searchParams.get("type") || "candidate";

  if (!token) {
    return NextResponse.redirect(new URL("/?error=missing_token", request.url));
  }

  const result = await verifyMagicLink(token);
  if (!result) {
    return NextResponse.redirect(new URL("/?error=invalid_token", request.url));
  }

  const { email } = result;

  if (type === "employer") {
    let account = await getEmployerAccountByEmail(email);
    if (!account) {
      account = await upsertEmployerAccount(email, {});
    }
    await createSession(null, account.id);
    return NextResponse.redirect(new URL("/talent", request.url));
  }

  // Candidate flow
  let candidate = await getCandidateByEmail(email);
  if (!candidate) {
    candidate = await upsertCandidate(email, {});
  }
  await createSession(candidate.id);

  // Redirect to profile setup if new, otherwise profile
  if (!candidate.name) {
    return NextResponse.redirect(new URL("/profile/setup", request.url));
  }
  return NextResponse.redirect(new URL("/profile", request.url));
}
