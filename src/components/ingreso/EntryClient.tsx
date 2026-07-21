"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { StatusBadge, type QcStatus } from "@/components/ui/StatusBadge";
import { zScore } from "@/lib/qc/stats";
import { evaluateWestgard, type LevelMeasurement } from "@/lib/qc/westgard";
import { loadEntryContext, saveRun } from "@/app/ingreso/actions";
import type {
  EntryAnalyte,
  EntryContext,
  TriggerOption,
} from "@/lib/qc-entry";

const todayISO = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

export function EntryClient({
  analytes,
  triggers,
}: {
  analytes: EntryAnalyte[];
  triggers: TriggerOption[];
}) {
  const router = useRouter();
  const [analyteId, setAnalyteId] = useState("");
  const [ctx, setCtx] = useState<EntryContext | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const hoy = todayISO();
  const [fecha, setFecha] = useState(hoy);
  const [triggerId, setTriggerId] = useState("");
  const [operador, setOperador] = useState("");
  const [notas, setNotas] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ status: string; violated: string[] } | null>(null);
  const [pending, startTransition] = useTransition();

  const onSelectAnalyte = (id: string) => {
    setAnalyteId(id);
    setCtx(null);
    setValues({});
    setSaved(null);
    setError(null);
    if (!id) return;
    setLoading(true);
    loadEntryContext(id).then((res) => {
      setLoading(false);
      if (res.ok) setCtx(res.data!);
      else setError(res.error);
    });
  };

  // Evaluación en vivo con los valores ingresados.
  const live = useMemo(() => {
    if (!ctx) return null;
    const measurements: LevelMeasurement[] = [];
    const perLevel: { lotId: string; z: number | null }[] = [];
    for (const lv of ctx.levels) {
      const raw = values[lv.lotId];
      const val = raw != null && raw.trim() !== "" ? Number(raw) : null;
      const z = val != null && !Number.isNaN(val) ? zScore(val, lv.mean, lv.sd) : null;
      perLevel.push({ lotId: lv.lotId, z });
      if (z != null) measurements.push({ levelIndex: lv.levelIndex, z, history: lv.history });
    }
    const result =
      measurements.length > 0 ? evaluateWestgard(measurements, ctx.plan.rules) : null;
    return { perLevel, result };
  }, [ctx, values]);

  const canSave =
    ctx != null &&
    ctx.levels.length > 0 &&
    ctx.levels.every((lv) => {
      const v = values[lv.lotId];
      return v != null && v.trim() !== "" && !Number.isNaN(Number(v));
    });

  const onSave = () => {
    if (!ctx) return;
    setError(null);
    startTransition(async () => {
      const res = await saveRun({
        analyteId: ctx.analyteId,
        fecha,
        triggerEventId: triggerId || null,
        operador: operador || null,
        notas: notas || null,
        correctiveAction: correctiveAction || null,
        levels: ctx.levels.map((lv) => ({ lotId: lv.lotId, value: Number(values[lv.lotId]) })),
      });
      if (res.ok) {
        setSaved(res.data!);
        setValues({});
        setNotas("");
        setCorrectiveAction("");
        // Recargar contexto (historial actualizado) y refrescar
        loadEntryContext(ctx.analyteId).then((r) => r.ok && setCtx(r.data!));
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <Card>
          <CardBody className="space-y-4">
            <Field label="Analito">
              <Select value={analyteId} onChange={(e) => onSelectAnalyte(e.target.value)}>
                <option value="">— Selecciona un analito —</option>
                {analytes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre} · {a.areaNombre} ({a.levelCount} niveles)
                  </option>
                ))}
              </Select>
            </Field>
            {analytes.length === 0 && (
              <p className="text-xs text-muted">
                No hay analitos con lotes de control activos. Registra un lote y sus valores de
                inserto en el módulo Lotes.
              </p>
            )}
            {loading && <p className="text-sm text-muted">Cargando niveles…</p>}
          </CardBody>
        </Card>

        {ctx && (
          <Card>
            <CardHeader
              title={`Resultados — ${ctx.nombre}`}
              subtitle="Ingresa el valor medido de cada nivel; la evaluación es en tiempo real."
            />
            <CardBody className="space-y-4">
              {ctx.levels.length === 0 && (
                <p className="text-sm text-muted">Este analito no tiene niveles de control activos.</p>
              )}
              {ctx.levels.map((lv) => {
                const z = live?.perLevel.find((p) => p.lotId === lv.lotId)?.z ?? null;
                const zClass =
                  z == null
                    ? "text-muted"
                    : Math.abs(z) > 3
                      ? "text-danger"
                      : Math.abs(z) > 2
                        ? "text-warning"
                        : "text-success";
                return (
                  <div key={lv.lotId} className="grid grid-cols-[1fr_120px_90px] items-end gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{lv.lotLabel}</p>
                      <p className="text-[11px] text-muted">
                        Media {lv.mean} · DS {lv.sd} ·{" "}
                        {lv.source === "ESTABLECIDA" ? "establecida" : "inserto (provisional)"}
                      </p>
                    </div>
                    <Input
                      type="number"
                      step="any"
                      placeholder="Valor"
                      value={values[lv.lotId] ?? ""}
                      onChange={(e) =>
                        setValues((s) => ({ ...s, [lv.lotId]: e.target.value }))
                      }
                    />
                    <div className={`text-right text-sm font-medium ${zClass}`}>
                      {z == null ? "—" : `z ${z >= 0 ? "+" : ""}${z.toFixed(2)}`}
                    </div>
                  </div>
                );
              })}

              <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
                <Field label="Fecha" hint="No se admiten fechas futuras.">
                  <Input
                    type="date"
                    value={fecha}
                    max={hoy}
                    onChange={(e) => setFecha(e.target.value)}
                  />
                </Field>
                <Field label="Evento disparador">
                  <Select value={triggerId} onChange={(e) => setTriggerId(e.target.value)}>
                    <option value="">—</option>
                    {triggers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Operador">
                  <Input value={operador} onChange={(e) => setOperador(e.target.value)} />
                </Field>
              </div>

              <Field label="Observación">
                <Input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Opcional" />
              </Field>
              <Field label="Acción correctiva">
                <Input
                  value={correctiveAction}
                  onChange={(e) => setCorrectiveAction(e.target.value)}
                  placeholder="Si se rechazó la corrida"
                />
              </Field>

              {error && (
                <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">{error}</p>
              )}
              {saved && (
                <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm">
                  Corrida guardada — estado{" "}
                  <span className="font-medium">{saved.status}</span>
                  {saved.violated.length > 0 && ` (${saved.violated.join(", ")})`}.
                </p>
              )}

              <div className="flex justify-end">
                <Button onClick={onSave} disabled={!canSave || pending}>
                  {pending ? "Guardando…" : "Guardar corrida"}
                </Button>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Panel lateral: reglas y estado en vivo */}
      {ctx && (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Evaluación en vivo" />
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Estado</span>
                {live?.result ? (
                  <StatusBadge status={live.result.status as QcStatus} />
                ) : (
                  <span className="text-sm text-muted">—</span>
                )}
              </div>
              {live?.result && live.result.warnings.length > 0 && (
                <p className="text-xs text-warning">
                  Advertencia: {live.result.warnings.join(", ")}
                </p>
              )}
              {live?.result && live.result.violated.length > 0 && (
                <p className="text-xs text-danger">
                  Reglas violadas: {live.result.violated.join(", ")}
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Reglas por Sigma" />
            <CardBody className="space-y-2 text-sm">
              <p>
                <span className="text-muted">Sigma: </span>
                <span className="font-medium text-foreground">
                  {ctx.sigma != null ? ctx.sigma.toFixed(2) : "sin datos"}
                </span>
              </p>
              <p className="text-xs text-muted">{ctx.plan.label}</p>
              <div className="flex flex-wrap gap-1 pt-1">
                {ctx.plan.rules.map((r) => (
                  <span
                    key={r}
                    className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary"
                  >
                    {r}
                  </span>
                ))}
              </div>
              <p className="pt-1 text-[11px] text-muted">
                N recomendado: {ctx.plan.n}
                {ctx.cvPct != null && ` · CV ${ctx.cvPct.toFixed(1)}%`}
                {ctx.etaValue != null && ` · ETa ${ctx.etaValue}%`}
              </p>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
