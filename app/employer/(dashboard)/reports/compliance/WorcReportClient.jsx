"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download } from "lucide-react";
import TrendChart from "../TrendChart";

// Print-first WORC workforce report. The sheet is always rendered as a white
// document (a "paper preview"), even in dark mode, so the on-screen view
// matches the printed/PDF output exactly. "Download PDF" is the browser's
// print-to-PDF — no PDF library needed.
const PRINT_CSS = `
@media print {
  @page { margin: 14mm; }
  body { background: #fff !important; }
  aside, #bg-gradient, button[aria-label="Open sidebar"] { display: none !important; }
  main { padding: 0 !important; }
  .worc-sheet { border: none !important; box-shadow: none !important; padding: 0 !important; }
  .worc-sheet * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

const MONTH_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function monthLong(ym) {
  const [y, m] = ym.split("-");
  return `${MONTH_FULL[Number(m) - 1]} ${y}`;
}

function monthShort(ym) {
  const [y, m] = ym.split("-");
  return `${MONTH_FULL[Number(m) - 1].slice(0, 3)} ’${y.slice(2)}`;
}

function pctOrDash(v) {
  return v != null ? `${v}%` : "—";
}

export default function WorcReportClient({ employerName, rollup, analytics }) {
  const months = analytics.trend.months;
  const monthKeys = months.map((m) => m.month);
  const period = `${monthLong(monthKeys[0])} — ${monthLong(monthKeys[monthKeys.length - 1])}`;
  const generated = new Date(analytics.generatedAt);
  const benchmark = analytics.benchmark;

  const downloadCsv = () => {
    const lines = [
      `careers.ky — Caymanian-First Workforce Report (WORC)`,
      `Employer,${employerName}`,
      `Period,${period}`,
      `Generated,${generated.toISOString()}`,
      ``,
      `SUMMARY (all platform activity)`,
      `Total candidates considered,${rollup.considered.total}`,
      `Caymanian considered,${rollup.considered.caymanian}`,
      `PR/RERC considered,${rollup.considered.noSponsorship}`,
      `WORC-verified status,${rollup.considered.verified}`,
      `Caymanian consideration rate,${rollup.considered.caymanianRate ?? "n/a"}%`,
      `Total hired,${rollup.hires.total}`,
      `Caymanian hired,${rollup.hires.caymanian}`,
      `Sponsored (work permit) hired,${rollup.hires.sponsored}`,
      `Caymanian hire rate,${rollup.hires.caymanianRate ?? "n/a"}%`,
      ``,
      `PLATFORM BENCHMARK (aggregate medians only)`,
      `Comparison cohort,${benchmark.cohort.employerCount} employers with ${benchmark.cohort.minIntroductions}+ introductions`,
      `Median Caymanian consideration rate,${benchmark.medianConsiderationRate != null ? `${benchmark.medianConsiderationRate}%` : "suppressed (cohort too small)"}`,
      `Median Caymanian hire rate,${benchmark.medianHireRate != null ? `${benchmark.medianHireRate}%` : "suppressed (cohort too small)"}`,
      ``,
      `MONTHLY BREAKDOWN`,
      `Month,Considered,Caymanian,PR/RERC,Work permit,Undeclared,Express Interest,Interest (Caymanian),Hires,Caymanian hires`,
      ...months.map((m) =>
        [
          m.month,
          m.considered.total,
          m.considered.caymanian,
          m.considered.prRerc,
          m.considered.workPermit,
          m.considered.undeclared,
          m.interests.total,
          m.interests.caymanian,
          m.hires.total,
          m.hires.caymanian,
        ].join(",")
      ),
      ``,
      `Methodology: ${analytics.trend.notes.considered}. ${analytics.trend.notes.hires}.`,
      `All interactions are timestamped on the careers.ky platform.`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `worc-workforce-report-${generated.toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const th = "text-left font-medium text-neutral-500 px-2 py-1.5 whitespace-nowrap";
  const td = "px-2 py-1.5 text-neutral-800 tabular-nums";

  return (
    <div className="wf-paper">
      <style>{PRINT_CSS}</style>

      {/* Toolbar — never printed */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link
          href="/employer/reports"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
        >
          <ArrowLeft className="w-4 h-4" /> Back to reports
        </Link>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="gap-1.5" onClick={downloadCsv}>
            <Download className="w-3.5 h-3.5" /> Download CSV
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5" /> Download PDF
          </Button>
        </div>
      </div>

      {/* The sheet — always light, exactly what prints */}
      <div className="worc-sheet bg-white text-neutral-900 rounded-2xl border border-neutral-200 shadow-sm p-6 sm:p-10">
        {/* Letterhead */}
        <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b-2 border-neutral-900">
          <div>
            <div className="text-xl font-semibold tracking-tight">
              careers<span className="text-primary-500">.ky</span>
            </div>
            <div className="text-sm text-neutral-500 mt-0.5">
              Caymanian-First Workforce Report
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="font-semibold">{employerName}</div>
            <div className="text-neutral-500">Period: {period}</div>
            <div className="text-neutral-500">
              Generated:{" "}
              {generated.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* Summary */}
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mt-8 mb-4">
          Summary — all platform activity
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Caymanian hire rate",
              value: pctOrDash(rollup.hires.caymanianRate),
              sub: `${rollup.hires.caymanian} of ${rollup.hires.total} hires`,
            },
            {
              label: "Caymanian consideration",
              value: pctOrDash(rollup.considered.caymanianRate),
              sub: `${rollup.considered.caymanian} of ${rollup.considered.total} considered`,
            },
            {
              label: "PR / RERC considered",
              value: rollup.considered.noSponsorship,
              sub: "no sponsorship required",
            },
            {
              label: "Sponsored hires",
              value: rollup.hires.sponsored,
              sub: "require work permits",
            },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-semibold">{s.value}</div>
              <div className="text-xs text-neutral-500">{s.label}</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Trend */}
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mt-10 mb-4">
          12-month trend
        </h2>
        <div className="mb-8">
          <TrendChart
            title="Candidates considered per month, by status"
            months={monthKeys}
            series={[
              {
                label: "Caymanian",
                color: "var(--wf-s1)",
                values: months.map((m) => m.considered.caymanian),
              },
              {
                label: "PR / RERC",
                color: "var(--wf-s2)",
                values: months.map((m) => m.considered.prRerc),
              },
              {
                label: "Work permit",
                color: "var(--wf-s3)",
                values: months.map((m) => m.considered.workPermit),
              },
              {
                label: "Undeclared",
                color: "var(--wf-mut)",
                values: months.map((m) => m.considered.undeclared),
              },
            ]}
          />
        </div>
        <TrendChart
          title="Hires per month"
          months={monthKeys}
          series={[
            {
              label: "Caymanian",
              color: "var(--wf-s1)",
              values: months.map((m) => m.hires.caymanian),
            },
            {
              label: "Non-Caymanian",
              color: "var(--wf-s3)",
              values: months.map((m) => m.hires.nonCaymanian),
            },
          ]}
        />

        {/* Monthly table */}
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mt-10 mb-3">
          Monthly breakdown
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-300">
                <th className={th}>Month</th>
                <th className={th}>Considered</th>
                <th className={th}>Caymanian</th>
                <th className={th}>PR / RERC</th>
                <th className={th}>Work permit</th>
                <th className={th}>Undeclared</th>
                <th className={th}>Express Interest</th>
                <th className={th}>Hires</th>
                <th className={th}>Caymanian hires</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.month} className="border-b border-neutral-100">
                  <td className={`${td} whitespace-nowrap`}>{monthShort(m.month)}</td>
                  <td className={td}>{m.considered.total}</td>
                  <td className={td}>{m.considered.caymanian}</td>
                  <td className={td}>{m.considered.prRerc}</td>
                  <td className={td}>{m.considered.workPermit}</td>
                  <td className={td}>{m.considered.undeclared}</td>
                  <td className={td}>{m.interests.total}</td>
                  <td className={td}>{m.hires.total}</td>
                  <td className={td}>{m.hires.caymanian}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Benchmark */}
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mt-10 mb-3">
          Platform benchmark
        </h2>
        {benchmark.medianConsiderationRate != null ? (
          <div className="text-sm text-neutral-700 space-y-1">
            <p>
              Median Caymanian consideration rate across {benchmark.cohort.employerCount} employers
              with {benchmark.cohort.minIntroductions}+ introductions:{" "}
              <span className="font-semibold">{benchmark.medianConsiderationRate}%</span> — yours:{" "}
              <span className="font-semibold">{pctOrDash(benchmark.you.considerationRate)}</span>
            </p>
            <p>
              Median Caymanian hire rate
              {benchmark.medianHireRate != null ? (
                <>
                  {" "}
                  across {benchmark.cohort.hiringEmployerCount} hiring employers:{" "}
                  <span className="font-semibold">{benchmark.medianHireRate}%</span> — yours:{" "}
                  <span className="font-semibold">{pctOrDash(benchmark.you.hireRate)}</span>
                </>
              ) : (
                <>: not shown — fewer than 5 employers have recorded hires on the platform</>
              )}
            </p>
          </div>
        ) : (
          <p className="text-sm text-neutral-500">
            Benchmark not shown: fewer than 5 employers currently meet the comparison threshold (
            {benchmark.cohort.minIntroductions}+ introductions). It will appear automatically as
            platform activity grows.
          </p>
        )}
        <p className="text-[11px] text-neutral-400 mt-2">
          Benchmarks are aggregate medians only — no individual employer&apos;s figures are
          disclosed.
        </p>

        {/* Methodology */}
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mt-10 mb-3">
          Methodology
        </h2>
        <ul className="text-[11px] text-neutral-500 space-y-1 list-disc pl-4">
          <li>{analytics.trend.notes.considered}.</li>
          <li>{analytics.trend.notes.interests}.</li>
          <li>{analytics.trend.notes.hires}.</li>
          <li>
            Candidate status tiers follow the WORC classification: Caymanian, PR (Permanent
            Resident), RERC (Residency &amp; Employment Rights Certificate), and work permit
            (dependant / overseas).
          </li>
        </ul>

        <div className="mt-8 pt-4 border-t border-neutral-200 text-[11px] text-neutral-400 flex justify-between">
          <span>
            Generated by careers.ky — every introduction, response, and stage change is timestamped
            on-platform.
          </span>
          <span>{generated.toISOString().split("T")[0]}</span>
        </div>
      </div>
    </div>
  );
}
