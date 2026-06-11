import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin-auth";
import { getCandidateDocumentById, uploadsConfigured } from "@/lib/documents";

// Stream a candidate document from the private blob store to an admin.
export async function GET(request, { params }) {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!uploadsConfigured()) {
    return NextResponse.json({ error: "Uploads not configured" }, { status: 503 });
  }

  const { id } = await params;
  const doc = await getCandidateDocumentById(id);
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const blob = await get(doc.blob_pathname, { access: "private" });
    if (!blob || blob.statusCode !== 200) {
      return NextResponse.json({ error: "File missing from storage" }, { status: 404 });
    }
    return new Response(blob.stream, {
      headers: {
        "Content-Type": doc.content_type || "application/octet-stream",
        "Content-Disposition": `inline; filename="${(doc.filename || "document").replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Document fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
  }
}
