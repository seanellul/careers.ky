"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, Users, List, FileText, MessageSquare,
  BarChart3, ExternalLink, Menu, X,
} from "lucide-react";

export default function DashboardSidebar({ employerSlug }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = [
    { href: "/employer/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/employer/profile", label: "Profile", icon: Building2 },
    { href: "/employer/talent", label: "Talent Search", icon: Users },
    { href: "/employer/shortlists", label: "Shortlists", icon: List },
    { href: "/employer/reports", label: "Reports", icon: FileText, prominent: true },
    { href: null, label: "Messaging", icon: MessageSquare, comingSoon: true },
    { href: null, label: "Analytics", icon: BarChart3, comingSoon: true },
  ];

  const externalLink = employerSlug
    ? { href: `/employer/${employerSlug}`, label: "Public Profile", icon: ExternalLink }
    : null;

  const isActive = (href) => {
    if (!href) return false;
    if (href === "/employer/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  const navContent = (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);

        if (item.comingSoon) {
          return (
            <div
              key={item.label}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-500 cursor-default"
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{item.label}</span>
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-500">
                Soon
              </span>
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
              active
                ? "bg-cyan-500/15 text-cyan-300 border border-cyan-300/20"
                : item.prominent
                  ? "text-neutral-200 hover:bg-white/10 hover:text-white font-medium"
                  : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200"
            }`}
          >
            <Icon className={`w-4 h-4 ${active ? "text-cyan-300" : item.prominent ? "text-cyan-300" : ""}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}

      {externalLink && (
        <>
          <div className="my-2 border-t border-white/5" />
          <Link
            href={externalLink.href}
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-400 hover:bg-white/5 hover:text-neutral-200 transition"
          >
            <ExternalLink className="w-4 h-4" />
            <span>{externalLink.label}</span>
          </Link>
        </>
      )}
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
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-neutral-950 border-r border-white/10 p-4 overflow-y-auto">
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
