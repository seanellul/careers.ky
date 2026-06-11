import { NextResponse } from "next/server";
import crypto from "crypto";
import { getDb } from "@/lib/db";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

// Subscribe (public — homepage footer, no registration needed)
export async function POST(request) {
  const ip = getClientIp(request);
  const check = rateLimit(`newsletter:ip:${ip}`, 5, 60 * 60 * 1000);
  if (check.limited) return rateLimitResponse(3600);

  const { email } = await request.json();
  const clean = String(email || "")
    .trim()
    .toLowerCase();
  if (!clean.includes("@") || clean.length > 255) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  const sql = getDb();
  const token = crypto.randomBytes(24).toString("hex");
  await sql`
    INSERT INTO newsletter_subscribers (email, unsubscribe_token)
    VALUES (${clean}, ${token})
    ON CONFLICT (email) DO UPDATE SET unsubscribed_at = NULL
  `;
  return NextResponse.json({ success: true });
}

// Unsubscribe via token link (one click from any email)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("unsubscribe");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }
  const sql = getDb();
  const rows = await sql`
    UPDATE newsletter_subscribers SET unsubscribed_at = NOW()
    WHERE unsubscribe_token = ${token}
    RETURNING id
  `;
  if (!rows.length) {
    return NextResponse.redirect(new URL("/?newsletter=invalid", request.url));
  }
  return NextResponse.redirect(new URL("/?newsletter=unsubscribed", request.url));
}
