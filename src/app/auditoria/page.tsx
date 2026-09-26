import Link from "next/link";
import { getAuditAnalytes, getAuditRows } from "@/server/audit";
import { todayInLabTz } from "@/lib/lab-time";
import {
  AUDIT_FILTERS,
  addDays,
  applyAuditFilter,
  levelColumns,
  parseAuditFilter,
  resolveRange,
  summarize,
  type AuditFilter,
} from "@/lib/audit";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { AuditTable } from "@/components/auditoria/AuditTable";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AuditoriaPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const today = todayInLabTz();
  const { desde, hasta } = resolveRange(one(sp.desde), one(sp.hasta), today);
  const filtro = parseAuditFilter(one(sp.filtro));

  const analytes = await getAuditAnalytes();
  const requested = one(sp.analito);
  const analito = analytes.some((a) => a.id === requested) ? requested! : "";

  const allRows = await getAuditRows({ desde, hasta, analyteId: analito || undefined });
  const rows = applyAuditFilter(allRows, filtro);
  const summary = summarize(allRows);

  const href = (over: Partial<{ desde: string; hasta: string; filtro: AuditFilter }>) => {
    const q = new URLSearchParams({ desde, hasta, ...(analito ? { analito } : {}), filtro, ...over });
    return `/auditoria?${q.toString()}`;
  };

  const tiles: { label: string; value: number; filter: AuditFilter; tone: string }[] = [
    { label: "Corridas", value: summary.total, filter: "todas", tone: "text-foreground" },
    { label: "Advertencias", value: summary.advertencias, filter: "advertencia", tone: "text-warning" },
    { label: "Rechazadas", value: summary.rechazadas, filter: "rechazada", tone: "text-danger" },
    {
      label: "Con observaciones",
      value: summary.conObservaciones,
      filter: "observaciones",
      tone: "text-primary",
    },
  ];

  return (
    <div className="space-y-5">
      <p className="max-w-3xl text-sm text-muted">
        Histórico de las corridas de control interno para auditar lo ingresado y lo calculado. Cada
        fila es una corrida: el valor y el z-score de cada nivel tal como se registraron, las
        observaciones del ingreso y el resultado de la validación de Westgard. Usa la bitácora de
        seguimiento para dejar constancia de las acciones posteriores sin alterar el registro
        original.
      </p>

      <Card>
        <CardBody>
          <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_2fr_2fr_auto] lg:items-end">
            <Field label="Desde">
              <Input type="date" name="desde" defaultValue={desde} max={today} />
            </Field>
            <Field label="Hasta">
              <Input type="date" name="hasta" defaultValue={hasta} max={today} />
            </Field>
            <Field label="Analito">
              <Select name="analito" defaultValue={analito}>
                <option value="">Todos los analitos</option>
                {analytes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre} · {a.areaNombre}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Mostrar">
              <Select name="filtro" defaultValue={filtro}>
                {AUDIT_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit">Consultar</Button>
          </form>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>Rango rápido:</span>
            {[7, 30, 90].map((d) => (
              <Link
                key={d}
                href={href({ desde: addDays(today, -d), hasta: today })}
                className="rounded-md bg-surface-2 px-2 py-1 hover:text-foreground"
              >
                Últimos {d} días
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link
            key={t.filter}
            href={href({ filtro: t.filter })}
            className={cn(
              "rounded-xl border bg-surface px-4 py-3 shadow-sm transition-colors hover:bg-surface-2",
              filtro === t.filter ? "border-primary" : "border-border"
            )}
          >
            <p className="text-xs text-muted">{t.label}</p>
            <p className={cn("mt-1 text-2xl font-semibold tabular-nums", t.tone)}>{t.value}</p>
          </Link>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader
          title="Histórico de corridas"
          subtitle={`${rows.length} de ${allRows.length} corridas · ${fmtDay(desde)} a ${fmtDay(hasta)}`}
        />
        <AuditTable rows={rows} columns={levelColumns(rows)} showAnalyte={!analito} />
      </Card>
    </div>
  );
}

function fmtDay(day: string) {
  const [y, m, d] = day.split("-");
  return `${d}/${m}/${y}`;
}
