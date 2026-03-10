"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Agente de Voz", icon: "phone" },
  { href: "/metricas", label: "Métricas", icon: "chart" },
  { href: "/reservas", label: "Reservas", icon: "calendar" },
  { href: "/historial", label: "Historial", icon: "list" },
];

const icons = {
  phone: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.11 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  chart: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
  ),
  calendar: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
  ),
  list: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/></svg>
  ),
};

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] bg-white border-r border-warm-gray flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-5 pb-3 border-b border-warm-gray">
        <img src="/logo.png" alt="Fonda Alcalá" className="h-14 mb-2" />
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold tracking-widest text-stone-400 uppercase">Asistente IA</span>
          <span className="text-[9px] font-bold tracking-wider bg-gradient-to-r from-gold to-gold-dark text-white px-2 py-0.5 rounded">DEMO</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                active
                  ? "bg-gold/10 text-gold-dark"
                  : "text-stone-500 hover:bg-cream-dark hover:text-stone-700"
              }`}
            >
              <span className={active ? "text-gold" : "text-stone-400"}>{icons[item.icon]}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-warm-gray">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
          <span className="text-[11px] text-stone-400">Sistema activo 24/7</span>
        </div>
      </div>
    </aside>
  );
}
