"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Eye,
  Users,
  CheckCircle,
  Briefcase,
  ArrowLeft,
  TrendingUp,
  Lock,
} from "lucide-react";
import ComplianceRollupCard from "@/components/ComplianceRollupCard";
import TrendChart from "./TrendChart";

function TrendSection({ analytics }) {
  const months = analytics.trend.months.map((m) => m.month);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
      <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 lg:col-span-2">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center gap-2 font-medium mb-4">
            <TrendingUp className="w-4 h-4 text-primary-500" /> Candidates considered — last 12
            months
          </div>
          <TrendChart
            months={months}
            series={[
              {
                label: "Caymanian",
                color: "var(--wf-s1)",
                values: analytics.trend.months.map((m) => m.considered.caymanian),
              },
              {
                label: "PR / RERC",
                color: "var(--wf-s2)",
                values: analytics.trend.months.map((m) => m.considered.prRerc),
              },
              {
                label: "Work permit",
                color: "var(--wf-s3)",
                values: analytics.trend.months.map((m) => m.considered.workPermit),
              },
              {
                label: "Undeclared",
                color: "var(--wf-mut)",
                values: analytics.trend.months.map((m) => m.considered.undeclared),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
        <CardContent className="p-5 sm:p-6">
          <div className="font-medium mb-4">Hires through platform</div>
          <TrendChart
            months={months}
            series={[
              {
                label: "Caymanian",
                color: "var(--wf-s1)",
                values: analytics.trend.months.map((m) => m.hires.caymanian),
              },
              {
                label: "Non-Caymanian",
                color: "var(--wf-s3)",
                values: analytics.trend.months.map((m) => m.hires.nonCaymanian),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
        <CardContent className="p-5 sm:p-6">
          <div className="font-medium mb-4">Express Interest on your postings</div>
          <TrendChart
            months={months}
            series={[
              {
                label: "Caymanian",
                color: "var(--wf-s1)",
                values: analytics.trend.months.map((m) => m.interests.caymanian),
              },
              {
                label: "Other status",
                color: "var(--wf-s2)",
                values: analytics.trend.months.map((m) => m.interests.total - m.interests.caymanian),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsUpsell() {
  return (
    <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 mb-8">
      <CardContent className="p-5 sm:p-6 flex items-start gap-3">
        <Lock className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
        <div>
          <div className="font-medium mb-1">Workforce analytics — available on paid plans</div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            12-month hiring and consideration trends, platform benchmark comparison, and a
            WORC-ready exportable report. Contact us to upgrade.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReportsClient({ postings, employerName, rollup, analytics }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 grid place-items-center">
          <FileText className="w-5 h-5 text-primary-500" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Compliance Reports</h1>
          <p className="text-neutral-500 text-sm">{employerName}</p>
        </div>
      </div>

      <p className="text-neutral-600 dark:text-neutral-400 mb-8 ml-[52px]">
        Track recruitment efforts per job posting for work permit compliance.
      </p>

      {rollup && (
        <ComplianceRollupCard
          rollup={rollup}
          employerName={employerName}
          benchmark={analytics?.benchmark}
          reportHref={analytics ? "/employer/reports/compliance" : undefined}
        />
      )}

      {analytics ? <TrendSection analytics={analytics} /> : <AnalyticsUpsell />}

      {postings.length === 0 ? (
        <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
          <CardContent className="p-12 text-center">
            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50 text-neutral-500" />
            <h3 className="text-lg font-medium mb-2">No job postings found</h3>
            <p className="text-neutral-500">Reports will appear here once you have job postings.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {postings.map((p) => (
            <Card
              key={p.cJobId}
              className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 hover:border-primary-200 dark:hover:border-primary-500/30 transition"
            >
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-lg">{p.cTitle}</span>
                      <Badge
                        className={
                          p.isActive
                            ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-300/30"
                            : "bg-neutral-100 dark:bg-neutral-500/20 text-neutral-600 dark:text-neutral-500 border-neutral-300 dark:border-neutral-400/30"
                        }
                      >
                        {p.isActive ? "Active" : "Closed"}
                      </Badge>
                    </div>
                    <div className="text-sm text-neutral-500 mb-2">
                      WORC ID: {p.cJobId}
                      {p.createdDate && (
                        <>
                          {" "}
                          &middot; Posted{" "}
                          {new Date(p.createdDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </>
                      )}
                      {p.endDate && (
                        <>
                          {" "}
                          &middot; Closes{" "}
                          {new Date(p.endDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
                        <Users className="w-3.5 h-3.5 text-primary-500" /> {p.introCount} contacted
                      </span>
                      <span className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-300" /> {p.respondedCount}{" "}
                        responded
                      </span>
                      <span className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
                        <Briefcase className="w-3.5 h-3.5 text-purple-300" /> {p.hiredCount} hired
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/employer/reports/${p.cJobId}`}>
                      <Button variant="secondary" size="sm" className="gap-1.5">
                        <Eye className="w-3.5 h-3.5" /> View Report
                      </Button>
                    </Link>
                    <a href={`/api/employer/reports/${p.cJobId}/export`}>
                      <Button variant="secondary" size="sm" className="gap-1.5">
                        <Download className="w-3.5 h-3.5" /> Export CSV
                      </Button>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
