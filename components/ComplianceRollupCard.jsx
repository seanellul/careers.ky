"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Download, FileText, BadgeCheck } from "lucide-react";

function Stat({ label, value, sub }) {
  return (
    <div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-neutral-500">{label}</div>
      {sub && <div className="text-[11px] text-neutral-400 mt-0.5">{sub}</div>}
    </div>
  );
}

// Compares a rate against the platform median without ever exposing
// another employer's individual numbers (benchmark is aggregate-only and
// suppressed upstream when the cohort is too small).
function BenchmarkNote({ benchmark }) {
  if (!benchmark || (benchmark.medianConsiderationRate == null && benchmark.medianHireRate == null))
    return null;

  const parts = [];
  if (benchmark.medianConsiderationRate != null) {
    parts.push(`Caymanian consideration ${benchmark.medianConsiderationRate}%`);
  }
  if (benchmark.medianHireRate != null) {
    parts.push(`Caymanian hire rate ${benchmark.medianHireRate}%`);
  }

  return (
    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-4 flex items-center gap-1.5">
      <BadgeCheck className="w-3.5 h-3.5 text-primary-500 shrink-0" />
      Platform median ({benchmark.cohort.employerCount} employers with{" "}
      {benchmark.cohort.minIntroductions}+ introductions): {parts.join(" · ")}
    </p>
  );
}

// Employer-level compliance summary (free tier per D3 — the full audit
// trail export is the paid feature). `benchmark` and `reportHref` are only
// passed on paid tiers (workforce analytics, CEO spec §24).
export default function ComplianceRollupCard({ rollup, employerName, benchmark, reportHref }) {
  const downloadSummary = () => {
    const lines = [
      `careers.ky — Caymanian-First Compliance Summary`,
      `Employer: ${employerName}`,
      `Generated: ${new Date(rollup.generatedAt).toLocaleString()}`,
      ``,
      `CANDIDATES CONSIDERED (all platform introductions)`,
      `Total considered,${rollup.considered.total}`,
      `Caymanian,${rollup.considered.caymanian}`,
      `PR/RERC (no sponsorship required),${rollup.considered.noSponsorship}`,
      `WORC-verified status,${rollup.considered.verified}`,
      `Caymanian consideration rate,${rollup.considered.caymanianRate ?? "n/a"}%`,
      ``,
      `HIRES THROUGH PLATFORM`,
      `Total hired,${rollup.hires.total}`,
      `Caymanian hired,${rollup.hires.caymanian}`,
      `Sponsored (work permit) hired,${rollup.hires.sponsored}`,
      `Caymanian hire rate,${rollup.hires.caymanianRate ?? "n/a"}%`,
      ``,
      `POSTINGS`,
      `Active postings,${rollup.postings.active}`,
      `Posted directly on careers.ky,${rollup.postings.native}`,
      ``,
      `All interactions are timestamped on the careers.ky platform and`,
      `available as per-posting compliance reports.`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compliance-summary-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 mb-8">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 font-medium">
            <Shield className="w-4 h-4 text-primary-500" /> Caymanian-first summary
          </div>
          <div className="flex gap-2">
            {reportHref && (
              <Link href={reportHref}>
                <Button size="sm" variant="secondary" className="gap-1">
                  <FileText className="w-3 h-3" /> WORC report
                </Button>
              </Link>
            )}
            <Button size="sm" variant="secondary" className="gap-1" onClick={downloadSummary}>
              <Download className="w-3 h-3" /> Download summary
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat
            label="Caymanian hire rate"
            value={rollup.hires.caymanianRate != null ? `${rollup.hires.caymanianRate}%` : "—"}
            sub={`${rollup.hires.caymanian} of ${rollup.hires.total} hires`}
          />
          <Stat
            label="Caymanian consideration"
            value={
              rollup.considered.caymanianRate != null ? `${rollup.considered.caymanianRate}%` : "—"
            }
            sub={`${rollup.considered.caymanian} of ${rollup.considered.total} considered`}
          />
          <Stat label="Sponsored hires" value={rollup.hires.sponsored} sub="require work permits" />
          <Stat
            label="Active postings"
            value={rollup.postings.active}
            sub={`${rollup.postings.native} posted directly`}
          />
        </div>

        <BenchmarkNote benchmark={benchmark} />

        <p className="text-xs text-neutral-400 mt-4">
          Every introduction, response, and stage change is timestamped — open a posting below for
          its full per-role compliance report.
        </p>
      </CardContent>
    </Card>
  );
}
