"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Select } from "@/components/ui/Field";
import { LJChart } from "@/components/levey-jennings/LJChart";
import { loadLJ } from "@/app/levey-jennings/actions";
import type { LJContext } from "@/lib/lj";
import type { EntryAnalyte } from "@/lib/qc-entry";

export function LJClient({ analytes }: { analytes: EntryAnalyte[] }) {
  const [analyteId, setAnalyteId] = useState("");
  const [ctx, setCtx] = useState<LJContext | null>(null);
  const [loading, setLoading] = useState(false);

  const onSelect = (id: string) => {
    setAnalyteId(id);
    setCtx(null);
    if (!id) return;
    setLoading(true);
    loadLJ(id).then((res) => {
      setLoading(false);
      if (res.ok) setCtx(res.data!);
    });
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardBody>
          <Field label="Analito">
            <Select value={analyteId} onChange={(e) => onSelect(e.target.value)}>
              <option value="">— Selecciona un analito —</option>
              {analytes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre} · {a.areaNombre} ({a.levelCount} niveles)
                </option>
              ))}
            </Select>
          </Field>
          {analytes.length === 0 && (
            <p className="mt-2 text-xs text-muted">
              No hay analitos con lotes de control activos.
            </p>
          )}
          {loading && <p className="mt-2 text-sm text-muted">Cargando gráficas…</p>}
        </CardBody>
      </Card>

      {ctx &&
        ctx.levels.map((lv) => (
          <Card key={lv.lotId}>
            <CardHeader
              title={lv.lotLabel}
              subtitle={`Media ${lv.mean} · DS ${lv.sd} · ${lv.points.length} corridas`}
              action={
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    lv.source === "ESTABLECIDA"
                      ? "bg-success-soft text-success"
                      : "bg-warning-soft text-warning"
                  }`}
                >
                  {lv.source === "ESTABLECIDA" ? "Establecida" : "Provisional (inserto)"}
                </span>
              }
            />
            <CardBody>
              <LJChart level={lv} decimales={ctx.decimales} />
            </CardBody>
          </Card>
        ))}

      {ctx && ctx.levels.length === 0 && (
        <Card>
          <CardBody className="text-sm text-muted">
            Este analito no tiene niveles de control activos.
          </CardBody>
        </Card>
      )}
    </div>
  );
}
