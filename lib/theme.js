/**
 * Centralized theme module for careers.ky
 *
 * Warm, friendly, Caymanian-first aesthetic with dark mode support.
 * Import `t` and use: className={t.page} or className={`${t.card} p-6`}
 *
 * All classes include `dark:` variants where needed.
 * Dark mode is toggled via the `dark` class on <html>.
 *
 * Color palette:
 *   cayman-warm  #FEFCF3  — page background (warm off-white)
 *   dark bg      #171412  — dark mode background
 *   primary-500  #0077B6  — ocean blue (primary actions)
 *   accent-500   #E76F51  — coral (warm accents)
 *   cayman-sand  #F4A261  — sand (highlights)
 */

// ── Page shells ──────────────────────────────────────────────
export const page = "min-h-screen bg-[#FEFCF3] dark:bg-[#171412] text-neutral-800 dark:text-neutral-100";
export const pageGradient =
  "fixed inset-0 -z-10 bg-[length:200%_200%]";
export const pageGradientStyle = {
  backgroundImage:
    "radial-gradient(1200px 1200px at 10% 10%, rgba(0,119,182,0.06) 0%, transparent 60%), radial-gradient(900px 900px at 90% 20%, rgba(244,162,97,0.06) 0%, transparent 60%), radial-gradient(900px 900px at 50% 110%, rgba(231,111,81,0.05) 0%, transparent 60%)",
  backgroundPosition: "0% 50%",
};

// ── Navigation ───────────────────────────────────────────────
export const nav =
  "sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-[#FEFCF3]/80 dark:supports-[backdrop-filter]:bg-[#171412]/80 border-b border-neutral-200 dark:border-neutral-800";
export const navInner =
  "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between";

// ── Sidebars ─────────────────────────────────────────────────
export const sidebar =
  "w-56 shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 min-h-screen";
export const sidebarLink =
  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors";
export const sidebarLinkActive =
  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-primary-50 dark:bg-primary-500/15 text-primary-700 dark:text-primary-300 font-medium";

// ── Cards ────────────────────────────────────────────────────
export const card = "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm";
export const cardHover = "hover:shadow-md hover:border-primary-500/30 transition-shadow";
export const cardInteractive = `${card} ${cardHover} cursor-pointer`;
export const cardSelected = "bg-white dark:bg-neutral-900 border-2 border-primary-500 rounded-2xl shadow-sm";
export const cardSelectedAccent = "bg-white dark:bg-neutral-900 border-2 border-accent-500 rounded-2xl shadow-sm";

// ── Glass (for overlaying on gradients) ──────────────────────
export const glass = "bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border border-neutral-200 dark:border-neutral-800 rounded-2xl";

// ── Text ─────────────────────────────────────────────────────
export const heading = "text-neutral-900 dark:text-neutral-100 font-semibold";
export const text = "text-neutral-700 dark:text-neutral-300";
export const textMuted = "text-neutral-500 dark:text-neutral-400";
export const textAccent = "text-primary-500";
export const textBrand = "text-primary-600 dark:text-primary-400";
export const textWarm = "text-accent-500";

// ── Buttons (use with shadcn Button variants mostly) ─────────
export const btnPrimary = "bg-primary-500 text-white hover:bg-primary-600";
export const btnSecondary =
  "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700";
export const btnGhost = "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100";
export const btnAccent = "bg-accent-500 text-white hover:bg-accent-600";

// ── Inputs ───────────────────────────────────────────────────
export const input =
  "bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 rounded-xl";

// ── Badges ───────────────────────────────────────────────────
export const badge = "bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300";
export const badgeAccent = "bg-primary-50 dark:bg-primary-500/15 border border-primary-200 dark:border-primary-500/30 text-primary-700 dark:text-primary-300";
export const badgeWarm = "bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300";

// ── Overlays / Modals ────────────────────────────────────────
export const overlay = "fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm";
export const modal =
  "relative w-full max-w-md mx-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-xl";

// ── Tables ───────────────────────────────────────────────────
export const tableHeader = "bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-medium uppercase tracking-wider";
export const tableRow = "border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors";

// ── Status colors ────────────────────────────────────────────
export const statusSuccess = "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30";
export const statusWarning = "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/30";
export const statusError = "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/15 border-red-200 dark:border-red-500/30";
export const statusInfo = "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/15 border-primary-200 dark:border-primary-500/30";

// ── Convenience: bundle as `t` for compact usage ─────────────
const t = {
  page, pageGradient, pageGradientStyle,
  nav, navInner,
  sidebar, sidebarLink, sidebarLinkActive,
  card, cardHover, cardInteractive, cardSelected, cardSelectedAccent,
  glass,
  heading, text, textMuted, textAccent, textBrand, textWarm,
  btnPrimary, btnSecondary, btnGhost, btnAccent,
  input,
  badge, badgeAccent, badgeWarm,
  overlay, modal,
  tableHeader, tableRow,
  statusSuccess, statusWarning, statusError, statusInfo,
};

export default t;
