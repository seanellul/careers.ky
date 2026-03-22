"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Download, Eye, Users, CheckCircle, Briefcase, ArrowLeft,
} from "lucide-react";

export default function ReportsClient({ postings, employerName }) {
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
            <Card key={p.cJobId} className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 hover:border-primary-200 dark:hover:border-primary-500/30 transition">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-lg">{p.cTitle}</span>
                      <Badge className={p.isActive
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-300/30"
                        : "bg-neutral-500/20 text-neutral-500 border-neutral-400/30"
                      }>
                        {p.isActive ? "Active" : "Closed"}
                      </Badge>
                    </div>
                    <div className="text-sm text-neutral-500 mb-2">
                      WORC ID: {p.cJobId}
                      {p.createdDate && <> &middot; Posted {new Date(p.createdDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</>}
                      {p.endDate && <> &middot; Closes {new Date(p.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</>}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
                        <Users className="w-3.5 h-3.5 text-primary-500" /> {p.introCount} contacted
                      </span>
                      <span className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-300" /> {p.respondedCount} responded
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
