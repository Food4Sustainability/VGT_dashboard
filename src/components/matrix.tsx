// App.tsx — PoC matched to your sketch. Debugged & tightened.
// Notes:
// - MORE parcels & parameters
// - NEGATIVE values (bars extend LEFT of reference line)
// - Single mid GREEN (no light/dark variants)
// - Fat bars, tall dotted reference line (small, subtle dots), bottom parameter labels
// - Horizontal scroll; anchored parcel labels
// - Width floors enforce: green ≤ yellow ≤ red (yellow never shorter than green; red never shorter than yellow)
//
// IMPORTANT (bugfix): fixed malformed DATA for Parcel 5 (stray props after the bars object).
// Also added tiny runtime assertions to sanity-check the width-floor rules.

import React from "react";

// ---- Layout constants ----
const ROW_LABEL_W = 110;   // tight parcel label column
const COL_MIN_W = 180;     // parameters closer together
const REF_X = 20;          // % position of dotted line inside each parameter column
const CELL_H = 48;         // compact rows so parcel names are close
const BAR_H = 48;          // very fat bars

// Reference line visual (small, subtle dots)
const REF_LINE_W = 1;            // ultra-slim column
const REF_DOT_DIAM = 2;          // VERY small dots
const REF_DOT_GAP = 8;           // tighter spacing
const REF_DOT_COLOR = "#9ca3af"; // lighter gray (slate-400)

// Minimum widths by color so YELLOW is never shorter than GREEN,
// and RED is never shorter than YELLOW (in pixels, applied to |size|)
const MIN_W = { g: 10, yl: 14, rd: 20 } as const;

// Columns (6 parameters + trailing label-only column like your sketch’s right block)
const COLUMNS = [
  { key: "p1", label: "Parameter 1" },
  { key: "p2", label: "Parameter 2" },
  { key: "p3", label: "Parameter 3" },
  { key: "p4", label: "Parameter 4" },
  { key: "p5", label: "Parameter 5" },
  { key: "p6", label: "Parameter 6" },
  { key: "rest", label: "Lab parameters" }, // label-only column
];

// Types
type Color = "g" | "yl" | "rd"; // single green, yellow, red
interface Bar { size: number; color: Color } // size in px; negative size draws left of reference
interface Row { id: string; name: string; bars: Record<string, Bar | null> }

// Mock data: more parcels, mixed positive/negative sizes
const DATA: Row[] = [
  {
    id: "parcel1",
    name: "Parcel 1",
    bars: { p1: { size: 18, color: "yl" }, p2: { size: -14, color: "g" }, p3: { size: 10, color: "g" }, p4: { size: 8, color: "yl" }, p5: { size: 60, color: "rd" }, p6: { size: 24, color: "g" }, rest: null },
  },
  {
    id: "parcel2",
    name: "Parcel 2",
    bars: { p1: { size: -22, color: "g" }, p2: { size: 36, color: "yl" }, p3: { size: 8, color: "g" }, p4: { size: 120, color: "rd" }, p5: { size: 14, color: "g" }, p6: { size: -12, color: "yl" }, rest: null },
  },
  {
    id: "parcel3",
    name: "Parcel 3",
    bars: { p1: { size: 16, color: "yl" }, p2: { size: 90, color: "rd" }, p3: { size: -10, color: "g" }, p4: { size: 12, color: "g" }, p5: { size: 18, color: "yl" }, p6: { size: 150, color: "rd" }, rest: null },
  },
  {
    id: "parcel4",
    name: "Parcel 4",
    bars: { p1: { size: 6, color: "g" }, p2: { size: -40, color: "yl" }, p3: { size: 22, color: "g" }, p4: { size: 16, color: "yl" }, p5: { size: -18, color: "g" }, p6: { size: 12, color: "g" }, rest: null },
  },
  {
    id: "parcel5",
    name: "Parcel 5",
    // NOTE: previously this row had stray properties after the bars object (syntax error). Fixed.
    bars: { p1: { size: 180, color: "rd" }, p2: { size: 8, color: "g" }, p3: { size: 14, color: "yl" }, p4: { size: -8, color: "g" }, p5: { size: 20, color: "g" }, p6: { size: 28, color: "yl" }, rest: null },
  },
  {
    id: "parcel6",
    name: "Parcel 6",
    bars: { p1: { size: 12, color: "g" }, p2: { size: 16, color: "g" }, p3: { size: 24, color: "yl" }, p4: { size: 8, color: "g" }, p5: { size: -14, color: "yl" }, p6: { size: 80, color: "rd" }, rest: null },
  },
  {
    id: "parcel7",
    name: "Parcel 7",
    bars: { p1: { size: -12, color: "g" }, p2: { size: 14, color: "g" }, p3: { size: 60, color: "rd" }, p4: { size: 10, color: "yl" }, p5: { size: 8, color: "g" }, p6: { size: 18, color: "g" }, rest: null },
  },
  {
    id: "parcel8",
    name: "Parcel 8",
    bars: { p1: { size: 20, color: "yl" }, p2: { size: 12, color: "g" }, p3: { size: -16, color: "g" }, p4: { size: 14, color: "g" }, p5: { size: 110, color: "rd" }, p6: { size: 10, color: "g" }, rest: null },
  },
];

