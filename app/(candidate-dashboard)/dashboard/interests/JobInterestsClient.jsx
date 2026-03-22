"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, HeartHandshake, Building2, ExternalLink } from "lucide-react";

export default function JobInterestsClient({ jobInterests }) {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
          <span className="text-primary-500">Job Interests</span>
        </h1>
        <p className="text-neutral-500">
          Jobs you&apos;ve expressed interest in. Employers are notified and may reach out.
        </p>
      </div>

      {jobInterests.length === 0 ? (
        <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
          <CardContent className="p-12 text-center">
            <HeartHandshake className="w-12 h-12 mx-auto mb-4 opacity-50 text-neutral-500" />
            <h3 className="text-lg font-medium mb-2">No job interests yet</h3>
            <p className="text-neutral-500 mb-4">When you express interest in jobs, they&apos;ll appear here.</p>
            <Link href="/careers" className="text-primary-500 hover:underline">
              Browse Jobs
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobInterests.map((ji) => (
            <Card key={ji.id} className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/15 grid place-items-center shrink-0">
                    <Briefcase className="w-5 h-5 text-purple-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium">{ji.job_title || "Untitled Role"}</h3>
                        <div className="flex items-center gap-2 text-sm text-neutral-500 mt-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {ji.employer_name || "Employer"}
                        </div>
                      </div>
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-300/30 text-xs shrink-0">
                        Interest Sent
                      </Badge>
                    </div>
                    {ji.message && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 p-2 rounded-lg bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700">
                        &ldquo;{ji.message}&rdquo;
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-neutral-500">
                      <span>
                        {new Date(ji.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </span>
                      {ji.job_id && (
                        <Link href={`/jobs/${ji.job_id}`} className="text-primary-500 hover:underline flex items-center gap-1">
                          View Job <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
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
