import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { uploadsConfigured } from "@/lib/documents";
import {
  upsertCandidate,
  updateCandidateInterests,
  updateCandidateSkills,
  updateBlockedEmployers,
  getCandidateById,
} from "@/lib/data";
import { isValidStatus } from "@/lib/candidate-status";

const PROFILE_TYPES = ["open", "selective", "closed"];

export async function PUT(request) {
  const session = await getSession();
  if (!session?.candidateId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    if (data.status != null && !isValidStatus(data.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    if (data.profileType != null && !PROFILE_TYPES.includes(data.profileType)) {
      return NextResponse.json({ error: "Invalid profile type" }, { status: 400 });
    }
    const candidate = await upsertCandidate(session.candidateEmail, {
      name: data.name,
      status: data.status || null,
      profileType: data.profileType || null,
      isCaymanian: data.isCaymanian,
      educationCode: data.educationCode,
      experienceCode: data.experienceCode,
      locationCode: data.locationCode,
      availability: data.availability,
      isDiscoverable: data.isDiscoverable,
      bio: data.bio,
      salaryMin: data.salaryMin || null,
      salaryTarget: data.salaryTarget || null,
      salaryNegotiable: data.salaryNegotiable || false,
      noticePeriod: data.noticePeriod || null,
      workTypePreferences: data.workTypePreferences || [],
      linkedinUrl: data.linkedinUrl || null,
      resumeSummary: data.resumeSummary || null,
      headline: data.headline || null,
      phone: data.phone || null,
      portfolioUrl: data.portfolioUrl || null,
      yearsOfExperience: data.yearsOfExperience || null,
      preferredIndustries: data.preferredIndustries || [],
      willingToRelocate: data.willingToRelocate || false,
    });

    if (data.ciscoCodes) {
      await updateCandidateInterests(candidate.id, data.ciscoCodes);
    }

    if (Array.isArray(data.blockedEmployerIds)) {
      const ids = data.blockedEmployerIds.map(Number).filter(Number.isInteger);
      await updateBlockedEmployers(candidate.id, ids);
    }

    // Referral attribution (MVP #23): once, at first profile save, never self
    if (data.referralCode && !candidate.referred_by) {
      try {
        const { getDb } = await import("@/lib/db");
        const sql = getDb();
        const referrer = await sql`
          SELECT id FROM candidates WHERE referral_code = ${String(data.referralCode).slice(0, 12)}
        `;
        if (referrer.length && referrer[0].id !== candidate.id) {
          await sql`
            UPDATE candidates SET referred_by = ${referrer[0].id}
            WHERE id = ${candidate.id} AND referred_by IS NULL
          `;
          const { captureServer, candidateDistinctId } = await import("@/lib/analytics-server");
          captureServer(candidateDistinctId(referrer[0].id), "referral_attributed", {
            referred_candidate: candidate.id,
          });
        }
      } catch (refErr) {
        console.error("Referral attribution error (non-fatal):", refErr.message);
      }
    }

    if (data.skillIds) {
      await updateCandidateSkills(candidate.id, data.skillIds);
    }

    return NextResponse.json({ success: true, candidate });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

// DELETE /api/profile — self-serve candidate account deletion (Cayman DPA
// right to erasure). Removes the candidate row (interests, skills, documents,
// introductions, alerts, blocked-employer rows, and sessions cascade via FK),
// plus rows that do NOT cascade: notifications, auth tokens, newsletter
// subscription, and referred_by back-references. Uploaded documents are
// removed from the private blob store best-effort.
export async function DELETE(request) {
  const session = await getSession();
  if (!session?.candidateId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const check = rateLimit(`account-delete:${getClientIp(request)}`, 5, 60 * 60 * 1000);
  if (check.limited) return rateLimitResponse(3600);

  const body = await request.json().catch(() => ({}));
  if (body?.confirm !== "DELETE") {
    return NextResponse.json({ error: "Type DELETE to confirm account deletion" }, { status: 400 });
  }

  const candidateId = session.candidateId;
  const email = session.candidateEmail;

  try {
    const sql = getDb();

    // Best-effort blob cleanup before the rows cascade away. Row deletion is
    // not blocked by storage failures (orphaned blobs are logged instead).
    const docs = await sql`
      SELECT blob_pathname FROM candidate_documents WHERE candidate_id = ${candidateId}
    `;
    if (docs.length && uploadsConfigured()) {
      try {
        const { del } = await import("@vercel/blob");
        await del(docs.map((d) => d.blob_pathname));
      } catch (blobErr) {
        console.error(
          `Account deletion: failed to delete ${docs.length} blob(s) for candidate ${candidateId} (rows still deleted):`,
          blobErr.message
        );
      }
    } else if (docs.length) {
      console.warn(
        `Account deletion: blob store not configured — ${docs.length} blob(s) orphaned for candidate ${candidateId}`
      );
    }

    // referred_by has no ON DELETE action — null it out so the delete succeeds.
    await sql`UPDATE candidates SET referred_by = NULL WHERE referred_by = ${candidateId}`;
    await sql`
      DELETE FROM notifications WHERE recipient_type = 'candidate' AND recipient_id = ${candidateId}
    `;
    if (email) {
      await sql`DELETE FROM auth_tokens WHERE LOWER(email) = LOWER(${email})`;
      await sql`DELETE FROM newsletter_subscribers WHERE LOWER(email) = LOWER(${email})`;
    }

    // Cascades: candidate_interests, candidate_skills, candidate_documents,
    // candidate_blocked_employers, introductions (+ introduction_messages),
    // match_alerts, shortlist_candidates, sessions.
    await sql`DELETE FROM candidates WHERE id = ${candidateId}`;

    const cookieStore = await cookies();
    cookieStore.delete("ck_session");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
