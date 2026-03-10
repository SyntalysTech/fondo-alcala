"use client";
import { useState, useEffect, useMemo } from "react";

const INTENT_LABELS = {
  reserva: "Reserva",
  cancelación: "Cancelación",
  modificación: "Modificación",
  consulta_horario: "Horario",
  consulta_carta: "Carta/Menú",
  consulta_ubicación: "Ubicación",
  consulta_precio: "Precios",
  consulta_mascotas: "Mascotas",
  consulta_terraza: "Terraza",
  consulta_eventos: "Eventos",
  consulta_general: "Consulta",
};

const INTENT_COLORS = {
  reserva: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelación: "bg-red-50 text-red-700 border-red-200",
  modificación: "bg-amber-50 text-amber-700 border-amber-200",
  consulta_horario: "bg-blue-50 text-blue-700 border-blue-200",
  consulta_carta: "bg-indigo-50 text-indigo-700 border-indigo-200",
  consulta_ubicación: "bg-violet-50 text-violet-700 border-violet-200",
  consulta_precio: "bg-cyan-50 text-cyan-700 border-cyan-200",
  consulta_mascotas: "bg-pink-50 text-pink-700 border-pink-200",
  consulta_terraza: "bg-teal-50 text-teal-700 border-teal-200",
  consulta_eventos: "bg-purple-50 text-purple-700 border-purple-200",
  consulta_general: "bg-slate-50 text-slate-700 border-slate-200",
};

const INTENT_BORDER = {
  reserva: "border-l-emerald-400",
  cancelación: "border-l-red-400",
  modificación: "border-l-amber-400",
  consulta_horario: "border-l-blue-400",
  consulta_carta: "border-l-indigo-400",
  consulta_ubicación: "border-l-violet-400",
  consulta_precio: "border-l-cyan-400",
  consulta_mascotas: "border-l-pink-400",
  consulta_terraza: "border-l-teal-400",
  consulta_eventos: "border-l-purple-400",
  consulta_general: "border-l-slate-400",
};

const FILTER_CATEGORIES = [
  { key: "todas", label: "Todas" },
  { key: "reservas", label: "Reservas", match: ["reserva", "modificación"] },
  {
    key: "consultas",
    label: "Consultas",
    match: [
      "consulta_horario",
      "consulta_carta",
      "consulta_ubicación",
      "consulta_precio",
      "consulta_mascotas",
      "consulta_terraza",
      "consulta_eventos",
      "consulta_general",
    ],
  },
  { key: "cancelaciones", label: "Cancelaciones", match: ["cancelación"] },
];

function formatTimestamp(iso) {
  const d = new Date(iso);
  return d.toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatSessionTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncate(str, max = 80) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "..." : str;
}