// Single green, yellow, red
const colorFor = (c: Color) => {
  switch (c) {
    case "g":
      return "bg-green-500 border-green-600"; // middle green
    case "yl":
      return "bg-yellow-400 border-yellow-500";
    case "rd":
    default:
      return "bg-red-500 border-red-600";
  }
};

// helper to normalize width by color ordering rule
function normalizedWidth(px: number, color: Color) {
  const abs = Math.abs(px);
  const floor = MIN_W[color];
  return Math.max(abs, floor);
}

// discrete dot column for the reference line
function RefDots({ leftPercent, height }: { leftPercent: number; height: number }) {
  const numDots = Math.floor(height / REF_DOT_GAP) + 1;
  const dots = Array.from({ length: numDots });
  return (
    <div
      className="absolute"
      style={{ left: `${leftPercent}%`, top: 0, height, width: REF_LINE_W, transform: `translateX(-${REF_LINE_W / 2}px)` }}
    >
      {dots.map((_, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${(REF_LINE_W - REF_DOT_DIAM) / 2}px`,
            top: i * REF_DOT_GAP + 2, // small top margin so first dot isn't clipped
            width: REF_DOT_DIAM,
            height: REF_DOT_DIAM,
            backgroundColor: REF_DOT_COLOR,
          }}
        />
      ))}
    </div>
  );
}

export default function App() {
  // tiny runtime assertions so we catch regressions quickly
  React.useEffect(() => {
    console.assert(normalizedWidth(1, "yl") >= normalizedWidth(1, "g"), "Yellow must be ≥ Green");
    console.assert(normalizedWidth(1, "rd") >= normalizedWidth(1, "yl"), "Red must be ≥ Yellow");
    console.assert(normalizedWidth(-5, "g") === normalizedWidth(5, "g"), "Width floors apply to |size|");
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="max-w-screen-xl mx-auto p-6">
        {/* Title at top center */}
        <div className="text-center text-xl font-semibold mb-3">Reference line</div>

        {/* Chart frame */}
        <div className="overflow-x-auto rounded-2xl ring-1 ring-slate-200 shadow-sm">
          <div className="relative">
            {/* Left anchored thick line */}
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-slate-800/90" />

            {/* Rows */}
            {DATA.map((row, i) => (
              <div
                key={row.id}
                className="grid"
                style={{ gridTemplateColumns: `${ROW_LABEL_W}px repeat(${COLUMNS.length}, minmax(${COL_MIN_W}px, 1fr))` }}
              >
                {/* Parcel label */}
                <div className="sticky left-0 z-10 bg-white px-3 flex items-center border-r border-slate-200" style={{ height: CELL_H }}>
                  <span className="text-slate-900 truncate">{row.name}</span>
                </div>

                {COLUMNS.map((col) => (
                  <Cell key={col.key} value={row.bars[col.key]} stripe={i % 2 === 1} />
                ))}
              </div>
            ))}

            {/* Bottom labels */}
            <div
              className="grid border-t border-slate-200"
              style={{ gridTemplateColumns: `${ROW_LABEL_W}px repeat(${COLUMNS.length}, minmax(${COL_MIN_W}px, 1fr))` }}
            >
              <div className="px-2 py-3" />
              {COLUMNS.map((c) => (
                <div key={c.key} className="px-2 py-3 text-center text-slate-800 font-medium">{c.label}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="mt-3 text-center text-sm text-slate-500">Anchored ←   Horizontally Scrollable →</div>
      </div>
    </div>
  );
}

function Cell({ value, stripe }: { value: Bar | null; stripe: boolean }) {
  return (
    <div className={`${stripe ? "bg-slate-50" : "bg-white"} relative overflow-hidden`} style={{ height: CELL_H }}>
      {/* Tall dotted reference line rendered as discrete dots (not a solid chain) */}
      <RefDots leftPercent={REF_X} height={CELL_H} />

      {/* One fat bar starting at the reference; positive → right, negative → left */}
      {value && (
        <div className="absolute inset-0 flex items-center">
          {(() => {
            const w = normalizedWidth(value.size, value.color);
            if (value.size >= 0) {
              return (
                <div
                  className={`rounded-md border shadow-sm ${colorFor(value.color)}`}
                  style={{
                    height: BAR_H,
                    width: w,
                    left: `${REF_X}%`,
                    maxWidth: `calc(100% - ${REF_X}%)`,
                    position: "absolute",
                  }}
                />
              );
            }
            return (
              <div
                className={`rounded-md border shadow-sm ${colorFor(value.color)}`}
                style={{
                  height: BAR_H,
                  width: w,
                  left: `calc(${REF_X}% - ${w}px)`,
                  maxWidth: `calc(${REF_X}%)`,
                  position: "absolute",
                }}
              />
            );
          })()}
        </div>
      )}
    </div>
  );
}
