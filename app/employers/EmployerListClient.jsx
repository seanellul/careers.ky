"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Building2, TrendingUp, DollarSign } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function EmployerListClient({ employers }) {
  const [q, setQ] = useState("");
  const [showActive, setShowActive] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 24;

  const filtered = useMemo(() => {
    return employers.filter(e => {
      if (q && !e.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (showActive && Number(e.active_postings) === 0) return false;
      return true;
    });
  }, [employers, q, showActive]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const view = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalActive = employers.filter(e => Number(e.active_postings) > 0).length;

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100">
      <div id="bg-gradient" aria-hidden className="fixed inset-0 -z-10 bg-[length:200%_200%]" style={{ backgroundImage: "radial-gradient(1200px 1200px at 10% 10%, rgba(56,189,248,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 90% 20%, rgba(34,197,94,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 50% 110%, rgba(147,51,234,0.12) 0%, transparent 60%)", backgroundPosition: "0% 50%" }} />

      <Navigation />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-4">
            Cayman <span className="text-cyan-300">Employers</span>
          </h1>
          <p className="text-neutral-300 text-lg max-w-3xl">
            Browse {employers.length} employers across the Cayman Islands. {totalActive} are currently hiring.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10"><CardContent className="p-4 md:p-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-cyan-400/15 grid place-items-center"><Building2 className="w-5 h-5 text-cyan-300" /></div><div><div className="text-2xl md:text-3xl font-semibold">{employers.length}</div><div className="text-xs md:text-sm text-neutral-400">Total Employers</div></div></div></CardContent></Card>
          <Card className="bg-white/5 border-white/10"><CardContent className="p-4 md:p-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-emerald-400/15 grid place-items-center"><TrendingUp className="w-5 h-5 text-emerald-300" /></div><div><div className="text-2xl md:text-3xl font-semibold">{totalActive}</div><div className="text-xs md:text-sm text-neutral-400">Currently Hiring</div></div></div></CardContent></Card>
          <Card className="bg-white/5 border-white/10 col-span-2 md:col-span-1"><CardContent className="p-4 md:p-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-purple-400/15 grid place-items-center"><DollarSign className="w-5 h-5 text-purple-300" /></div><div><div className="text-2xl md:text-3xl font-semibold">{employers.reduce((a, e) => a + Number(e.total_postings), 0).toLocaleString()}</div><div className="text-xs md:text-sm text-neutral-400">Total Postings</div></div></div></CardContent></Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search employers..." className="pl-10 bg-white/5 border-white/10 h-12 text-base" />
          </div>
          <Button variant={showActive ? "default" : "secondary"} onClick={() => { setShowActive(!showActive); setPage(1); }} className="gap-2 h-12">
            <TrendingUp className="w-4 h-4" /> {showActive ? "Show All" : "Currently Hiring"}
          </Button>
        </div>

        <div className="mb-4 text-sm text-neutral-300">
          Showing {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} employers
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {view.map((e) => (
            <Link key={e.slug} href={`/employer/${e.slug}`}>
              <Card className="bg-white/5 border-white/10 hover:border-cyan-300/40 transition h-full cursor-pointer">
                <CardContent className="p-5 h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-white/10 grid place-items-center shrink-0">
                      <Building2 className="w-5 h-5 text-neutral-400" />
                    </div>
                    <h3 className="font-medium leading-tight line-clamp-2">{e.name}</h3>
                  </div>
                  <div className="space-y-1 text-sm text-neutral-400 mb-3">
                    <div>{Number(e.total_postings)} total postings</div>
                    {Number(e.active_postings) > 0 && <div className="text-emerald-300">{Number(e.active_postings)} active now</div>}
                    {Number(e.avg_salary) > 0 && <div>Avg: CI$ {Math.round(Number(e.avg_salary)).toLocaleString()}</div>}
                  </div>
                  <div className="mt-auto flex gap-1">
                    {Number(e.active_postings) > 0 && <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-300/30 text-xs">Hiring</Badge>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-neutral-300">Page {page} of {totalPages}</div>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
            <Button variant="secondary" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
