"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import type { ReportRow, ReportData } from "@/components/informe/ReportPdf";

const ReportDownload = dynamic(
  () => import("@/components/informe/ReportPdf").then((m) => m.ReportDownload),
  { ssr: false, loading: () => <span className="text-sm text-muted">Cargando…</span> }
);

const f = (v: number | null, d = 2) => (v == null ? "—" : v.toFixed(d));
const currentMonth = () => new Date().toISOString().slice(0, 7);

export function InformeClient({
  ipsNombre,
  ipsNit,
  responsable,
  rows,
}: {
  ipsNombre: string;
  ipsNit: string | null;
  responsable: string | null;
  rows: ReportRow[];
}) {
  const [periodo, setPeriodo] = useState(currentMonth());
  const [analisis, setAnalisis] = useState("");
  const [firmadoPor, setFirmadoPor] = useState(responsable ?? "");

  const data: ReportData = {
    ipsNombre,
    ipsNit,
    responsable,
    periodo,
    generado: new Date().toLocaleDateString("es-CO"),
    analisis,
    firmadoPor,
    rows,
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Informe mensual"
          subtitle="Consolidado de indicadores con análisis cualitativo y firma, exportable a PDF."
          action={<ReportDownload data={data} />}
        />
        <CardBody className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Periodo">
              <Input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} />
            </Field>
            <Field label="Firmado por">
              <Input value={firmadoPor} onChange={(e) => setFirmadoPor(e.target.value)} />
            </Field>
          </div>
          <Field label="Análisis cualitativo">
            <textarea
              value={analisis}
              onChange={(e) => setAnalisis(e.target.value)}
              rows={5}
              placeholder="Interpretación del desempeño del periodo, no conformidades, acciones y conclusiones."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Field>
        </CardBody>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="Vista previa de indicadores" subtitle={`${rows.length} analitos con datos`} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-4 py-2.5 font-medium">Analito</th>
                <th className="px-4 py-2.5 font-medium">n</th>
                <th className="px-4 py-2.5 font-medium">CV%</th>
                <th className="px-4 py-2.5 font-medium">Sesgo%</th>
                <th className="px-4 py-2.5 font-medium">ET%</th>
                <th className="px-4 py-2.5 font-medium">Sigma</th>
                <th className="px-4 py-2.5 font-medium">U%</th>
                <th className="px-4 py-2.5 font-medium">Comp.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-foreground">{r.nombre}</span>
                    <span className="block text-[11px] text-muted">{r.areaNombre}</span>
                  </td>
                  <td className="px-4 py-2.5 text-foreground">{r.n}</td>
                  <td className="px-4 py-2.5 text-foreground">{f(r.cvPct)}</td>
                  <td className="px-4 py-2.5 text-foreground">{f(r.biasPct)}</td>
                  <td className="px-4 py-2.5 text-foreground">{f(r.tePct)}</td>
                  <td className="px-4 py-2.5 text-foreground">{f(r.sigma)}</td>
                  <td className="px-4 py-2.5 text-foreground">{f(r.uncertaintyU)}</td>
                  <td className="px-4 py-2.5 text-foreground">
                    {r.competent == null ? "—" : r.competent ? "Sí" : "No"}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted">
                    No hay analitos con datos suficientes. Ingresa corridas para generar el informe.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
