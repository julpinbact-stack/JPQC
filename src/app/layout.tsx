import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { DemoBanner } from "@/components/DemoBanner";
import { isDemoMode } from "@/lib/demo";
import { getSessionUser } from "@/lib/auth";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isLogin = pathname === "/login";
  // Usuario autenticado (solo fuera del modo demostración) para el botón de salir.
  const user = isDemoMode() ? null : await getSessionUser();

  // Reserva espacio para la franja de demostración fija al borde inferior.
  const demoPad = isDemoMode() ? "pb-16 md:pb-12" : "";

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {isLogin ? (
          children
        ) : (
          <div className={`flex min-h-screen ${demoPad}`}>
            <Sidebar />
            <div className="flex flex-1 flex-col min-w-0">
              <Topbar user={user} />
              <main className="flex-1 p-5 md:p-8">{children}</main>
            </div>
          </div>
        )}
        <DemoBanner />
      </body>
    </html>
  );
}
