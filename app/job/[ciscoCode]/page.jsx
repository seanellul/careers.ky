import {
  getCiscoUnit,
  loadAggregates,
  loadWorkTypes,
  loadEducationTypes,
  loadExperienceTypes,
  searchTitles,
  getJobPostingsByCiscoCode,
  getSkillsForCisco,
} from "@/lib/data";
import { notFound } from "next/navigation";
import JobDetailClient from "./JobDetailClient";

export async function generateMetadata({ params }) {
  const { ciscoCode } = await params;
  const unit = await getCiscoUnit(ciscoCode);
  if (!unit) return { title: "Job Not Found" };

  const aggregates = await loadAggregates();
  const stats = aggregates.get(ciscoCode);
  const jobCount = stats?.count || 0;
  const avgSalary = stats?.mean ? `CI$ ${Math.round(stats.mean).toLocaleString()}` : "";

  return {
    title: `${unit.title} Jobs in Cayman`,
    description: `Find ${unit.title} jobs in the Cayman Islands. ${jobCount} postings available${avgSalary ? `, average salary ${avgSalary}` : ""}. Browse salary data, requirements, and apply on WORC.`,
    openGraph: {
      title: `${unit.title} Jobs in Cayman | careers.ky`,
      description: `${jobCount} ${unit.title} job postings in Cayman${avgSalary ? ` with average salary ${avgSalary}` : ""}.`,
    },
  };
}

export default async function JobDetailPage({ params }) {
  const { ciscoCode } = await params;
  const [unit, aggregates, workTypes, eduTypes, expTypes, postings, related, ciscoSkills] =
    await Promise.all([
      getCiscoUnit(ciscoCode),
      loadAggregates(),
      loadWorkTypes(),
      loadEducationTypes(),
      loadExperienceTypes(),
      getJobPostingsByCiscoCode(ciscoCode),
      searchTitles(ciscoCode, 6),
      getSkillsForCisco(ciscoCode),
    ]);

  if (!unit) notFound();

  const stats = aggregates.get(ciscoCode);

  // Build employer data
  const employerMap = new Map();
  postings.forEach((p) => {
    const employer = p.Employer;
    if (!employer) return;
    if (!employerMap.has(employer)) {
      employerMap.set(employer, { name: employer, totalPostings: 0, activePostings: 0, isActiveHiring: false, recentPosting: null });
    }
    const emp = employerMap.get(employer);
    emp.totalPostings++;
    if (p.isActive) {
      emp.activePostings++;
      emp.isActiveHiring = true;
    }
    if (!emp.recentPosting || new Date(p.createdDate) > new Date(emp.recentPosting.createdDate)) {
      emp.recentPosting = p;
    }
  });
  const employerData = Array.from(employerMap.values()).sort((a, b) => {
    if (a.isActiveHiring !== b.isActiveHiring) return a.isActiveHiring ? -1 : 1;
    return b.totalPostings - a.totalPostings;
  });

  // Get proper related titles using the unit title
  const relatedTitles = unit.title ? await searchTitles(unit.title, 6) : [];

  // JSON-LD structured data for Google Jobs
  const jsonLd = stats
    ? {
        "@context": "https://schema.org",
        "@type": "OccupationalCategory",
        name: unit.title,
        description: unit.description,
        occupationalCategory: ciscoCode,
        estimatedSalary: {
          "@type": "MonetaryAmountDistribution",
          name: "base",
          currency: "KYD",
          median: stats.mean,
          percentile10: stats.min,
          percentile90: stats.max,
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <JobDetailClient
        unit={unit}
        ciscoCode={ciscoCode}
        stats={stats}
        workTypes={Object.fromEntries(workTypes)}
        eduTypes={Object.fromEntries(eduTypes)}
        expTypes={Object.fromEntries(expTypes)}
        employerData={employerData}
        relatedJobs={relatedTitles}
        postings={postings}
        skills={ciscoSkills}
      />
    </>
  );
}
