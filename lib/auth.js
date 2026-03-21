import { getDb } from "@/lib/db";
import { cookies } from "next/headers";
import crypto from "crypto";

const SESSION_COOKIE = "ck_session";
const SESSION_DURATION_DAYS = 30;

// --- Token generation ---

export function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

// --- Magic link creation ---

export async function createMagicLink(email, type = "candidate") {
  const sql = getDb();
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await sql`
    INSERT INTO auth_tokens (email, token, token_type, expires_at)
    VALUES (${email.toLowerCase()}, ${token}, ${type}, ${expiresAt})
  `;

  return token;
}

// --- Magic link verification ---

export async function verifyMagicLink(token) {
  const sql = getDb();
  const rows = await sql`
    SELECT email, token_type FROM auth_tokens
    WHERE token = ${token} AND used = FALSE AND expires_at > NOW()
  `;

  if (!rows.length) return null;

  // Mark as used
  await sql`UPDATE auth_tokens SET used = TRUE WHERE token = ${token}`;

  return { email: rows[0].email, type: rows[0].token_type };
}

// --- Session management ---

export async function createSession(candidateId, employerAccountId = null) {
  const sql = getDb();
  const sessionId = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await sql`
    INSERT INTO sessions (session_id, candidate_id, employer_account_id, expires_at)
    VALUES (${sessionId}, ${candidateId}, ${employerAccountId}, ${expiresAt})
  `;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
  });

  return sessionId;
}

export async function getSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const sql = getDb();
  const rows = await sql`
    SELECT s.candidate_id, s.employer_account_id, s.expires_at,
           c.email as candidate_email, c.name as candidate_name,
           ea.email as employer_email, ea.name as employer_name, ea.employer_id,
           ea.role as employer_role, ea.verification_status as employer_verification_status,
           e.name as employer_company_name
    FROM sessions s
    LEFT JOIN candidates c ON s.candidate_id = c.id
    LEFT JOIN employer_accounts ea ON s.employer_account_id = ea.id
    LEFT JOIN employers e ON ea.employer_id = e.id
    WHERE s.session_id = ${sessionId} AND s.expires_at > NOW()
  `;

  if (!rows.length) return null;

  const row = rows[0];
  return {
    candidateId: row.candidate_id,
    employerAccountId: row.employer_account_id,
    candidateEmail: row.candidate_email,
    candidateName: row.candidate_name,
    employerEmail: row.employer_email,
    employerName: row.employer_name,
    employerId: row.employer_id,
    employerRole: row.employer_role,
    employerVerificationStatus: row.employer_verification_status,
    employerCompanyName: row.employer_company_name,
  };
}

export async function destroySession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return;

  const sql = getDb();
  await sql`DELETE FROM sessions WHERE session_id = ${sessionId}`;
  cookieStore.delete(SESSION_COOKIE);
}

// --- Email sending via Resend ---

export async function sendMagicLinkEmail(email, token, type = "candidate") {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://careers.ky";
  const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}&type=${type}`;

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const subject = type === "employer"
    ? "Sign in to careers.ky — Employer Portal"
    : "Sign in to careers.ky";

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "careers.ky <noreply@careers.ky>",
    to: email,
    subject,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #0e0e0e; margin-bottom: 16px;">Sign in to careers.ky</h2>
        <p style="color: #555; line-height: 1.6;">Click the button below to sign in. This link expires in 15 minutes.</p>
        <a href="${verifyUrl}" style="display: inline-block; background: #06b6d4; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 500; margin: 24px 0;">
          Sign In
        </a>
        <p style="color: #888; font-size: 13px; margin-top: 24px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
