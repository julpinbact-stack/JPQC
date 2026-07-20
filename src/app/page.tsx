import Link from "next/link";
import { NAV_ITEMS } from "@/lib/nav";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { CheckCircle2, Circle, ArrowRight, AlertTriangle } from "lucide-react";
import { getDashboardStats } from "@/server/stats";

// Consulta la base en cada solicitud (no prerenderizar en build).
export const dynamic = "force-dynamic";

const modules = NAV_ITEMS.filter((i) => i.href !== "/");

const setup: { label: string; done: boolean }[] = [
  { label: "Andamiaje: Next.js + Prisma + PostgreSQL (Fase 0)", done: true },
  { label: "Base de datos y seed inicial aplicados (5 áreas, 28 analitos)", done: true },
  { label: "Módulo Parámetros: cargar analitos con ETa/CVi/CVg (Fase 1)", done: false },
  { label: "Módulo Lotes: registrar controles de tercera opinión (Fase 1)", done: false },
  { label: "Ingreso diario + reglas Westgard-Sigma (Fase 2)", done: false },
  { label: "Levey-Jennings e indicadores (Fase 3)", done: false },
];

const statCards = (s: {
  areas: number;
  analytes: number;
  lots: number;
  triggerEvents: number;
}) => [
  { label: "Áreas", value: s.areas },
  { label: "Analitos", value: s.analytes },
  { label: "Lotes de control", value: s.lots },
  { label: "Eventos disparadores", value: s.triggerEvents },
];

export default async function Home() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-xl font-semibold text-foreground">
          Sistema de Control de Calidad Analítica
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Gestión integrada del control de calidad interno (CCI) y externo (CCE) del
          laboratorio clínico: parametrización, gráficas de Levey-Jennings, reglas de
          Westgard por métrica Sigma e indicadores de competencia analítica.
        </p>
      </section>

      <section>
        {stats.connected ? (
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {statCards(stats).map((c) => (
              <Card key={c.label}>
                <CardBody>
                  <p className="text-2xl font-semibold text-foreground">{c.value}</p>
                  <p className="mt-0.5 text-xs text-muted">{c.label}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardBody className="flex items-center gap-3 text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
              <span className="text-muted">
                Base de datos no conectada. Verifica PostgreSQL y ejecuta las migraciones
                y el seed (<code className="text-foreground">npm run db:deploy</code> y{" "}
                <code className="text-foreground">npm run db:seed</code>).
              </span>
            </CardBody>
          </Card>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Módulos</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <Link key={m.href} href={m.href} className="group">
                <Card className="h-full transition-colors group-hover:border-primary/50">
                  <CardBody className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="flex items-center gap-1 text-sm font-medium text-foreground">
                        {m.label}
                        <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                      </p>
                      <p className="mt-0.5 text-xs text-muted">{m.description}</p>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="max-w-2xl">
        <Card>
          <CardHeader
            title="Estado de la implementación"
            subtitle="Avance por fases del plan"
          />
          <CardBody>
            <ul className="space-y-2.5">
              {setup.map((s) => (
                <li key={s.label} className="flex items-center gap-2.5 text-sm">
                  {s.done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted" />
                  )}
                  <span className={s.done ? "text-foreground" : "text-muted"}>
                    {s.label}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
