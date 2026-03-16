import { NextResponse } from "next/server";
import { createMagicLink, sendMagicLinkEmail } from "@/lib/auth";

export async function POST(request) {
  try {
    const { email, type = "candidate" } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    if (!["candidate", "employer"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const token = await createMagicLink(email, type);
    await sendMagicLinkEmail(email, token, type);

    return NextResponse.json({ success: true, message: "Magic link sent. Check your email." });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Failed to send magic link" }, { status: 500 });
  }
}
