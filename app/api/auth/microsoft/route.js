import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

// Microsoft Entra ID (work + personal accounts via the /common endpoint).
// Cayman professional firms are overwhelmingly Microsoft 365 shops — this
// lets employer users sign in with their corporate identity directly.
export async function GET(request) {
  const ip = getClientIp(request);
  const check = rateLimit(`oauth:ip:${ip}`, 10, 5 * 60 * 1000);
  if (check.limited) return rateLimitResponse(300);

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "candidate";

  const clientId = process.env.MICROSOFT_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Microsoft OAuth not configured" }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;
  const redirectUri = `${baseUrl}/api/auth/microsoft/callback`;

  const nonce = crypto.randomBytes(16).toString("hex");

  const state = Buffer.from(JSON.stringify({ type, nonce })).toString("base64url");

  const cookieStore = await cookies();
  cookieStore.set("ck_oauth_nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  return NextResponse.redirect(
    `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`
  );
}
