"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ExternalLink,
  Building2,
  MapPin,
  Clock,
  BookOpen,
  Briefcase,
  DollarSign,
  Calendar,
  Users,
  FileText,
  Shield,
  Car,
  Heart,
  Mail,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

function formatDate(d) {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function daysUntil(d) {
  if (!d) return null;
  const diff = Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
}

// Clean up inconsistent job descriptions into readable paragraphs/lists
function FormatDescription({ text }) {
  if (!text) return null;

  // Normalize line endings and trim
  let cleaned = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();

  // Split into lines
  const lines = cleaned.split("\n").map((l) => l.trim()).filter(Boolean);

  const elements = [];
  let currentParagraph = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      elements.push({ type: "paragraph", text: currentParagraph.join(" ") });
      currentParagraph = [];
    }
  };

  for (const line of lines) {
    // Detect list items: starts with *, -, ·, •, or numbered (1., 2.)
    const listMatch = line.match(/^[\*\-·•]\s*(.+)/) || line.match(/^\d+[\.\)]\s*(.+)/);
    if (listMatch) {
      flushParagraph();
      elements.push({ type: "listItem", text: listMatch[1] });
      continue;
    }

    // Detect section headers: ALL CAPS lines or lines ending with ':'
    const isHeader =
      (line.length < 80 && line === line.toUpperCase() && /[A-Z]/.test(line) && !/[a-z]/.test(line)) ||
      (line.length < 80 && line.endsWith(":"));

    if (isHeader) {
      flushParagraph();
      elements.push({ type: "heading", text: line.replace(/:$/, "") });
      continue;
    }

    // Otherwise it's paragraph text
    currentParagraph.push(line);
  }
  flushParagraph();

  // Group consecutive list items
  const grouped = [];
  for (const el of elements) {
    if (el.type === "listItem") {
      const last = grouped[grouped.length - 1];
      if (last && last.type === "list") {
        last.items.push(el.text);
      } else {
        grouped.push({ type: "list", items: [el.text] });
      }
    } else {
      grouped.push(el);
    }
  }

  return (
    <div className="space-y-4">
      {grouped.map((el, i) => {
        if (el.type === "heading") {
          return (
            <h3 key={i} className="text-lg font-semibold text-white mt-6 first:mt-0">
              {el.text}
            </h3>
          );
        }
        if (el.type === "paragraph") {
          return (
            <p key={i} className="text-neutral-300 leading-relaxed">
              {el.text}
            </p>
          );
        }
        if (el.type === "list") {
          return (
            <ul key={i} className="space-y-2 ml-1">
              {el.items.map((item, j) => (
                <li key={j} className="flex gap-2 text-neutral-300">
                  <span className="text-cyan-400 mt-1.5 shrink-0">
                    <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor"><circle cx="3" cy="3" r="3" /></svg>
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        return null;
      })}
    </div>
  );
}

export default function JobPostingClient({ job, worcUrl, workTypes: wtObj, eduTypes: etObj, expTypes: exObj, locTypes: ltObj, referrer }) {
  const workTypes = useMemo(() => new Map(Object.entries(wtObj)), [wtObj]);
  const eduTypes = useMemo(() => new Map(Object.entries(etObj)), [etObj]);
  const expTypes = useMemo(() => new Map(Object.entries(exObj)), [exObj]);
  const locTypes = useMemo(() => new Map(Object.entries(ltObj)), [ltObj]);

  const [session, setSession] = useState(null);
  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(d => setSession(d.authenticated ? d : null)).catch(() => {});
  }, []);

  const daysLeft = daysUntil(job.endDate);
  const isExpiring = daysLeft !== null && daysLeft <= 5 && daysLeft > 0;

  const requirements = [
    job.medicalCheck && { icon: Heart, label: "Medical Check Required", color: "text-red-300" },
    job.policeCheck && { icon: Shield, label: "Police Check Required", color: "text-yellow-300" },
    job.drivingLicense && { icon: Car, label: "Driving License Required", color: "text-blue-300" },
    job.coverLetterRequired && { icon: Mail, label: "Cover Letter Required", color: "text-purple-300" },
  ].filter(Boolean);

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100">
      <div id="bg-gradient" aria-hidden className="fixed inset-0 -z-10 bg-[length:200%_200%]" style={{ backgroundImage: "radial-gradient(1200px 1200px at 10% 10%, rgba(56,189,248,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 90% 20%, rgba(34,197,94,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 50% 110%, rgba(147,51,234,0.12) 0%, transparent 60%)", backgroundPosition: "0% 50%" }} />

      <Navigation />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <div className="mb-6">
          <Button variant="secondary" className="gap-2" onClick={() => window.history.length > 1 ? window.history.back() : window.location.href = "/jobs"}>
            <ChevronLeft className="w-4 h-4" /> Back to Jobs
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {job.isActive ? (
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-300/30">Active</Badge>
            ) : (
              <Badge className="bg-neutral-500/20 text-neutral-300 border-neutral-300/30">Closed</Badge>
            )}
            {isExpiring && (
              <Badge className="bg-red-500/20 text-red-300 border-red-300/30">Closes in {daysLeft} day{daysLeft !== 1 ? "s" : ""}</Badge>
            )}
            <Badge className="bg-white/5 border-white/10 text-neutral-400">WORC ID: {job.cJobId}</Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mb-3">{job.cTitle}</h1>

          <Link
            href={`/employer/${encodeURIComponent(job.Employer?.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-"))}`}
            className="inline-flex items-center gap-2 text-lg text-neutral-300 hover:text-cyan-300 transition mb-4"
          >
            <Building2 className="w-5 h-5" /> {job.Employer}
          </Link>

          {/* Apply CTA */}
          {job.isActive && (
            <div className="mt-4 flex flex-wrap gap-3">
              <a href={worcUrl} target="_blank" rel="noreferrer">
                <Button size="lg" className="gap-2">
                  <ExternalLink className="w-4 h-4" /> Apply on WORC
                </Button>
              </a>
              {session?.employerAccountId && (
                <Link href={`/talent?jobId=${job.cJobId}`}>
                  <Button size="lg" variant="secondary" className="gap-2">
                    <Users className="w-4 h-4" /> Find Matching Candidates
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Key Details Grid */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-neutral-400">Salary</div>
                      <div className="text-sm font-medium">{job.salaryLong || job.salaryShort || "Not specified"}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-pink-300 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-neutral-400">Location</div>
                      <div className="text-sm font-medium">{locTypes.get(job.sLocation) || "Cayman Islands"}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-cyan-300 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-neutral-400">Work Type</div>
                      <div className="text-sm font-medium">{workTypes.get(job.sWork) || "Full-time"}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-orange-300 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-neutral-400">Hours/Week</div>
                      <div className="text-sm font-medium">{job.hoursPerWeek || "N/A"}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-purple-300 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-neutral-400">Education</div>
                      <div className="text-sm font-medium">{eduTypes.get(job.sEducation) || "Not specified"}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-neutral-400">Experience</div>
                      <div className="text-sm font-medium">{expTypes.get(job.sExperience) || "Not specified"}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Description */}
            {job.jobDescription && (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 sm:p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" /> Job Description
                  </h2>
                  <FormatDescription text={job.jobDescription} />
                </CardContent>
              </Card>
            )}

            {/* Requirements Checklist */}
            {requirements.length > 0 && (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 sm:p-6">
                  <h2 className="text-xl font-semibold mb-4">Application Requirements</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {requirements.map((req, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                        <req.icon className={`w-5 h-5 ${req.color} shrink-0`} />
                        <span className="text-sm">{req.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Card */}
            <Card className="bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 border-cyan-300/20">
              <CardContent className="p-4 sm:p-6 space-y-4">
                <h3 className="text-lg font-semibold">Apply for this role</h3>
                {job.isActive ? (
                  <>
                    <a href={worcUrl} target="_blank" rel="noreferrer" className="block">
                      <Button className="w-full gap-2">
                        <ExternalLink className="w-4 h-4" /> Apply on WORC
                      </Button>
                    </a>
                    {daysLeft !== null && daysLeft > 0 && (
                      <p className="text-xs text-neutral-400 text-center">
                        {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining to apply
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-neutral-400">This posting is no longer accepting applications.</p>
                )}
              </CardContent>
            </Card>

            {/* Key Info Card */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 sm:p-6 space-y-4">
                <h3 className="text-lg font-semibold">Details</h3>
                <div className="space-y-3 text-sm">
                  {job.numberOfPositions > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400 flex items-center gap-2"><Users className="w-4 h-4" /> Positions</span>
                      <span className="font-medium">{job.numberOfPositions}</span>
                    </div>
                  )}
                  {job.applicantCount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400 flex items-center gap-2"><Users className="w-4 h-4" /> Applicants</span>
                      <span className="font-medium">{job.applicantCount}</span>
                    </div>
                  )}
                  {job.kydPerAnnum > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Annual (KYD)</span>
                      <span className="font-medium">CI$ {Math.round(job.kydPerAnnum).toLocaleString()}</span>
                    </div>
                  )}
                  {job.Occupation && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400 flex items-center gap-2"><Briefcase className="w-4 h-4" /> Industry</span>
                      <span className="font-medium text-right">{job.Occupation}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Timeline Card */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 sm:p-6 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2"><Calendar className="w-5 h-5" /> Timeline</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Posted</span>
                    <span>{formatDate(job.createdDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Start Date</span>
                    <span>{formatDate(job.startDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Closing Date</span>
                    <span className={isExpiring ? "text-red-300 font-medium" : ""}>{formatDate(job.endDate)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employer Link */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-lg font-semibold mb-3">Employer</h3>
                <Link
                  href={`/employer/${encodeURIComponent(job.Employer?.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-"))}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-300/40 transition"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/10 grid place-items-center shrink-0">
                    <Building2 className="w-5 h-5 text-neutral-400" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{job.Employer}</div>
                    <div className="text-xs text-neutral-400">View employer profile</div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
