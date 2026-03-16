"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search, Users, BookOpen, Clock, MapPin, Shield, Filter,
  Send, Eye, ChevronRight, ChevronDown, ChevronLeft, Briefcase, Star, CheckCircle, X,
  Target, TrendingUp, Plus, List, Save,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const AVAILABILITY_LABELS = {
  actively_looking: "Actively Looking",
  open_to_offers: "Open to Offers",
  not_looking: "Not Looking",
};
const AVAILABILITY_COLORS = {
  actively_looking: "bg-emerald-500/20 text-emerald-300 border-emerald-300/30",
  open_to_offers: "bg-cyan-500/20 text-cyan-300 border-cyan-300/30",
  not_looking: "bg-neutral-500/20 text-neutral-300 border-neutral-300/30",
};

const STATUS_COLORS = {
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-300/30",
  accepted: "bg-emerald-500/20 text-emerald-300 border-emerald-300/30",
  declined: "bg-red-500/20 text-red-300 border-red-300/30",
};

function ScoreBadge({ score }) {
  const pct = Math.round(score);
  let colorClass = "bg-neutral-500/20 text-neutral-300 border-neutral-300/30";
  if (pct >= 75) colorClass = "bg-emerald-500/20 text-emerald-300 border-emerald-300/30";
  else if (pct >= 50) colorClass = "bg-cyan-500/20 text-cyan-300 border-cyan-300/30";
  else if (pct >= 25) colorClass = "bg-yellow-500/20 text-yellow-300 border-yellow-300/30";

  return (
    <Badge className={`${colorClass} text-sm font-semibold`}>
      <Target className="w-3 h-3 mr-1" /> {pct}%
    </Badge>
  );
}

function ScoreBreakdown({ scores }) {
  const items = [
    { label: "CISCO", score: scores.cisco, max: 35 },
    { label: "Skills", score: scores.skill, max: 25 },
    { label: "Education", score: scores.education, max: 10 },
    { label: "Experience", score: scores.experience, max: 10 },
    { label: "Salary", score: scores.salary, max: 10 },
    { label: "Availability", score: scores.availability, max: 5 },
    { label: "Caymanian", score: scores.caymanian, max: 5 },
  ];

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-400">
      {items.map((item) => (
        <span key={item.label}>
          {item.label}: <span className={item.score > 0 ? "text-neutral-200" : ""}>{item.score}/{item.max}</span>
        </span>
      ))}
    </div>
  );
}

