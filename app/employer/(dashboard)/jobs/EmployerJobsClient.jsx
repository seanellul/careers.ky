"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Plus, Clock, Users, XCircle, ExternalLink } from "lucide-react";

export default function EmployerJobsClient({ postings }) {
  const router = useRouter();
  const [closing, setClosing] = useState(null);

  const closePosting = async (jobId) => {
    setClosing(jobId);
    try {
      const res = await fetch(`/api/employer/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close" }),
      });
      if (res.ok) router.refresh();
    } finally {
      setClosing(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Briefcase className="w-6 h-6 text-primary-500" />
          <h1 className="text-2xl font-semibold">Your Job Postings</h1>
        </div>
        <Link href="/employer/jobs/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Post a role
          </Button>
        </Link>
      </div>

      {postings.length === 0 ? (
        <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
          <CardContent className="p-10 text-center">
            <Briefcase className="w-10 h-10 mx-auto mb-3 text-neutral-300" />
            <p className="font-medium mb-1">No postings yet</p>
            <p className="text-sm text-neutral-500 mb-4">
              Roles you post here get enforced quality fields, a 24-hour Caymanian early-access
              window, and a full applicant pipeline.
            </p>
            <Link href="/employer/jobs/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Post your first role
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {postings.map((p) => {
            const earlyAccess = p.public_at && new Date(p.public_at) > new Date();
            const active = p.status === "Active" && new Date(p.end_date) > new Date();
            return (
              <Card
                key={p.job_id}
                className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Link
                          href={`/jobs/${p.job_id}`}
                          className="font-medium hover:text-primary-500 transition truncate"
                        >
                          {p.title}
                        </Link>
                        <Badge
                          className={
                            active
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : "bg-neutral-100 text-neutral-500 border-neutral-200"
                          }
                        >
                          {active ? "Active" : "Closed"}
                        </Badge>
                        {earlyAccess && (
                          <Badge className="bg-amber-50 text-amber-600 border-amber-200">
                            <Clock className="w-3 h-3 mr-1" /> Caymanian early access
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-neutral-500 flex flex-wrap gap-x-3 gap-y-1">
                        <span>{p.district}</span>
                        <span>
                          KYD {Number(p.min_salary).toLocaleString()}–
                          {Number(p.max_salary).toLocaleString()}
                        </span>
                        <span>
                          Closes{" "}
                          {new Date(p.end_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {p.interest_count} interested
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/jobs/${p.job_id}`}>
                        <Button size="sm" variant="secondary" className="gap-1">
                          <ExternalLink className="w-3 h-3" /> View
                        </Button>
                      </Link>
                      {active && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="gap-1 text-red-500"
                          disabled={closing === p.job_id}
                          onClick={() => closePosting(p.job_id)}
                        >
                          <XCircle className="w-3 h-3" /> Close
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
