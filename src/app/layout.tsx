import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { DemoBanner } from "@/components/DemoBanner";
import { isDemoMode } from "@/lib/demo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JPQC — Control de Calidad Analítica",
  description:
    "Sistema de gestión de calidad analítica para laboratorio clínico: control interno y externo, Levey-Jennings, Westgard e indicadores.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Reserva espacio para la franja de demostración fija al borde inferior, para
  // que no tape el contenido ni el pie del sidebar. Solo en modo demostración.
  const demoPad = isDemoMode() ? "pb-16 md:pb-12" : "";

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div className={`flex min-h-screen ${demoPad}`}>
          <Sidebar />
          <div className="flex flex-1 flex-col min-w-0">
            <Topbar />
            <main className="flex-1 p-5 md:p-8">{children}</main>
          </div>
        </div>
        <DemoBanner />
      </body>
    </html>
  );
}
