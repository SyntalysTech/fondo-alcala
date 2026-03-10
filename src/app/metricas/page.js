"use client";

import { useState, useEffect, useCallback } from "react";

const INTENT_LABELS = {
  reserva: "Reservas",
  cancelación: "Cancelaciones",
  consulta_horario: "Horario",
  consulta_carta: "Carta/Menú",
  consulta_ubicación: "Ubicación",
  consulta_precio: "Precios",
  consulta_terraza: "Terraza",
  consulta_eventos: "Eventos",
  consulta_general: "General",
  consulta_mascotas: "Mascotas",
  modificación: "Modificaciones",
};

const INTENT_COLORS = {
  reserva: "bg-emerald-100 text-emerald-700",
  cancelación: "bg-red-100 text-red-700",
  consulta_horario: "bg-blue-100 text-blue-700",
  consulta_carta: "bg-amber-100 text-amber-700",
  consulta_ubicación: "bg-purple-100 text-purple-700",
  consulta_precio: "bg-cyan-100 text-cyan-700",
  consulta_terraza: "bg-lime-100 text-lime-700",
  consulta_eventos: "bg-pink-100 text-pink-700",
  consulta_general: "bg-gray-100 text-gray-600",
  consulta_mascotas: "bg-orange-100 text-orange-700",
  modificación: "bg-indigo-100 text-indigo-700",
};

/* ─── SVG Icons ─── */

function PhoneIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SearchIcon({ className = "w-8 h-8" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function ChartIcon({ className = "w-8 h-8" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function TableIcon({ className = "w-8 h-8" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M10.875 12c-.621 0-1.125.504-1.125 1.125M12 12c.621 0 1.125.504 1.125 1.125m0-1.125c.621 0 1.125.504 1.125 1.125m-2.25 0c0 .621.504 1.125 1.125 1.125m0 0c.621 0 1.125.504 1.125 1.125" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}

function ActivityIcon({ className = "w-8 h-8" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

/* ─── Helpers ─── */

function formatDuration(seconds) {
  const s = Number(seconds) || 0;
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/* ─── Stat Card ─── */

function StatCard({ icon, label, value, accentColor, delta }) {
  const borderColors = {
    gold: "border-t-gold",
    green: "border-t-emerald-500",
    red: "border-t-red-500",
    blue: "border-t-blue-500",
  };

  const iconBgColors = {
    gold: "bg-gold/10 text-gold",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-500",
    blue: "bg-blue-50 text-blue-500",
  };

  const deltaColors = {
    gold: "text-gold-dark",
    green: "text-emerald-600",
    red: "text-red-500",
    blue: "text-blue-500",
  };

  return (
    <div
      className={`bg-white rounded-xl border border-warm-border ${borderColors[accentColor]} border-t-[3px] p-5 flex flex-col gap-3 hover:shadow-lg transition-shadow duration-300`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 font-medium">{label}</span>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBgColors[accentColor]}`}>
          {icon}
        </div>
      </div>
      <span className="font-serif text-4xl font-bold text-gray-900">{value}</span>
      <span className={`text-xs ${deltaColors[accentColor]} flex items-center gap-1`}>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
        </svg>
        vs. ultimo periodo
      </span>
    </div>
  );
}

/* ─── Export helper ─── */
function exportToCSV(data) {
  if (!data) return;

  const rows = [];

  // Metrics summary
  rows.push(["=== RESUMEN DE METRICAS ==="]);
  rows.push(["Llamadas Atendidas", data.totalCalls]);
  rows.push(["Reservas Generadas", data.totalReservations]);
  rows.push(["Cancelaciones", data.totalCancellations]);
  rows.push(["Duracion Media (s)", data.avgCallDuration]);
  rows.push([]);

  // Reservations
  rows.push(["=== RESERVAS ==="]);
  rows.push(["Nombre", "Fecha", "Hora", "Comensales", "Estado", "Telefono", "Notas", "Fuente"]);
  (data.reservations || []).forEach((r) => {
    rows.push([r.name, r.date, r.time, r.guests, r.status, r.phone, r.notes, r.source]);
  });
  rows.push([]);

  // Keywords
  rows.push(["=== PALABRAS CLAVE ==="]);
  rows.push(["Palabra", "Veces"]);
  Object.entries(data.keywords || {}).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    rows.push([k, v]);
  });
  rows.push([]);

  // Query distribution
  rows.push(["=== DISTRIBUCION DE CONSULTAS ==="]);
  rows.push(["Tipo", "Cantidad"]);
  Object.entries(data.queries || {}).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    rows.push([k, v]);
  });
  rows.push([]);

  // Call log
  rows.push(["=== REGISTRO DE INTERACCIONES ==="]);
  rows.push(["Fecha/Hora", "Sesion", "Cliente dice", "Agente responde", "Intencion", "Keywords"]);
  (data.callLog || []).forEach((entry) => {
    rows.push([
      entry.timestamp,
      entry.sessionId,
      entry.userMessage,
      entry.agentResponse,
      entry.intent,
      (entry.keywords || []).join("; "),
    ]);
  });

  // Build CSV
  const csvContent = rows
    .map((row) =>
      Array.isArray(row)
        ? row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
        : `"${row}"`
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `fonda-alcala-metricas-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/* ─── Main Component ─── */

export default function MetricasPage() {
  const [data, setData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [mounted, setMounted] = useState(false);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch("/api/metrics");
      if (!res.ok) return;
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch {
      // silent fail
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const totalCalls = data?.totalCalls ?? 0;
  const totalReservations = data?.totalReservations ?? 0;
  const totalCancellations = data?.totalCancellations ?? 0;
  const avgCallDuration = data?.avgCallDuration ?? 0;
  const keywords = data?.keywords ?? {};
  const queries = data?.queries ?? {};
  const callLog = data?.callLog ?? [];
  const dailyCalls = data?.dailyCalls ?? {};
  const peakHours = data?.peakHours ?? {};

  const maxQuery = Math.max(...Object.values(queries), 1);
  const recentLog = [...callLog].reverse().slice(0, 20);

  // Keywords sorted by count descending
  const sortedKeywords = Object.entries(keywords).sort((a, b) => b[1] - a[1]);
  const topKeyword = sortedKeywords.length > 0 ? sortedKeywords[0][0] : null;

  // Peak hours
  const peakHoursEntries = Object.entries(peakHours).map(([h, c]) => [Number(h), c]);
  const maxPeakCount = Math.max(...peakHoursEntries.map(([, c]) => c), 1);
  const busiestHourCount = Math.max(...peakHoursEntries.map(([, c]) => c), 0);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">Panel de Control</h1>
          <p className="text-gray-500 text-sm mt-1">Resumen de actividad del asistente de voz</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <p className="text-xs text-gray-400 hidden sm:block">
              Actualizado: {lastUpdated.toLocaleTimeString("es-ES")}
            </p>
          )}
          <button
            onClick={() => exportToCSV(data)}
            disabled={!data}
            className="inline-flex items-center gap-2 bg-gold text-white text-xs md:text-sm font-medium px-3 md:px-4 py-2 rounded-lg hover:bg-gold-dark transition-colors shadow-sm disabled:opacity-50"
          >
            <ExportIcon />
            Exportar
          </button>
        </div>
      </div>

      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<PhoneIcon />}
          label="Llamadas Atendidas"
          value={totalCalls}
          accentColor="gold"
        />
        <StatCard
          icon={<CalendarIcon />}
          label="Reservas Generadas"
          value={totalReservations}
          accentColor="green"
        />
        <StatCard
          icon={<XCircleIcon />}
          label="Cancelaciones"
          value={totalCancellations}
          accentColor="red"
        />
        <StatCard
          icon={<ClockIcon />}
          label="Duracion Media"
          value={formatDuration(avgCallDuration)}
          accentColor="blue"
        />
      </div>

      {/* ─── Two Columns: Keywords + Query Distribution ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Keywords */}
        <div className="bg-white rounded-xl border border-warm-border p-4 md:p-6 hover:shadow-lg transition-shadow duration-300">
          <h2 className="font-semibold text-gray-900 mb-3 md:mb-4 text-base md:text-lg flex items-center gap-2">
            <span className="w-1.5 h-5 bg-gold rounded-full inline-block"></span>
            Palabras Clave Detectadas
          </h2>
          {sortedKeywords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-300">
              <SearchIcon className="w-12 h-12 mb-3" />
              <p className="text-sm text-gray-400 font-medium">Sin palabras clave detectadas</p>
              <p className="text-xs text-gray-400 mt-1">Las keywords apareceran cuando se procesen llamadas</p>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap gap-2">
                {sortedKeywords.map(([word, count]) => (
                  <span
                    key={word}
                    className="inline-flex items-center gap-1.5 bg-gold/8 text-gold-dark px-3 py-1.5 rounded-full text-sm font-medium hover:bg-gold/15 transition-colors cursor-default"
                  >
                    {word}
                    <span className="bg-gold text-white text-xs font-bold rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1">
                      {count}
                    </span>
                  </span>
                ))}
              </div>
              {topKeyword && (
                <p className="mt-4 text-xs text-gray-500 bg-cream/60 rounded-lg px-3 py-2 border border-warm-border">
                  <span className="mr-1">💡</span>
                  Los clientes preguntan frecuentemente por <span className="font-semibold text-gold-dark">{topKeyword}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Query Distribution */}
        <div className="bg-white rounded-xl border border-warm-border p-4 md:p-6 hover:shadow-lg transition-shadow duration-300">
          <h2 className="font-semibold text-gray-900 mb-3 md:mb-4 text-base md:text-lg flex items-center gap-2">
            <span className="w-1.5 h-5 bg-gold rounded-full inline-block"></span>
            Distribucion de Consultas
          </h2>
          {Object.keys(queries).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-300">
              <ChartIcon className="w-12 h-12 mb-3" />
              <p className="text-sm text-gray-400 font-medium">Sin datos de consultas</p>
              <p className="text-xs text-gray-400 mt-1">La distribucion se mostrara al recibir consultas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(queries)
                .sort((a, b) => b[1] - a[1])
                .map(([intent, count]) => (
                  <div key={intent} className="flex items-center gap-3 group">
                    <span className="text-sm text-gray-600 w-28 shrink-0 text-right group-hover:text-gray-900 transition-colors">
                      {INTENT_LABELS[intent] || intent}
                    </span>
                    <div className="flex-1 h-7 bg-cream-dark rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light transition-all duration-700 ease-out"
                        style={{ width: mounted ? `${(count / maxQuery) * 100}%` : "0%" }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-700 w-8 text-right font-serif">{count}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Peak Hours ─── */}
      <div className="bg-white rounded-xl border border-warm-border p-4 md:p-6 hover:shadow-lg transition-shadow duration-300">
        <h2 className="font-semibold text-gray-900 mb-4 md:mb-6 text-base md:text-lg flex items-center gap-2">
          <span className="w-1.5 h-5 bg-gold rounded-full inline-block"></span>
          Actividad por Hora
        </h2>
        {peakHoursEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-300">
            <ActivityIcon className="w-12 h-12 mb-3" />
            <p className="text-sm text-gray-400 font-medium">Sin datos de actividad por hora</p>
            <p className="text-xs text-gray-400 mt-1">Los datos apareceran con el uso del sistema</p>
          </div>
        ) : (
          <div>
            <div className="flex items-end gap-[3px] h-40">
              {Array.from({ length: 24 }, (_, h) => {
                const count = peakHours[h] || peakHours[String(h)] || 0;
                const heightPct = maxPeakCount > 0 ? (count / maxPeakCount) * 100 : 0;
                const isBusiest = count === busiestHourCount && busiestHourCount > 0;
                return (
                  <div key={h} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-8 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {h}:00 — {count} {count === 1 ? "llamada" : "llamadas"}
                    </div>
                    <div
                      className={`w-full rounded-t-sm transition-all duration-700 ease-out ${
                        isBusiest
                          ? "bg-gradient-to-t from-gold-dark to-gold shadow-sm"
                          : count > 0
                            ? "bg-gold/40 group-hover:bg-gold/60"
                            : "bg-cream-dark"
                      }`}
                      style={{
                        height: mounted ? `${Math.max(heightPct, 3)}%` : "3%",
                        minHeight: "2px",
                      }}
                    />
                  </div>
                );
              })}
            </div>
            {/* Hour labels */}
            <div className="flex items-center mt-2 text-xs text-gray-400 select-none">
              <span className="flex-1 text-left">0h</span>
              <span className="flex-1 text-center" style={{ marginLeft: "calc(25% - 1em)" }}>6h</span>
              <span className="flex-1 text-center">12h</span>
              <span className="flex-1 text-center" style={{ marginRight: "calc(25% - 2em)" }}>18h</span>
              <span className="flex-none text-right">23h</span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Interactions Table ─── */}
      <div className="bg-white rounded-xl border border-warm-border p-4 md:p-6 hover:shadow-lg transition-shadow duration-300">
        <h2 className="font-semibold text-gray-900 mb-4 text-base md:text-lg flex items-center gap-2">
          <span className="w-1.5 h-5 bg-gold rounded-full inline-block"></span>
          Registro de Interacciones
        </h2>
        {recentLog.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 md:py-16 text-gray-300">
            <TableIcon className="w-10 h-10 md:w-12 md:h-12 mb-3" />
            <p className="text-sm text-gray-400 font-medium">Sin interacciones registradas</p>
          </div>
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="md:hidden space-y-3">
              {recentLog.map((entry, idx) => (
                <div key={idx} className="border border-warm-border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-mono">{entry.time || "--:--"}</span>
                    {entry.intent && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${INTENT_COLORS[entry.intent] || "bg-gray-100 text-gray-600"}`}>
                        {INTENT_LABELS[entry.intent] || entry.intent}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500"><span className="font-semibold text-indigo-500">CL:</span> {entry.userMessage || "-"}</p>
                  <p className="text-xs text-gray-600"><span className="font-semibold text-gold-dark">FA:</span> {entry.agentResponse || "-"}</p>
                  {(entry.keywords || []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.keywords.map((kw, i) => (
                        <span key={i} className="bg-gold/10 text-gold-dark text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-gold/20">{kw}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-warm-border text-left">
                    <th className="pb-3 pr-4 font-semibold text-gray-500 text-xs uppercase tracking-wider whitespace-nowrap">Hora</th>
                    <th className="pb-3 pr-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Cliente dice</th>
                    <th className="pb-3 pr-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Agente responde</th>
                    <th className="pb-3 pr-4 font-semibold text-gray-500 text-xs uppercase tracking-wider whitespace-nowrap">Intencion</th>
                    <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Keywords</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-border/50">
                  {recentLog.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-cream/40 transition-colors">
                      <td className="py-3 pr-4 text-gray-500 whitespace-nowrap font-mono text-xs">{entry.time || "--:--"}</td>
                      <td className="py-3 pr-4 text-gray-700 max-w-[250px] truncate" title={entry.userMessage}>{entry.userMessage || "-"}</td>
                      <td className="py-3 pr-4 text-gray-700 max-w-[250px] truncate" title={entry.agentResponse}>{entry.agentResponse || "-"}</td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {entry.intent ? (
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${INTENT_COLORS[entry.intent] || "bg-gray-100 text-gray-600"}`}>
                            {INTENT_LABELS[entry.intent] || entry.intent}
                          </span>
                        ) : <span className="text-gray-300">--</span>}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          {(entry.keywords || []).map((kw, i) => (
                            <span key={i} className="bg-gold/10 text-gold-dark text-xs font-medium px-2 py-0.5 rounded-full border border-gold/20">{kw}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
