"use client";

import { useState, useEffect, useCallback } from "react";

/* ────────────────────────────────────────────
   Status styling map
   ──────────────────────────────────────────── */
const STATUS_STYLES = {
  confirmada: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-l-emerald-500",
    dot: "bg-emerald-500",
    label: "Confirmada",
  },
  pendiente: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-l-amber-500",
    dot: "bg-amber-500",
    label: "Pendiente",
  },
  cancelada: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-l-red-400",
    dot: "bg-red-500",
    label: "Cancelada",
  },
};

const TAG_COLORS = [
  "bg-gold-light/30 text-gold-dark",
  "bg-emerald-100 text-emerald-700",
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-rose-100 text-rose-700",
];

const FILTER_OPTIONS = [
  { key: "todas", label: "Todas" },
  { key: "confirmada", label: "Confirmadas" },
  { key: "pendiente", label: "Pendientes" },
  { key: "cancelada", label: "Canceladas" },
];

/* ────────────────────────────────────────────
   Inline SVG Icons
   ──────────────────────────────────────────── */
function CalendarIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function ClockIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PersonIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function PhoneIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  );
}

function SparklesIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

function EuroIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 7.756a4.5 4.5 0 100 8.488M7.5 10.5H5.25m2.25 3H5.25M9 12h6" />
    </svg>
  );
}

function TagIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
  );
}

function SearchIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function XIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function CheckCircleIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function XCircleIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function BellIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}

function PencilIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );
}

function DotsIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
    </svg>
  );
}

function UsersIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function ClipboardIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  );
}

function PlusIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function ChatBubbleIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  );
}

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */
function formatDateSpanish(dateStr) {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString("es-ES", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function getInitials(name) {
  if (!name) return "?";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/* ────────────────────────────────────────────
   Toast Component
   ──────────────────────────────────────────── */
function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed top-6 right-6 z-[60] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border transition-all duration-300 animate-slide-in ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : toast.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-gold-light/20 border-gold/30 text-gold-dark"
          }`}
        >
          {toast.type === "success" && <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0" />}
          {toast.type === "error" && <XCircleIcon className="w-5 h-5 text-red-500 shrink-0" />}
          {toast.type === "info" && <BellIcon className="w-5 h-5 text-gold shrink-0" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="ml-2 text-current opacity-50 hover:opacity-100 transition-opacity"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────
   Detail Panel (Slide-in overlay)
   ──────────────────────────────────────────── */
function DetailPanel({ reservation, onClose, onAction }) {
  if (!reservation) return null;

  const styles = STATUS_STYLES[reservation.status] || STATUS_STYLES.pendiente;

  const timelineEvents = [
    {
      label: "Reserva creada via Agente IA",
      time: "Hace 2 dias",
      icon: <SparklesIcon className="w-4 h-4 text-gold" />,
      done: true,
    },
  ];
  if (reservation.status === "confirmada") {
    timelineEvents.push(
      {
        label: "Recordatorio enviado (24h antes)",
        time: "Hace 1 dia",
        icon: <BellIcon className="w-4 h-4 text-blue-500" />,
        done: true,
      },
      {
        label: "Cliente confirmo asistencia",
        time: "Hace 6 horas",
        icon: <CheckCircleIcon className="w-4 h-4 text-emerald-500" />,
        done: true,
      }
    );
  }
  if (reservation.status === "pendiente") {
    timelineEvents.push({
      label: "Esperando confirmacion del cliente",
      time: "Pendiente",
      icon: <ClockIcon className="w-4 h-4 text-amber-500" />,
      done: false,
    });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-[480px] bg-white z-50 shadow-2xl overflow-y-auto animate-slide-panel">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-warm-border px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-serif text-xl font-bold text-gray-900">Detalle de Reserva</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-cream transition-colors text-gray-500 hover:text-gray-800"
          >
            <XIcon />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Name + Status */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-serif font-bold text-gray-900">{reservation.name}</h3>
              {reservation.source && (
                <span className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium px-2.5 py-1 rounded-full bg-gold/10 text-gold-dark border border-gold/20">
                  <SparklesIcon className="w-3 h-3" />
                  {reservation.source}
                </span>
              )}
            </div>
            <span
              className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full ${styles.bg} ${styles.text}`}
            >
              <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
              {styles.label}
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <DetailItem icon={<CalendarIcon />} label="Fecha" value={formatDateSpanish(reservation.date)} />
            <DetailItem icon={<ClockIcon />} label="Hora" value={reservation.time} />
            <DetailItem icon={<PersonIcon />} label="Comensales" value={`${reservation.guests} personas`} />
            <DetailItem icon={<PhoneIcon className="w-4 h-4" />} label="Telefono" value={reservation.phone || "N/A"} />
          </div>

          {/* Notes */}
          {reservation.notes && (
            <div className="bg-cream rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notas</p>
              <p className="text-sm text-gray-700 leading-relaxed italic">&ldquo;{reservation.notes}&rdquo;</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</p>
            {reservation.status === "pendiente" && (
              <button
                onClick={() => onAction("confirm", reservation.id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-colors"
              >
                <CheckCircleIcon className="w-4 h-4" />
                Confirmar Reserva
              </button>
            )}
            <button
              onClick={() => onAction("cancel", reservation.id)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-medium text-sm transition-colors border border-red-200"
            >
              <XCircleIcon className="w-4 h-4" />
              Cancelar Reserva
            </button>
            <button
              onClick={() => onAction("reminder", reservation.id)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gold/10 hover:bg-gold/20 text-gold-dark font-medium text-sm transition-colors border border-gold/30"
            >
              <ChatBubbleIcon className="w-4 h-4" />
              Enviar Recordatorio WhatsApp
            </button>
            <div className="flex gap-2.5">
              <button
                onClick={() => onAction("call", reservation.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-sm transition-colors border border-blue-200"
              >
                <PhoneIcon className="w-4 h-4" />
                Llamar
              </button>
              <button
                onClick={() => onAction("edit", reservation.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium text-sm transition-colors border border-gray-200"
              >
                <PencilIcon className="w-4 h-4" />
                Editar
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Historial</p>
            <div className="space-y-0">
              {timelineEvents.map((event, i) => (
                <div key={i} className="flex gap-3 relative">
                  {/* Vertical line */}
                  {i < timelineEvents.length - 1 && (
                    <div className="absolute left-[11px] top-7 bottom-0 w-px bg-gray-200" />
                  )}
                  <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${event.done ? "bg-white border-2 border-gray-200" : "bg-gray-100 border-2 border-dashed border-gray-300"}`}>
                    {event.icon}
                  </div>
                  <div className="pb-5">
                    <p className={`text-sm font-medium ${event.done ? "text-gray-800" : "text-gray-400"}`}>
                      {event.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Editable Notes */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notas internas</p>
            <textarea
              className="w-full rounded-xl border border-warm-border bg-cream/50 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-shadow"
              rows={3}
              defaultValue={reservation.notes || ""}
              placeholder="Agregar notas sobre esta reserva..."
            />
          </div>
        </div>
      </div>
    </>
  );
}

function DetailItem({ icon, label, value }) {
  return (
    <div className="bg-cream/60 rounded-xl p-3.5">
      <div className="flex items-center gap-1.5 text-gray-400 mb-1">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
  );
}

/* ────────────────────────────────────────────
   Reservation Card
   ──────────────────────────────────────────── */
function ReservationCard({ reservation, onClick }) {
  const { name, date, time, guests, status, notes, source } = reservation;
  const styles = STATUS_STYLES[status] || STATUS_STYLES.pendiente;

  return (
    <div
      onClick={onClick}
      className={`group bg-white rounded-xl border border-warm-border border-l-[3px] ${styles.border} p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
    >
      <div className="flex items-center gap-4">
        {/* Name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-gray-900 truncate">{name}</span>
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${styles.bg} ${styles.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
              {styles.label}
            </span>
            {source && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-gold/10 text-gold-dark border border-gold/20">
                <SparklesIcon className="w-3 h-3" />
                {source}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5" />
              {formatDateSpanish(date)}
            </span>
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="w-3.5 h-3.5" />
              {time}
            </span>
            <span className="inline-flex items-center gap-1">
              <PersonIcon className="w-3.5 h-3.5" />
              {guests} {guests === 1 ? "persona" : "personas"}
            </span>
          </div>

          {notes && (
            <p className="mt-2 text-xs italic text-gray-400 leading-relaxed truncate max-w-lg">
              &ldquo;{notes}&rdquo;
            </p>
          )}
        </div>

        {/* Three dots */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-cream-dark opacity-0 group-hover:opacity-100 transition-all"
        >
          <DotsIcon />
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Client Card
   ──────────────────────────────────────────── */
function ClientCard({ client }) {
  const { name, phone, visits, lastVisit, totalSpent, tags } = client;

  return (
    <div className="bg-white rounded-xl border border-warm-border p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group">
      {/* Avatar + Name */}
      <div className="flex items-start gap-3.5">
        <div className="shrink-0 w-11 h-11 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
          <span className="text-sm font-bold text-gold-dark">{getInitials(name)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{name}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            <PhoneIcon />
            {phone}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="bg-cream/60 rounded-lg px-2.5 py-2 text-center">
          <p className="text-lg font-bold text-gray-800">{visits}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Visitas</p>
        </div>
        <div className="bg-cream/60 rounded-lg px-2.5 py-2 text-center">
          <p className="text-xs font-semibold text-gray-700 mt-0.5">{lastVisit}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Ultima</p>
        </div>
        <div className="bg-cream/60 rounded-lg px-2.5 py-2 text-center">
          <p className="text-xs font-semibold text-gray-700 mt-0.5">
            {typeof totalSpent === "number"
              ? totalSpent.toLocaleString("es-ES", { style: "currency", currency: "EUR" })
              : totalSpent}
          </p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Total</p>
        </div>
      </div>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="flex items-center gap-1.5 mt-3.5 flex-wrap">
          {tags.map((tag, i) => (
            <span
              key={tag}
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${TAG_COLORS[i % TAG_COLORS.length]}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Link */}
      <button className="mt-3.5 text-xs font-medium text-gold-dark hover:text-gold transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100">
        Ver historial completo
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  );
}

/* ────────────────────────────────────────────
   Stat Card
   ──────────────────────────────────────────── */
function StatCard({ label, value, icon, colorClass, bgClass }) {
  return (
    <div className={`rounded-xl border p-5 transition-all duration-200 hover:shadow-md ${bgClass}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
          <p className={`text-3xl font-bold mt-1.5 ${colorClass}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorClass} opacity-20`}>{icon}</div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   CSS Keyframes (injected via style tag)
   ──────────────────────────────────────────── */
function AnimationStyles() {
  return (
    <style>{`
      @keyframes slide-in {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slide-in-toast {
        from { transform: translateX(40px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      .animate-slide-panel {
        animation: slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .animate-slide-in {
        animation: slide-in-toast 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      }
    `}</style>
  );
}

/* ────────────────────────────────────────────
   MAIN PAGE
   ──────────────────────────────────────────── */
export default function ReservasPage() {
  const [reservations, setReservations] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("reservas");
  const [filter, setFilter] = useState("todas");
  const [search, setSearch] = useState("");
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    fetch("/api/metrics")
      .then((res) => res.json())
      .then((data) => {
        setReservations(data.reservations || []);
        setClients(data.clients || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* Toast helper */
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* Handle detail panel actions */
  const handleAction = useCallback(
    (action, reservationId) => {
      switch (action) {
        case "confirm":
          setReservations((prev) =>
            prev.map((r) => (r.id === reservationId ? { ...r, status: "confirmada" } : r))
          );
          setSelectedReservation((prev) =>
            prev && prev.id === reservationId ? { ...prev, status: "confirmada" } : prev
          );
          addToast("Reserva confirmada correctamente", "success");
          break;
        case "cancel":
          setReservations((prev) =>
            prev.map((r) => (r.id === reservationId ? { ...r, status: "cancelada" } : r))
          );
          setSelectedReservation((prev) =>
            prev && prev.id === reservationId ? { ...prev, status: "cancelada" } : prev
          );
          addToast("Reserva cancelada", "error");
          break;
        case "reminder":
          addToast("Recordatorio de WhatsApp enviado al cliente", "info");
          break;
        case "call":
          addToast("Iniciando llamada al cliente...", "info");
          break;
        case "edit":
          addToast("Modo de edicion (demo)", "info");
          break;
        default:
          break;
      }
    },
    [addToast]
  );

  /* Computed stats */
  const totalActive = reservations.filter((r) => r.status !== "cancelada").length;
  const confirmed = reservations.filter((r) => r.status === "confirmada").length;
  const pending = reservations.filter((r) => r.status === "pendiente").length;
  const cancelled = reservations.filter((r) => r.status === "cancelada").length;

  /* Filtered & searched reservations */
  const filteredReservations = reservations.filter((r) => {
    if (filter !== "todas" && r.status !== filter) return false;
    if (search.trim() && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  /* Filtered clients */
  const filteredClients = clients.filter((c) => {
    if (search.trim() && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Cargando reservas...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimationStyles />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Detail Panel */}
      {selectedReservation && (
        <DetailPanel
          reservation={selectedReservation}
          onClose={() => setSelectedReservation(null)}
          onAction={handleAction}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-gray-900">Gestion de Reservas</h1>
            <p className="mt-1.5 text-sm text-gray-500">
              Administra reservas y gestiona la base de datos de clientes del restaurante
            </p>
          </div>
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-dark text-white font-semibold text-sm transition-colors shadow-sm">
            <PlusIcon />
            Nueva Reserva
          </button>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Reservas Activas"
            value={totalActive}
            icon={<ClipboardIcon className="w-7 h-7" />}
            colorClass="text-gold-dark"
            bgClass="border-gold/20 bg-gold/5"
          />
          <StatCard
            label="Confirmadas"
            value={confirmed}
            icon={<CheckCircleIcon className="w-7 h-7" />}
            colorClass="text-emerald-600"
            bgClass="border-emerald-200 bg-emerald-50/50"
          />
          <StatCard
            label="Pendientes"
            value={pending}
            icon={<ClockIcon className="w-7 h-7" />}
            colorClass="text-amber-600"
            bgClass="border-amber-200 bg-amber-50/50"
          />
          <StatCard
            label="Canceladas"
            value={cancelled}
            icon={<XCircleIcon className="w-7 h-7" />}
            colorClass="text-red-500"
            bgClass="border-red-200 bg-red-50/50"
          />
        </div>

        {/* ── Tab Switcher + Filter Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          {/* Tabs */}
          <div className="inline-flex bg-white rounded-xl border border-warm-border p-1">
            <button
              onClick={() => { setActiveTab("reservas"); setSearch(""); }}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "reservas"
                  ? "bg-gold text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800 hover:bg-cream"
              }`}
            >
              <ClipboardIcon className="w-4 h-4" />
              Reservas
            </button>
            <button
              onClick={() => { setActiveTab("clientes"); setSearch(""); setFilter("todas"); }}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "clientes"
                  ? "bg-gold text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800 hover:bg-cream"
              }`}
            >
              <UsersIcon className="w-4 h-4" />
              Clientes (CRM)
            </button>
          </div>

          {/* Filter pills (reservas only) */}
          {activeTab === "reservas" && (
            <div className="inline-flex bg-white rounded-xl border border-warm-border p-1 gap-0.5">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setFilter(opt.key)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filter === opt.key
                      ? "bg-cream-dark text-gray-800 shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Search Bar ── */}
        <div className="relative mb-6">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeTab === "reservas"
                ? "Buscar reservas por nombre..."
                : "Buscar clientes por nombre..."
            }
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-warm-border text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-shadow"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-cream transition-all"
            >
              <XIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── Content Area ── */}
        {activeTab === "reservas" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {filteredReservations.length}{" "}
                {filteredReservations.length === 1 ? "reserva" : "reservas"}
                {filter !== "todas" && ` ${FILTER_OPTIONS.find((o) => o.key === filter)?.label?.toLowerCase()}`}
                {search && ` para "${search}"`}
              </p>
            </div>

            {filteredReservations.length === 0 ? (
              <div className="rounded-xl border border-warm-border bg-white p-12 text-center">
                <ClipboardIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400 font-medium">No se encontraron reservas</p>
                <p className="text-xs text-gray-300 mt-1">Prueba con otros filtros o terminos de busqueda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReservations.map((r) => (
                  <ReservationCard
                    key={r.id}
                    reservation={r}
                    onClick={() => setSelectedReservation(r)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "clientes" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {filteredClients.length} {filteredClients.length === 1 ? "cliente" : "clientes"}
                {search && ` para "${search}"`}
              </p>
            </div>

            {filteredClients.length === 0 ? (
              <div className="rounded-xl border border-warm-border bg-white p-12 text-center">
                <UsersIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400 font-medium">No se encontraron clientes</p>
                <p className="text-xs text-gray-300 mt-1">Prueba con otros terminos de busqueda</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredClients.map((c) => (
                  <ClientCard key={c.id} client={c} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
