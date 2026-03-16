"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Building2, Users, Send, CheckCircle, Clock, XCircle,
  Globe, FileText, Edit3, ExternalLink, Search, Mail,
  TrendingUp, TrendingDown, List, BookmarkPlus, Activity,
  Briefcase, BarChart3, ChevronDown,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const STATUS_COLORS = {
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-300/30",
  accepted: "bg-emerald-500/20 text-emerald-300 border-emerald-300/30",
  declined: "bg-red-500/20 text-red-300 border-red-300/30",
};

const STAGE_LABELS = {
  outreach: "Outreach",
  responded: "Responded",
  interviewing: "Interviewing",
  offered: "Offered",
  hired: "Hired",
  archived: "Archived",
};

const STAGE_COLORS = {
  outreach: "bg-neutral-500/20 text-neutral-300 border-neutral-300/30",
  responded: "bg-cyan-500/20 text-cyan-300 border-cyan-300/30",
  interviewing: "bg-purple-500/20 text-purple-300 border-purple-300/30",
  offered: "bg-yellow-500/20 text-yellow-300 border-yellow-300/30",
  hired: "bg-emerald-500/20 text-emerald-300 border-emerald-300/30",
  archived: "bg-neutral-500/20 text-neutral-400 border-neutral-400/30",
};

const ACTIVITY_LABELS = {
  intro_sent: "Sent introduction",
  intro_accepted: "Introduction accepted",
  intro_declined: "Introduction declined",
  stage_changed: "Pipeline stage changed",
  candidate_shortlisted: "Candidate added to shortlist",
  search_run: "Search performed",
};

