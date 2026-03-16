"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Building2, DollarSign, TrendingUp, Briefcase, MapPin,
  ChevronLeft, ExternalLink, Calendar, Users, Search, Filter,
  ArrowUpDown, BookOpen, Clock, BarChart3,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { generateWORCSearchURL } from "@/lib/data";

export default function EmployerProfileClient({ profile, workTypes: wtObj, eduTypes: etObj, expTypes: exObj, locTypes: ltObj }) {
  const { employer, postings, stats, topRoles, distributions, timeline, industries } = profile;

  const workTypes = useMemo(() => new Map(Object.entries(wtObj)), [wtObj]);
  const eduTypes = useMemo(() => new Map(Object.entries(etObj)), [etObj]);
  const expTypes = useMemo(() => new Map(Object.entries(exObj)), [exObj]);
  const locTypes = useMemo(() => new Map(Object.entries(ltObj)), [ltObj]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredPostings = useMemo(() => {
    return postings.filter(p => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!p.cTitle?.toLowerCase().includes(q)) return false;
      }
      if (statusFilter === "active") return p.isActive;
      if (statusFilter === "closed") return !p.isActive;
      return true;
    });
  }, [postings, searchQuery, statusFilter]);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A";
  const formatSalary = (p) => {
    if (p["Salary Description"]) return p["Salary Description"];
    if (p.fMinSalary && p.fMaxSalary) return `CI$ ${p.fMinSalary.toLocaleString()} - ${p.fMaxSalary.toLocaleString()}`;
    if (p.fMeanSalary) return `CI$ ${p.fMeanSalary.toLocaleString()}`;
    return "Salary not specified";
  };

  const Bar = ({ label, value, total, color = "bg-cyan-400" }) => (
    <div className="flex items-center gap-2">
      <div className="w-32 text-xs text-neutral-300 truncate" title={label}>{label}</div>
      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${Math.round((value / Math.max(1, total)) * 100)}%` }} />
      </div>
      <div className="w-16 text-xs text-neutral-400 text-right">{value} ({Math.round((value / Math.max(1, total)) * 100)}%)</div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100">
      <div id="bg-gradient" aria-hidden className="fixed inset-0 -z-10 bg-[length:200%_200%]" style={{ backgroundImage: "radial-gradient(1200px 1200px at 10% 10%, rgba(56,189,248,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 90% 20%, rgba(34,197,94,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 50% 110%, rgba(147,51,234,0.12) 0%, transparent 60%)", backgroundPosition: "0% 50%" }} />

      <Navigation />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/employers">
            <Button variant="secondary" className="gap-2"><ChevronLeft className="w-4 h-4" /> All Employers</Button>
          </Link>
        </div>

        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            {employer.logo_url ? (
              <img src={employer.logo_url} alt={employer.name} className="w-16 h-16 rounded-xl object-contain bg-white/10" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-white/10 grid place-items-center">
                <Building2 className="w-8 h-8 text-neutral-400" />
              </div>
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{employer.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                {stats.activePostings > 0 && (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-300/30">Currently Hiring</Badge>
                )}
                {employer.claimed && (
                  <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-300/30">Verified</Badge>
                )}
                {employer.website && (
                  <a href={employer.website} target="_blank" rel="noreferrer" className="text-sm text-neutral-400 hover:text-white flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Website
                  </a>
                )}
              </div>
            </div>
          </div>
          {employer.description && <p className="text-neutral-300 mt-4 max-w-3xl">{employer.description}</p>}

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <Card className="bg-white/5 border-white/10"><CardContent className="p-4 text-center"><Briefcase className="w-5 h-5 text-cyan-300 mx-auto mb-2" /><div className="text-2xl font-semibold">{stats.totalPostings}</div><div className="text-sm text-neutral-400">Total Posts</div></CardContent></Card>
            <Card className="bg-white/5 border-white/10"><CardContent className="p-4 text-center"><TrendingUp className="w-5 h-5 text-emerald-300 mx-auto mb-2" /><div className="text-2xl font-semibold">{stats.activePostings}</div><div className="text-sm text-neutral-400">Active Now</div></CardContent></Card>
            <Card className="bg-white/5 border-white/10"><CardContent className="p-4 text-center"><DollarSign className="w-5 h-5 text-purple-300 mx-auto mb-2" /><div className="text-xl font-semibold">CI$ {Math.round(stats.avgSalary).toLocaleString()}</div><div className="text-sm text-neutral-400">Avg Salary</div></CardContent></Card>
            <Card className="bg-white/5 border-white/10"><CardContent className="p-4 text-center"><DollarSign className="w-5 h-5 text-orange-300 mx-auto mb-2" /><div className="text-xl font-semibold">CI$ {Math.round(stats.minSalary).toLocaleString()}</div><div className="text-sm text-neutral-400">Min Salary</div></CardContent></Card>
            <Card className="bg-white/5 border-white/10"><CardContent className="p-4 text-center"><DollarSign className="w-5 h-5 text-green-300 mx-auto mb-2" /><div className="text-xl font-semibold">CI$ {Math.round(stats.maxSalary).toLocaleString()}</div><div className="text-sm text-neutral-400">Max Salary</div></CardContent></Card>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Top Roles */}
            {topRoles.length > 0 && (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Users className="w-5 h-5" /> Top Roles Hired</h2>
                  <div className="space-y-2">
                    {topRoles.map((role, i) => (
                      <Bar key={i} label={role.title} value={role.count} total={stats.totalPostings} color="bg-cyan-400" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Distributions */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Hiring Patterns</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4" /> Work Types</h3>
                    <div className="space-y-2">{Object.entries(distributions.work).map(([k, v]) => <Bar key={k} label={workTypes.get(k) || k} value={v} total={stats.totalPostings} color="bg-emerald-400" />)}</div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Education Requirements</h3>
                    <div className="space-y-2">{Object.entries(distributions.edu).map(([k, v]) => <Bar key={k} label={eduTypes.get(k) || k} value={v} total={stats.totalPostings} color="bg-purple-400" />)}</div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Experience Levels</h3>
                    <div className="space-y-2">{Object.entries(distributions.exp).map(([k, v]) => <Bar key={k} label={expTypes.get(k) || k} value={v} total={stats.totalPostings} color="bg-orange-400" />)}</div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" /> Locations</h3>
                    <div className="space-y-2">{Object.entries(distributions.loc).map(([k, v]) => <Bar key={k} label={locTypes.get(k) || k} value={v} total={stats.totalPostings} color="bg-pink-400" />)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hiring Timeline */}
            {timeline.length > 0 && (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5" /> Hiring Timeline</h2>
                  <div className="flex items-end gap-1 h-32 overflow-x-auto">
                    {timeline.map(([month, count]) => {
                      const maxCount = Math.max(...timeline.map(t => t[1]));
                      const height = Math.max(8, (count / maxCount) * 100);
                      return (
                        <div key={month} className="flex flex-col items-center gap-1 min-w-[2rem]" title={`${month}: ${count} postings`}>
                          <div className="text-xs text-neutral-500">{count}</div>
                          <div className="w-6 bg-cyan-400/60 rounded-t" style={{ height: `${height}%` }} />
                          <div className="text-[10px] text-neutral-500 -rotate-45 origin-top-left whitespace-nowrap">{month}</div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5" /> Salary Range</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-neutral-400">Minimum</span><span className="font-medium">CI$ {Math.round(stats.minSalary).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-400">Average</span><span className="font-medium">CI$ {Math.round(stats.avgSalary).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-400">Maximum</span><span className="font-medium">CI$ {Math.round(stats.maxSalary).toLocaleString()}</span></div>
                </div>
              </CardContent>
            </Card>

            {industries.length > 0 && (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Industries</h3>
                  <div className="flex flex-wrap gap-2">
                    {industries.map(([name, count]) => (
                      <Badge key={name} className="bg-white/5 border-white/10 text-neutral-300">{name} ({count})</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link href={`/jobs?employer=${encodeURIComponent(employer.name)}`} className="block">
                    <Button className="w-full gap-2"><Search className="w-4 h-4" /> View Active Jobs</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* All Postings */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold mb-2">All Job Postings</h2>
              <p className="text-neutral-400">{filteredPostings.length} of {postings.length} postings</p>
            </div>
            <Button variant="secondary" onClick={() => setShowFilters(!showFilters)} className="gap-2">
              <Filter className="w-4 h-4" /> {showFilters ? "Hide" : "Show"} Filters
            </Button>
          </div>

          <div className="space-y-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by job title..." className="pl-10 bg-white/5 border-white/10" />
            </div>
            {showFilters && (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm max-w-xs">
                    <option value="all">All Postings</option>
                    <option value="active">Active Only</option>
                    <option value="closed">Closed Only</option>
                  </select>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="grid gap-3">
            {filteredPostings.slice(0, 50).map((p, i) => (
              <Card key={p.cJobId || i} className="bg-white/5 border-white/10 hover:border-cyan-300/40 transition">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{p.cTitle}</h3>
                        {p.isActive ? <Badge className="bg-green-500/20 text-green-300 border-green-300/30 text-xs">Active</Badge> : <Badge className="bg-neutral-500/20 text-neutral-300 border-neutral-300/30 text-xs">Closed</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-neutral-400">
                        <span>{formatDate(p.createdDate)}</span>
                        <span>{workTypes.get(p.sWork) || p.sWork}</span>
                        <span>{locTypes.get(p.sLocation) || p.sLocation}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-medium">{formatSalary(p)}</div>
                      {p.isActive && (
                        <a href={generateWORCSearchURL(p)} target="_blank" rel="noreferrer" className="text-xs text-cyan-300 hover:underline">Apply on WORC</a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPostings.length > 50 && (
            <p className="text-neutral-400 text-sm mt-4 text-center">Showing 50 of {filteredPostings.length} postings. Use search to narrow results.</p>
          )}

          {filteredPostings.length === 0 && (
            <Card className="bg-white/5 border-white/10"><CardContent className="p-12 text-center"><Search className="w-12 h-12 mx-auto mb-4 opacity-50" /><h3 className="text-lg font-medium mb-2">No postings found</h3><p className="text-neutral-400">Try adjusting your search.</p></CardContent></Card>
          )}
        </div>

        {/* SEO */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <h2 className="text-2xl font-semibold mb-4">About {employer.name}</h2>
          <p className="text-neutral-300 leading-relaxed mb-4">
            {employer.name} is an employer in the Cayman Islands with {stats.totalPostings} historical job postings on record.
            {stats.activePostings > 0 ? ` They currently have ${stats.activePostings} active job postings.` : ""}
            {stats.avgSalary > 0 ? ` Their average salary offering is CI$ ${Math.round(stats.avgSalary).toLocaleString()}.` : ""}
          </p>
          {topRoles.length > 0 && (
            <p className="text-neutral-300 leading-relaxed">
              Top roles hired include {topRoles.slice(0, 5).map(r => r.title).join(", ")}.
            </p>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
