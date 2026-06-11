import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
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

    if (data.skillIds) {
      await updateCandidateSkills(candidate.id, data.skillIds);
    }

    return NextResponse.json({ success: true, candidate });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
