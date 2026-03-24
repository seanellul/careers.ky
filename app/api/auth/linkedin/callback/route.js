import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSession } from "@/lib/auth";
import {
  getCandidateByEmail,
  upsertCandidate,
  getEmployerAccountByEmail,
  upsertEmployerAccount,
} from "@/lib/data";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request) {
  const ip = getClientIp(request);
  const check = rateLimit(`oauth-cb:ip:${ip}`, 10, 5 * 60 * 1000);
  if (check.limited) {
    return NextResponse.redirect(new URL("/?error=too_many_attempts", request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/?error=linkedin_denied", request.url));
  }

  // Validate state nonce against cookie
  let type = "candidate";
  const cookieStore = await cookies();
  const storedNonce = cookieStore.get("ck_oauth_nonce")?.value;

  try {
    const state = JSON.parse(Buffer.from(stateParam, "base64url").toString());
    type = state.type || "candidate";

    if (!storedNonce || !state.nonce || storedNonce !== state.nonce) {
      console.error("OAuth CSRF check failed: nonce mismatch");
      return NextResponse.redirect(new URL("/?error=invalid_state", request.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/?error=invalid_state", request.url));
  }

  // Clear the nonce cookie
  cookieStore.delete("ck_oauth_nonce");

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;
  const redirectUri = `${baseUrl}/api/auth/linkedin/callback`;

  // Exchange code for tokens
  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    console.error("LinkedIn token exchange failed:", await tokenRes.text());
    return NextResponse.redirect(new URL("/?error=linkedin_token", request.url));
  }

  const tokens = await tokenRes.json();

  // Get user info from OpenID Connect userinfo endpoint
  const userRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) {
    return NextResponse.redirect(new URL("/?error=linkedin_userinfo", request.url));
  }

  const userinfo = await userRes.json();
  const email = userinfo.email;
  const name = userinfo.name || null;
  const pictureUrl = userinfo.picture || null;

  if (!email) {
    return NextResponse.redirect(new URL("/?error=linkedin_no_email", request.url));
  }

  // Employer flow
  if (type === "employer") {
    let account = await getEmployerAccountByEmail(email);
    if (!account) {
      account = await upsertEmployerAccount(email, { name });
    }
    await createSession(null, account.id);
    if (!account.employer_id) {
      return NextResponse.redirect(new URL("/employer/setup", request.url));
    }
    return NextResponse.redirect(new URL("/employer/dashboard", request.url));
  }

  // Candidate flow
  let candidate = await getCandidateByEmail(email);
  const isNew = !candidate;

  if (!candidate) {
    candidate = await upsertCandidate(email, { name, profilePictureUrl: pictureUrl });
  } else if (!candidate.name && name) {
    candidate = await upsertCandidate(email, { name, profilePictureUrl: pictureUrl });
  } else if (pictureUrl && !candidate.profile_picture_url) {
    candidate = await upsertCandidate(email, { profilePictureUrl: pictureUrl });
  }

  await createSession(candidate.id);

  if (isNew || !candidate.name) {
    return NextResponse.redirect(new URL("/profile/setup", request.url));
  }
  return NextResponse.redirect(new URL("/profile", request.url));
}