/* ─── Expandable Card for a single interaction ─── */
function CallEntry({ entry, isGrouped }) {
  const [expanded, setExpanded] = useState(false);

  const intentLabel =
    INTENT_LABELS[entry.intent] || entry.intent || "Consulta";
  const intentColor =
    INTENT_COLORS[entry.intent] || INTENT_COLORS.consulta_general;
  const borderColor =
    INTENT_BORDER[entry.intent] || INTENT_BORDER.consulta_general;

  return (
    <div
      className={`bg-white rounded-xl border border-warm-border border-l-4 ${borderColor} cursor-pointer transition-all duration-200 hover:shadow-sm ${
        isGrouped ? "" : ""
      }`}
      onClick={() => setExpanded((prev) => !prev)}
    >
      {/* Collapsed view */}
      <div className="p-4 flex items-center gap-3">
        {/* Timestamp */}
        <span className="text-xs text-stone-400 shrink-0 w-36">
          {formatTimestamp(entry.timestamp)}
        </span>

        {/* Intent badge */}
        <span
          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${intentColor}`}
        >
          {intentLabel}
        </span>

        {/* Message preview */}
        <span className="text-sm text-stone-600 truncate flex-1 min-w-0">
          {truncate(entry.userMessage, 90)}
        </span>

        {/* Keyword tags (collapsed - show first 3) */}
        {entry.keywords && entry.keywords.length > 0 && (
          <div className="hidden md:flex gap-1 shrink-0">
            {entry.keywords.slice(0, 3).map((kw, j) => (
              <span
                key={j}
                className="text-[10px] font-medium bg-gold/10 text-gold-dark px-2 py-0.5 rounded-full"
              >
                {kw}
              </span>
            ))}
            {entry.keywords.length > 3 && (
              <span className="text-[10px] text-stone-400">
                +{entry.keywords.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Expand chevron */}
        <svg
          className={`w-4 h-4 text-stone-400 shrink-0 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {/* Expanded view */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-5 pb-5 pt-1 border-t border-warm-border/60">
          {/* Chat bubbles */}
          <div className="space-y-3 mt-3">
            {/* User message */}
            <div className="flex gap-3">
              <span className="text-[10px] font-bold text-blue-500 uppercase mt-2 shrink-0 w-14 text-right">
                Usuario
              </span>
              <div className="bg-blue-50 border border-blue-100 rounded-xl rounded-tl-sm px-4 py-2.5 text-sm text-stone-700 flex-1 leading-relaxed">
                {entry.userMessage}
              </div>
            </div>

            {/* Agent response */}
            <div className="flex gap-3">
              <span className="text-[10px] font-bold text-gold uppercase mt-2 shrink-0 w-14 text-right">
                Agente
              </span>
              <div className="bg-gold/5 border border-gold/15 rounded-xl rounded-tl-sm px-4 py-2.5 text-sm text-stone-700 flex-1 leading-relaxed">
                {entry.agentResponse}
              </div>
            </div>
          </div>

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-warm-border/40">
            {/* Keywords */}
            {entry.keywords && entry.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {entry.keywords.map((kw, j) => (
                  <span
                    key={j}
                    className="text-[10px] font-semibold bg-gold/10 text-gold-dark border border-gold/20 px-2 py-0.5 rounded-full"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}

            <div className="flex-1" />

            {/* Intent */}
            <span className="text-[10px] text-stone-400">
              Intent:{" "}
              <span className="font-medium text-stone-500">
                {entry.intent || "N/A"}
              </span>
            </span>

            {/* Session ID */}
            <span className="text-[10px] text-stone-400">
              Sesión:{" "}
              <span className="font-mono font-medium text-stone-500">
                {entry.sessionId
                  ? entry.sessionId.slice(0, 12) + "..."
                  : "N/A"}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Session Group ─── */
function SessionGroup({ sessionId, entries }) {
  const [expanded, setExpanded] = useState(false);
  const startTime = entries[0]?.timestamp;

  return (
    <div className="space-y-0">
      {/* Session header */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center gap-3 px-4 py-2.5 bg-cream-dark/40 rounded-t-xl border border-warm-border hover:bg-cream-dark/60 transition-colors"
      >
        <svg
          className="w-4 h-4 text-gold-dark shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.694.198-.79 1.093-.234 1.649l3.558 3.558c.556.556 1.451.46 1.649-.234l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 13.852v1.148A1.5 1.5 0 0116.5 16h-1.572a10.5 10.5 0 01-10.428-10.428V3.5z" />
        </svg>
        <h3 className="text-sm font-serif font-semibold text-stone-700">
          Llamada
        </h3>
        <span className="text-xs text-stone-400">
          {formatSessionTime(startTime)}
        </span>
        <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full font-medium">
          {entries.length} mensaje{entries.length !== 1 ? "s" : ""}
        </span>
        <span className="text-[10px] font-mono text-stone-400 hidden sm:inline">
          {sessionId.slice(0, 12)}...
        </span>
        <div className="flex-1" />
        <svg
          className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Session entries */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-2 p-3 bg-cream/40 border border-t-0 border-warm-border rounded-b-xl">
          {entries.map((entry, i) => (
            <CallEntry key={i} entry={entry} isGrouped />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function HistorialPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("todas");
  const [expandedSingles, setExpandedSingles] = useState({});

  useEffect(() => {
    fetch("/api/metrics")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const callLog = data?.callLog || [];

  /* ─── Computed Stats ─── */
  const stats = useMemo(() => {
    const uniqueKeywords = new Set();
    const uniqueSessions = new Set();
    callLog.forEach((entry) => {
      if (entry.keywords) entry.keywords.forEach((kw) => uniqueKeywords.add(kw));
      if (entry.sessionId) uniqueSessions.add(entry.sessionId);
    });
    return {
      total: callLog.length,
      keywords: uniqueKeywords.size,
      sessions: uniqueSessions.size,
    };
  }, [callLog]);

  /* ─── Filtered entries ─── */
  const filtered = useMemo(() => {
    let entries = [...callLog].reverse();

    // Filter by intent category
    if (activeFilter !== "todas") {
      const category = FILTER_CATEGORIES.find((c) => c.key === activeFilter);
      if (category && category.match) {
        entries = entries.filter((e) => category.match.includes(e.intent));
      }
    }

    // Filter by search term
    if (search.trim()) {
      const q = search.toLowerCase();
      entries = entries.filter(
        (e) =>
          (e.userMessage && e.userMessage.toLowerCase().includes(q)) ||
          (e.agentResponse && e.agentResponse.toLowerCase().includes(q))
      );
    }

    return entries;
  }, [callLog, activeFilter, search]);

  /* ─── Group by session ─── */
  const grouped = useMemo(() => {
    const sessionMap = new Map();
    const singles = [];

    // Count occurrences of each sessionId
    const sessionCounts = {};
    filtered.forEach((entry) => {
      const sid = entry.sessionId || `_solo_${Math.random()}`;
      sessionCounts[sid] = (sessionCounts[sid] || 0) + 1;
    });

    // Build groups
    filtered.forEach((entry) => {
      const sid = entry.sessionId;
      if (sid && sessionCounts[sid] > 1) {
        if (!sessionMap.has(sid)) {
          sessionMap.set(sid, []);
        }
        sessionMap.get(sid).push(entry);
      } else {
        singles.push(entry);
      }
    });

    // Merge into ordered list by first timestamp
    const items = [];

    sessionMap.forEach((entries, sessionId) => {
      // Sort entries within session chronologically
      entries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      items.push({ type: "session", sessionId, entries, ts: entries[0].timestamp });
    });

    singles.forEach((entry) => {
      items.push({ type: "single", entry, ts: entry.timestamp });
    });

    // Sort by most recent first
    items.sort((a, b) => new Date(b.ts) - new Date(a.ts));

    return items;
  }, [filtered]);

  /* ─── Loading State ─── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* ─── Header ─── */}
      <div className="mb-5 md:mb-8">
        <h1 className="text-xl md:text-2xl font-serif font-bold text-stone-800 tracking-tight">
          Historial de Llamadas
        </h1>
        <p className="text-xs md:text-sm text-stone-400 mt-1">
          Registro de interacciones con el agente
        </p>
      </div>

      {/* ─── Stats Row ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Total */}
        <div className="bg-white rounded-xl border border-warm-border p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gold/5 rounded-bl-[40px]" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-gold-dark" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.694.198-.79 1.093-.234 1.649l3.558 3.558c.556.556 1.451.46 1.649-.234l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 13.852v1.148A1.5 1.5 0 0116.5 16h-1.572a10.5 10.5 0 01-10.428-10.428V3.5z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                Total interacciones
              </p>
              <p className="text-2xl font-bold text-stone-800">{stats.total}</p>
            </div>
          </div>
        </div>

        {/* Keywords */}
        <div className="bg-white rounded-xl border border-warm-border p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-[40px]" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.5 3A2.5 2.5 0 003 5.5v2.879a2.5 2.5 0 00.732 1.767l6.5 6.5a2.5 2.5 0 003.536 0l2.878-2.878a2.5 2.5 0 000-3.536l-6.5-6.5A2.5 2.5 0 008.38 3H5.5zM6 7a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                Keywords detectadas
              </p>
              <p className="text-2xl font-bold text-stone-800">{stats.keywords}</p>
            </div>
          </div>
        </div>

        {/* Sessions */}
        <div className="bg-white rounded-xl border border-warm-border p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-bl-[40px]" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                Sesiones únicas
              </p>
              <p className="text-2xl font-bold text-stone-800">{stats.sessions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Filter Bar ─── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar en mensajes..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-warm-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 text-stone-700 placeholder:text-stone-400"
          />
        </div>

        {/* Intent filter buttons */}
        <div className="flex flex-wrap gap-1.5">
          {FILTER_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveFilter(cat.key)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                activeFilter === cat.key
                  ? "bg-gold/10 border-gold/30 text-gold-dark"
                  : "bg-white border-warm-border text-stone-500 hover:bg-cream hover:text-stone-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Call Log ─── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-warm-border p-16 text-center">
          <svg
            className="w-16 h-16 mx-auto text-warm-gray mb-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <path d="M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2" />
            <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
            <line x1="9" y1="12" x2="15" y2="12" />
            <line x1="9" y1="16" x2="13" y2="16" />
          </svg>
          <p className="text-stone-500 text-sm max-w-sm mx-auto leading-relaxed">
            Las interacciones aparecerán aquí cuando el agente atienda llamadas.
            Prueba el agente de voz para generar datos.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map((item, i) =>
            item.type === "session" ? (
              <SessionGroup
                key={`s-${item.sessionId}`}
                sessionId={item.sessionId}
                entries={item.entries}
              />
            ) : (
              <CallEntry
                key={`e-${i}`}
                entry={item.entry}
                isGrouped={false}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
