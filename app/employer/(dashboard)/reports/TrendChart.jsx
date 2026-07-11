"use client";

import { useState } from "react";

// Dependency-free stacked bar trend chart (SVG). Palette validated with the
// dataviz six-checks script for both the light and dark surfaces; the
// low-contrast light slots are relieved by the legend, hover tooltip, and the
// monthly table on the WORC report page.
//
// Series colors are CSS custom properties so dark mode (html.dark) swaps them,
// and `.wf-paper` (the print report sheet) pins the light palette.
const PALETTE_CSS = `
.wf-viz { --wf-s1:#2a78d6; --wf-s2:#1baf7a; --wf-s3:#eda100; --wf-mut:#898781;
  --wf-grid:#e1e0d9; --wf-axis:#c3c2b7; }
html.dark .wf-viz { --wf-s1:#3987e5; --wf-s2:#199e70; --wf-s3:#c98500;
  --wf-grid:#2c2c2a; --wf-axis:#383835; }
.wf-paper .wf-viz, html.dark .wf-paper .wf-viz { --wf-s1:#2a78d6; --wf-s2:#1baf7a;
  --wf-s3:#eda100; --wf-mut:#898781; --wf-grid:#e1e0d9; --wf-axis:#c3c2b7; }
@media print {
  .wf-viz { --wf-s1:#2a78d6; --wf-s2:#1baf7a; --wf-s3:#eda100; --wf-mut:#898781;
    --wf-grid:#e1e0d9; --wf-axis:#c3c2b7;
    -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthLabel(ym, withYear) {
  const [y, m] = ym.split("-");
  const name = MONTH_NAMES[Number(m) - 1] || ym;
  return withYear ? `${name} ’${y.slice(2)}` : name;
}

function niceMax(v) {
  if (v <= 4) return Math.max(v, 1);
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  for (const mult of [1, 2, 4, 5, 10]) {
    if (mult * pow >= v) return mult * pow;
  }
  return 10 * pow;
}

// Rect with only the top corners rounded (4px data-end, square baseline)
function topRoundedRect(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`;
}

// months: ["2025-08", ...]
// series: [{ label, color (css var), values: number[] aligned to months }]
export default function TrendChart({ title, months, series }) {
  const [hover, setHover] = useState(null); // { index, xPct }

  const W = 640;
  const H = 210;
  const pad = { top: 10, right: 8, bottom: 22, left: 34 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const totals = months.map((_, i) => series.reduce((sum, s) => sum + (s.values[i] || 0), 0));
  const rawMax = Math.max(...totals, 0);
  const isEmpty = rawMax === 0;
  const yMax = niceMax(rawMax);
  // largest tick count <= 5 that divides yMax evenly, so every tick is a clean integer
  const tickCount = [5, 4, 3, 2, 1].find((d) => yMax % d === 0);
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (yMax / tickCount) * i);

  const band = plotW / months.length;
  const barW = Math.min(24, band * 0.55);
  const GAP = 2; // surface gap between stacked segments

  const yFor = (v) => pad.top + plotH - (v / yMax) * plotH;

  return (
    <div className="wf-viz relative">
      <style>{PALETTE_CSS}</style>
      {title && (
        <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          {title}
        </div>
      )}

      {isEmpty ? (
        <div className="h-40 grid place-items-center text-sm text-neutral-400">
          No activity in the last 12 months
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          role="img"
          aria-label={title}
          onMouseLeave={() => setHover(null)}
        >
          {/* gridlines + y ticks */}
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={pad.left}
                x2={W - pad.right}
                y1={yFor(t)}
                y2={yFor(t)}
                stroke={t === 0 ? "var(--wf-axis)" : "var(--wf-grid)"}
                strokeWidth="1"
              />
              <text
                x={pad.left - 6}
                y={yFor(t) + 3}
                textAnchor="end"
                fontSize="9"
                fill="var(--wf-mut)"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {t.toLocaleString()}
              </text>
            </g>
          ))}

          {/* stacked bars */}
          {months.map((m, i) => {
            const x = pad.left + band * i + (band - barW) / 2;
            let cumulative = 0;
            const segs = [];
            const monthSeries = series
              .map((s) => ({ ...s, v: s.values[i] || 0 }))
              .filter((s) => s.v > 0);
            monthSeries.forEach((s, si) => {
              const y0 = yFor(cumulative);
              const y1 = yFor(cumulative + s.v);
              const isTop = si === monthSeries.length - 1;
              const h = Math.max(y0 - y1 - (isTop ? 0 : GAP), 1);
              segs.push(
                isTop ? (
                  <path key={s.label} d={topRoundedRect(x, y1, barW, h, 4)} fill={s.color} />
                ) : (
                  <rect key={s.label} x={x} y={y1 + GAP} width={barW} height={h} fill={s.color} />
                )
              );
              cumulative += s.v;
            });

            return (
              <g key={m}>
                {segs}
                {/* hover hit target: the whole month band */}
                <rect
                  x={pad.left + band * i}
                  y={pad.top}
                  width={band}
                  height={plotH}
                  fill="transparent"
                  onMouseEnter={() =>
                    setHover({ index: i, xPct: ((pad.left + band * (i + 0.5)) / W) * 100 })
                  }
                />
                <text
                  x={pad.left + band * (i + 0.5)}
                  y={H - 8}
                  textAnchor="middle"
                  fontSize="9"
                  fill="var(--wf-mut)"
                >
                  {monthLabel(m, i === 0 || m.endsWith("-01"))}
                </text>
              </g>
            );
          })}
        </svg>
      )}

      {/* legend — identity never rides on color alone */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {series.map((s) => (
          <span
            key={s.label}
            className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400"
          >
            <span
              aria-hidden
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{ background: s.color }}
            />
            {s.label}
          </span>
        ))}
      </div>

      {/* tooltip */}
      {hover && !isEmpty && (
        <div
          className="absolute top-6 z-10 pointer-events-none rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-md px-3 py-2 text-xs print:hidden"
          style={{
            left: `${hover.xPct}%`,
            transform: hover.xPct > 55 ? "translateX(-105%)" : "translateX(6px)",
          }}
        >
          <div className="font-medium text-neutral-700 dark:text-neutral-200 mb-1">
            {monthLabel(months[hover.index], true)}
          </div>
          {series.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5 whitespace-nowrap">
              <span
                aria-hidden
                className="inline-block w-2 h-2 rounded-sm"
                style={{ background: s.color }}
              />
              <span className="text-neutral-500 dark:text-neutral-400">{s.label}</span>
              <span
                className="ml-auto pl-3 text-neutral-700 dark:text-neutral-200"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {s.values[hover.index] || 0}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-neutral-100 dark:border-neutral-800">
            <span className="text-neutral-500 dark:text-neutral-400">Total</span>
            <span
              className="ml-auto pl-3 font-medium text-neutral-700 dark:text-neutral-200"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {totals[hover.index]}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
