import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import {
  getCandidateByEmail,
  upsertCandidate,
  getEmployerAccountByEmail,
  upsertEmployerAccount,
} from "@/lib/data";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/?error=google_denied", request.url));
  }

  // Decode state
  let type = "candidate";
  try {
    const state = JSON.parse(Buffer.from(stateParam, "base64url").toString());
    type = state.type || "candidate";
  } catch {}

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    console.error("Google token exchange failed:", await tokenRes.text());
    return NextResponse.redirect(new URL("/?error=google_token", request.url));
  }

  const tokens = await tokenRes.json();

  // Get user info
  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) {
    return NextResponse.redirect(new URL("/?error=google_userinfo", request.url));
  }

  const user = await userRes.json();
  const email = user.email;
  const name = user.name || null;

  if (!email) {
    return NextResponse.redirect(new URL("/?error=google_no_email", request.url));
  }

  // Employer flow
  if (type === "employer") {
    let account = await getEmployerAccountByEmail(email);
    if (!account) {
      account = await upsertEmployerAccount(email, { name });
    }
    await createSession(null, account.id);
    // Redirect to setup if no employer linked, otherwise dashboard
    if (!account.employer_id) {
      return NextResponse.redirect(new URL("/employer/setup", request.url));
    }
    return NextResponse.redirect(new URL("/employer/dashboard", request.url));
  }

  // Candidate flow
  let candidate = await getCandidateByEmail(email);
  const isNew = !candidate;
  const pictureUrl = user.picture || null;

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
