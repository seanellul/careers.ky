import { Suspense } from "react";
import {
  loadCISCO,
  buildCiscoTree,
  loadAggregates,
  loadWorkTypes,
  loadEducationTypes,
  loadExperienceTypes,
  loadLocationTypes,
  getActiveJobPostings,
  getEmployerList,
} from "@/lib/data";
import CareersClient from "./CareersClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Careers — Jobs, Employers & Career Tracks in Cayman",
  description:
    "Explore the complete Cayman Islands job market. Search active job postings, browse employers, and discover career tracks by industry.",
};

export default async function CareersPage() {
  const [ciscoRows, aggregates, workTypes, eduTypes, expTypes, locTypes, postings, employers] =
    await Promise.all([
      loadCISCO(),
      loadAggregates(),
      loadWorkTypes(),
      loadEducationTypes(),
      loadExperienceTypes(),
      loadLocationTypes(),
      getActiveJobPostings(),
      getEmployerList(),
    ]);

  const tree = buildCiscoTree(ciscoRows);

  const ciscoSubMajors = Object.fromEntries(
    ciscoRows
      .filter(r => String(r.sCISCO).length === 4 && r.sCISCO.endsWith("00") && !r.sCISCO.endsWith("000"))
      .map(r => [String(r.sCISCO).substring(0, 2), r.cTitle])
  );

  const jobs = postings.map((job) => ({
    educationLevel: job.sEducation || "0",
    employerName: job.Employer || "Employer not listed",
    hoursPerWeek: parseFloat(job["Hours Per Week"]) || 40,
    minimumAmount: job.fMinSalary || 0,
    maximumAmount: job.fMaxSalary || 0,
    jobLocation: job.sLocation || "0",
    jobPostId: job.cJobId,
    jobPostIdString: job.cJobId,
    yearsOfExperience: job.sExperience || "0",
    workType: job.sWork || "0",
    jobTitle: job.cTitle || "Untitled Role",
    currency: job.Currency || "KYD",
    salaryShort: job["Salary Description"] || null,
    startDate: job.startDate,
    endDate: job.endDate,
    approvalDate: job.createdDate,
    occupation: job.Occupation || "",
    sOccupation: job.sOccupation || "",
  }));

  return (
    <Suspense fallback={null}>
      <CareersClient
        jobs={jobs}
        employers={employers}
        tree={tree}
        aggregates={Object.fromEntries(aggregates)}
        workTypes={Object.fromEntries(workTypes)}
        eduTypes={Object.fromEntries(eduTypes)}
        expTypes={Object.fromEntries(expTypes)}
        locTypes={Object.fromEntries(locTypes)}
        ciscoSubMajors={ciscoSubMajors}
      />
    </Suspense>
  );
}
