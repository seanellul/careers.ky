"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { List, Plus, Trash2, ChevronRight, Users } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function ShortlistsClient({ shortlists: initialShortlists }) {
  const router = useRouter();
  const [shortlists, setShortlists] = useState(initialShortlists);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/employer/shortlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (res.ok) {
        setNewName("");
        setShowCreate(false);
        router.refresh();
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    await fetch("/api/employer/shortlists", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setShortlists(shortlists.filter(s => s.id !== id));
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100">
      <div id="bg-gradient" aria-hidden className="fixed inset-0 -z-10 bg-[length:200%_200%]" style={{ backgroundImage: "radial-gradient(1200px 1200px at 10% 10%, rgba(56,189,248,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 90% 20%, rgba(34,197,94,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 50% 110%, rgba(147,51,234,0.12) 0%, transparent 60%)", backgroundPosition: "0% 50%" }} />

      <Navigation />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight flex items-center gap-3">
            <List className="w-7 h-7 text-cyan-300" /> Shortlists
          </h1>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" /> New Shortlist
          </Button>
        </div>

        {showCreate && (
          <Card className="bg-white/5 border-white/10 mb-6">
            <CardContent className="p-4 flex gap-3">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Shortlist name..."
                className="bg-white/5 border-white/10 flex-1"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
              <Button onClick={handleCreate} disabled={creating}>{creating ? "Creating..." : "Create"}</Button>
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            </CardContent>
          </Card>
        )}

        {shortlists.length > 0 ? (
          <div className="space-y-3">
            {shortlists.map(sl => (
              <Card key={sl.id} className="bg-white/5 border-white/10 hover:border-cyan-300/40 transition">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <Link href={`/employer/shortlists/${sl.id}`} className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-white/10 grid place-items-center">
                        <Users className="w-5 h-5 text-cyan-300" />
                      </div>
                      <div>
                        <div className="font-medium">{sl.name}</div>
                        <div className="text-sm text-neutral-400">{sl.candidate_count || 0} candidate{sl.candidate_count !== 1 ? "s" : ""}</div>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleDelete(sl.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-neutral-400 hover:text-red-400 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <Link href={`/employer/shortlists/${sl.id}`}>
                        <ChevronRight className="w-5 h-5 text-neutral-400" />
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-12 text-center">
              <List className="w-12 h-12 mx-auto mb-4 opacity-50 text-neutral-400" />
              <h3 className="text-lg font-medium mb-2">No shortlists yet</h3>
              <p className="text-neutral-400 mb-4">Create a shortlist to save and organize candidates.</p>
              <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> Create Shortlist</Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
}
