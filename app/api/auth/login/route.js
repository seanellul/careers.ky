import { NextResponse } from "next/server";
import { createMagicLink, sendMagicLinkEmail } from "@/lib/auth";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request) {
  const ip = getClientIp(request);

  // 5 magic links per IP per 15 minutes
  const ipCheck = rateLimit(`login:ip:${ip}`, 5, 15 * 60 * 1000);
  if (ipCheck.limited) return rateLimitResponse(900);

  try {
    const { email, type = "candidate" } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    if (!["candidate", "employer"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // 3 magic links per email per 15 minutes
    const emailCheck = rateLimit(`login:email:${email.toLowerCase()}`, 3, 15 * 60 * 1000);
    if (emailCheck.limited) {
      // Return success to avoid email enumeration
      return NextResponse.json({ success: true, message: "Magic link sent. Check your email." });
    }

    const token = await createMagicLink(email, type);
    await sendMagicLinkEmail(email, token, type);

    return NextResponse.json({ success: true, message: "Magic link sent. Check your email." });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Failed to send magic link" }, { status: 500 });
  }
}
