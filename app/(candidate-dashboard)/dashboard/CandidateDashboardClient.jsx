"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Send, CheckCircle, Clock, Building2, HeartHandshake, Briefcase,
  Search, User, Bell, ChevronRight, XCircle, ExternalLink, ArrowUpRight,
} from "lucide-react";
import { calcProfileStrength } from "@/lib/profileStrength";
import ProfileCompletenessCard from "@/components/ProfileCompletenessCard";

const STATUS_COLORS = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-300",
  accepted: "bg-emerald-50 text-emerald-600 border-emerald-300",
  declined: "bg-red-50 text-red-500 border-red-300",
};

function ProfilePicture({ url, name }) {
  const [imgError, setImgError] = useState(false);
  const initial = name?.[0]?.toUpperCase() || "?";
  if (url && !imgError) {
    return (
      <img
        src={url}
        alt={name || "Profile"}
        onError={() => setImgError(true)}
        className="w-14 h-14 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700"
      />
    );
  }
  return (
    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-100 to-purple-100 dark:from-primary-500/20 dark:to-purple-500/20 grid place-items-center text-xl font-semibold text-primary-600 dark:text-primary-400 border-2 border-neutral-200 dark:border-neutral-700">
      {initial}
    </div>
  );
}

export default function CandidateDashboardClient({
  candidate,
  interests,
  skills,
  introductions,
  jobInterests,
  alerts,
  notifications,
  unreadCount,
}) {
  const { score, missing } = calcProfileStrength(candidate, interests, skills);

  const pendingIntros = introductions.filter((i) => i.status === "pending");
  const acceptedIntros = introductions.filter((i) => i.status === "accepted");
  const [responding, setResponding] = useState(null);
  const [introList, setIntroList] = useState(introductions);

  const handleRespond = async (introId, accept) => {
    setResponding(introId);
    try {
      const res = await fetch("/api/introductions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ introductionId: introId, accept }),
      });
      if (res.ok) {
        setIntroList((prev) =>
          prev.map((i) =>
            i.id === introId
              ? { ...i, status: accept ? "accepted" : "declined", responded_at: new Date().toISOString() }
              : i
          )
        );
      }
    } finally {
      setResponding(null);
    }
  };

  const activePending = introList.filter((i) => i.status === "pending");
  const activeAccepted = introList.filter((i) => i.status === "accepted");

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <ProfilePicture url={candidate.profile_picture_url} name={candidate.name} />
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Welcome back, <span className="text-primary-500">{candidate.name || "there"}</span>
          </h1>
          {candidate.headline && (
            <p className="text-neutral-500 text-sm mt-1">{candidate.headline}</p>
          )}
        </div>
        {/* Profile strength mini-bar */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{score}%</div>
            <div className="text-xs text-neutral-500">Profile</div>
          </div>
          <div className="w-20 h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
        {/* Mobile profile strength badge */}
        <Badge className={`sm:hidden ${score >= 80 ? "bg-emerald-50 text-emerald-600 border-emerald-300" : score >= 50 ? "bg-yellow-50 text-yellow-700 border-yellow-300" : "bg-red-50 text-red-500 border-red-300"}`}>
          {score}%
        </Badge>
      </div>

      {/* Profile completeness card */}
      {score < 100 && (
        <div className="mb-6">
          <ProfileCompletenessCard score={score} missing={missing} />
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-yellow-100 dark:bg-yellow-500/20 grid place-items-center">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{activePending.length}</div>
              <div className="text-xs text-neutral-500">Pending Intros</div>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 grid place-items-center">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{activeAccepted.length}</div>
              <div className="text-xs text-neutral-500">Accepted</div>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-500/20 grid place-items-center">
              <HeartHandshake className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{jobInterests.length}</div>
              <div className="text-xs text-neutral-500">Jobs Interested</div>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-500/20 grid place-items-center">
              <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{score}%</div>
              <div className="text-xs text-neutral-500">Profile</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content — 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Introductions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                  <Send className="w-5 h-5 text-primary-500" />
                  Active Introductions
                </h2>
                <Link href="/dashboard/introductions" className="text-sm text-primary-500 hover:underline flex items-center gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {activePending.length === 0 && activeAccepted.length === 0 ? (
                <div className="text-center py-8">
                  <Send className="w-10 h-10 mx-auto mb-3 opacity-30 text-neutral-400" />
                  <p className="text-neutral-500 text-sm">No active introductions yet.</p>
                  <p className="text-neutral-400 text-xs mt-1">When employers want to connect, they&apos;ll appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...activePending, ...activeAccepted.slice(0, 3)].map((intro) => (
                    <div key={intro.id} className={`p-4 rounded-xl border-2 transition ${intro.status === "pending" ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 dark:border-yellow-500/40" : "border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"}`}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-neutral-200 dark:bg-neutral-700 grid place-items-center">
                            <Building2 className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                          </div>
                          <div>
                            <div className="font-medium text-sm text-neutral-900 dark:text-neutral-100">{intro.employer_name || intro.employer_contact_name || "An employer"}</div>
                            {intro.job_title && <div className="text-xs text-neutral-500">{intro.job_title}</div>}
                          </div>
                        </div>
                        <Badge className={STATUS_COLORS[intro.status]}>{intro.status}</Badge>
                      </div>
                      {intro.status === "pending" && intro.initiated_by !== "candidate" && (
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" onClick={() => handleRespond(intro.id, true)} disabled={responding === intro.id} className="gap-1.5 flex-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Accept
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => handleRespond(intro.id, false)} disabled={responding === intro.id} className="gap-1.5 flex-1">
                            <XCircle className="w-3.5 h-3.5" /> Decline
                          </Button>
                        </div>
                      )}
                      {intro.status === "pending" && intro.initiated_by === "candidate" && (
                        <p className="text-xs text-neutral-500 mt-2">Waiting for employer to respond.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Job Interests */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                  <HeartHandshake className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Recent Job Interests
                </h2>
                <Link href="/dashboard/interests" className="text-sm text-primary-500 hover:underline flex items-center gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {jobInterests.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30 text-neutral-400" />
                  <p className="text-neutral-500 text-sm">You haven&apos;t expressed interest in any jobs yet.</p>
                  <Link href="/careers" className="text-primary-500 text-sm hover:underline mt-2 inline-block">Browse Jobs</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {jobInterests.slice(0, 5).map((ji) => (
                    <Link key={ji.id} href={`/jobs/${ji.job_id || ji.id}`} className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-500/30 hover:shadow-sm transition">
                      <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-neutral-900 dark:text-neutral-100 truncate">{ji.job_title || "Untitled Role"}</div>
                        <div className="text-xs text-neutral-500 truncate">{ji.employer_name}</div>
                      </div>
                      <div className="text-xs text-neutral-400">
                        {new Date(ji.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar — 1 col */}
        <div className="space-y-6">
          {/* Profile Completion */}
          {score < 80 && (
            <Card className="border-primary-300 dark:border-primary-500/40 shadow-md">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                  <User className="w-4 h-4 text-primary-500" />
                  Complete Your Profile
                </h3>
                <div className="w-full h-2.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full ${score >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <p className="text-xs text-neutral-500 mb-3">{score}% complete — {missing.length} items remaining</p>
                <ul className="space-y-1.5 mb-4">
                  {missing.slice(0, 4).map((item) => (
                    <li key={item} className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                      {item}
                    </li>
                  ))}
                  {missing.length > 4 && (
                    <li className="text-xs text-neutral-500">+{missing.length - 4} more</li>
                  )}
                </ul>
                <Link href="/profile">
                  <Button size="sm" className="w-full gap-2">
                    <User className="w-3.5 h-3.5" /> Edit Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3 text-neutral-900 dark:text-neutral-100">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/careers" className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-500/30 hover:shadow-sm transition text-sm bg-neutral-50 dark:bg-neutral-800">
                  <Search className="w-4 h-4 text-primary-500" />
                  <span className="text-neutral-700 dark:text-neutral-300">Browse Jobs</span>
                  <ArrowUpRight className="w-3.5 h-3.5 ml-auto text-neutral-400" />
                </Link>
                <Link href="/profile" className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-500/30 hover:shadow-sm transition text-sm bg-neutral-50 dark:bg-neutral-800">
                  <User className="w-4 h-4 text-primary-500" />
                  <span className="text-neutral-700 dark:text-neutral-300">Edit Profile</span>
                  <ArrowUpRight className="w-3.5 h-3.5 ml-auto text-neutral-400" />
                </Link>
                <Link href="/dashboard/alerts" className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-500/30 hover:shadow-sm transition text-sm bg-neutral-50 dark:bg-neutral-800">
                  <Bell className="w-4 h-4 text-primary-500" />
                  <span className="text-neutral-700 dark:text-neutral-300">Manage Alerts</span>
                  <ArrowUpRight className="w-3.5 h-3.5 ml-auto text-neutral-400" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                  <Bell className="w-4 h-4" />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 bg-primary-500 rounded-full text-[10px] grid place-items-center font-semibold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </h3>
                <Link href="/notifications" className="text-xs text-primary-500 hover:underline">View all</Link>
              </div>
              {notifications.length === 0 ? (
                <p className="text-xs text-neutral-500">No notifications yet.</p>
              ) : (
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <div key={n.id} className={`p-3 rounded-lg text-xs border ${n.read_at ? "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700" : "bg-primary-50 dark:bg-primary-500/10 border-primary-300 dark:border-primary-500/30"}`}>
                      <div className="font-medium text-neutral-800 dark:text-neutral-200">{n.title}</div>
                      <div className="text-neutral-500 mt-0.5">{n.body}</div>
                      <div className="text-neutral-400 mt-1">
                        {new Date(n.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
