import { getDb } from "@/lib/db";

// Free CV review loop (CEO spec §19). Candidates with an uploaded CV
// (candidate_documents, doc_type 'cv') request a review; admins deliver
// written feedback from /admin/cv-reviews. One open request per candidate
// at a time (enforced by a partial unique index); unlimited sequential
// requests after each one completes.

// 42P01 = undefined_table. The cv_review_requests migration may not have
// run yet (dev DATABASE_URL is production) — callers use this to feature-
// detect and hide the CV review UI instead of erroring.
export function isMissingTableError(error) {
  return error?.code === "42P01";
}

// 23505 = unique_violation — the one-open-request partial unique index fired.
export function isDuplicateOpenRequestError(error) {
  return error?.code === "23505";
}

export async function getLatestCvDocument(candidateId) {
  const sql = getDb();
  const rows = await sql`
    SELECT id, filename, created_at
    FROM candidate_documents
    WHERE candidate_id = ${candidateId} AND doc_type = 'cv'
    ORDER BY created_at DESC
    LIMIT 1
  `;
  return rows[0] || null;
}

export async function getCvReviewsForCandidate(candidateId) {
  const sql = getDb();
  return sql`
    SELECT r.id, r.status, r.feedback, r.requested_at, r.reviewed_at,
           cd.filename
    FROM cv_review_requests r
    LEFT JOIN candidate_documents cd ON cd.id = r.document_id
    WHERE r.candidate_id = ${candidateId}
    ORDER BY r.requested_at DESC
  `;
}

export async function getOpenCvReview(candidateId) {
  const sql = getDb();
  const rows = await sql`
    SELECT id FROM cv_review_requests
    WHERE candidate_id = ${candidateId} AND status = 'pending'
    LIMIT 1
  `;
  return rows[0] || null;
}

export async function createCvReviewRequest(candidateId, documentId) {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO cv_review_requests (candidate_id, document_id)
    VALUES (${candidateId}, ${documentId})
    RETURNING id, status, requested_at
  `;
  return rows[0];
}

export async function getPendingCvReviews() {
  const sql = getDb();
  return sql`
    SELECT r.id, r.document_id, r.requested_at,
           c.id AS candidate_id, c.name AS candidate_name, c.email AS candidate_email,
           cd.filename, cd.content_type, cd.size_bytes
    FROM cv_review_requests r
    JOIN candidates c ON c.id = r.candidate_id
    JOIN candidate_documents cd ON cd.id = r.document_id
    WHERE r.status = 'pending'
    ORDER BY r.requested_at ASC
  `;
}

// Complete or decline a pending review. Returns the updated row (with the
// candidate's name/email for notifications) or null if not found / already
// resolved.
export async function resolveCvReview(id, action, feedback, reviewedBy) {
  const sql = getDb();
  const status = action === "complete" ? "completed" : "declined";
  const rows = await sql`
    UPDATE cv_review_requests r
    SET status = ${status}, feedback = ${feedback}, reviewed_by = ${reviewedBy}, reviewed_at = NOW()
    FROM candidates c
    WHERE r.id = ${id} AND r.status = 'pending' AND c.id = r.candidate_id
    RETURNING r.*, c.name AS candidate_name, c.email AS candidate_email
  `;
  return rows[0] || null;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Notify the admin team that a candidate requested a CV review.
 * Best-effort — callers should not fail the request if this throws.
 */
export async function sendCvReviewRequestNotificationToTeam(candidate, document, requestId) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn("ADMIN_EMAIL not set — skipping CV review notification");
    return;
  }
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping CV review notification");
    return;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://careers.ky";
  const structuredData = JSON.stringify({
    type: "cv_review_request",
    requestId,
    candidateId: candidate.id,
    candidateEmail: candidate.email,
    candidateName: candidate.name,
    documentId: document.id,
    filename: document.filename,
    timestamp: new Date().toISOString(),
  });

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "careers.ky <noreply@careers.ky>",
    to: adminEmail,
    subject: `[CV Review] ${candidate.email} requested a free CV review`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #0e0e0e; margin-bottom: 16px;">New CV Review Request</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Candidate</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(candidate.name || "Not provided")}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(candidate.email)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">CV File</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(document.filename || "Unnamed file")}</td></tr>
        </table>
        <p style="color: #555;">Turnaround promise to the candidate is 48 hours.</p>
        <a href="${baseUrl}/admin/cv-reviews" style="display: inline-block; background: #06b6d4; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 500; margin: 16px 0;">
          Review in Admin
        </a>
        <!-- STRUCTURED_DATA: ${structuredData} -->
      </div>
    `,
  });
}

/**
 * Deliver completed feedback to the candidate: in-app notification plus a
 * transactional email containing the feedback text. Best-effort — callers
 * should not fail the admin action if this throws.
 */
export async function notifyCandidateCvReviewCompleted(review) {
  const sql = getDb();

  await sql`
    INSERT INTO notifications (recipient_type, recipient_id, title, body, link)
    VALUES (
      'candidate',
      ${review.candidate_id},
      'Your free CV review is ready',
      'Our team has reviewed your CV — read the feedback on your profile.',
      '/profile'
    )
  `;

  if (!process.env.RESEND_API_KEY || !review.candidate_email) return;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://careers.ky";
  const feedbackHtml = escapeHtml(review.feedback || "").replace(/\n/g, "<br />");

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "careers.ky <noreply@careers.ky>",
    to: review.candidate_email,
    subject: "Your free CV review is ready — careers.ky",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #0e0e0e; margin-bottom: 8px;">Your CV Review Is Ready</h2>
        <p style="color: #555; margin-bottom: 16px;">Hi ${escapeHtml(review.candidate_name || "there")}, our team has reviewed your CV. Here's the feedback:</p>
        <div style="background: #f8f8f8; border-radius: 8px; padding: 16px 20px; color: #333; line-height: 1.7; margin-bottom: 16px;">
          ${feedbackHtml}
        </div>
        <p style="color: #555;">You can request another review any time after updating your CV.</p>
        <a href="${baseUrl}/profile" style="display: inline-block; background: #06b6d4; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 500; margin: 16px 0;">
          View on Your Profile
        </a>
        <p style="color: #888; font-size: 13px; margin-top: 24px;">You're receiving this because you requested a free CV review on careers.ky.</p>
      </div>
    `,
  });
}