export default function TalentSearchClient({ eduTypes: etObj, expTypes: exObj, locTypes: ltObj, ciscoUnits }) {
  const eduTypes = useMemo(() => new Map(Object.entries(etObj)), [etObj]);
  const expTypes = useMemo(() => new Map(Object.entries(exObj)), [exObj]);
  const locTypes = useMemo(() => new Map(Object.entries(ltObj)), [ltObj]);
  const searchParamsHook = useSearchParams();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [introSent, setIntroSent] = useState(new Set());

  // Inline intro form state
  const [expandedIntro, setExpandedIntro] = useState(null);
  const [introMessage, setIntroMessage] = useState("");
  const [sendingIntro, setSendingIntro] = useState(false);

  // My Introductions
  const [introductions, setIntroductions] = useState([]);
  const [showIntroductions, setShowIntroductions] = useState(false);

  // Score breakdown expand
  const [expandedScore, setExpandedScore] = useState(null);

  // Filters
  const [ciscoCode, setCiscoCode] = useState("");
  const [educationCode, setEducationCode] = useState("");
  const [experienceCode, setExperienceCode] = useState("");
  const [locationCode, setLocationCode] = useState("");
  const [availability, setAvailability] = useState("");
  const [ciscoSearch, setCiscoSearch] = useState("");
  const [isCaymanian, setIsCaymanian] = useState(false);

  // Skill filter
  const [skillSearch, setSkillSearch] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);

  // Shortlist state
  const [shortlists, setShortlists] = useState([]);
  const [showShortlistDropdown, setShowShortlistDropdown] = useState(null);

  // Bulk selection
  const [selectedCandidates, setSelectedCandidates] = useState(new Set());
  const [showBulkIntro, setShowBulkIntro] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");
  const [sendingBulk, setSendingBulk] = useState(false);

  // Templates
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(d => {
      setSession(d.authenticated ? d : null);
      setLoading(false);
    });
  }, []);

  // Load employer data
  useEffect(() => {
    if (!session?.employerAccountId) return;
    fetch("/api/introductions").then(r => r.json()).then(d => setIntroductions(d.introductions || [])).catch(() => {});
    fetch("/api/employer/shortlists").then(r => r.json()).then(d => setShortlists(d.shortlists || [])).catch(() => {});
    fetch("/api/employer/templates").then(r => r.json()).then(d => setTemplates(d.templates || [])).catch(() => {});
  }, [session]);

  // Auto-search if jobId param present
  useEffect(() => {
    if (!session?.employerAccountId) return;
    const jobId = searchParamsHook.get("jobId");
    if (jobId) {
      setSearching(true);
      setHasSearched(true);
      fetch(`/api/talent/match-to-job?jobId=${jobId}`)
        .then(r => r.json())
        .then(d => {
          setResults(d.candidates || []);
          setTotal(d.total || 0);
          setPage(d.page || 1);
        })
        .finally(() => setSearching(false));
    }
  }, [session, searchParamsHook]);

  // Skill search suggestions
  useEffect(() => {
    if (!skillSearch.trim()) { setSkillSuggestions([]); return; }
    const ctrl = new AbortController();
    fetch(`/api/skills/search?q=${encodeURIComponent(skillSearch)}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(d => {
        const existing = new Set(selectedSkills.map(s => s.id));
        setSkillSuggestions((d.skills || []).filter(s => !existing.has(s.id)));
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [skillSearch, selectedSkills]);

  const filteredCisco = useMemo(() => {
    if (!ciscoSearch) return ciscoUnits.slice(0, 50);
    return ciscoUnits.filter(c => c.title.toLowerCase().includes(ciscoSearch.toLowerCase())).slice(0, 50);
  }, [ciscoUnits, ciscoSearch]);

  const totalPages = Math.ceil(total / pageSize);

  const handleSearch = async (searchPage = 1) => {
    setSearching(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams();
      if (ciscoCode) params.set("ciscoCode", ciscoCode);
      if (educationCode) params.set("educationCode", educationCode);
      if (experienceCode) params.set("experienceCode", experienceCode);
      if (locationCode) params.set("locationCode", locationCode);
      if (availability) params.set("availability", availability);
      if (isCaymanian) params.set("isCaymanian", "true");
      if (selectedSkills.length > 0) params.set("skillIds", selectedSkills.map(s => s.id).join(","));
      params.set("page", String(searchPage));
      params.set("pageSize", String(pageSize));

      const res = await fetch(`/api/talent/search?${params}`);
      const data = await res.json();
      setResults(data.candidates || []);
      setTotal(data.total || 0);
      setPage(data.page || searchPage);
      setSelectedCandidates(new Set());
    } finally {
      setSearching(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    handleSearch(newPage);
  };

  const handleSendIntroduction = async (candidateId) => {
    setSendingIntro(true);
    try {
      const res = await fetch("/api/introductions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, message: introMessage }),
      });
      if (res.ok) {
        setIntroSent(new Set([...introSent, candidateId]));
        setExpandedIntro(null);
        setIntroMessage("");
        const intRes = await fetch("/api/introductions");
        const intData = await intRes.json();
        setIntroductions(intData.introductions || []);
      }
    } finally {
      setSendingIntro(false);
    }
  };

  const handleBulkIntro = async () => {
    if (selectedCandidates.size === 0) return;
    setSendingBulk(true);
    try {
      const res = await fetch("/api/introductions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateIds: [...selectedCandidates], message: bulkMessage }),
      });
      if (res.ok) {
        setIntroSent(new Set([...introSent, ...selectedCandidates]));
        setSelectedCandidates(new Set());
        setShowBulkIntro(false);
        setBulkMessage("");
        const intRes = await fetch("/api/introductions");
        const intData = await intRes.json();
        setIntroductions(intData.introductions || []);
      }
    } finally {
      setSendingBulk(false);
    }
  };

  const handleAddToShortlist = async (shortlistId, candidateId) => {
    await fetch(`/api/employer/shortlists/${shortlistId}/candidates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId }),
    });
    setShowShortlistDropdown(null);
  };

  const toggleCandidate = (id) => {
    const next = new Set(selectedCandidates);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedCandidates(next);
  };

  const selectAll = () => {
    if (selectedCandidates.size === results.length) {
      setSelectedCandidates(new Set());
    } else {
      setSelectedCandidates(new Set(results.map(c => c.id)));
    }
  };

  if (loading) return <div className="min-h-screen bg-neutral-950" />;

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100">
      <div id="bg-gradient" aria-hidden className="fixed inset-0 -z-10 bg-[length:200%_200%]" style={{ backgroundImage: "radial-gradient(1200px 1200px at 10% 10%, rgba(56,189,248,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 90% 20%, rgba(34,197,94,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 50% 110%, rgba(147,51,234,0.12) 0%, transparent 60%)", backgroundPosition: "0% 50%" }} />

      <Navigation />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-4">
            Cayman <span className="text-cyan-300">Talent Pool</span>
          </h1>
          <p className="text-neutral-300 text-lg max-w-3xl">
            Search for local talent by career interests, skills, education, and experience. Candidates are ranked by match quality.
          </p>
        </div>

        {/* Employer Login Gate */}
        {!session?.employerAccountId && (
          <Card className="bg-white/5 border-white/10 mb-8">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 grid place-items-center mx-auto"><Users className="w-8 h-8 text-cyan-300" /></div>
              <h2 className="text-2xl font-semibold">Employer Access Required</h2>
              <p className="text-neutral-300 max-w-md mx-auto">Sign in to search the talent pool and request introductions.</p>
              <a
                href="/api/auth/google?type=employer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-neutral-900 text-sm font-medium hover:bg-neutral-100 transition"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Sign in with Google
              </a>
            </CardContent>
          </Card>
        )}

        {/* Search Filters */}
        {session?.employerAccountId && (
          <>
            <Card className="bg-white/5 border-white/10 mb-8">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Filter className="w-5 h-5" /> Search Filters</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Career Interest (CISCO)</label>
                    <Input value={ciscoSearch} onChange={(e) => setCiscoSearch(e.target.value)} placeholder="Search occupations..." className="bg-white/5 border-white/10 mb-2" />
                    <select value={ciscoCode} onChange={(e) => setCiscoCode(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-200" size={4}>
                      <option value="">Any occupation</option>
                      {filteredCisco.map(c => <option key={c.code} value={c.code}>{c.title} ({c.code})</option>)}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Education</label>
                      <select value={educationCode} onChange={(e) => setEducationCode(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-200">
                        <option value="">Any education</option>
                        {Array.from(eduTypes.entries()).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Experience</label>
                      <select value={experienceCode} onChange={(e) => setExperienceCode(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-200">
                        <option value="">Any experience</option>
                        {Array.from(expTypes.entries()).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Location</label>
                      <select value={locationCode} onChange={(e) => setLocationCode(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-200">
                        <option value="">Any location</option>
                        {Array.from(locTypes.entries()).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Availability</label>
                      <select value={availability} onChange={(e) => setAvailability(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-200">
                        <option value="">Any availability</option>
                        <option value="actively_looking">Actively Looking</option>
                        <option value="open_to_offers">Open to Offers</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Skills Filter */}
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">Skills</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input
                      value={skillSearch}
                      onChange={(e) => setSkillSearch(e.target.value)}
                      placeholder="Search skills to filter by..."
                      className="pl-10 bg-white/5 border-white/10"
                    />
                  </div>
                  {skillSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {skillSuggestions.slice(0, 10).map((s) => (
                        <button key={s.id} onClick={() => { setSelectedSkills([...selectedSkills, s]); setSkillSearch(""); }}>
                          <Badge className="bg-white/5 border-white/10 text-neutral-300 hover:border-purple-300/40 cursor-pointer">
                            <Plus className="w-3 h-3 mr-1" /> {s.name}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedSkills.map((s) => (
                        <div key={s.id} className="flex items-center gap-1">
                          <Badge className="bg-purple-500/20 text-purple-300 border-purple-300/30">{s.name}</Badge>
                          <button onClick={() => setSelectedSkills(selectedSkills.filter(sk => sk.id !== s.id))} className="text-neutral-400 hover:text-red-400">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isCaymanian} onChange={(e) => setIsCaymanian(e.target.checked)} className="rounded" />
                    <span className="text-sm flex items-center gap-1"><Shield className="w-3 h-3 text-cyan-300" /> Caymanian Only</span>
                  </label>
                </div>
                <Button onClick={() => handleSearch(1)} disabled={searching} className="gap-2 mt-2">
                  <Search className="w-4 h-4" /> {searching ? "Searching..." : "Search Talent"}
                </Button>
              </CardContent>
            </Card>

            {/* Loading Skeleton */}
            {searching && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-white/5 border-white/10 animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/10" />
                        <div className="flex-1 space-y-3">
                          <div className="h-4 bg-white/10 rounded w-1/4" />
                          <div className="h-3 bg-white/10 rounded w-1/2" />
                          <div className="flex gap-2">
                            <div className="h-5 bg-white/10 rounded w-16" />
                            <div className="h-5 bg-white/10 rounded w-20" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Bulk Actions Bar */}
            {!searching && results.length > 0 && selectedCandidates.size > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-cyan-500/10 border border-cyan-300/20 flex items-center justify-between">
                <span className="text-sm text-cyan-300">{selectedCandidates.size} selected</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setShowBulkIntro(true)} className="gap-1">
                    <Send className="w-3 h-3" /> Send Intros
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setSelectedCandidates(new Set())}>
                    Clear
                  </Button>
                </div>
              </div>
            )}

            {/* Bulk Intro Modal */}
            {showBulkIntro && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowBulkIntro(false)}>
                <Card className="bg-neutral-900 border-white/10 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold">Send Bulk Introductions</h3>
                    <p className="text-sm text-neutral-400">Sending to {selectedCandidates.size} candidate{selectedCandidates.size !== 1 ? "s" : ""}</p>
                    {templates.length > 0 && (
                      <div>
                        <label className="text-sm font-medium mb-1 block">Use Template</label>
                        <select
                          onChange={(e) => { const t = templates.find(t => t.id === Number(e.target.value)); if (t) setBulkMessage(t.message); }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-200"
                        >
                          <option value="">Select a template...</option>
                          {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                    )}
                    <textarea
                      value={bulkMessage}
                      onChange={(e) => setBulkMessage(e.target.value)}
                      rows={4}
                      placeholder="Your message to these candidates..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-200"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="secondary" onClick={() => setShowBulkIntro(false)}>Cancel</Button>
                      <Button onClick={handleBulkIntro} disabled={sendingBulk} className="gap-2">
                        <Send className="w-3 h-3" /> {sendingBulk ? "Sending..." : "Send All"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Results */}
            {!searching && hasSearched && results.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-neutral-300 mb-2">
                  <div className="flex items-center gap-3">
                    <span>{total} candidate{total !== 1 ? "s" : ""} found</span>
                    <button onClick={selectAll} className="text-xs text-cyan-300 hover:underline">
                      {selectedCandidates.size === results.length ? "Deselect all" : "Select all"}
                    </button>
                  </div>
                  <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Ranked by match score</span>
                </div>
                {results.map((c, i) => (
                  <Card key={c.id} className={`bg-white/5 border-white/10 hover:border-cyan-300/40 transition ${selectedCandidates.has(c.id) ? "ring-1 ring-cyan-300/40" : ""}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <label className="mt-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedCandidates.has(c.id)}
                              onChange={() => toggleCandidate(c.id)}
                              className="rounded"
                            />
                          </label>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-10 h-10 rounded-full bg-white/10 grid place-items-center"><Users className="w-5 h-5 text-neutral-400" /></div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Candidate #{(page - 1) * pageSize + i + 1}</span>
                                  {c.scores && <ScoreBadge score={c.scores.total} />}
                                </div>
                                <div className="flex gap-2">
                                  <Badge className={AVAILABILITY_COLORS[c.availability] || ""}>{AVAILABILITY_LABELS[c.availability] || c.availability}</Badge>
                                  {c.is_caymanian && <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-300/30"><Shield className="w-3 h-3 mr-1" /> Caymanian</Badge>}
                                </div>
                              </div>
                            </div>

                            {/* Score Breakdown */}
                            {c.scores && c.scores.total > 0 && (
                              <div className="mb-3">
                                <button
                                  onClick={() => setExpandedScore(expandedScore === c.id ? null : c.id)}
                                  className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1"
                                >
                                  {expandedScore === c.id ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                  Match breakdown
                                </button>
                                {expandedScore === c.id && (
                                  <div className="mt-2 p-2 rounded-lg bg-white/5 border border-white/10">
                                    <ScoreBreakdown scores={c.scores} />
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3 text-sm">
                              <div className="flex items-center gap-1"><BookOpen className="w-3 h-3 text-purple-300" /> {eduTypes.get(c.education_code) || "Not specified"}</div>
                              <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-orange-300" /> {expTypes.get(c.experience_code) || "Not specified"}</div>
                              <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-pink-300" /> {locTypes.get(c.location_code) || "Not specified"}</div>
                            </div>
                            {c.interests?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {c.interests.map((int) => (
                                  <Badge key={int.cisco_code} className="bg-white/5 border-white/10 text-neutral-300 text-xs">{int.title || int.cisco_code}</Badge>
                                ))}
                              </div>
                            )}
                            {c.skills?.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {c.skills.map((s) => (
                                  <Badge key={s.id} className="bg-purple-500/10 text-purple-300 border-purple-300/20 text-xs">{s.name}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 flex flex-col gap-2">
                          {introSent.has(c.id) ? (
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-300/30"><CheckCircle className="w-3 h-3 mr-1" /> Sent</Badge>
                          ) : expandedIntro === c.id ? null : (
                            <Button onClick={() => { setExpandedIntro(c.id); setIntroMessage(""); }} variant="secondary" size="sm" className="gap-2">
                              <Send className="w-3 h-3" /> Intro
                            </Button>
                          )}
                          {shortlists.length > 0 && (
                            <div className="relative">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="gap-1"
                                onClick={() => setShowShortlistDropdown(showShortlistDropdown === c.id ? null : c.id)}
                              >
                                <List className="w-3 h-3" /> Save
                              </Button>
                              {showShortlistDropdown === c.id && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-neutral-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-20">
                                  {shortlists.map(sl => (
                                    <button
                                      key={sl.id}
                                      onClick={() => handleAddToShortlist(sl.id, c.id)}
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition"
                                    >
                                      {sl.name}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Inline Intro Form */}
                      {expandedIntro === c.id && !introSent.has(c.id) && (
                        <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                          <div className="text-sm font-medium">Send an introduction request</div>
                          {templates.length > 0 && (
                            <select
                              onChange={(e) => { const t = templates.find(t => t.id === Number(e.target.value)); if (t) setIntroMessage(t.message); }}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-200"
                            >
                              <option value="">Use a template...</option>
                              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                          )}
                          <textarea
                            value={introMessage}
                            onChange={(e) => setIntroMessage(e.target.value)}
                            rows={3}
                            placeholder="Introduce yourself and explain why you'd like to connect..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-cyan-300/40"
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <Button variant="secondary" size="sm" onClick={() => setExpandedIntro(null)}>Cancel</Button>
                            <Button size="sm" onClick={() => handleSendIntroduction(c.id)} disabled={sendingIntro} className="gap-2">
                              <Send className="w-3 h-3" /> {sendingIntro ? "Sending..." : "Send"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => handlePageChange(page - 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-neutral-400">
                      Page {page} of {totalPages}
                    </span>
                    <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => handlePageChange(page + 1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {!searching && hasSearched && results.length === 0 && (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-12 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50 text-neutral-400" />
                  <h3 className="text-lg font-medium mb-2">No candidates found</h3>
                  <p className="text-neutral-400">Try broadening your search filters.</p>
                </CardContent>
              </Card>
            )}

            {!searching && !hasSearched && (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-12 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50 text-neutral-400" />
                  <h3 className="text-lg font-medium mb-2">Search for talent</h3>
                  <p className="text-neutral-400">Use the filters above to find candidates matching your requirements.</p>
                </CardContent>
              </Card>
            )}

            {/* My Introductions */}
            {introductions.length > 0 && (
              <div className="mt-8">
                <button
                  onClick={() => setShowIntroductions(!showIntroductions)}
                  className="flex items-center gap-2 text-lg font-semibold mb-4 hover:text-cyan-300 transition"
                >
                  <Send className="w-5 h-5" />
                  My Introductions ({introductions.length})
                  <ChevronDown className={`w-4 h-4 transition-transform ${showIntroductions ? "rotate-180" : ""}`} />
                </button>

                {showIntroductions && (
                  <div className="space-y-3">
                    {introductions.map((intro) => (
                      <Card key={intro.id} className="bg-white/5 border-white/10">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">Candidate</div>
                              <div className="text-xs text-neutral-400">
                                Sent {new Date(intro.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </div>
                            </div>
                            <Badge className={STATUS_COLORS[intro.status] || STATUS_COLORS.pending}>
                              {intro.status || "pending"}
                            </Badge>
                          </div>
                          {intro.message && (
                            <div className="mt-2 text-xs text-neutral-400 line-clamp-2">{intro.message}</div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
