"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Building2, DollarSign, TrendingUp, Briefcase, MapPin,
  ChevronLeft, ExternalLink, Calendar, Users, Search,
  BookOpen, Clock, BarChart3, Globe, Heart, GraduationCap,
  Baby, Sun, Star, ChevronDown, ChevronUp, Linkedin, Twitter, Instagram,
} from "lucide-react";
import { generateWORCSearchURL } from "@/lib/data";
import t from "@/lib/theme";

const CATEGORY_ICONS = {
  health: Heart,
  financial: DollarSign,
  lifestyle: Sun,
  growth: GraduationCap,
  family: Baby,
  office: Building2,
};

export default function EmployerProfileClient({ profile, perks: perkGroups, workTypes: wtObj, eduTypes: etObj, expTypes: exObj, locTypes: ltObj }) {
  const { employer, postings, stats, topRoles, distributions, timeline, industries } = profile;

  const sections = { about: true, benefits: true, jobs: true, insights: true, ...(employer.profile_sections || {}) };

  const workTypes = useMemo(() => new Map(Object.entries(wtObj)), [wtObj]);
  const eduTypes = useMemo(() => new Map(Object.entries(etObj)), [etObj]);
  const expTypes = useMemo(() => new Map(Object.entries(exObj)), [exObj]);
  const locTypes = useMemo(() => new Map(Object.entries(ltObj)), [ltObj]);

  const [searchQuery, setSearchQuery] = useState("");
  const [insightsOpen, setInsightsOpen] = useState(false);

  const activePostings = useMemo(() => postings.filter((p) => p.isActive), [postings]);

  const filteredJobs = useMemo(() => {
    if (!searchQuery) return activePostings;
    const q = searchQuery.toLowerCase();
    return activePostings.filter((p) => p.cTitle?.toLowerCase().includes(q));
  }, [activePostings, searchQuery]);

  const formatSalary = (p) => {
    if (p["Salary Description"]) return p["Salary Description"];
    if (p.fMinSalary && p.fMaxSalary) return `CI$ ${p.fMinSalary.toLocaleString()} - ${p.fMaxSalary.toLocaleString()}`;
    if (p.fMeanSalary) return `CI$ ${p.fMeanSalary.toLocaleString()}`;
    return "Salary not specified";
  };

  const socialLinks = employer.social_links || {};

  const Bar = ({ label, value, total, color = "bg-primary-300" }) => (
    <div className="flex items-center gap-2">
      <div className="w-16 sm:w-24 md:w-32 text-xs text-neutral-600 dark:text-neutral-400 truncate" title={label}>{label}</div>
      <div className="flex-1 h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${Math.round((value / Math.max(1, total)) * 100)}%` }} />
      </div>
      <div className="w-12 sm:w-16 text-xs text-neutral-500 text-right">{value} ({Math.round((value / Math.max(1, total)) * 100)}%)</div>
    </div>
  );

  return (
    <div className={`${t.page} w-full`}>
      <div id="bg-gradient" aria-hidden className="fixed inset-0 -z-10 bg-[length:200%_200%]" style={t.pageGradientStyle} />

      {/* Hero */}
      <div className="relative">
        {employer.cover_url ? (
          <div className="h-40 sm:h-48 md:h-64 w-full overflow-hidden">
            <img src={employer.cover_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#FEFCF3] via-[#FEFCF3]/40 to-transparent" />
          </div>
        ) : (
          <div className="h-40 sm:h-48 md:h-64 w-full bg-gradient-to-br from-primary-100 via-neutral-50 to-primary-50">
            <div className="absolute inset-0 bg-gradient-to-t from-[#FEFCF3] via-transparent to-transparent" />
          </div>
        )}

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-12 sm:-mt-16 md:-mt-20 flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {/* Logo */}
            {employer.logo_url ? (
              <img src={employer.logo_url} alt={employer.name} className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl object-contain bg-white dark:bg-neutral-900 border-4 border-[#FEFCF3] shadow-xl" />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl bg-white dark:bg-neutral-800 shadow-sm border-4 border-[#FEFCF3] grid place-items-center shadow-xl">
                <Building2 className="w-10 h-10 text-neutral-500" />
              </div>
            )}

            <div className="flex-1 pt-2 sm:pt-4">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{employer.name}</h1>
              {employer.tagline && <p className="text-neutral-500 mt-1 text-lg">{employer.tagline}</p>}

              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {stats.activePostings > 0 && (
                  <Badge className="bg-primary-50 dark:bg-primary-500/15 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-500/30">Currently Hiring</Badge>
                )}
                {employer.claimed && (
                  <Badge className="bg-primary-50 dark:bg-primary-500/15 text-primary-500 border-primary-200 dark:border-primary-500/30">Verified</Badge>
                )}
              </div>

              {/* Company quick info */}
              <div className="flex items-center gap-4 mt-3 flex-wrap text-sm text-neutral-500">
                {employer.company_size && (
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {employer.company_size} employees</span>
                )}
                {employer.year_founded && (
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Founded {employer.year_founded}</span>
                )}
                {employer.headquarters && (
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {employer.headquarters}</span>
                )}
                {employer.industry && (
                  <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {employer.industry}</span>
                )}
              </div>

              {/* Links */}
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {employer.website && (
                  <a href={employer.website} target="_blank" rel="noreferrer" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1 transition">
                    <Globe className="w-3.5 h-3.5" /> Website
                  </a>
                )}
                {socialLinks.linkedin && (
                  <a href={socialLinks.linkedin} target="_blank" rel="noreferrer" className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition">
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                {socialLinks.twitter && (
                  <a href={socialLinks.twitter} target="_blank" rel="noreferrer" className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition">
                    <Twitter className="w-4 h-4" />
                  </a>
                )}
                {socialLinks.instagram && (
                  <a href={socialLinks.instagram} target="_blank" rel="noreferrer" className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition">
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Back link */}
        <Link href="/employers">
          <Button variant="secondary" className="gap-2"><ChevronLeft className="w-4 h-4" /> All Employers</Button>
        </Link>

        {/* About Section */}
        {sections.about && (employer.description || employer.company_size || employer.headquarters) && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">About {employer.name}</h2>
            {employer.description && (
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-3xl whitespace-pre-line">{employer.description}</p>
            )}
            {(employer.company_size || employer.year_founded || employer.headquarters || employer.industry) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                {employer.company_size && (
                  <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
                    <CardContent className="p-4 text-center">
                      <Users className="w-5 h-5 text-primary-500 mx-auto mb-2" />
                      <div className="text-lg font-semibold">{employer.company_size}</div>
                      <div className="text-xs text-neutral-500">Employees</div>
                    </CardContent>
                  </Card>
                )}
                {employer.year_founded && (
                  <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
                    <CardContent className="p-4 text-center">
                      <Calendar className="w-5 h-5 text-primary-500 mx-auto mb-2" />
                      <div className="text-lg font-semibold">{employer.year_founded}</div>
                      <div className="text-xs text-neutral-500">Founded</div>
                    </CardContent>
                  </Card>
                )}
                {employer.headquarters && (
                  <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
                    <CardContent className="p-4 text-center">
                      <MapPin className="w-5 h-5 text-primary-500 mx-auto mb-2" />
                      <div className="text-lg font-semibold">{employer.headquarters}</div>
                      <div className="text-xs text-neutral-500">Headquarters</div>
                    </CardContent>
                  </Card>
                )}
                {employer.industry && (
                  <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
                    <CardContent className="p-4 text-center">
                      <Briefcase className="w-5 h-5 text-primary-500 mx-auto mb-2" />
                      <div className="text-lg font-semibold">{employer.industry}</div>
                      <div className="text-xs text-neutral-500">Industry</div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </section>
        )}

        {/* Benefits & Perks */}
        {sections.benefits && perkGroups && perkGroups.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Benefits & Perks</h2>
            <div className="space-y-4">
              {perkGroups.map((group) => {
                const Icon = CATEGORY_ICONS[group.id] || Star;
                return (
                  <div key={group.id}>
                    <h3 className="text-sm font-medium text-neutral-500 mb-2 flex items-center gap-2">
                      <Icon className="w-4 h-4" /> {group.label}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {group.perks.map((perk, i) => (
                        <Badge key={i} className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 px-3 py-1.5">
                          {perk.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Open Positions */}
        {sections.jobs && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">
                Open Positions {activePostings.length > 0 && <span className="text-neutral-500 text-lg font-normal">({activePostings.length})</span>}
              </h2>
            </div>

            {activePostings.length > 0 && (
              <div className="relative mb-4 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by job title..." className="pl-10 bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700" />
              </div>
            )}

            {filteredJobs.length > 0 ? (
              <div className="grid gap-3">
                {filteredJobs.map((p, i) => (
                  <Card key={p.cJobId || i} className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 hover:border-primary-300 transition">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{p.cTitle}</h3>
                          <div className="flex items-center gap-3 text-sm text-neutral-500 mt-1">
                            {workTypes.get(p.sWork) && <span>{workTypes.get(p.sWork)}</span>}
                            {locTypes.get(p.sLocation) && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {locTypes.get(p.sLocation)}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0 space-y-1">
                          <div className="text-sm font-medium">{formatSalary(p)}</div>
                          <div className="flex gap-2 justify-end">
                            <Link href={`/jobs/${p.cJobId}`}>
                              <Button size="sm" className="gap-1 text-xs h-7">View Details</Button>
                            </Link>
                            <a href={generateWORCSearchURL(p)} target="_blank" rel="noreferrer">
                              <Button size="sm" variant="secondary" className="gap-1 text-xs h-7">
                                <ExternalLink className="w-3 h-3" /> Apply on WORC
                              </Button>
                            </a>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : activePostings.length === 0 ? (
              <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
                <CardContent className="p-8 text-center">
                  <Briefcase className="w-10 h-10 mx-auto mb-3 text-neutral-500" />
                  <p className="text-neutral-500">No open positions at the moment.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
                <CardContent className="p-8 text-center">
                  <Search className="w-10 h-10 mx-auto mb-3 text-neutral-500" />
                  <p className="text-neutral-500">No positions match &ldquo;{searchQuery}&rdquo;</p>
                </CardContent>
              </Card>
            )}
          </section>
        )}

        {/* Hiring Insights (collapsible accordion) */}
        {sections.insights && stats.totalPostings > 0 && (
          <section>
            <button
              onClick={() => setInsightsOpen(!insightsOpen)}
              className="flex items-center gap-3 w-full text-left"
            >
              <h2 className="text-2xl font-semibold">Hiring Insights</h2>
              <Badge className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 text-neutral-500">{stats.totalPostings} postings</Badge>
              {insightsOpen ? <ChevronUp className="w-5 h-5 text-neutral-500 ml-auto" /> : <ChevronDown className="w-5 h-5 text-neutral-500 ml-auto" />}
            </button>

            {insightsOpen && (
              <div className="mt-6 space-y-6">
                {/* Stats overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700"><CardContent className="p-4 text-center"><div className="text-2xl font-semibold">{stats.totalPostings}</div><div className="text-sm text-neutral-500">Total Posts</div></CardContent></Card>
                  <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700"><CardContent className="p-4 text-center"><div className="text-2xl font-semibold">{stats.activePostings}</div><div className="text-sm text-neutral-500">Active Now</div></CardContent></Card>
                  {stats.avgSalary > 0 && <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700"><CardContent className="p-4 text-center"><div className="text-xl font-semibold">CI$ {Math.round(stats.avgSalary).toLocaleString()}</div><div className="text-sm text-neutral-500">Avg Salary</div></CardContent></Card>}
                  {stats.maxSalary > 0 && <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700"><CardContent className="p-4 text-center"><div className="text-xl font-semibold">CI$ {Math.round(stats.maxSalary).toLocaleString()}</div><div className="text-sm text-neutral-500">Max Salary</div></CardContent></Card>}
                </div>

                {/* Salary range */}
                {stats.minSalary > 0 && (
                  <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><DollarSign className="w-5 h-5" /> Salary Range</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-neutral-500">Minimum</span><span className="font-medium">CI$ {Math.round(stats.minSalary).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-neutral-500">Average</span><span className="font-medium">CI$ {Math.round(stats.avgSalary).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-neutral-500">Maximum</span><span className="font-medium">CI$ {Math.round(stats.maxSalary).toLocaleString()}</span></div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Top Roles */}
                {topRoles.length > 0 && (
                  <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Users className="w-5 h-5" /> Top Roles</h3>
                      <div className="space-y-2">
                        {topRoles.map((role, i) => (
                          <Bar key={i} label={role.title} value={role.count} total={stats.totalPostings} color="bg-primary-300" />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Distributions */}
                <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Hiring Patterns</h3>
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4" /> Work Types</h4>
                        <div className="space-y-2">{Object.entries(distributions.work).map(([k, v]) => <Bar key={k} label={workTypes.get(k) || k} value={v} total={stats.totalPostings} color="bg-primary-300" />)}</div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Education</h4>
                        <div className="space-y-2">{Object.entries(distributions.edu).map(([k, v]) => <Bar key={k} label={eduTypes.get(k) || k} value={v} total={stats.totalPostings} color="bg-primary-200" />)}</div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Experience</h4>
                        <div className="space-y-2">{Object.entries(distributions.exp).map(([k, v]) => <Bar key={k} label={expTypes.get(k) || k} value={v} total={stats.totalPostings} color="bg-primary-300" />)}</div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" /> Locations</h4>
                        <div className="space-y-2">{Object.entries(distributions.loc).map(([k, v]) => <Bar key={k} label={locTypes.get(k) || k} value={v} total={stats.totalPostings} color="bg-primary-200" />)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline */}
                {timeline.length > 0 && (() => {
                  const maxCount = Math.max(...timeline.map((t) => t[1]));
                  const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                  const formatMonth = (m) => {
                    const [y, mo] = m.split("-");
                    return { short: MONTHS_SHORT[parseInt(mo, 10) - 1], year: y };
                  };
                  const totalPostings = timeline.reduce((s, t) => s + t[1], 0);
                  return (
                    <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-lg font-semibold flex items-center gap-2"><Calendar className="w-5 h-5" /> Hiring Timeline</h3>
                          <span className="text-sm text-neutral-500">{totalPostings} total postings</span>
                        </div>
                        <div className="pt-4">
                          <div className="flex items-end gap-1" style={{ height: "10rem" }}>
                            {timeline.map(([month, count]) => {
                              const pct = count / maxCount;
                              const barHeight = Math.max(6, Math.round(pct * 120));
                              const { short, year } = formatMonth(month);
                              const showYear = month.endsWith("-01") || timeline[0][0] === month;
                              return (
                                <div key={month} className="flex-1 flex flex-col items-center group" title={`${short} ${year}: ${count} posting${count !== 1 ? "s" : ""}`}>
                                  <div className="text-[11px] text-neutral-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity font-medium">{count}</div>
                                  <div className="w-full max-w-[2.5rem] mx-auto rounded-t transition-colors bg-primary-300 group-hover:bg-primary-400" style={{ height: `${barHeight}px` }} />
                                  <div className="text-[10px] text-neutral-500 mt-2 leading-none">{short}</div>
                                  {showYear && <div className="text-[9px] text-neutral-600 dark:text-neutral-400 leading-none mt-0.5">{year}</div>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Industries */}
                {industries.length > 0 && (
                  <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Industries</h3>
                      <div className="flex flex-wrap gap-2">
                        {industries.map(([name, count]) => (
                          <Badge key={name} className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400">{name} ({count})</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </section>
        )}

        {/* SEO */}
        <section className="pt-8 border-t border-neutral-200 dark:border-neutral-700">
          <h2 className="text-xl font-semibold mb-3">About {employer.name}</h2>
          <p className="text-neutral-500 leading-relaxed">
            {employer.name} is an employer in the Cayman Islands
            {employer.industry ? ` in the ${employer.industry} sector` : ""}
            {employer.headquarters ? `, based in ${employer.headquarters}` : ""}
            {stats.totalPostings > 0 ? `, with ${stats.totalPostings} historical job postings on record` : ""}.
            {stats.activePostings > 0 ? ` They currently have ${stats.activePostings} active job posting${stats.activePostings > 1 ? "s" : ""}.` : ""}
            {stats.avgSalary > 0 ? ` Their average salary offering is CI$ ${Math.round(stats.avgSalary).toLocaleString()}.` : ""}
            {perkGroups && perkGroups.length > 0 ? ` Benefits include ${perkGroups.flatMap((g) => g.perks).slice(0, 5).map((p) => p.label).join(", ")}.` : ""}
          </p>
          {topRoles.length > 0 && (
            <p className="text-neutral-500 leading-relaxed mt-2">
              Top roles hired include {topRoles.slice(0, 5).map((r) => r.title).join(", ")}.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
