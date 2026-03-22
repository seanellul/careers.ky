"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Building2, Users, Send, CheckCircle, Clock, XCircle,
  Globe, FileText, Edit3, ExternalLink, Search, Mail,
  TrendingUp, TrendingDown, List, BookmarkPlus, Activity,
  Briefcase, BarChart3, ChevronDown, ChevronUp, ClipboardList,
  HeartHandshake, MessageSquare, AlertTriangle,
} from "lucide-react";

const STATUS_COLORS = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-300",
  accepted: "bg-emerald-50 text-emerald-600 border-emerald-300",
  declined: "bg-red-50 text-red-500 border-red-300",
};

const STAGE_LABELS = {
  outreach: "Outreach",
  responded: "Responded",
  interviewing: "Interviewing",
  offered: "Offered",
  hired: "Hired",
  rejected: "Rejected",
  archived: "Archived",
};

const STAGE_COLORS = {
  outreach: "bg-neutral-100 text-neutral-600 border-neutral-300",
  responded: "bg-primary-50 text-primary-500 border-primary-200",
  interviewing: "bg-purple-50 text-purple-600 border-purple-300",
  offered: "bg-yellow-50 text-yellow-700 border-yellow-300",
  hired: "bg-emerald-50 text-emerald-600 border-emerald-300",
  rejected: "bg-red-50 text-red-500 border-red-300",
  archived: "bg-neutral-100 text-neutral-500 border-neutral-300",
};

const REJECTION_REASONS = [
  { value: "position_filled", label: "Position Filled" },
  { value: "qualifications_mismatch", label: "Qualifications Don't Match" },
  { value: "salary_mismatch", label: "Salary Expectations Misaligned" },
  { value: "candidate_unresponsive", label: "Candidate Unresponsive" },
  { value: "candidate_withdrew", label: "Candidate Withdrew" },
  { value: "insufficient_experience", label: "Insufficient Experience" },
  { value: "location_mismatch", label: "Location Mismatch" },
  { value: "other", label: "Other" },
];

const ACTIVITY_LABELS = {
  intro_sent: "Sent introduction",
  intro_accepted: "Introduction accepted",
  intro_declined: "Introduction declined",
  interest_expressed: "Candidate expressed interest",
  interest_accepted: "Candidate interest accepted",
  interest_declined: "Candidate interest declined",
  stage_changed: "Pipeline stage changed",
  candidate_shortlisted: "Candidate added to shortlist",
  search_run: "Search performed",
  message_sent: "Message sent",
};

