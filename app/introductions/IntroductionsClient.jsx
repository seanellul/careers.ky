"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import t from "@/lib/theme";
import {
  Send, CheckCircle, XCircle, Clock, Building2, Mail, ExternalLink,
  Briefcase, DollarSign, HeartHandshake, MessageSquare, ChevronDown, ChevronUp,
} from "lucide-react";

const STATUS_COLORS = {
  pending: "bg-yellow-50 text-yellow-600 border-yellow-200",
  accepted: "bg-emerald-50 text-emerald-600 border-emerald-200",
  declined: "bg-red-50 text-red-500 border-red-200",
};

const STATUS_ICONS = {
  pending: Clock,
  accepted: CheckCircle,
  declined: XCircle,
};

function MessageThread({ introId }) {
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
        <div className="space-y-2 max-h-40 sm:max-h-60 overflow-y-auto">
          {messages.map(m => (
            <div key={m.id} className={`text-sm p-2 rounded-lg ${m.sender_type === "candidate" ? "bg-primary-50 dark:bg-primary-500/15 border border-primary-200 dark:border-primary-500/30 ml-2 sm:ml-4" : "bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 mr-2 sm:mr-4"}`}>
              <div className="text-xs text-neutral-500 mb-1">
                {m.sender_type === "candidate" ? "You" : "Employer"} &middot; {new Date(m.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </div>
              <div className="text-neutral-700 dark:text-neutral-300">{m.body}</div>
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
          className="flex-1 bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 placeholder:text-neutral-600 focus:outline-none focus:border-primary-300"
        />
        <Button size="sm" onClick={handleSend} disabled={sending || !newMessage.trim()}>
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

function JobContext({ intro }) {
  if (!intro.job_id) return null;
  const salary = intro.job_min_salary && intro.job_max_salary
    ? `$${Number(intro.job_min_salary).toLocaleString()} - $${Number(intro.job_max_salary).toLocaleString()}`
    : intro.job_salary_description || null;

  return (
    <Link href={`/jobs/${intro.job_id}`} className="flex items-center gap-2 text-sm p-3 rounded-lg bg-purple-50 border border-purple-200 hover:border-purple-300 transition mb-3">
      <Briefcase className="w-4 h-4 text-purple-600 shrink-0" />
      <span className="text-purple-700 font-medium truncate">{intro.job_title || intro.job_id}</span>
      {salary && (
        <>
          <span className="text-neutral-600 dark:text-neutral-400">|</span>
          <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="text-emerald-600 text-xs">{salary}</span>
        </>
      )}
    </Link>
  );
}

function DirectionBadge({ initiatedBy }) {
  if (initiatedBy === "candidate") {
    return <Badge className="bg-purple-50 text-purple-600 border-purple-200 text-xs"><HeartHandshake className="w-3 h-3 mr-1" /> You expressed interest</Badge>;
  }
  return <Badge className="bg-primary-50 dark:bg-primary-500/15 text-primary-500 border-primary-200 dark:border-primary-500/30 text-xs"><Building2 className="w-3 h-3 mr-1" /> Employer reached out</Badge>;
}

export default function IntroductionsClient({ introductions: initialIntros, embedded = false }) {
  const [introductions, setIntroductions] = useState(initialIntros);
  const [responding, setResponding] = useState(null);
  const [expandedMessages, setExpandedMessages] = useState({});

  const toggleMessages = (id) => setExpandedMessages(prev => ({ ...prev, [id]: !prev[id] }));

  const handleRespond = async (introId, accept) => {
    setResponding(introId);
    try {
      const res = await fetch("/api/introductions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ introductionId: introId, accept }),
      });
      if (res.ok) {
        setIntroductions(prev =>
          prev.map(i => i.id === introId ? {
            ...i,
            status: accept ? "accepted" : "declined",
            responded_at: new Date().toISOString(),
          } : i)
        );
      }
    } finally {
      setResponding(null);
    }
  };

  const pending = introductions.filter(i => i.status === "pending");
  const responded = introductions.filter(i => i.status !== "pending");

  const content = (
    <div className={embedded ? "" : "mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 md:py-12"}>
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            <span className="text-primary-500">Introductions</span>
          </h1>
          <p className="text-neutral-500">
            Employers who want to connect with you. Accept to share your contact details.
          </p>
        </div>

        {introductions.length === 0 && (
          <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
            <CardContent className="p-12 text-center">
              <Send className="w-12 h-12 mx-auto mb-4 opacity-50 text-neutral-500" />
              <h3 className="text-lg font-medium mb-2">No introductions yet</h3>
              <p className="text-neutral-500 mb-4">When employers want to connect, their requests will appear here.</p>
              <Link href="/profile">
                <Button variant="secondary">Complete Your Profile</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Pending Introductions */}
        {pending.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              Pending ({pending.length})
            </h2>
            <div className="space-y-4">
              {pending.map((intro) => (
                <Card key={intro.id} className="bg-white dark:bg-neutral-800 shadow-sm border-yellow-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 grid place-items-center">
                          <Building2 className="w-5 h-5 text-neutral-500" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {intro.employer_name || intro.employer_contact_name || "An employer"}
                          </div>
                          {intro.employer_slug && (
                            <Link href={`/employer/${intro.employer_slug}`} className="text-xs text-primary-500 hover:underline flex items-center gap-1">
                              View company <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={STATUS_COLORS.pending}>Pending</Badge>
                        <DirectionBadge initiatedBy={intro.initiated_by} />
                      </div>
                    </div>

                    <JobContext intro={intro} />

                    {intro.message && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 p-3 rounded-lg bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700">
                        &ldquo;{intro.message}&rdquo;
                      </p>
                    )}

                    <div className="text-xs text-neutral-500 mb-4">
                      Received {new Date(intro.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </div>

                    {intro.initiated_by !== "candidate" && (
                      <>
                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleRespond(intro.id, true)}
                            disabled={responding === intro.id}
                            className="gap-2 flex-1"
                          >
                            <CheckCircle className="w-4 h-4" /> Accept
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => handleRespond(intro.id, false)}
                            disabled={responding === intro.id}
                            className="gap-2 flex-1"
                          >
                            <XCircle className="w-4 h-4" /> Decline
                          </Button>
                        </div>
                        <p className="text-xs text-neutral-500 mt-2">
                          Accepting will share your name and email with this employer.
                        </p>
                      </>
                    )}
                    {intro.initiated_by === "candidate" && (
                      <p className="text-xs text-neutral-500">
                        Waiting for employer to respond to your interest.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Responded Introductions */}
        {responded.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Send className="w-5 h-5" />
              History ({responded.length})
            </h2>
            <div className="space-y-3">
              {responded.map((intro) => {
                const StatusIcon = STATUS_ICONS[intro.status] || Clock;
                return (
                  <Card key={intro.id} className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 grid place-items-center">
                            <Building2 className="w-4 h-4 text-neutral-500" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {intro.employer_name || intro.employer_contact_name || "Employer"}
                            </div>
                            <div className="text-xs text-neutral-500">
                              {new Date(intro.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DirectionBadge initiatedBy={intro.initiated_by} />
                          <Badge className={STATUS_COLORS[intro.status]}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {intro.status}
                          </Badge>
                        </div>
                      </div>

                      <JobContext intro={intro} />

                      {intro.status === "accepted" && intro.employer_contact_email && (
                        <div className="flex items-center gap-2 text-sm text-emerald-600 mt-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                          <Mail className="w-4 h-4" />
                          <span>Employer contact: </span>
                          <a href={`mailto:${intro.employer_contact_email}`} className="hover:underline font-medium">
                            {intro.employer_contact_email}
                          </a>
                        </div>
                      )}

                      {/* Message thread for accepted intros */}
                      {intro.status === "accepted" && (
                        <div className="mt-2">
                          <button
                            onClick={() => toggleMessages(intro.id)}
                            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-300 transition"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Messages
                            {expandedMessages[intro.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                          {expandedMessages[intro.id] && <MessageThread introId={intro.id} />}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
    </div>
  );

  if (embedded) return content;

  return (
    <div className={`${t.page} w-full`}>
      <div id="bg-gradient" aria-hidden className="fixed inset-0 -z-10 bg-[length:200%_200%]" style={t.pageGradientStyle} />
      {content}
    </div>
  );
}
