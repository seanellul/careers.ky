"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import t from "@/lib/theme";
import {
  ChevronLeft,
  ExternalLink,
  CheckCircle,
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
  HeartHandshake,
  Share2,
  Copy,
  Check,
} from "lucide-react";

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
            <h3 key={i} className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mt-6 first:mt-0">
              {el.text}
            </h3>
          );
        }
        if (el.type === "paragraph") {
          return (
            <p key={i} className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {el.text}
            </p>
          );
        }
        if (el.type === "list") {
          return (
            <ul key={i} className="space-y-2 ml-1">
              {el.items.map((item, j) => (
                <li key={j} className="flex gap-2 text-neutral-600 dark:text-neutral-400">
                  <span className="text-primary-500 mt-1.5 shrink-0">
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
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [interestState, setInterestState] = useState("idle"); // idle | sending | sent | error
  const [interestMessage, setInterestMessage] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(d => { setSession(d.authenticated ? d : null); setSessionLoaded(true); }).catch(() => setSessionLoaded(true));
  }, []);

  const isOwner = session?.employerCompanyName && job.Employer &&
    session.employerCompanyName.trim().toLowerCase() === job.Employer.trim().toLowerCase();

  const daysLeft = daysUntil(job.endDate);
  const isExpiring = daysLeft !== null && daysLeft <= 5 && daysLeft > 0;

  const requirements = [
    job.medicalCheck && { icon: Heart, label: "Medical Check Required", color: "text-neutral-600 dark:text-neutral-400" },
    job.policeCheck && { icon: Shield, label: "Police Check Required", color: "text-neutral-600 dark:text-neutral-400" },
    job.drivingLicense && { icon: Car, label: "Driving License Required", color: "text-neutral-600 dark:text-neutral-400" },
    job.coverLetterRequired && { icon: Mail, label: "Cover Letter Required", color: "text-neutral-600 dark:text-neutral-400" },
  ].filter(Boolean);

  return (
    <div className={`${t.page} w-full`}>
      <div id="bg-gradient" aria-hidden className="fixed inset-0 -z-10 bg-[length:200%_200%]" style={t.pageGradientStyle} />

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
              <Badge className="bg-primary-50 dark:bg-primary-500/15 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-500/30">Active</Badge>
            ) : (
              <Badge className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700">Closed</Badge>
            )}
            {isExpiring && (
              <Badge className="bg-red-50 text-red-500 border-red-200">Closes in {daysLeft} day{daysLeft !== 1 ? "s" : ""}</Badge>
            )}
            <Badge className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 text-neutral-500">WORC ID: {job.cJobId}</Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mb-3">{job.cTitle}</h1>

          <Link
            href={`/employer/${encodeURIComponent(job.Employer?.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-"))}`}
            className="inline-flex items-center gap-2 text-lg text-neutral-600 dark:text-neutral-400 hover:text-primary-500 transition mb-4"
          >
            <Building2 className="w-5 h-5" /> {job.Employer}
          </Link>

          {/* CTA */}
          {job.isActive && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {sessionLoaded && (
                <>
                  {/* Express Interest — primary CTA for candidates */}
                  {session?.candidateId && !session?.employerAccountId && interestState !== "sent" && (
                    <Button
                      size="lg"
                      className="gap-2"
                      disabled={interestState === "sending"}
                      onClick={async () => {
                        setInterestState("sending");
                        try {
                          const res = await fetch("/api/introductions", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ jobId: job.cJobId, message: interestMessage || null }),
                          });
                          if (res.ok) setInterestState("sent");
                          else {
                            const data = await res.json();
                            if (res.status === 409) setInterestState("sent");
                            else { alert(data.error || "Failed"); setInterestState("idle"); }
                          }
                        } catch { setInterestState("error"); }
                      }}
                    >
                      <HeartHandshake className="w-4 h-4" /> {interestState === "sending" ? "Sending..." : "Express Interest"}
                    </Button>
                  )}
                  {interestState === "sent" && (
                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-sm py-2 px-4">
                      <CheckCircle className="w-4 h-4 mr-1" /> Interest Expressed
                    </Badge>
                  )}
                  {/* Not signed in — prompt to sign in to express interest */}
                  {!session && (
                    <Link href="/profile/setup">
                      <Button size="lg" className="gap-2">
                        <HeartHandshake className="w-4 h-4" /> Sign in to Express Interest
                      </Button>
                    </Link>
                  )}
                  {isOwner && (
                    <Link href={`/talent?jobId=${job.cJobId}`}>
                      <Button size="lg" className="gap-2">
                        <Users className="w-4 h-4" /> Find Matching Candidates
                      </Button>
                    </Link>
                  )}
                </>
              )}
              {/* WORC link — secondary */}
              <a href={worcUrl} target="_blank" rel="noreferrer">
                <Button size="lg" variant="secondary" className="gap-2 text-neutral-500">
                  <ExternalLink className="w-4 h-4" /> Apply on WORC
                </Button>
              </a>
              {/* WhatsApp share */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${job.cTitle} at ${job.Employer} — ${typeof window !== "undefined" ? window.location.href : ""}`)}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button size="lg" variant="secondary" className="gap-2 bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                  Share on WhatsApp
                </Button>
              </a>
              {/* Copy link */}
              <Button
                size="lg"
                variant="secondary"
                className="gap-2"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  });
                }}
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Key Details Grid */}
            <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-neutral-500">Salary</div>
                      <div className="text-sm font-medium">{job.salaryLong || job.salaryShort || "Not specified"}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-neutral-500">Location</div>
                      <div className="text-sm font-medium">{locTypes.get(job.sLocation) || "Cayman Islands"}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-neutral-500">Work Type</div>
                      <div className="text-sm font-medium">{workTypes.get(job.sWork) || "Full-time"}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-neutral-500">Hours/Week</div>
                      <div className="text-sm font-medium">{job.hoursPerWeek || "N/A"}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-neutral-500">Education</div>
                      <div className="text-sm font-medium">{eduTypes.get(job.sEducation) || "Not specified"}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-neutral-500">Experience</div>
                      <div className="text-sm font-medium">{expTypes.get(job.sExperience) || "Not specified"}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Description */}
            {job.jobDescription && (
              <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
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
              <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
                <CardContent className="p-4 sm:p-6">
                  <h2 className="text-xl font-semibold mb-4">Application Requirements</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {requirements.map((req, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700">
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
            {/* Interest / Apply Card */}
            <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200 dark:border-primary-500/30">
              <CardContent className="p-4 sm:p-6 space-y-4">
                <h3 className="text-lg font-semibold">Interested in this role?</h3>
                {job.isActive ? (
                  <>
                    {sessionLoaded && (
                      <>
                        {/* Express Interest — primary sidebar CTA */}
                        {session?.candidateId && !session?.employerAccountId && interestState !== "sent" && (
                          <Button
                            className="w-full gap-2"
                            disabled={interestState === "sending"}
                            onClick={async () => {
                              setInterestState("sending");
                              try {
                                const res = await fetch("/api/introductions", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ jobId: job.cJobId, message: interestMessage || null }),
                                });
                                if (res.ok) setInterestState("sent");
                                else {
                                  const data = await res.json();
                                  if (res.status === 409) setInterestState("sent");
                                  else { alert(data.error || "Failed"); setInterestState("idle"); }
                                }
                              } catch { setInterestState("error"); }
                            }}
                          >
                            <HeartHandshake className="w-4 h-4" /> {interestState === "sending" ? "Sending..." : "Express Interest"}
                          </Button>
                        )}
                        {interestState === "sent" && (
                          <div className="text-center">
                            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-sm py-2 px-4">
                              <CheckCircle className="w-4 h-4 mr-1" /> Interest Expressed
                            </Badge>
                          </div>
                        )}
                        {!session && (
                          <Link href="/profile/setup" className="block">
                            <Button className="w-full gap-2">
                              <HeartHandshake className="w-4 h-4" /> Sign in to Express Interest
                            </Button>
                          </Link>
                        )}
                        {/* Employer viewing — no Express Interest, show WORC fallback */}
                        {session?.employerAccountId && (
                          <a href={worcUrl} target="_blank" rel="noreferrer" className="block">
                            <Button variant="secondary" className="w-full gap-2 text-neutral-500">
                              <ExternalLink className="w-4 h-4" /> View on WORC
                            </Button>
                          </a>
                        )}
                        {/* WORC as subtle secondary link */}
                        {!session?.employerAccountId && (
                          <a href={worcUrl} target="_blank" rel="noreferrer" className="block text-center">
                            <span className="text-xs text-neutral-500 hover:text-neutral-600 dark:text-neutral-400 transition inline-flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" /> Or apply directly on WORC
                            </span>
                          </a>
                        )}
                      </>
                    )}
                    {daysLeft !== null && daysLeft > 0 && (
                      <p className="text-xs text-neutral-500 text-center">
                        {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-neutral-500">This posting is no longer accepting applications.</p>
                )}
              </CardContent>
            </Card>

            {/* Key Info Card */}
            <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
              <CardContent className="p-4 sm:p-6 space-y-4">
                <h3 className="text-lg font-semibold">Details</h3>
                <div className="space-y-3 text-sm">
                  {job.numberOfPositions > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 flex items-center gap-2"><Users className="w-4 h-4" /> Positions</span>
                      <span className="font-medium">{job.numberOfPositions}</span>
                    </div>
                  )}
                  {job.applicantCount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 flex items-center gap-2"><Users className="w-4 h-4" /> Applicants</span>
                      <span className="font-medium">{job.applicantCount}</span>
                    </div>
                  )}
                  {job.kydPerAnnum > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Annual (KYD)</span>
                      <span className="font-medium">CI$ {Math.round(job.kydPerAnnum).toLocaleString()}</span>
                    </div>
                  )}
                  {job.Occupation && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 flex items-center gap-2"><Briefcase className="w-4 h-4" /> Industry</span>
                      <span className="font-medium text-right">{job.Occupation}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Timeline Card */}
            <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
              <CardContent className="p-4 sm:p-6 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2"><Calendar className="w-5 h-5" /> Timeline</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Posted</span>
                    <span>{formatDate(job.createdDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Start Date</span>
                    <span>{formatDate(job.startDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Closing Date</span>
                    <span className={isExpiring ? "text-red-500 font-medium" : ""}>{formatDate(job.endDate)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employer Link */}
            <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-lg font-semibold mb-3">Employer</h3>
                <Link
                  href={`/employer/${encodeURIComponent(job.Employer?.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-"))}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 hover:border-primary-300 transition"
                >
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 grid place-items-center shrink-0">
                    <Building2 className="w-5 h-5 text-neutral-500" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{job.Employer}</div>
                    <div className="text-xs text-neutral-500">View employer profile</div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

    </div>
  );
}
