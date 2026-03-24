"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, Users, List, FileText, MessageSquare,
  BarChart3, ExternalLink, Menu, X, Users2,
} from "lucide-react";

export default function DashboardSidebar({ employerSlug, accountRole }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = [
    { href: "/employer/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/employer/profile", label: "Profile", icon: Building2 },
    { href: "/employer/talent", label: "Talent Search", icon: Users },
    { href: "/employer/shortlists", label: "Shortlists", icon: List },
    { href: "/employer/reports", label: "Reports", icon: FileText },
    ...((accountRole === "owner" || accountRole === "admin")
      ? [{ href: "/employer/team", label: "Team", icon: Users2 }]
      : []),
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
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-400 dark:text-neutral-500 cursor-default"
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{item.label}</span>
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 text-neutral-500 dark:text-neutral-400">
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
                ? "bg-primary-50 dark:bg-primary-500/15 text-primary-700 dark:text-neutral-100 font-medium border border-primary-200 dark:border-primary-500/30"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100"
            }`}
          >
            <Icon className={`w-4 h-4 ${active ? "text-primary-600 dark:text-neutral-100" : ""}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}

      {externalLink && (
        <>
          <div className="my-2 border-t border-neutral-200 dark:border-neutral-700" />
          <Link
            href={externalLink.href}
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 transition"
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
        className="md:hidden fixed bottom-4 left-4 z-40 p-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-lg"
        aria-label="Open sidebar"
      >
        <Menu className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-56 sm:w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-700 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Navigation</span>
              <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
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
