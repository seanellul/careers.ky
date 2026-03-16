"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Send, CheckCircle, XCircle, Clock, Building2, Mail, ExternalLink,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const STATUS_COLORS = {
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-300/30",
  accepted: "bg-emerald-500/20 text-emerald-300 border-emerald-300/30",
  declined: "bg-red-500/20 text-red-300 border-red-300/30",
};

const STATUS_ICONS = {
  pending: Clock,
  accepted: CheckCircle,
  declined: XCircle,
};

export default function IntroductionsClient({ introductions: initialIntros }) {
  const [introductions, setIntroductions] = useState(initialIntros);
  const [responding, setResponding] = useState(null);

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

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100">
      <div id="bg-gradient" aria-hidden className="fixed inset-0 -z-10 bg-[length:200%_200%]" style={{ backgroundImage: "radial-gradient(1200px 1200px at 10% 10%, rgba(56,189,248,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 90% 20%, rgba(34,197,94,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 50% 110%, rgba(147,51,234,0.12) 0%, transparent 60%)", backgroundPosition: "0% 50%" }} />

      <Navigation />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            <span className="text-cyan-300">Introductions</span>
          </h1>
          <p className="text-neutral-400">
            Employers who want to connect with you. Accept to share your contact details.
          </p>
        </div>

        {introductions.length === 0 && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-12 text-center">
              <Send className="w-12 h-12 mx-auto mb-4 opacity-50 text-neutral-400" />
              <h3 className="text-lg font-medium mb-2">No introductions yet</h3>
              <p className="text-neutral-400 mb-4">When employers want to connect, their requests will appear here.</p>
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
              <Clock className="w-5 h-5 text-yellow-300" />
              Pending ({pending.length})
            </h2>
            <div className="space-y-4">
              {pending.map((intro) => (
                <Card key={intro.id} className="bg-white/5 border-yellow-300/20">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/10 grid place-items-center">
                          <Building2 className="w-5 h-5 text-neutral-400" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {intro.employer_name || intro.employer_contact_name || "An employer"}
                          </div>
                          {intro.employer_slug && (
                            <Link href={`/employer/${intro.employer_slug}`} className="text-xs text-cyan-300 hover:underline flex items-center gap-1">
                              View company <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                      <Badge className={STATUS_COLORS.pending}>Pending</Badge>
                    </div>

                    {intro.message && (
                      <p className="text-sm text-neutral-300 mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
                        "{intro.message}"
                      </p>
                    )}

                    <div className="text-xs text-neutral-500 mb-4">
                      Received {new Date(intro.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </div>

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
                  <Card key={intro.id} className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/10 grid place-items-center">
                            <Building2 className="w-4 h-4 text-neutral-400" />
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
                        <Badge className={STATUS_COLORS[intro.status]}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {intro.status}
                        </Badge>
                      </div>

                      {intro.status === "accepted" && intro.employer_contact_email && (
                        <div className="flex items-center gap-2 text-sm text-emerald-300 mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-300/20">
                          <Mail className="w-4 h-4" />
                          <span>Employer contact: </span>
                          <a href={`mailto:${intro.employer_contact_email}`} className="hover:underline font-medium">
                            {intro.employer_contact_email}
                          </a>
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

      <Footer />
    </div>
  );
}
