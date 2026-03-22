"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Download, Printer, ArrowLeft, Users, CheckCircle,
  Shield, Briefcase, Activity,
} from "lucide-react";

const STAGE_LABELS = {
  outreach: "Outreach",
  responded: "Responded",
  interviewing: "Interviewing",
  offered: "Offered",
  hired: "Hired",
  rejected: "Rejected",
  archived: "Archived",
};

const REJECTION_REASON_LABELS = {
  position_filled: "Position Filled",
  qualifications_mismatch: "Qualifications Don't Match",
  salary_mismatch: "Salary Expectations Misaligned",
  candidate_unresponsive: "Candidate Unresponsive",
  candidate_withdrew: "Candidate Withdrew",
  insufficient_experience: "Insufficient Experience",
  location_mismatch: "Location Mismatch",
  other: "Other",
};

const ACTIVITY_LABELS = {
  intro_sent: "Introduction sent",
  intro_accepted: "Introduction accepted",
  intro_declined: "Introduction declined",
  interest_expressed: "Candidate expressed interest",
  interest_accepted: "Candidate interest accepted",
  interest_declined: "Candidate interest declined",
  stage_changed: "Pipeline stage changed",
  search_run: "Talent search performed",
  message_sent: "Message sent",
};

function formatDate(d) {
  if (!d) return "--";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(d) {
  if (!d) return "--";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function buildPrintDocument(report, employerName) {
  const { job, intros, activity, summary } = report;

  const candidateRows = intros.map((intro, i) => `
    <tr>
      <td>Candidate #${i + 1}</td>
      <td>${intro.is_caymanian ? "<strong>Yes</strong>" : "No"}</td>
      <td>${intro.education_code || "--"}</td>
      <td>${intro.experience_code || "--"}</td>
      <td>${intro.location_code || "--"}</td>
      <td>${intro.match_score != null ? Math.round(Number(intro.match_score)) + "%" : "--"}</td>
      <td>${intro.status || "pending"}</td>
      <td>${STAGE_LABELS[intro.stage] || intro.stage || "Outreach"}</td>
      <td>${intro.initiated_by || "employer"}</td>
      <td>${intro.rejection_reason ? (REJECTION_REASON_LABELS[intro.rejection_reason] || intro.rejection_reason) : "--"}</td>
      <td>${formatDate(intro.created_at)}</td>
      <td>${formatDate(intro.responded_at)}</td>
    </tr>
  `).join("");

  const activityRows = activity.map(a => `
    <tr>
      <td>${formatDateTime(a.created_at)}</td>
      <td>${ACTIVITY_LABELS[a.action] || a.action}</td>
      <td>${a.details?.from && a.details?.to ? `${STAGE_LABELS[a.details.from] || a.details.from} → ${STAGE_LABELS[a.details.to] || a.details.to}` : ""}</td>
    </tr>
  `).join("");

  const pipelineRows = Object.entries(summary.stageBreakdown || {}).map(([stage, count]) =>
    `<span class="pill">${STAGE_LABELS[stage] || stage}: <strong>${count}</strong></span>`
  ).join(" ");

  const rejectionRows = Object.entries(summary.rejectionBreakdown || {}).map(([reason, count]) =>
    `<span class="pill">${REJECTION_REASON_LABELS[reason] || reason}: <strong>${count}</strong></span>`
  ).join(" ");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Compliance Report — ${job.title} — ${employerName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #1a1a1a; line-height: 1.5; padding: 40px; max-width: 900px; margin: 0 auto; font-size: 13px; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    h2 { font-size: 16px; margin: 28px 0 12px; padding-bottom: 6px; border-bottom: 2px solid #e5e5e5; }
    .subtitle { color: #666; font-size: 13px; margin-bottom: 2px; }
    .header { border-bottom: 3px solid #111; padding-bottom: 20px; margin-bottom: 24px; }
    .header-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 32px; margin-top: 12px; }
    .header-grid dt { color: #666; font-size: 12px; }
    .header-grid dd { font-weight: 500; margin-bottom: 6px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .stat { border: 1px solid #e5e5e5; border-radius: 6px; padding: 12px; text-align: center; }
    .stat .value { font-size: 24px; font-weight: 700; }
    .stat .label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
    .pills { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
    .pill { background: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 4px; padding: 3px 10px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #f8f8f8; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #555; padding: 8px 6px; border-bottom: 2px solid #ddd; }
    td { padding: 7px 6px; border-bottom: 1px solid #eee; font-size: 12px; }
    tr:nth-child(even) td { background: #fafafa; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 11px; color: #999; text-align: center; }
    @media print { body { padding: 20px; } h2 { break-after: avoid; } table { break-inside: auto; } tr { break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Local Recruitment Compliance Report</h1>
    <p class="subtitle">Evidence of Caymanian Solicitation Efforts</p>
    <dl class="header-grid">
      <dt>Employer</dt><dd>${employerName}</dd>
      <dt>WORC Job ID</dt><dd>${job.job_id}</dd>
      <dt>Position</dt><dd>${job.title}</dd>
      <dt>Occupation Code</dt><dd>${job.occupation_code || "--"}</dd>
      <dt>Posting Period</dt><dd>${formatDate(job.created_date)} — ${formatDate(job.end_date)}</dd>
      <dt>Report Generated</dt><dd>${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</dd>
    </dl>
  </div>
  <h2>Recruitment Summary</h2>
  <div class="stats">
    <div class="stat"><div class="value">${summary.totalContacted}</div><div class="label">Total Contacted</div></div>
    <div class="stat"><div class="value">${summary.responseRate}%</div><div class="label">Response Rate</div></div>
    <div class="stat"><div class="value">${summary.caymanianCount}</div><div class="label">Caymanians Contacted</div></div>
    <div class="stat"><div class="value">${summary.stageBreakdown?.hired || 0}</div><div class="label">Hired</div></div>
  </div>
  ${pipelineRows ? `<div class="pills">${pipelineRows}</div>` : ""}
  ${rejectionRows ? `<h2>Rejection Reasons</h2><div class="pills">${rejectionRows}</div>` : ""}
  <h2>Candidates Contacted</h2>
  ${intros.length === 0 ? "<p>No candidates were contacted for this position.</p>" : `
  <table><thead><tr><th>Candidate</th><th>Caymanian</th><th>Education</th><th>Experience</th><th>Location</th><th>Match</th><th>Status</th><th>Stage</th><th>Initiated By</th><th>Rejection Reason</th><th>Contacted</th><th>Responded</th></tr></thead><tbody>${candidateRows}</tbody></table>`}
  ${activity.length > 0 ? `<h2>Activity Timeline</h2><table><thead><tr><th>Date & Time</th><th>Action</th><th>Details</th></tr></thead><tbody>${activityRows}</tbody></table>` : ""}
  <div class="footer">
    This report was generated by careers.ky on ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} at ${new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}.<br>
    Data reflects recruitment activity recorded through the careers.ky employer platform.
  </div>
</body></html>`;
}

export default function ComplianceReportClient({ report, employerName, jobId }) {
  const { job, intros, activity, summary } = report;

  const handlePrint = () => {
    const html = buildPrintDocument(report, employerName);
    const printWindow = window.open("", "_blank");
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };

  return (
    <div>
      {/* Actions */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/employer/reports" className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Reports
        </Link>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="gap-1.5" onClick={handlePrint}>
            <Printer className="w-3.5 h-3.5" /> Print Report
          </Button>
          <a href={`/api/employer/reports/${jobId}/export`}>
            <Button variant="secondary" size="sm" className="gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
          </a>
        </div>
      </div>

      {/* Report Header */}
      <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-500/15 grid place-items-center">
              <FileText className="w-6 h-6 text-primary-500" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold mb-1">Compliance Report</h1>
              <div className="text-sm text-neutral-500 space-y-0.5">
                <div><strong>Employer:</strong> {employerName}</div>
                <div><strong>Job Title:</strong> {job.title}</div>
                <div><strong>WORC Job ID:</strong> {job.job_id}</div>
                <div><strong>Posted:</strong> {formatDate(job.created_date)} &mdash; {formatDate(job.end_date)}</div>
                <div><strong>Report Generated:</strong> {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700"><CardContent className="p-4 text-center"><Users className="w-5 h-5 mx-auto mb-1 text-primary-500" /><div className="text-2xl font-semibold">{summary.totalContacted}</div><div className="text-xs text-neutral-500">Total Contacted</div></CardContent></Card>
        <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700"><CardContent className="p-4 text-center"><CheckCircle className="w-5 h-5 mx-auto mb-1 text-emerald-300" /><div className="text-2xl font-semibold">{summary.responseRate}%</div><div className="text-xs text-neutral-500">Response Rate</div></CardContent></Card>
        <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700"><CardContent className="p-4 text-center"><Shield className="w-5 h-5 mx-auto mb-1 text-primary-500" /><div className="text-2xl font-semibold">{summary.caymanianCount}</div><div className="text-xs text-neutral-500">Caymanians Contacted</div></CardContent></Card>
        <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700"><CardContent className="p-4 text-center"><Briefcase className="w-5 h-5 mx-auto mb-1 text-purple-300" /><div className="text-2xl font-semibold">{summary.stageBreakdown?.hired || 0}</div><div className="text-xs text-neutral-500">Hired</div></CardContent></Card>
      </div>

      {/* Pipeline Breakdown */}
      {Object.keys(summary.stageBreakdown || {}).length > 0 && (
        <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 mb-6">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-3">Pipeline Breakdown</h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(summary.stageBreakdown).map(([stage, count]) => (
                <div key={stage} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 text-sm">
                  <span className="text-neutral-500">{STAGE_LABELS[stage] || stage}:</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejection Reason Breakdown */}
      {Object.keys(summary.rejectionBreakdown || {}).length > 0 && (
        <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 mb-6">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-3">Rejection Reasons</h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(summary.rejectionBreakdown).map(([reason, count]) => (
                <div key={reason} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-300/20 text-sm">
                  <span className="text-red-300">{REJECTION_REASON_LABELS[reason] || reason}:</span>
                  <span className="font-semibold text-red-200">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Candidate Table */}
      <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 mb-6">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Candidates Contacted</h2>
          {intros.length === 0 ? (
            <p className="text-neutral-500 text-sm">No candidates have been contacted for this position yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left">
                    <th className="pb-2 pr-3 text-neutral-500 font-medium">#</th>
                    <th className="pb-2 pr-3 text-neutral-500 font-medium">Caymanian</th>
                    <th className="pb-2 pr-3 text-neutral-500 font-medium">Education</th>
                    <th className="pb-2 pr-3 text-neutral-500 font-medium">Experience</th>
                    <th className="pb-2 pr-3 text-neutral-500 font-medium">Location</th>
                    <th className="pb-2 pr-3 text-neutral-500 font-medium">Match</th>
                    <th className="pb-2 pr-3 text-neutral-500 font-medium">Status</th>
                    <th className="pb-2 pr-3 text-neutral-500 font-medium">Stage</th>
                    <th className="pb-2 pr-3 text-neutral-500 font-medium">Initiated By</th>
                    <th className="pb-2 pr-3 text-neutral-500 font-medium">Rejection Reason</th>
                    <th className="pb-2 pr-3 text-neutral-500 font-medium">Contacted</th>
                    <th className="pb-2 text-neutral-500 font-medium">Responded</th>
                  </tr>
                </thead>
                <tbody>
                  {intros.map((intro, i) => (
                    <tr key={intro.id} className="border-b border-neutral-200 dark:border-neutral-700">
                      <td className="py-2.5 pr-3 font-medium">Candidate #{i + 1}</td>
                      <td className="py-2.5 pr-3">
                        {intro.is_caymanian ? (
                          <Badge className="bg-primary-50 dark:bg-primary-500/15 text-primary-500 border-primary-200 dark:border-primary-500/30">Yes</Badge>
                        ) : (
                          <span className="text-neutral-500">No</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-neutral-600 dark:text-neutral-500">{intro.education_code || "--"}</td>
                      <td className="py-2.5 pr-3 text-neutral-600 dark:text-neutral-500">{intro.experience_code || "--"}</td>
                      <td className="py-2.5 pr-3 text-neutral-600 dark:text-neutral-500">{intro.location_code || "--"}</td>
                      <td className="py-2.5 pr-3">{intro.match_score != null ? `${Math.round(Number(intro.match_score))}%` : "--"}</td>
                      <td className="py-2.5 pr-3">
                        <Badge className={
                          intro.status === "accepted" ? "bg-emerald-500/20 text-emerald-300 border-emerald-300/30" :
                          intro.status === "declined" ? "bg-red-500/20 text-red-300 border-red-300/30" :
                          "bg-yellow-500/20 text-yellow-300 border-yellow-300/30"
                        }>{intro.status || "pending"}</Badge>
                      </td>
                      <td className="py-2.5 pr-3 text-neutral-600 dark:text-neutral-500">{STAGE_LABELS[intro.stage] || intro.stage || "Outreach"}</td>
                      <td className="py-2.5 pr-3 text-neutral-300 capitalize">{intro.initiated_by || "employer"}</td>
                      <td className="py-2.5 pr-3 text-neutral-600 dark:text-neutral-500">{intro.rejection_reason ? (REJECTION_REASON_LABELS[intro.rejection_reason] || intro.rejection_reason) : "--"}</td>
                      <td className="py-2.5 pr-3 text-neutral-500">{formatDate(intro.created_at)}</td>
                      <td className="py-2.5 text-neutral-500">{formatDate(intro.responded_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      {activity.length > 0 && (
        <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 mb-6">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" /> Activity Timeline
            </h2>
            <div className="space-y-3">
              {activity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="text-neutral-700 dark:text-neutral-300">{ACTIVITY_LABELS[a.action] || a.action}</div>
                    {a.details && a.details.from && a.details.to && (
                      <div className="text-xs text-neutral-500">{STAGE_LABELS[a.details.from] || a.details.from} &rarr; {STAGE_LABELS[a.details.to] || a.details.to}</div>
                    )}
                    <div className="text-xs text-neutral-500">{formatDateTime(a.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
