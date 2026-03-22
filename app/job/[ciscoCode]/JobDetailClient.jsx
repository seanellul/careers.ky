"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DollarSign,
  Users,
  BookOpen,
  Briefcase,
  TrendingUp,
  MapPin,
  Clock,
  ChevronLeft,
  ExternalLink,
  FileText,
  CheckCircle,
  Building2,
  AlertCircle,
  X,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  Eye,
  Copy,
  Check,
} from "lucide-react";
import { generateWORCSearchURL } from "@/lib/data";
import t from "@/lib/theme";

export default function JobDetailClient({
  unit,
  ciscoCode,
  stats,
  workTypes: wtObj,
  eduTypes: etObj,
  expTypes: exObj,
  employerData,
  relatedJobs,
  postings,
  skills = [],
}) {
  const router = useRouter();
  const [showCareerPlan, setShowCareerPlan] = useState(false);
  const [copied, setCopied] = useState(false);

  const workTypes = useMemo(() => new Map(Object.entries(wtObj)), [wtObj]);
  const eduTypes = useMemo(() => new Map(Object.entries(etObj)), [etObj]);
  const expTypes = useMemo(() => new Map(Object.entries(exObj)), [exObj]);

  // Job postings filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("createdDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredPostings = useMemo(() => {
    let filtered = postings.filter((p) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!p.cTitle?.toLowerCase().includes(q) && !p.Employer?.toLowerCase().includes(q)) return false;
      }
      if (statusFilter === "active") return p.isActive;
      if (statusFilter === "closed") return !p.isActive;
      return true;
    });

    filtered.sort((a, b) => {
      let vA, vB;
      switch (sortBy) {
        case "salary": vA = a.fMeanSalary || 0; vB = b.fMeanSalary || 0; break;
        case "employer": vA = a.Employer || ""; vB = b.Employer || ""; break;
        default: vA = new Date(a.createdDate).getTime(); vB = new Date(b.createdDate).getTime();
      }
      if (typeof vA === "string") return sortOrder === "desc" ? vB.localeCompare(vA) : vA.localeCompare(vB);
      return sortOrder === "desc" ? vB - vA : vA - vB;
    });
    return filtered;
  }, [postings, searchQuery, sortBy, sortOrder, statusFilter]);

  const formatDate = (d) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  const formatSalary = (p) => {
    if (p["Salary Description"]) return p["Salary Description"];
    if (p.fMinSalary && p.fMaxSalary) return `${p.Currency || "CI$"} ${p.fMinSalary.toLocaleString()} - ${p.fMaxSalary.toLocaleString()}`;
    if (p.fMeanSalary) return `${p.Currency || "CI$"} ${p.fMeanSalary.toLocaleString()}`;
    return "Salary not specified";
  };

  const Bar = ({ label, value, total, color = "bg-cyan-400" }) => (
    <div className="flex items-center gap-2">
      <div className="w-20 sm:w-32 text-xs text-neutral-600 truncate" title={label}>{label}</div>
      <div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${Math.round((value / Math.max(1, total)) * 100)}%` }} />
      </div>
      <div className="w-12 sm:w-16 text-xs text-neutral-500 text-right">{Math.round((value / Math.max(1, total)) * 100)}%</div>
    </div>
  );

  return (
    <div className={`${t.page} w-full`}>
      <div id="bg-gradient" aria-hidden className="fixed inset-0 -z-10 bg-[length:200%_200%]" style={t.pageGradientStyle} />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <div className="mb-6">
          <Link href="/career-tracks">
            <Button variant="secondary" className="gap-2"><ChevronLeft className="w-4 h-4" /> Back to Career Tracks</Button>
          </Link>
        </div>

        {/* Hero */}
        <div className="mb-8">
          <Badge className="mb-3 bg-primary-50 text-primary-500 border-primary-200">CISCO Unit {unit.id}</Badge>
          <h1 className="text-4xl font-semibold tracking-tight">{unit.title} <span className="text-primary-500">Jobs in Cayman</span></h1>
          <div className="flex flex-wrap gap-2 mt-3">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${unit.title} jobs in Cayman — ${typeof window !== "undefined" ? window.location.href : ""}`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] text-xs font-medium hover:bg-[#25D366]/20 transition min-h-[36px]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
              Share on WhatsApp
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-500 text-xs font-medium hover:border-neutral-300 hover:text-neutral-900 transition min-h-[36px]"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>

          {stats && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 mt-6">
              <Card className="bg-neutral-50 border-neutral-200"><CardContent className="p-4 text-center"><Briefcase className="w-5 h-5 text-primary-500 mx-auto mb-2" /><div className="text-2xl font-semibold">{stats.count}</div><div className="text-sm text-neutral-500">Job Posts</div></CardContent></Card>
              <Card className="bg-neutral-50 border-neutral-200"><CardContent className="p-4 text-center"><DollarSign className="w-5 h-5 text-emerald-600 mx-auto mb-2" /><div className="text-2xl font-semibold">CI$ {Math.round(stats.mean).toLocaleString()}</div><div className="text-sm text-neutral-500">Average Salary</div></CardContent></Card>
              <Card className="bg-neutral-50 border-neutral-200"><CardContent className="p-4 text-center"><TrendingUp className="w-5 h-5 text-purple-600 mx-auto mb-2" /><div className="text-2xl font-semibold">CI$ {Math.round(stats.max).toLocaleString()}</div><div className="text-sm text-neutral-500">Max Salary</div></CardContent></Card>
              <Card className="bg-neutral-50 border-neutral-200"><CardContent className="p-4 text-center"><MapPin className="w-5 h-5 text-orange-600 mx-auto mb-2" /><div className="text-2xl font-semibold">Cayman</div><div className="text-sm text-neutral-500">Location</div></CardContent></Card>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <Card className="bg-neutral-50 border-neutral-200"><CardContent className="p-6"><h2 className="text-2xl font-semibold mb-4">Job Description</h2><p className="text-neutral-600 leading-relaxed">{unit.description}</p></CardContent></Card>

            {/* Tasks */}
            {unit.tasks && (
              <Card className="bg-neutral-50 border-neutral-200"><CardContent className="p-6"><h2 className="text-2xl font-semibold mb-4">Key Tasks & Responsibilities</h2><div className="text-neutral-600 whitespace-pre-line leading-relaxed">{unit.tasks}</div></CardContent></Card>
            )}

            {/* Market Analysis */}
            {stats?.dist && (
              <Card className="bg-neutral-50 border-neutral-200">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-semibold mb-4">Market Analysis</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-3 flex items-center gap-2"><Briefcase className="w-5 h-5" /> Work Type Distribution</h3>
                      <div className="space-y-2">{Object.entries(stats.dist.work).map(([k, v]) => <Bar key={k} label={workTypes.get(k) || k} value={v} total={stats.count} color="bg-emerald-400" />)}</div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-3 flex items-center gap-2"><BookOpen className="w-5 h-5" /> Education Requirements</h3>
                      <div className="space-y-2">{Object.entries(stats.dist.edu).map(([k, v]) => <Bar key={k} label={eduTypes.get(k) || k} value={v} total={stats.count} color="bg-purple-400" />)}</div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-3 flex items-center gap-2"><Clock className="w-5 h-5" /> Experience Levels</h3>
                      <div className="space-y-2">{Object.entries(stats.dist.exp).map(([k, v]) => <Bar key={k} label={expTypes.get(k) || k} value={v} total={stats.count} color="bg-orange-400" />)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {stats && (
              <Card className="bg-neutral-50 border-neutral-200"><CardContent className="p-6"><h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5" /> Salary Range</h3><div className="space-y-3"><div className="flex justify-between"><span className="text-neutral-500">Minimum</span><span className="font-medium">CI$ {Math.round(stats.min).toLocaleString()}</span></div><div className="flex justify-between"><span className="text-neutral-500">Average</span><span className="font-medium">CI$ {Math.round(stats.mean).toLocaleString()}</span></div><div className="flex justify-between"><span className="text-neutral-500">Maximum</span><span className="font-medium">CI$ {Math.round(stats.max).toLocaleString()}</span></div></div></CardContent></Card>
            )}

            {skills.length > 0 && (
              <Card className="bg-neutral-50 border-neutral-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5" /> Top Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((s) => (
                      <Badge key={s.id} className="bg-purple-50 text-purple-600 border-purple-200">
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {relatedJobs.length > 0 && (
              <Card className="bg-neutral-50 border-neutral-200"><CardContent className="p-6"><h3 className="text-lg font-semibold mb-4">Related Positions</h3><div className="space-y-3">{relatedJobs.map((job, i) => (<div key={i} className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg"><div className="font-medium text-sm">{job.cTitle}</div><div className="text-xs text-neutral-500">Occupation #{job.sOccupation}</div></div>))}</div></CardContent></Card>
            )}

            <Card className="bg-neutral-50 border-neutral-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Take Action</h3>
                <div className="space-y-3">
                  <Button className="w-full gap-2" onClick={() => setShowCareerPlan(true)}><FileText className="w-4 h-4" /> Build Career Plan</Button>
                  <Link href={`/jobs?q=${encodeURIComponent(unit.title)}`} className="block">
                    <Button variant="secondary" className="w-full gap-2"><ExternalLink className="w-4 h-4" /> Search Live Jobs</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Job Postings History */}
        <div className="mt-12 pt-8 border-t border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Job Postings for {unit.title}</h2>
              <p className="text-neutral-500">{filteredPostings.length} of {postings.length} total postings</p>
            </div>
            <Button variant="secondary" onClick={() => setShowFilters(!showFilters)} className="gap-2">
              <Filter className="w-4 h-4" /> {showFilters ? "Hide" : "Show"} Filters
            </Button>
          </div>

          <div className="space-y-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by title or employer..." className="pl-10 bg-neutral-50 border-neutral-200" />
            </div>
            {showFilters && (
              <Card className="bg-neutral-50 border-neutral-200">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Status</label>
                      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm">
                        <option value="all">All Postings</option>
                        <option value="active">Active Only</option>
                        <option value="closed">Closed Only</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Sort By</label>
                      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm">
                        <option value="createdDate">Created Date</option>
                        <option value="salary">Salary</option>
                        <option value="employer">Employer</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button variant="secondary" onClick={() => setSortOrder((p) => (p === "desc" ? "asc" : "desc"))} className="gap-2 w-full">
                        <ArrowUpDown className="w-4 h-4" /> {sortOrder === "desc" ? "High to Low" : "Low to High"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="grid gap-4">
            {filteredPostings.map((p, i) => (
              <Card key={p.cJobId || i} className="bg-neutral-50 border-neutral-200 hover:border-primary-300 transition group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold group-hover:text-primary-500 transition">{p.cTitle}</h3>
                        {p.isActive ? <Badge className="bg-green-50 text-green-600 border-green-200">Active</Badge> : <Badge className="bg-neutral-100 text-neutral-600 border-neutral-200">Closed</Badge>}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-neutral-500 mb-3">
                        <Link href={`/employer/${encodeURIComponent(p.Employer?.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-"))}`} className="flex items-center gap-1 hover:text-primary-500 transition"><Building2 className="w-4 h-4" /> {p.Employer}</Link>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold mb-1">{formatSalary(p)}</div>
                      <div className="text-sm text-neutral-500">{workTypes.get(p.sWork) || p.sWork}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div><div className="text-xs text-neutral-500 mb-1">Created</div><div className="text-sm font-medium">{formatDate(p.createdDate)}</div></div>
                    <div><div className="text-xs text-neutral-500 mb-1">Start Date</div><div className="text-sm font-medium">{formatDate(p.startDate)}</div></div>
                    <div><div className="text-xs text-neutral-500 mb-1">End Date</div><div className="text-sm font-medium">{formatDate(p.endDate)}</div></div>
                    <div><div className="text-xs text-neutral-500 mb-1">Requirements</div><div className="flex gap-1"><Badge className="bg-neutral-50 border-neutral-200 text-xs">{eduTypes.get(p.sEducation) || p.sEducation}</Badge></div></div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                    <div className="text-sm text-neutral-500"><Calendar className="w-4 h-4 inline mr-1" /> Job ID: {p.cJobId}</div>
                    {p.isActive && (
                      <a href={generateWORCSearchURL(p)} target="_blank" rel="noreferrer">
                        <Button size="sm" className="gap-2"><ExternalLink className="w-4 h-4" /> Apply on WORC</Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPostings.length === 0 && (
            <Card className="bg-neutral-50 border-neutral-200"><CardContent className="p-12 text-center"><Search className="w-12 h-12 mx-auto mb-4 opacity-50" /><h3 className="text-lg font-medium mb-2">No job postings found</h3><p className="text-neutral-500">Try adjusting your search criteria.</p></CardContent></Card>
          )}
        </div>

        {/* SEO Content */}
        <div className="mt-12 pt-8 border-t border-neutral-200">
          <h2 className="text-2xl font-semibold mb-4">About {unit.title} Careers in Cayman</h2>
          <p className="text-neutral-600 leading-relaxed mb-4">
            {unit.title} positions in the Cayman Islands offer unique opportunities in a thriving offshore financial center.
            With a growing economy and international business environment, Cayman provides excellent career prospects for professionals in this field.
          </p>
          <p className="text-neutral-600 leading-relaxed mb-4">
            The Cayman Islands job market for {unit.title} roles is characterized by competitive salaries, tax-free income,
            and opportunities to work with leading international companies.
          </p>
          <h3 className="text-xl font-semibold mb-3">Why Choose Cayman for {unit.title} Careers?</h3>
          <ul className="list-disc list-inside text-neutral-600 space-y-2">
            <li>Tax-free salary structure</li>
            <li>International business environment</li>
            <li>Growing job market with {stats?.count || "many"} current opportunities</li>
            <li>High standard of living</li>
            <li>Beautiful tropical location</li>
          </ul>
        </div>
      </div>

      {/* Career Plan Modal */}
      {showCareerPlan && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-4 px-2 sm:py-8 sm:px-4">
          <div className="relative w-full max-w-4xl bg-white border border-neutral-200 rounded-2xl shadow-2xl">
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-neutral-200 p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-semibold mb-2 flex items-center gap-3"><FileText className="w-8 h-8 text-primary-500" /> Career Plan: {unit.title}</h2>
                  <p className="text-neutral-500">Your roadmap to entering this career track in Cayman</p>
                </div>
                <button onClick={() => setShowCareerPlan(false)} className="p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition"><X className="w-6 h-6" /></button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-neutral-50 border-neutral-200"><CardContent className="p-4 text-center"><div className="text-2xl font-semibold text-primary-500">{employerData.length}</div><div className="text-sm text-neutral-500">Employers</div></CardContent></Card>
                <Card className="bg-neutral-50 border-neutral-200"><CardContent className="p-4 text-center"><div className="text-2xl font-semibold text-emerald-600">{employerData.filter((e) => e.isActiveHiring).length}</div><div className="text-sm text-neutral-500">Active Hirers</div></CardContent></Card>
                <Card className="bg-neutral-50 border-neutral-200"><CardContent className="p-4 text-center"><div className="text-2xl font-semibold text-purple-600">{stats ? stats.count : 0}</div><div className="text-sm text-neutral-500">Total Postings</div></CardContent></Card>
                <Card className="bg-neutral-50 border-neutral-200"><CardContent className="p-4 text-center"><div className="text-2xl font-semibold text-orange-600">CI$ {stats ? Math.round(stats.mean).toLocaleString() : 0}</div><div className="text-sm text-neutral-500">Avg Salary</div></CardContent></Card>
              </div>
              <Card className="bg-neutral-50 border-neutral-200">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><Building2 className="w-5 h-5 text-primary-500" /> Employers in Cayman Islands</h3>
                  <p className="text-neutral-500 mb-4">{employerData.length} employers have hired for this position.</p>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {employerData.map((employer, idx) => (
                      <div key={idx}
                        className={`p-4 rounded-lg border transition ${employer.isActiveHiring ? "bg-emerald-50 border-emerald-200 hover:bg-emerald-50 cursor-pointer" : "bg-neutral-50 border-neutral-200"}`}
                        onClick={employer.isActiveHiring ? () => { setShowCareerPlan(false); router.push(`/jobs?employer=${encodeURIComponent(employer.name)}`); } : undefined}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-lg truncate">{employer.name}</h4>
                              {employer.isActiveHiring && <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 shrink-0"><AlertCircle className="w-3 h-3 mr-1" /> Actively Hiring</Badge>}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
                              <span>{employer.totalPostings} posting{employer.totalPostings !== 1 ? "s" : ""}</span>
                              {employer.activePostings > 0 && <span className="text-emerald-600">{employer.activePostings} active</span>}
                            </div>
                            {employer.isActiveHiring && <div className="mt-2 text-xs text-emerald-600/80">Click to view active job postings</div>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-primary-50 to-purple-50 border-primary-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-lg mb-1">Ready to take the next step?</h4>
                      <p className="text-neutral-500 text-sm">Search for live job opportunities</p>
                    </div>
                    <Button onClick={() => { setShowCareerPlan(false); router.push(`/jobs?q=${encodeURIComponent(unit.title)}`); }} className="gap-2 shrink-0">
                      <ExternalLink className="w-4 h-4" /> Find Jobs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
