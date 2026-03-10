import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Fonda Alcalá — Agente de Voz IA",
  description: "Sistema de gestión de reservas con agente de voz inteligente",
  icons: { icon: "/logo.png" },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased bg-cream`}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-auto pb-14 md:pb-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