export default function EmployerDashboardClient({ employer, stats, introductions, employerName, shortlists, savedSearches }) {
  const [editingProfile, setEditingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [website, setWebsite] = useState(employer.website || "");
  const [description, setDescription] = useState(employer.description || "");
  const [activeStage, setActiveStage] = useState("all");
  const [updatingStage, setUpdatingStage] = useState(null);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/employer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website, description }),
      });
      if (res.ok) setEditingProfile(false);
    } finally {
      setSaving(false);
    }
  };

  const handleStageChange = async (introId, newStage) => {
    setUpdatingStage(introId);
    try {
      await fetch(`/api/introductions/${introId}/stage`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      // Optimistically update
      const intro = introductions.find(i => i.id === introId);
      if (intro) intro.stage = newStage;
    } finally {
      setUpdatingStage(null);
    }
  };

  const filteredIntros = activeStage === "all"
    ? introductions
    : introductions.filter(i => (i.stage || "outreach") === activeStage);

  const monthTrend = stats.lastMonth > 0
    ? Math.round(((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100)
    : stats.thisMonth > 0 ? 100 : 0;

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100">
      <div id="bg-gradient" aria-hidden className="fixed inset-0 -z-10 bg-[length:200%_200%]" style={{ backgroundImage: "radial-gradient(1200px 1200px at 10% 10%, rgba(56,189,248,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 90% 20%, rgba(34,197,94,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 50% 110%, rgba(147,51,234,0.12) 0%, transparent 60%)", backgroundPosition: "0% 50%" }} />

      <Navigation />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-white/10 grid place-items-center">
                <Building2 className="w-6 h-6 text-cyan-300" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{employer.name}</h1>
                <p className="text-neutral-400 text-sm">Welcome back, {employerName}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/employer/${employer.slug}`}>
              <Button variant="secondary" className="gap-2"><ExternalLink className="w-4 h-4" /> Public Profile</Button>
            </Link>
            <Link href="/talent">
              <Button className="gap-2"><Search className="w-4 h-4" /> Search Talent</Button>
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-400/15 grid place-items-center"><Send className="w-5 h-5 text-cyan-300" /></div>
                <div><div className="text-2xl font-semibold">{stats.total}</div><div className="text-xs text-neutral-400">Total Intros</div></div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-400/15 grid place-items-center"><CheckCircle className="w-5 h-5 text-emerald-300" /></div>
                <div><div className="text-2xl font-semibold">{stats.responseRate}%</div><div className="text-xs text-neutral-400">Accept Rate</div></div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-400/15 grid place-items-center"><Clock className="w-5 h-5 text-purple-300" /></div>
                <div><div className="text-2xl font-semibold">{stats.avgResponseHours != null ? `${stats.avgResponseHours}h` : "--"}</div><div className="text-xs text-neutral-400">Avg Response</div></div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-yellow-400/15 grid place-items-center"><Clock className="w-5 h-5 text-yellow-300" /></div>
                <div><div className="text-2xl font-semibold">{stats.pending}</div><div className="text-xs text-neutral-400">Pending</div></div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl ${monthTrend >= 0 ? "bg-emerald-400/15" : "bg-red-400/15"} grid place-items-center`}>
                  {monthTrend >= 0 ? <TrendingUp className="w-5 h-5 text-emerald-300" /> : <TrendingDown className="w-5 h-5 text-red-300" />}
                </div>
                <div>
                  <div className="text-2xl font-semibold">{stats.thisMonth}</div>
                  <div className="text-xs text-neutral-400">This Month {monthTrend !== 0 && <span className={monthTrend > 0 ? "text-emerald-300" : "text-red-300"}>{monthTrend > 0 ? "+" : ""}{monthTrend}%</span>}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Pipeline View */}
          <div className="md:col-span-2 space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5" /> Hiring Pipeline</h2>

                {/* Stage Tabs */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => setActiveStage("all")}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${activeStage === "all" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-300/30" : "bg-white/5 border border-white/10 text-neutral-400 hover:text-neutral-200"}`}
                  >
                    All ({introductions.length})
                  </button>
                  {Object.entries(STAGE_LABELS).map(([stage, label]) => {
                    const count = stats.pipeline?.[stage] || 0;
                    return (
                      <button
                        key={stage}
                        onClick={() => setActiveStage(stage)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${activeStage === stage ? STAGE_COLORS[stage]?.replace("bg-", "bg-") + " border" : "bg-white/5 border border-white/10 text-neutral-400 hover:text-neutral-200"}`}
                      >
                        {label} ({count})
                      </button>
                    );
                  })}
                </div>

                {filteredIntros.length > 0 ? (
                  <div className="space-y-3">
                    {filteredIntros.slice(0, 15).map((intro) => (
                      <div key={intro.id} className="p-4 rounded-xl border border-white/10 bg-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            {intro.status === "accepted" && intro.candidate_name ? (
                              <div className="font-medium">{intro.candidate_name}</div>
                            ) : (
                              <div className="font-medium text-neutral-400">Candidate</div>
                            )}
                            <div className="text-xs text-neutral-500">
                              Sent {new Date(intro.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              {intro.responded_at && ` · Responded ${new Date(intro.responded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={STATUS_COLORS[intro.status] || STATUS_COLORS.pending}>
                              {intro.status || "pending"}
                            </Badge>
                            <select
                              value={intro.stage || "outreach"}
                              onChange={(e) => handleStageChange(intro.id, e.target.value)}
                              disabled={updatingStage === intro.id}
                              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-neutral-200"
                            >
                              {Object.entries(STAGE_LABELS).map(([s, l]) => (
                                <option key={s} value={s}>{l}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        {intro.message && (
                          <div className="text-sm text-neutral-400 line-clamp-2 mb-2">{intro.message}</div>
                        )}
                        {intro.employer_notes && (
                          <div className="text-xs text-neutral-500 mt-1 italic">Notes: {intro.employer_notes}</div>
                        )}
                        {intro.status === "accepted" && intro.candidate_email && (
                          <div className="flex items-center gap-2 text-sm text-emerald-300 mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-300/20">
                            <Mail className="w-4 h-4" />
                            <a href={`mailto:${intro.candidate_email}`} className="hover:underline">{intro.candidate_email}</a>
                            {intro.candidate_linkedin && (
                              <>
                                <span className="text-neutral-500">|</span>
                                <a href={intro.candidate_linkedin} target="_blank" rel="noreferrer" className="hover:underline">LinkedIn</a>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50 text-neutral-400" />
                    <p className="text-neutral-400 mb-3">{activeStage === "all" ? "No introductions yet." : `No introductions in ${STAGE_LABELS[activeStage]} stage.`}</p>
                    <Link href="/talent">
                      <Button className="gap-2"><Search className="w-4 h-4" /> Search Talent</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            {stats.recentActivity?.length > 0 && (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Activity className="w-5 h-5" /> Recent Activity</h2>
                  <div className="space-y-3">
                    {stats.recentActivity.slice(0, 10).map((a) => (
                      <div key={a.id} className="flex items-start gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <div className="text-neutral-200">{ACTIVITY_LABELS[a.action] || a.action}</div>
                          {a.details && Object.keys(a.details).length > 0 && (
                            <div className="text-xs text-neutral-500">
                              {a.details.from && a.details.to && `${STAGE_LABELS[a.details.from] || a.details.from} → ${STAGE_LABELS[a.details.to] || a.details.to}`}
                            </div>
                          )}
                          <div className="text-xs text-neutral-500">
                            {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Profile */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Company Profile</h3>
                  {!editingProfile && (
                    <Button variant="secondary" size="sm" onClick={() => setEditingProfile(true)} className="gap-1">
                      <Edit3 className="w-3 h-3" /> Edit
                    </Button>
                  )}
                </div>
                {editingProfile ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Website</label>
                      <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." className="bg-white/5 border-white/10" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Description</label>
                      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-200" placeholder="About your company..." />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => setEditingProfile(false)}>Cancel</Button>
                      <Button size="sm" onClick={handleSaveProfile} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="text-neutral-400">Name:</span>
                      <div className="font-medium">{employer.name}</div>
                    </div>
                    {employer.website && (
                      <div className="text-sm">
                        <span className="text-neutral-400">Website:</span>
                        <div><a href={employer.website} target="_blank" rel="noreferrer" className="text-cyan-300 hover:underline flex items-center gap-1"><Globe className="w-3 h-3" /> {employer.website}</a></div>
                      </div>
                    )}
                    {employer.description && (
                      <div className="text-sm">
                        <span className="text-neutral-400">Description:</span>
                        <p className="text-neutral-300 mt-1">{employer.description}</p>
                      </div>
                    )}
                    {!employer.website && !employer.description && (
                      <p className="text-sm text-neutral-500">No details added yet. Click Edit to add your company website and description.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shortlists */}
            {shortlists && shortlists.length > 0 && (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><List className="w-5 h-5" /> Shortlists</h3>
                  <div className="space-y-2">
                    {shortlists.map(sl => (
                      <Link key={sl.id} href={`/employer/shortlists/${sl.id}`} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-300/30 transition text-sm">
                        <span>{sl.name}</span>
                        <Badge className="bg-white/5 border-white/10 text-neutral-400">{sl.candidate_count || 0}</Badge>
                      </Link>
                    ))}
                  </div>
                  <Link href="/employer/shortlists">
                    <Button variant="secondary" size="sm" className="w-full mt-3 gap-1">View All</Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Saved Searches */}
            {savedSearches && savedSearches.length > 0 && (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><BookmarkPlus className="w-5 h-5" /> Saved Searches</h3>
                  <div className="space-y-2">
                    {savedSearches.map(ss => (
                      <Link key={ss.id} href={`/talent?${new URLSearchParams(ss.filters || {}).toString()}`} className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-300/30 transition text-sm">
                        <Search className="w-3 h-3 text-neutral-400" /> {ss.name}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Links */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6 space-y-3">
                <h3 className="text-lg font-semibold mb-2">Quick Links</h3>
                <Link href="/talent" className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-300/30 transition text-sm">
                  <Users className="w-4 h-4 text-cyan-300" /> Search Talent Pool
                </Link>
                <Link href="/employer/shortlists" className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-300/30 transition text-sm">
                  <List className="w-4 h-4 text-cyan-300" /> Manage Shortlists
                </Link>
                <Link href={`/employer/${employer.slug}`} className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-300/30 transition text-sm">
                  <Building2 className="w-4 h-4 text-cyan-300" /> View Public Profile
                </Link>
                <Link href="/notifications" className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-300/30 transition text-sm">
                  <CheckCircle className="w-4 h-4 text-cyan-300" /> Notifications
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
