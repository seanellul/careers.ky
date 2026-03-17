"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Send, HeartHandshake, Bell, User, ExternalLink, Menu, X,
} from "lucide-react";

export default function CandidateDashboardSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/introductions", label: "Introductions", icon: Send },
    { href: "/dashboard/interests", label: "Job Interests", icon: HeartHandshake },
    { href: "/dashboard/alerts", label: "Alerts", icon: Bell },
  ];

  const externalLink = { href: "/profile", label: "Edit Profile", icon: User };

  const isActive = (href) => {
    if (!href) return false;
    if (href === "/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  const navContent = (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
              active
                ? "bg-cyan-500/15 text-cyan-300 border border-cyan-300/20"
                : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200"
            }`}
          >
            <Icon className={`w-4 h-4 ${active ? "text-cyan-300" : ""}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}

      <div className="my-2 border-t border-white/5" />
      <Link
        href={externalLink.href}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-400 hover:bg-white/5 hover:text-neutral-200 transition"
      >
        <ExternalLink className="w-4 h-4" />
        <span>{externalLink.label}</span>
      </Link>
    </nav>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed bottom-4 left-4 z-40 p-3 rounded-xl bg-neutral-900 border border-white/10 shadow-lg"
        aria-label="Open sidebar"
      >
        <Menu className="w-5 h-5 text-neutral-300" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-56 sm:w-64 bg-neutral-950 border-r border-white/10 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-medium text-neutral-300">Navigation</span>
              <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg hover:bg-white/10">
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-60 shrink-0">
        <div className="sticky top-20 py-6 pr-6">
          {navContent}
        </div>
      </aside>
    </>
  );
}
