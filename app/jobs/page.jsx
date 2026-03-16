import { Suspense } from "react";
import {
  getActiveJobPostings,
  loadWorkTypes,
  loadEducationTypes,
  loadExperienceTypes,
  loadLocationTypes,
} from "@/lib/data";
import LiveSearchClient from "./LiveSearchClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Live Job Search — Browse Active Cayman Postings",
  description:
    "Browse and filter active job postings in the Cayman Islands. Real-time data from WORC with salary, location, and industry filters.",
};

export default async function JobsPage() {
  const [postings, workTypes, eduTypes, expTypes, locTypes] = await Promise.all([
    getActiveJobPostings(),
    loadWorkTypes(),
    loadEducationTypes(),
    loadExperienceTypes(),
    loadLocationTypes(),
  ]);

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
      <LiveSearchClient
        jobs={jobs}
        workTypes={Object.fromEntries(workTypes)}
        eduTypes={Object.fromEntries(eduTypes)}
        expTypes={Object.fromEntries(expTypes)}
        locTypes={Object.fromEntries(locTypes)}
      />
    </Suspense>
  );
}