function EmployerMessageThread({ introId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/introductions/${introId}/messages`)
      .then(r => r.json())
      .then(d => { setMessages(d.messages || []); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [introId]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/introductions/${introId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newMessage.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage("");
      }
    } finally {
      setSending(false);
    }
  };

  if (!loaded) return <div className="text-xs text-neutral-500 py-2">Loading messages...</div>;

  return (
    <div className="mt-3 space-y-3">
      {messages.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {messages.map(m => (
            <div key={m.id} className={`text-sm p-2 rounded-lg ${m.sender_type === "employer" ? "bg-primary-50 border border-primary-200 ml-4" : "bg-neutral-50 border border-neutral-200 mr-4"}`}>
              <div className="text-xs text-neutral-500 mb-1">
                {m.sender_type === "employer" ? "You" : "Candidate"} &middot; {new Date(m.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </div>
              <div className="text-neutral-700">{m.body}</div>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          maxLength={2000}
          className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:border-primary-300"
        />
        <Button size="sm" onClick={handleSend} disabled={sending || !newMessage.trim()}>
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function EmployerDashboardClient({ employer, stats, introductions, employerName, shortlists, savedSearches }) {
  const [activeStage, setActiveStage] = useState("all");
  const [updatingStage, setUpdatingStage] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [jobDropdownOpen, setJobDropdownOpen] = useState(false);
  const [jobSearch, setJobSearch] = useState("");
  const jobDropdownRef = useRef(null);
  const [rejectionModal, setRejectionModal] = useState(null); // { introId, pendingStage }
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [expandedMessages, setExpandedMessages] = useState({});
  const [respondingInterest, setRespondingInterest] = useState(null);

  // Derive unique postings from introductions
  const jobPostings = useMemo(() => {
    const map = new Map();
    for (const intro of introductions) {
      if (intro.job_id && !map.has(intro.job_id)) {
        map.set(intro.job_id, { jobId: intro.job_id, title: intro.job_title || intro.job_id });
      }
    }
    return [...map.values()].sort((a, b) => a.title.localeCompare(b.title));
  }, [introductions]);

  const filteredPostings = useMemo(() => {
    if (!jobSearch.trim()) return jobPostings;
    const q = jobSearch.toLowerCase();
    return jobPostings.filter(p => p.title.toLowerCase().includes(q) || p.jobId.toLowerCase().includes(q));
  }, [jobPostings, jobSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!jobDropdownOpen) return;
    const handler = (e) => {
      if (jobDropdownRef.current && !jobDropdownRef.current.contains(e.target)) {
        setJobDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [jobDropdownOpen]);

  const handleStageChange = async (introId, newStage) => {
    // Show rejection modal for rejected stage
    if (newStage === "rejected") {
      setRejectionModal({ introId, pendingStage: newStage });
      setRejectionReason("");
      setRejectionNotes("");
      return;
    }

    setUpdatingStage(introId);
    try {
      await fetch(`/api/introductions/${introId}/stage`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      const intro = introductions.find(i => i.id === introId);
      if (intro) intro.stage = newStage;
    } finally {
      setUpdatingStage(null);
    }
  };

  const handleRejectionSubmit = async () => {
    if (!rejectionReason) return;
    const { introId, pendingStage } = rejectionModal;
    setUpdatingStage(introId);
    try {
      await fetch(`/api/introductions/${introId}/stage`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: pendingStage, rejectionReason, rejectionNotes }),
      });
      const intro = introductions.find(i => i.id === introId);
      if (intro) {
        intro.stage = pendingStage;
        intro.rejection_reason = rejectionReason;
        intro.rejection_notes = rejectionNotes;
      }
      setRejectionModal(null);
    } finally {
      setUpdatingStage(null);
    }
  };

  const handleRespondToInterest = async (introId, accept) => {
    setRespondingInterest(introId);
    try {
      await fetch("/api/introductions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ introductionId: introId, accept }),
      });
      const intro = introductions.find(i => i.id === introId);
      if (intro) {
        intro.status = accept ? "accepted" : "declined";
        intro.responded_at = new Date().toISOString();
        if (accept) intro.stage = "responded";
      }
    } finally {
      setRespondingInterest(null);
    }
  };

  const toggleMessages = (id) => setExpandedMessages(prev => ({ ...prev, [id]: !prev[id] }));

  const filteredIntros = useMemo(() => {
    let filtered = introductions;
    if (selectedJobId) {
      filtered = filtered.filter(i => i.job_id === selectedJobId);
    }
    if (activeStage !== "all") {
      filtered = filtered.filter(i => (i.stage || "outreach") === activeStage);
    }
    return filtered;
  }, [introductions, selectedJobId, activeStage]);

  const monthTrend = stats.lastMonth > 0
    ? Math.round(((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100)
    : stats.thisMonth > 0 ? 100 : 0;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-neutral-100 grid place-items-center">
              <Building2 className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{employer.name}</h1>
              <p className="text-neutral-500 text-sm">Welcome back, {employerName}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/employer/${employer.slug}`}>
            <Button variant="secondary" className="gap-2"><ExternalLink className="w-4 h-4" /> Public Profile</Button>
          </Link>
          <Link href="/employer/talent">
            <Button className="gap-2"><Search className="w-4 h-4" /> Search Talent</Button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card className="bg-white border-neutral-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary-50 grid place-items-center"><Send className="w-5 h-5 text-primary-500" /></div>
              <div><div className="text-2xl font-semibold">{stats.total}</div><div className="text-xs text-neutral-500">Total Intros</div></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-neutral-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 grid place-items-center"><CheckCircle className="w-5 h-5 text-emerald-600" /></div>
              <div><div className="text-2xl font-semibold">{stats.responseRate}%</div><div className="text-xs text-neutral-500">Accept Rate</div></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-neutral-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-50 grid place-items-center"><Clock className="w-5 h-5 text-purple-600" /></div>
              <div><div className="text-2xl font-semibold">{stats.avgResponseHours != null ? `${stats.avgResponseHours}h` : "--"}</div><div className="text-xs text-neutral-500">Avg Response</div></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-neutral-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-yellow-50 grid place-items-center"><Clock className="w-5 h-5 text-yellow-600" /></div>
              <div><div className="text-2xl font-semibold">{stats.pending}</div><div className="text-xs text-neutral-500">Pending</div></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-neutral-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl ${monthTrend >= 0 ? "bg-emerald-50" : "bg-red-50"} grid place-items-center`}>
                {monthTrend >= 0 ? <TrendingUp className="w-5 h-5 text-emerald-600" /> : <TrendingDown className="w-5 h-5 text-red-500" />}
              </div>
              <div>
                <div className="text-2xl font-semibold">{stats.thisMonth}</div>
                <div className="text-xs text-neutral-500">This Month {monthTrend !== 0 && <span className={monthTrend > 0 ? "text-emerald-600" : "text-red-500"}>{monthTrend > 0 ? "+" : ""}{monthTrend}%</span>}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Pipeline View */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-white border-neutral-200">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5" /> Hiring Pipeline</h2>

              {/* Job Filter */}
              {jobPostings.length > 0 && (
                <div className="relative mb-4" ref={jobDropdownRef}>
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2 block">Filter by posting</label>
                  <button
                    onClick={() => setJobDropdownOpen(!jobDropdownOpen)}
                    className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-neutral-300 transition text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-primary-50 grid place-items-center shrink-0">
                        {selectedJobId ? <Briefcase className="w-4 h-4 text-primary-500" /> : <ClipboardList className="w-4 h-4 text-primary-500" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-neutral-800 truncate">
                          {selectedJobId
                            ? jobPostings.find(p => p.jobId === selectedJobId)?.title || selectedJobId
                            : "All Postings"}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {selectedJobId ? selectedJobId : "Showing introductions across all jobs"}
                        </div>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-neutral-500 shrink-0 transition-transform ${jobDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {jobDropdownOpen && (
                    <div className="absolute z-30 left-0 right-0 mt-2 rounded-xl bg-white border border-neutral-200 shadow-2xl overflow-hidden">
                      {jobPostings.length > 5 && (
                        <div className="p-2 border-b border-neutral-200">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                            <input
                              type="text"
                              value={jobSearch}
                              onChange={(e) => setJobSearch(e.target.value)}
                              placeholder="Search postings..."
                              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-9 pr-3 py-2 text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:border-primary-300"
                              autoFocus
                            />
                          </div>
                        </div>
                      )}
                      <div className="max-h-64 overflow-y-auto py-1">
                        <button
                          onClick={() => { setSelectedJobId(""); setJobDropdownOpen(false); setJobSearch(""); }}
                          className={`w-full text-left px-3 py-2.5 flex items-center gap-3 text-sm transition ${
                            selectedJobId === "" ? "bg-primary-50 text-primary-700" : "hover:bg-neutral-50 text-neutral-600"
                          }`}
                        >
                          <ClipboardList className="w-3.5 h-3.5 shrink-0 text-neutral-500" />
                          <span>All Postings</span>
                        </button>
                        {filteredPostings.map(p => (
                          <button
                            key={p.jobId}
                            onClick={() => { setSelectedJobId(p.jobId); setJobDropdownOpen(false); setJobSearch(""); }}
                            className={`w-full text-left px-3 py-2.5 flex items-center gap-3 text-sm transition ${
                              selectedJobId === p.jobId ? "bg-primary-50 text-primary-700" : "hover:bg-neutral-50 text-neutral-600"
                            }`}
                          >
                            <Briefcase className="w-3.5 h-3.5 shrink-0 text-neutral-500" />
                            <span className="truncate">{p.title}</span>
                            <span className="text-xs text-neutral-400 font-mono ml-auto shrink-0">{p.jobId}</span>
                          </button>
                        ))}
                        {filteredPostings.length === 0 && (
                          <div className="px-3 py-4 text-sm text-neutral-500 text-center">No postings match &ldquo;{jobSearch}&rdquo;</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Stage Tabs */}
              <div className="flex flex-wrap gap-2 mb-4">
                {(() => {
                  const jobFiltered = selectedJobId
                    ? introductions.filter(i => i.job_id === selectedJobId)
                    : introductions;
                  return (
                    <>
                      <button
                        onClick={() => setActiveStage("all")}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${activeStage === "all" ? "bg-primary-50 text-primary-500 border border-primary-200" : "bg-neutral-50 border border-neutral-200 text-neutral-500 hover:text-neutral-700"}`}
                      >
                        All ({jobFiltered.length})
                      </button>
                      {Object.entries(STAGE_LABELS).map(([stage, label]) => {
                        const count = jobFiltered.filter(i => (i.stage || "outreach") === stage).length;
                        return (
                          <button
                            key={stage}
                            onClick={() => setActiveStage(stage)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${activeStage === stage ? STAGE_COLORS[stage]?.replace("bg-", "bg-") + " border" : "bg-neutral-50 border border-neutral-200 text-neutral-500 hover:text-neutral-700"}`}
                          >
                            {label} ({count})
                          </button>
                        );
                      })}
                    </>
                  );
                })()}
              </div>

              {filteredIntros.length > 0 ? (
                <div className="space-y-3">
                  {filteredIntros.slice(0, 15).map((intro) => (
                    <div key={intro.id} className="p-4 rounded-xl border border-neutral-200 bg-white space-y-2">
                      <div>
                        {intro.status === "accepted" && intro.candidate_name ? (
                          <div className="font-medium">{intro.candidate_name}</div>
                        ) : (
                          <div className="font-medium text-neutral-500">Candidate</div>
                        )}
                        <div className="text-xs text-neutral-500">
                          {intro.initiated_by === "candidate" ? "Expressed interest" : "Sent"} {new Date(intro.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          {intro.responded_at && ` · Responded ${new Date(intro.responded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={STATUS_COLORS[intro.status] || STATUS_COLORS.pending}>
                          {intro.status || "pending"}
                        </Badge>
                        {intro.initiated_by === "candidate" && (
                          <Badge className="bg-amber-50 text-amber-600 border-amber-300 text-xs">
                            <HeartHandshake className="w-3 h-3 mr-1" /> Candidate Interest
                          </Badge>
                        )}
                        <select
                          value={intro.stage || "outreach"}
                          onChange={(e) => handleStageChange(intro.id, e.target.value)}
                          disabled={updatingStage === intro.id}
                          className="bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1 text-xs text-neutral-700"
                        >
                          {Object.entries(STAGE_LABELS).map(([s, l]) => (
                            <option key={s} value={s}>{l}</option>
                          ))}
                        </select>
                        {intro.job_title ? (
                          <Badge className="bg-purple-50 text-purple-600 border-purple-200 text-xs">
                            <Briefcase className="w-3 h-3 mr-1 shrink-0" /> {intro.job_title}
                          </Badge>
                        ) : intro.job_id ? (
                          <Badge className="bg-purple-50 text-purple-600 border-purple-200 text-xs">
                            <Briefcase className="w-3 h-3 mr-1 shrink-0" /> {intro.job_id}
                          </Badge>
                        ) : (
                          <Badge className="bg-neutral-50 text-neutral-500 border-neutral-200 text-xs">General</Badge>
                        )}
                      </div>

                      {/* Accept/Decline for candidate-initiated pending intros */}
                      {intro.initiated_by === "candidate" && intro.status === "pending" && (
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" className="gap-1.5 flex-1" onClick={() => handleRespondToInterest(intro.id, true)} disabled={respondingInterest === intro.id}>
                            <CheckCircle className="w-3.5 h-3.5" /> Accept
                          </Button>
                          <Button size="sm" variant="secondary" className="gap-1.5 flex-1" onClick={() => handleRespondToInterest(intro.id, false)} disabled={respondingInterest === intro.id}>
                            <XCircle className="w-3.5 h-3.5" /> Decline
                          </Button>
                        </div>
                      )}

                      {intro.message && (
                        <div className="text-sm text-neutral-500 line-clamp-2 mb-2">{intro.message}</div>
                      )}
                      {intro.employer_notes && (
                        <div className="text-xs text-neutral-500 mt-1 italic">Notes: {intro.employer_notes}</div>
                      )}
                      {intro.rejection_reason && (
                        <div className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Rejection: {REJECTION_REASONS.find(r => r.value === intro.rejection_reason)?.label || intro.rejection_reason}
                          {intro.rejection_notes && <span className="text-neutral-500 ml-1">— {intro.rejection_notes}</span>}
                        </div>
                      )}
                      {intro.status === "accepted" && intro.candidate_email && (
                        <div className="flex items-center gap-2 text-sm text-emerald-600 mt-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                          <Mail className="w-4 h-4" />
                          <a href={`mailto:${intro.candidate_email}`} className="hover:underline">{intro.candidate_email}</a>
                          {intro.candidate_linkedin && (
                            <>
                              <span className="text-neutral-400">|</span>
                              <a href={intro.candidate_linkedin} target="_blank" rel="noreferrer" className="hover:underline">LinkedIn</a>
                            </>
                          )}
                        </div>
                      )}

                      {/* Message thread for accepted intros */}
                      {intro.status === "accepted" && (
                        <div className="mt-2">
                          <button
                            onClick={() => toggleMessages(intro.id)}
                            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700 transition"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Messages
                            {expandedMessages[intro.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                          {expandedMessages[intro.id] && <EmployerMessageThread introId={intro.id} />}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50 text-neutral-400" />
                  <p className="text-neutral-500 mb-3">{activeStage === "all" ? "No introductions yet." : `No introductions in ${STAGE_LABELS[activeStage]} stage.`}</p>
                  <Link href="/employer/talent">
                    <Button className="gap-2"><Search className="w-4 h-4" /> Search Talent</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          {stats.recentActivity?.length > 0 && (
            <Card className="bg-white border-neutral-200">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Activity className="w-5 h-5" /> Recent Activity</h2>
                <div className="space-y-3">
                  {stats.recentActivity.slice(0, 10).map((a) => (
                    <div key={a.id} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <div className="text-neutral-700">{ACTIVITY_LABELS[a.action] || a.action}</div>
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
          <Card className="bg-white border-neutral-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-3">Company Profile</h3>
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="text-neutral-500">Name:</span>
                  <div className="font-medium">{employer.name}</div>
                </div>
                {employer.website && (
                  <div className="text-sm">
                    <span className="text-neutral-500">Website:</span>
                    <div><a href={employer.website} target="_blank" rel="noreferrer" className="text-primary-500 hover:underline flex items-center gap-1"><Globe className="w-3 h-3" /> {employer.website}</a></div>
                  </div>
                )}
                {employer.description && (
                  <p className="text-sm text-neutral-600 line-clamp-3">{employer.description}</p>
                )}
              </div>
              <Link href="/employer/profile">
                <Button variant="secondary" size="sm" className="w-full mt-4 gap-1">
                  <Edit3 className="w-3 h-3" /> Edit Profile
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Shortlists */}
          {shortlists && shortlists.length > 0 && (
            <Card className="bg-white border-neutral-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><List className="w-5 h-5" /> Shortlists</h3>
                <div className="space-y-2">
                  {shortlists.map(sl => (
                    <Link key={sl.id} href={`/employer/shortlists/${sl.id}`} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-primary-200 transition text-sm">
                      <span>{sl.name}</span>
                      <Badge className="bg-neutral-50 border-neutral-200 text-neutral-500">{sl.candidate_count || 0}</Badge>
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
            <Card className="bg-white border-neutral-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><BookmarkPlus className="w-5 h-5" /> Saved Searches</h3>
                <div className="space-y-2">
                  {savedSearches.map(ss => (
                    <Link key={ss.id} href={`/employer/talent?${new URLSearchParams(ss.filters || {}).toString()}`} className="flex items-center gap-2 p-3 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-primary-200 transition text-sm">
                      <Search className="w-3 h-3 text-neutral-500" /> {ss.name}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Rejection Reason Modal */}
      {rejectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" /> Rejection Reason
            </h3>
            <p className="text-sm text-neutral-500 mb-4">WORC compliance requires documenting why a candidate was not selected.</p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Reason *</label>
                <select
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-700"
                >
                  <option value="">Select a reason...</option>
                  {REJECTION_REASONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Notes (optional)</label>
                <textarea
                  value={rejectionNotes}
                  onChange={e => setRejectionNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm text-neutral-700"
                  placeholder="Additional details..."
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => setRejectionModal(null)}>Cancel</Button>
                <Button className="flex-1 gap-1.5" disabled={!rejectionReason || updatingStage} onClick={handleRejectionSubmit}>
                  {updatingStage ? "Saving..." : "Confirm Rejection"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
