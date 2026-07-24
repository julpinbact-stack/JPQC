import { Suspense } from "react";
import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/demo";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // En modo demostración no hay login.
  if (isDemoMode()) redirect("/");
  // Si ya hay sesión, no mostrar el login.
  if (await getSessionUser()) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground">
            Q
          </div>
          <h1 className="text-lg font-semibold text-foreground">JPQC</h1>
          <p className="text-sm text-muted">Sistema de Control de Calidad Analítica</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Iniciar sesión</h2>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted">
          Acceso restringido al personal autorizado del laboratorio.
        </p>
      </div>
    </div>
  );
}
