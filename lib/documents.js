import { getDb } from "@/lib/db";

export const DOC_TYPES = ["status_proof", "cv", "police_clearance", "reference"];

export const ALLOWED_CONTENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10 MB

export function uploadsConfigured() {
  // Static RW token, or OIDC auth: BLOB_STORE_ID + a runtime OIDC token
  // (VERCEL_OIDC_TOKEN locally via `vercel env pull`; request context on Vercel).
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
    (process.env.BLOB_STORE_ID && (process.env.VERCEL_OIDC_TOKEN || process.env.VERCEL))
  );
}

export async function createCandidateDocument(candidateId, doc) {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO candidate_documents (candidate_id, doc_type, blob_pathname, filename, content_type, size_bytes)
    VALUES (${candidateId}, ${doc.docType}, ${doc.blobPathname}, ${doc.filename}, ${doc.contentType}, ${doc.sizeBytes})
    RETURNING *
  `;
  return rows[0];
}

export async function getCandidateDocuments(candidateId) {
  const sql = getDb();
  return sql`
    SELECT id, doc_type, filename, content_type, size_bytes, review_status, review_notes, created_at, reviewed_at
    FROM candidate_documents
    WHERE candidate_id = ${candidateId}
    ORDER BY created_at DESC
  `;
}

export async function getCandidateDocumentById(id) {
  const sql = getDb();
  const rows = await sql`SELECT * FROM candidate_documents WHERE id = ${id}`;
  return rows[0] || null;
}

export async function getPendingCandidateDocuments() {
  const sql = getDb();
  return sql`
    SELECT cd.id, cd.doc_type, cd.filename, cd.content_type, cd.size_bytes, cd.created_at,
           c.id as candidate_id, c.name as candidate_name, c.email as candidate_email,
           c.status as candidate_status, c.status_verified
    FROM candidate_documents cd
    JOIN candidates c ON c.id = cd.candidate_id
    WHERE cd.review_status = 'pending'
    ORDER BY cd.created_at ASC
  `;
}

// Approve or reject a document. Approving a status_proof grants the
// WORC Verified badge on the candidate.
export async function reviewCandidateDocument(id, action, reviewedBy, notes = null) {
  const sql = getDb();
  const status = action === "approve" ? "approved" : "rejected";
  const rows = await sql`
    UPDATE candidate_documents
    SET review_status = ${status}, review_notes = ${notes}, reviewed_by = ${reviewedBy}, reviewed_at = NOW()
    WHERE id = ${id} AND review_status = 'pending'
    RETURNING *
  `;
  const doc = rows[0];
  if (!doc) return null;

  if (status === "approved" && doc.doc_type === "status_proof") {
    await sql`
      UPDATE candidates SET status_verified = TRUE, status_verified_at = NOW()
      WHERE id = ${doc.candidate_id}
    `;
  }
  return doc;
}
