import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request) {
  const ip = getClientIp(request);
  const check = rateLimit(`oauth:ip:${ip}`, 10, 5 * 60 * 1000);
  if (check.limited) return rateLimitResponse(300);

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "candidate";

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "LinkedIn OAuth not configured" }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;
  const redirectUri = `${baseUrl}/api/auth/linkedin/callback`;

  const nonce = crypto.randomBytes(16).toString("hex");

  const state = Buffer.from(JSON.stringify({
    type,
    nonce,
  })).toString("base64url");

  // Store nonce in httpOnly cookie for validation on callback
  const cookieStore = await cookies();
  cookieStore.set("ck_oauth_nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "openid profile email",
  });

  return NextResponse.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params}`);
}
