import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin-auth";
import { getPendingCandidateDocuments, reviewCandidateDocument } from "@/lib/documents";

export async function GET() {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const documents = await getPendingCandidateDocuments();
  return NextResponse.json({ documents });
}

export async function PATCH(request) {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId, action, notes } = await request.json();
  if (!documentId || !["approve", "reject"].includes(action)) {
    return NextResponse.json(
      { error: "documentId and action (approve/reject) required" },
      { status: 400 }
    );
  }

  const adminEmail = session.candidateEmail || session.employerEmail;
  const doc = await reviewCandidateDocument(documentId, action, adminEmail, notes || null);
  if (!doc) {
    return NextResponse.json({ error: "Document not found or already reviewed" }, { status: 404 });
  }
  return NextResponse.json({ success: true, document: doc });
}
