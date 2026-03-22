"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Bell, LogOut, User, ChevronDown, Building2, Sun, Moon } from "lucide-react";
import { useSession } from "@/components/SessionProvider";
import { useTheme } from "@/components/ThemeProvider";
import Logo from "@/components/Logo";
import t from "@/lib/theme";

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const dropdownRef = useRef(null);

  const { session, loading, refresh } = useSession();
  const { theme, toggle: toggleTheme } = useTheme();

  const unreadCount = session?.unreadCount || 0;
  const pendingIntroCount = session?.pendingIntroCount || 0;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setShowDropdown(false);
    refresh();
    router.push("/");
    router.refresh();
  };

  const isEmployer = !!session?.employerAccountId;
  const isCandidate = !!session?.candidateId && !isEmployer;

  // Build nav items based on user state
  const navItems = [];
  navItems.push({ href: "/", label: "Home" });
  navItems.push({ href: "/careers", label: "Careers" });
  navItems.push({ href: "/about", label: "About" });

  if (isCandidate) {
    navItems.push({ href: "/dashboard", label: "Dashboard", badge: pendingIntroCount });
  }

  if (isEmployer) {
    navItems.push({ href: "/employer/dashboard", label: "Dashboard" });
  }

  const initial =
    session?.candidateName?.[0] || session?.employerName?.[0] || "U";

  const isNavActive = (href) => {
    if (href === "/") return pathname === "/";
    if (href === "/careers") return pathname === "/careers" || pathname.startsWith("/careers?");
    return pathname.startsWith(href);
  };

  return (
    <header className={t.nav}>
      <div className={t.navInner}>
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
          <div className="h-8 w-8">
            <Logo />
          </div>
          <span className="font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            careers<span className="text-primary-500">.ky</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-neutral-500 dark:text-neutral-400">
          {navItems.map((item) =>
            isNavActive(item.href) ? (
              <span key={item.href} className="text-primary-600 font-medium flex items-center gap-1.5">
                {item.label}
                {item.badge > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 bg-primary-500 rounded-full text-[10px] grid place-items-center font-semibold text-white">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </span>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-neutral-900 dark:hover:text-neutral-100 transition flex items-center gap-1.5"
              >
                {item.label}
                {item.badge > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 bg-primary-500 rounded-full text-[10px] grid place-items-center font-semibold text-white animate-pulse">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </Link>
            )
          )}

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition text-neutral-500 dark:text-neutral-400"
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {!loading && !session && (
            <Link
              href="/sign-in"
              className="px-4 py-1.5 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition text-sm font-medium"
            >
              Sign In
            </Link>
          )}

          {!loading && session && (
            <div className="flex items-center gap-3">
              <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition text-neutral-600 dark:text-neutral-400">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent-500 rounded-full text-[10px] grid place-items-center font-semibold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-100 transition"
                >
                  <div className="w-7 h-7 rounded-full bg-primary-50 dark:bg-primary-500/20 text-primary-600 dark:text-primary-300 grid place-items-center text-xs font-semibold">
                    {initial}
                  </div>
                  <ChevronDown className="w-3 h-3 text-neutral-400" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl overflow-hidden z-50">
                    {isEmployer ? (
                      <Link
                        href="/employer/profile"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
                      >
                        <Building2 className="w-4 h-4" /> Company Profile
                      </Link>
                    ) : (
                      <Link
                        href="/profile"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
                      >
                        <User className="w-4 h-4" /> Profile
                      </Link>
                    )}
                    <Link
                      href="/notifications"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
                    >
                      <Bell className="w-4 h-4" /> Notifications
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-neutral-50 transition w-full text-left text-red-500"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition text-neutral-600 dark:text-neutral-400"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-[#121212]/95 backdrop-blur">
          <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-3">
            {navItems.map((item) =>
              isNavActive(item.href) ? (
                <div
                  key={item.href}
                  className="px-4 py-3 rounded-lg bg-primary-50 border border-primary-200 text-primary-700 font-medium flex items-center justify-between"
                >
                  {item.label}
                  {item.badge > 0 && (
                    <span className="min-w-[20px] h-[20px] px-1.5 bg-primary-500 rounded-full text-[11px] grid place-items-center font-semibold text-white">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 text-left flex items-center justify-between"
                >
                  {item.label}
                  {item.badge > 0 && (
                    <span className="min-w-[20px] h-[20px] px-1.5 bg-primary-500 rounded-full text-[11px] grid place-items-center font-semibold text-white animate-pulse">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </Link>
              )
            )}
            {!loading && session && (
              <>
                {isEmployer ? (
                  <Link href="/employer/profile" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100">
                    Company Profile
                  </Link>
                ) : (
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100">
                    My Profile
                  </Link>
                )}
                <Link href="/notifications" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100">
                  Notifications
                </Link>
                <button onClick={handleLogout} className="px-4 py-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition text-red-500 text-left">
                  Sign Out
                </button>
              </>
            )}
            {!loading && !session && (
              <Link
                href="/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg bg-primary-500 text-white font-medium text-left hover:bg-primary-600 transition"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
