/**
 * Centralized theme module for careers.ky
 *
 * Warm, friendly, Caymanian-first aesthetic.
 * Import `t` and use: className={t.page} or className={`${t.card} p-6`}
 *
 * Color palette:
 *   cayman-warm  #FEFCF3  — page background (warm off-white)
 *   primary-500  #0077B6  — ocean blue (primary actions)
 *   primary-600  #005FA3  — ocean blue hover
 *   accent-500   #E76F51  — coral (warm accents, CTAs)
 *   cayman-sand  #F4A261  — sand (highlights, badges)
 */

// ── Page shells ──────────────────────────────────────────────
export const page = "min-h-screen bg-[#FEFCF3] text-neutral-800";
export const pageGradient =
  "fixed inset-0 -z-10 bg-[length:200%_200%]";
export const pageGradientStyle = {
  backgroundImage:
    "radial-gradient(1200px 1200px at 10% 10%, rgba(0,119,182,0.06) 0%, transparent 60%), radial-gradient(900px 900px at 90% 20%, rgba(244,162,97,0.06) 0%, transparent 60%), radial-gradient(900px 900px at 50% 110%, rgba(231,111,81,0.05) 0%, transparent 60%)",
  backgroundPosition: "0% 50%",
};

// ── Navigation ───────────────────────────────────────────────
export const nav =
  "sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-[#FEFCF3]/80 border-b border-neutral-200";
export const navInner =
  "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between";

// ── Sidebars ─────────────────────────────────────────────────
export const sidebar =
  "w-56 shrink-0 border-r border-neutral-200 bg-white min-h-screen";
export const sidebarLink =
  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors";
export const sidebarLinkActive =
  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-primary-50 text-primary-700 font-medium";

// ── Cards ────────────────────────────────────────────────────
export const card = "bg-white border border-neutral-200 rounded-2xl shadow-sm";
export const cardHover = "hover:shadow-md hover:border-primary-500/30 transition-shadow";
export const cardInteractive = `${card} ${cardHover} cursor-pointer`;
export const cardSelected = "bg-white border-2 border-primary-500 rounded-2xl shadow-sm";
export const cardSelectedAccent = "bg-white border-2 border-accent-500 rounded-2xl shadow-sm";

// ── Glass (for overlaying on gradients) ──────────────────────
export const glass = "bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-2xl";

// ── Text ─────────────────────────────────────────────────────
export const heading = "text-neutral-900 font-semibold";
export const text = "text-neutral-700";
export const textMuted = "text-neutral-500";
export const textAccent = "text-primary-500";
export const textBrand = "text-primary-600";
export const textWarm = "text-accent-500";

// ── Buttons (use with shadcn Button variants mostly) ─────────
export const btnPrimary = "bg-primary-500 text-white hover:bg-primary-600";
export const btnSecondary =
  "bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200";
export const btnGhost = "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900";
export const btnAccent = "bg-accent-500 text-white hover:bg-accent-600";

// ── Inputs ───────────────────────────────────────────────────
export const input =
  "bg-white border border-neutral-300 text-neutral-800 placeholder:text-neutral-400 rounded-xl";

// ── Badges ───────────────────────────────────────────────────
export const badge = "bg-neutral-100 border border-neutral-200 text-neutral-600";
export const badgeAccent = "bg-primary-50 border border-primary-200 text-primary-700";
export const badgeWarm = "bg-amber-50 border border-amber-200 text-amber-700";

// ── Overlays / Modals ────────────────────────────────────────
export const overlay = "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm";
export const modal =
  "relative w-full max-w-md mx-4 rounded-2xl bg-white border border-neutral-200 p-6 shadow-xl";

// ── Tables ───────────────────────────────────────────────────
export const tableHeader = "bg-neutral-50 text-neutral-600 text-xs font-medium uppercase tracking-wider";
export const tableRow = "border-b border-neutral-100 hover:bg-neutral-50 transition-colors";

// ── Status colors ────────────────────────────────────────────
export const statusSuccess = "text-emerald-600 bg-emerald-50 border-emerald-200";
export const statusWarning = "text-amber-600 bg-amber-50 border-amber-200";
export const statusError = "text-red-600 bg-red-50 border-red-200";
export const statusInfo = "text-primary-600 bg-primary-50 border-primary-200";

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
