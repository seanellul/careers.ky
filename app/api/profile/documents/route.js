import { NextResponse } from "next/server";
import crypto from "crypto";
import { put } from "@vercel/blob";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  DOC_TYPES,
  ALLOWED_CONTENT_TYPES,
  MAX_DOCUMENT_BYTES,
  uploadsConfigured,
  createCandidateDocument,
  getCandidateDocuments,
} from "@/lib/documents";

export async function GET() {
  const session = await getSession();
  if (!session?.candidateId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const documents = await getCandidateDocuments(session.candidateId);
  return NextResponse.json({ documents, uploadsConfigured: uploadsConfigured() });
}

export async function POST(request) {
  const session = await getSession();
  if (!session?.candidateId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!uploadsConfigured()) {
    return NextResponse.json({ error: "Document uploads are not configured yet" }, { status: 503 });
  }

  const check = rateLimit(`doc-upload:${session.candidateId}`, 5, 60 * 60 * 1000);
  if (check.limited) {
    return NextResponse.json({ error: "Too many uploads — try again later" }, { status: 429 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const docType = formData.get("docType");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!DOC_TYPES.includes(docType)) {
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
    }
    if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Only PDF, JPG, PNG or WEBP files" }, { status: 400 });
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
    }

    // Unguessable pathname inside the private store, namespaced by candidate
    const suffix = crypto.randomBytes(8).toString("hex");
    const safeName = (file.name || "document").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const pathname = `candidates/${session.candidateId}/${docType}/${suffix}-${safeName}`;

    const blob = await put(pathname, file, {
      access: "private",
      contentType: file.type,
    });

    const document = await createCandidateDocument(session.candidateId, {
      docType,
      blobPathname: blob.pathname,
      filename: file.name || safeName,
      contentType: file.type,
      sizeBytes: file.size,
    });

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
