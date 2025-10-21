import React, { useState, useRef, useEffect } from "react";

// --- tiny SVG line chart (no external libs, works with React 19) ---
function MiniLineChart({ data, xKey, yKey, stroke = "currentColor", fill = "none", ySuffix = "", height = 160 }) {
  if (!data?.length) return null;
  const xs = data.map((d, i) => i);
  const ys = data.map((d) => Number(d[yKey]));
  const xMax = xs[xs.length - 1] || 1;
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const pad = (yMax - yMin) * 0.1 || 1; // 10% padding
  const minY = yMin - pad;
  const maxY = yMax + pad;
  const points = data
    .map((d, i) => {
      const x = (i / xMax) * 100;
      const y = 100 - ((Number(d[yKey]) - minY) / (maxY - minY)) * 100;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  // baseline area for subtle fill
  const area = `0,100 ${points} 100,100`;

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ height }} className="w-full">
      <defs>
        <linearGradient id={`grad-${yKey}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopOpacity="0.25" />
          <stop offset="100%" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={area} fill={fill === "none" ? "none" : fill} opacity="0.25" />
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// Generate one day of realistic hourly data (static demo; think: a batch read from SD card)
function generate24h() {
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
  const baseT = 22 + Math.random() * 2;
  const data = hours.map((h, i) => {
    const wave = 6 * Math.sin((Math.PI * (i - 6)) / 12); // warmer afternoon
    const temperature = +(baseT + wave + (Math.random() - 0.5) * 1.2).toFixed(1);
    const humidity = +(60 - wave + (Math.random() - 0.5) * 6).toFixed(0); // inverse of temp
    const conductivity = +(1.2 + (Math.sin(i / 3) + 1) * 0.5 + (Math.random() - 0.5) * 0.1).toFixed(2); // 0.5–2.5-ish
    return { hour: h, temperature, humidity, conductivity };
  });
  return data;
}

const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

export default function AgronomicPortal() {
  // --- Tabs state (accessible, ARIA-compliant) ---
  const tabs = [
    { id: "solo", label: "Solo" },
    { id: "sondas", label: "Sondas" },
    { id: "deteccao", label: "Detecção Remota" },
  ];
  const [tab, setTab] = useState("solo");
  const [focusedTab, setFocusedTab] = useState(0);
  const tabRefs = useRef([]);

  // --- Shape hover/selection state ---
  const [hoverId, setHoverId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  // --- Shapes (SVG paths in native 546x829 coordinates) ---
  const shapes = [
    {
      id: "custom-path-1",
      type: "path",
      d: "m87.38 605.94c0.2 24.83 1.59 24.82 2.11 49.66 0.11 5.26-0.8 9.38 0 10.53 1.9 2.69 3.73-11.97 9.34-22.92 11.76-22.96 10.81-25.26 29.3-42.82 12.99-12.35 13.9-12.67 30.2-20.46 12.72-6.07 13.21-5.67 27-8.97 10.71-2.56 10.91-3.35 21.81-3.57 18.28-0.37 19.44-0.08 36.5 6.54 6.1 2.37 5.5 4.01 11.6 6.44 0.96 0.39 1.47 0.78 2.04 0.45 0.8-0.48-0.01-1.47-0.02-2.94-0.03-3.89-0.28-3.9-0.1-7.78 0.75-16.47 1.2-16.52 3.67-32.85 2.12-13.99 3.51-13.81 5.22-27.84 0.39-3.21 1.63-6.51 0.41-6.48-0.71 0.02-1.38 1.27-2.57 2.7-8.09 9.73-6.6 11.16-15.25 20.25-17.09 17.94-17.45 21.06-40.09 29.96-15.8 6.21-17.2 5.8-34.42 5.81-15.97 0.01-16.96 0.14-31.97-5.05-19.18-6.63-19.68-8.22-35.39-21.41-7.42-6.23-6.35-7.49-13.56-14.06-2.31-2.11-3.5-5.02-4.82-4-0.57 0.43-0.46 1.3-0.49 2.62-0.4 14.5 1.04 14.57 1.22 29.15 0.35 28.51-1.96 28.52-1.74 57.04z",
    },
    { id: "fresh-1", type: "path", fillRule: "evenodd", d: "m74 464.75c0-55.72 45.26-100.75 101.26-100.75 8.15 0 16.09 0.96 23.68 2.76l-52.17 194.7c-42.09-12.21-72.77-50.84-72.77-96.71z" },
    { id: "fresh-2", type: "path", fillRule: "evenodd", d: "m175.26 565.49c-11.32 0-22.19-1.84-32.35-5.23l52.08-194.35c46.52 9.11 81.52 49.84 81.52 98.84 0 55.71-45.26 100.74-101.25 100.74z" },
    { id: "fresh-3", type: "path", fillRule: "evenodd", d: "m207.5 810.03c-65.53 0-118.5-54.77-118.5-122.53 0-67.76 52.97-122.53 118.5-122.53q4.83 0 9.56 0.39l-8.54 244.67q-0.51 0-1.02 0z" },
    { id: "fresh-4", type: "path", fillRule: "evenodd", d: "m207.5 810.03q-3.95 0-7.84-0.26l8.54-244.8c65.21 0.39 117.8 55.01 117.8 122.53 0 67.76-52.97 122.53-118.5 122.53z" },
  ];

  // Labels per shape
  const shapeLabels = {
    "custom-path-1": "Parcela 3",
    "fresh-1": "Parcela 1",
    "fresh-2": "Parcela 2",
    "fresh-3": "Parcela 4",
    "fresh-4": "Parcela 5",
  };

  // Title: selected parcela or all
  const title = selectedId ? (shapeLabels[selectedId] || "Parcela") : "Todas as Parcelas";

  const colorFor = (id) => {
    const base = "fill-sky/30 stroke-chlorophyll/70"; // idle
    const hover = "fill-sun/40 stroke-sun"; // hover
    const active = "fill-chlorophyll/50 stroke-chlorophyll"; // selected
    if (selectedId === id) return active;
    if (hoverId === id) return hover;
    return base;
  };

  // --- Sondas chart data ---
  const [series] = useState(generate24h());

  // Last reading (most recent hour)
  const last = series && series.length ? series[series.length - 1] : {};

  // Keyboard navigation for ARIA tabs
  useEffect(() => {
    const idx = tabs.findIndex((t) => t.id === tab);
    if (idx >= 0) setFocusedTab(idx);
  }, [tab]);

  // daily averages for KPIs (based on hourly values)
  const avgTemp = +(avg(series.map((d) => d.temperature)).toFixed(1));
  const avgHum = +(avg(series.map((d) => d.humidity)).toFixed(0));
  const avgCond = +(avg(series.map((d) => d.conductivity)).toFixed(2));

  return (
    <div className="h-screen bg-gradient-to-b from-chlorophyll/5 to-chlorophyll/10 text-gray-800">
      {/* Toolbar */}
      <header role="toolbar" aria-label="Main application toolbar" className="fixed top-0 left-0 right-0 h-14 bg-white/90 backdrop-blur shadow-soft border-b border-chlorophyll/20 z-50">
        <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-chlorophyll text-white flex items-center justify-center font-bold"></div>
            <div className="font-handwritten text-xl text-chlorophyll">Proof of concept Portal Dashboard</div>
          </div>
        </div>
      </header>

      {/* Main below toolbar */}
      <div className="pt-14 h-full flex overflow-hidden">
        {/* LEFT: map column (pixel-perfect) */}
        <aside className="flex-none border-r border-chlorophyll/20 bg-white select-none">
          <div className="relative h-[calc(100vh-3.5rem)] aspect-[546/829]">
            {/* Base image */}
            <img src="https://raw.githubusercontent.com/Food4Sustainability/VGT_dashboard/refs/heads/main/mapa.jpg" alt="mapa" className="absolute inset-0 block h-full w-auto object-contain" draggable={false} />

            {/* SVG overlay (same 546x829 viewBox) */}
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 546 829" preserveAspectRatio="xMidYMid meet" aria-label="Mapa interativo" onClick={(e) => { if (e.target === e.currentTarget) setSelectedId(null); }}>
              <g>
                {shapes.map((s) => {
                  const common = {
                    key: s.id,
                    onMouseEnter: () => setHoverId(s.id),
                    onMouseLeave: () => setHoverId((pid) => (pid === s.id ? null : pid)),
                    onClick: () => setSelectedId((id) => (id === s.id ? null : s.id)),
                    className: ["cursor-pointer transition-all duration-150", "stroke-2", colorFor(s.id)].join(" "),
                  };
                  if (s.type === "path") return <path {...common} d={s.d} fillRule={s.fillRule} />;
                  return null;
                })}
              </g>
            </svg>
          </div>
        </aside>

        {/* RIGHT: content; horizontally scrollable on tight width */}
        <main className="flex-1 min-w-0 overflow-x-auto overflow-y-auto">
          <div className="min-w-[48rem] px-10 py-8 bg-gradient-to-b from-white to-chlorophyll/5">
            <h1 className="text-3xl font-semibold text-chlorophyll mb-6 font-handwritten">{title}</h1>

            {/* Tabs */}
            <div
              role="tablist"
              aria-label="Secções da parcela"
              className="flex space-x-8 border-b border-chlorophyll/20 mb-6 text-sm font-medium"
              onKeyDown={(e) => {
                const lastIdx = tabs.length - 1;
                if (e.key === "ArrowRight") {
                  e.preventDefault();
                  const next = focusedTab === lastIdx ? 0 : focusedTab + 1;
                  setFocusedTab(next);
                  tabRefs.current[next]?.focus();
                } else if (e.key === "ArrowLeft") {
                  e.preventDefault();
                  const prev = focusedTab === 0 ? lastIdx : focusedTab - 1;
                  setFocusedTab(prev);
                  tabRefs.current[prev]?.focus();
                } else if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  const t = tabs[focusedTab];
                  setTab(t.id);
                }
              }}
            >
              {tabs.map((t, i) => {
                const active = tab === t.id;
                const base = "pb-2 transition-colors duration-200";
                const activeCls = "border-b-2 border-chlorophyll text-chlorophyll";
                const idleCls = "text-gray-500 hover:text-chlorophyll";
                return (
                  <button
                    key={t.id}
                    role="tab"
                    id={`tab-${t.id}`}
                    aria-controls={`panel-${t.id}`}
                    aria-selected={active}
                    tabIndex={active ? 0 : -1}
                    ref={(el) => (tabRefs.current[i] = el)}
                    onClick={() => {
                      setTab(t.id);
                      setFocusedTab(i);
                    }}
                    className={[base, active ? activeCls : idleCls].join(" ")}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* SOLO */}
            <section role="tabpanel" id="panel-solo" aria-labelledby="tab-solo" hidden={tab !== "solo"}>
              <h2 className="text-lg font-semibold text-chlorophyll mb-3 border-l-4 border-chlorophyll pl-3">Análise de Solo</h2>
              <iframe title="Hortipor (3)" width="1000" height="600" src="https://app.powerbi.com/view?r=eyJrIjoiMDMzZWEyYTctMGE3MC00ZjYyLTkxYTEtYWUyM2UxZTM4NWU0IiwidCI6IjRlNGJiMjQ3LWZjN2MtNGY3YS1iNTYzLTdiZTRmMDkzZWZkZCIsImMiOjl9&pageName=101883f99518a994bd0a" frameBorder="0" allowFullScreen></iframe>
            </section>

            {/* SONDAS */}
            <section role="tabpanel" id="panel-sondas" aria-labelledby="tab-sondas" hidden={tab !== "sondas"}>
              <h2 className="text-lg font-semibold text-chlorophyll mb-4 border-l-4 border-chlorophyll pl-3">Sondas</h2>

              {/* KPI tiles (daily averages) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl shadow-soft p-4">
                  <div className="text-xs text-gray-500">Temperatura média (dia)</div>
                  <div className="text-3xl font-semibold text-chlorophyll">{Number.isFinite(avgTemp) ? `${avgTemp}°C` : "--"}</div>
                </div>
                <div className="bg-white rounded-2xl shadow-soft p-4">
                  <div className="text-xs text-gray-500">Humidade média (dia)</div>
                  <div className="text-3xl font-semibold text-chlorophyll">{Number.isFinite(avgHum) ? `${avgHum}%` : "--"}</div>
                </div>
                <div className="bg-white rounded-2xl shadow-soft p-4">
                  <div className="text-xs text-gray-500">Condutividade média (dia)</div>
                  <div className="text-3xl font-semibold text-chlorophyll">{Number.isFinite(avgCond) ? `${avgCond} dS/m` : "--"}</div>
                </div>
              </div>


              {/* Line charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl shadow-soft p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-chlorophyll">Temperatura (°C)</div>
                    <div className="text-xs text-gray-500">média diária</div>
                  </div>
                  <MiniLineChart data={series} xKey="hour" yKey="temperature" stroke="#ffb703" fill="#ffb703" />
                </div>
                <div className="bg-white rounded-2xl shadow-soft p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-chlorophyll">Humidade Relativa (%)</div>
                    <div className="text-xs text-gray-500">média diária</div>
                  </div>
                  <MiniLineChart data={series} xKey="hour" yKey="humidity" stroke="#8ecae6" fill="#8ecae6" />
                </div>
                <div className="bg-white rounded-2xl shadow-soft p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-chlorophyll">Condutividade (dS/m)</div>
                    <div className="text-xs text-gray-500">média diária</div>
                  </div>
                  <MiniLineChart data={series} xKey="hour" yKey="conductivity" stroke="#3bb143" fill="#3bb143" />
                </div>
              </div>

            </section>

            {/* DETECÇÃO REMOTA */}
            <section role="tabpanel" id="panel-deteccao" aria-labelledby="tab-deteccao" hidden={tab !== "deteccao"}>
              <h2 className="text-lg font-semibold text-chlorophyll mb-3 border-l-4 border-chlorophyll pl-3">Detecção Remota</h2>
              <div className="text-gray-600">(Em desenvolvimento)</div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
