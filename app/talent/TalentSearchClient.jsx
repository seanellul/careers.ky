"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search, Users, BookOpen, Clock, MapPin, Shield, Filter,
  Send, Eye, ChevronRight, ChevronDown, Briefcase, Star, CheckCircle, X,
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

export default function TalentSearchClient({ eduTypes: etObj, expTypes: exObj, locTypes: ltObj, ciscoUnits }) {
  const eduTypes = useMemo(() => new Map(Object.entries(etObj)), [etObj]);
  const expTypes = useMemo(() => new Map(Object.entries(exObj)), [exObj]);
  const locTypes = useMemo(() => new Map(Object.entries(ltObj)), [ltObj]);

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [introSent, setIntroSent] = useState(new Set());

  // Inline intro form state (keyed by candidate ID)
  const [expandedIntro, setExpandedIntro] = useState(null);
  const [introMessage, setIntroMessage] = useState("");
  const [sendingIntro, setSendingIntro] = useState(false);

  // My Introductions
  const [introductions, setIntroductions] = useState([]);
  const [showIntroductions, setShowIntroductions] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginSending, setLoginSending] = useState(false);
  const [loginSent, setLoginSent] = useState(false);

  // Filters
  const [ciscoCode, setCiscoCode] = useState("");
  const [educationCode, setEducationCode] = useState("");
  const [experienceCode, setExperienceCode] = useState("");
  const [locationCode, setLocationCode] = useState("");
  const [availability, setAvailability] = useState("");
  const [ciscoSearch, setCiscoSearch] = useState("");

  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(d => {
      setSession(d.authenticated ? d : null);
      setLoading(false);
    });
  }, []);

  // Load employer introductions
  useEffect(() => {
    if (!session?.employerAccountId) return;
    fetch("/api/introductions")
      .then(r => r.json())
      .then(d => setIntroductions(d.introductions || []))
      .catch(() => {});
  }, [session]);

  const filteredCisco = useMemo(() => {
    if (!ciscoSearch) return ciscoUnits.slice(0, 50);
    return ciscoUnits.filter(c => c.title.toLowerCase().includes(ciscoSearch.toLowerCase())).slice(0, 50);
  }, [ciscoUnits, ciscoSearch]);

  const handleSearch = async () => {
    setSearching(true);
    try {
      const params = new URLSearchParams();
      if (ciscoCode) params.set("ciscoCode", ciscoCode);
      if (educationCode) params.set("educationCode", educationCode);
      if (experienceCode) params.set("experienceCode", experienceCode);
      if (locationCode) params.set("locationCode", locationCode);
      if (availability) params.set("availability", availability);

      const res = await fetch(`/api/talent/search?${params}`);
      const data = await res.json();
      setResults(data.candidates || []);
    } finally {
      setSearching(false);
    }
  };

  const handleLogin = async () => {
    if (!loginEmail) return;
    setLoginSending(true);
    try {
      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, type: "employer" }),
      });
      setLoginSent(true);
    } finally {
      setLoginSending(false);
    }
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
        // Refresh introductions
        const intRes = await fetch("/api/introductions");
        const intData = await intRes.json();
        setIntroductions(intData.introductions || []);
      }
    } finally {
      setSendingIntro(false);
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
            Search for local talent by career interests, education, experience, and availability. Double opt-in — candidates choose to share their contact details.
          </p>
        </div>

        {/* Employer Login Gate */}
        {!session?.employerAccountId && (
          <Card className="bg-white/5 border-white/10 mb-8">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 grid place-items-center mx-auto"><Users className="w-8 h-8 text-cyan-300" /></div>
              <h2 className="text-2xl font-semibold">Employer Access Required</h2>
              <p className="text-neutral-300 max-w-md mx-auto">Sign in with your employer email to search the talent pool and request introductions.</p>
              {!loginSent ? (
                <div className="flex gap-2 max-w-md mx-auto">
                  <Input value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="your@company.ky" type="email" className="bg-white/5 border-white/10" />
                  <Button onClick={handleLogin} disabled={loginSending}>{loginSending ? "Sending..." : "Sign In"}</Button>
                </div>
              ) : (
                <div className="p-4 bg-emerald-500/10 border border-emerald-300/20 rounded-xl text-emerald-300">
                  <CheckCircle className="w-5 h-5 mx-auto mb-2" />
                  Check your email for the sign-in link.
                </div>
              )}
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
                <Button onClick={handleSearch} disabled={searching} className="gap-2">
                  <Search className="w-4 h-4" /> {searching ? "Searching..." : "Search Talent"}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            {results.length > 0 && (
              <div className="space-y-4">
                <div className="text-sm text-neutral-300 mb-2">{results.length} candidate{results.length !== 1 ? "s" : ""} found</div>
                {results.map((c, i) => (
                  <Card key={c.id} className="bg-white/5 border-white/10 hover:border-cyan-300/40 transition">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-10 h-10 rounded-full bg-white/10 grid place-items-center"><Users className="w-5 h-5 text-neutral-400" /></div>
                            <div>
                              <div className="font-medium">Candidate #{i + 1}</div>
                              <div className="flex gap-2">
                                <Badge className={AVAILABILITY_COLORS[c.availability] || ""}>{AVAILABILITY_LABELS[c.availability] || c.availability}</Badge>
                                {c.is_caymanian && <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-300/30"><Shield className="w-3 h-3 mr-1" /> Caymanian</Badge>}
                              </div>
                            </div>
                          </div>
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
                        <div className="shrink-0">
                          {introSent.has(c.id) ? (
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-300/30"><CheckCircle className="w-3 h-3 mr-1" /> Sent</Badge>
                          ) : expandedIntro === c.id ? null : (
                            <Button onClick={() => { setExpandedIntro(c.id); setIntroMessage(""); }} variant="secondary" className="gap-2">
                              <Send className="w-4 h-4" /> Request Intro
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Inline Intro Form */}
                      {expandedIntro === c.id && !introSent.has(c.id) && (
                        <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                          <div className="text-sm font-medium">Send an introduction request</div>
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
              </div>
            )}

            {results.length === 0 && !searching && (
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
