"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge, type QcStatus } from "@/components/ui/StatusBadge";
import { establishTarget, revertTargetToProvisional } from "@/app/levey-jennings/actions";
import { seriesStats } from "@/lib/qc/stats";
import {
  CLSI_MIN_N,
  eligiblePoints,
  ljFormatDate,
  type LJLevel,
  type LJPoint,
} from "@/lib/lj";

/** Preselección por defecto: las últimas CLSI_MIN_N corridas aceptadas. */
function defaultSelection(eligible: LJPoint[]): Set<string> {
  return new Set(eligible.slice(-CLSI_MIN_N).map((p) => p.resultId));
}

export function TargetPanel({
  level,
  decimales,
  unidad,
  onChanged,
}: {
  level: LJLevel;
  decimales: number;
  unidad: string | null;
  onChanged: () => void;
}) {
  const eligible = useMemo(() => eligiblePoints(level.points), [level.points]);

  const [selected, setSelected] = useState<Set<string>>(() => defaultSelection(eligible));
  const [approveOpen, setApproveOpen] = useState(false);
  const [revertOpen, setRevertOpen] = useState(false);
  const [approvedBy, setApprovedBy] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Si cambia el nivel o su historial (p. ej. tras aprobar y recargar),
  // se vuelve a la preselección por defecto.
  const signature = `${level.targetId}|${level.source}|${level.points.length}`;
  const [sig, setSig] = useState(signature);
  if (sig !== signature) {
    setSig(signature);
    setSelected(defaultSelection(eligible));
    setError(null);
  }

  const values = useMemo(
    () => eligible.filter((p) => selected.has(p.resultId)).map((p) => p.value),
    [eligible, selected]
  );
  const stats = useMemo(() => seriesStats(values), [values]);

  const sdDecimals = Math.max(decimales, 2);
  const fmtMean = (v: number) => (Number.isFinite(v) ? v.toFixed(decimales) : "—");
  const fmtSd = (v: number) => (Number.isFinite(v) ? v.toFixed(sdDecimals) : "—");
  const fmtCv = (v: number) => (Number.isFinite(v) ? `${v.toFixed(2)} %` : "—");

  const established = level.source === "ESTABLECIDA";
  const belowMin = stats.n < CLSI_MIN_N;
  const canApprove = stats.n >= 2 && !pending;

  const toggle = (resultId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(resultId)) next.delete(resultId);
      else next.add(resultId);
      return next;
    });
  };

  const onApprove = () => {
    setError(null);
    startTransition(async () => {
      const res = await establishTarget({
        targetId: level.targetId,
        resultIds: Array.from(selected),
        approvedBy,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setApproveOpen(false);
      setApprovedBy("");
      onChanged();
    });
  };

  const onRevert = () => {
    setError(null);
    startTransition(async () => {
      const res = await revertTargetToProvisional(level.targetId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setRevertOpen(false);
      onChanged();
    });
  };

  return (
    <div className="mt-4 rounded-lg border border-border bg-surface-2/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Media y DS del laboratorio</h3>
          <p className="mt-0.5 text-xs text-muted">
            {established ? (
              <>
                La gráfica usa la <strong className="font-medium text-foreground">media/DS
                establecida</strong> por el laboratorio: media {fmtMean(level.establishedMean ?? NaN)}{" "}
                · DS {fmtSd(level.establishedSd ?? NaN)} · n {level.nEstablished}
                {level.approvedBy ? ` · aprobada por ${level.approvedBy}` : ""}
                {level.approvedAt ? ` el ${ljFormatDate(level.approvedAt)}` : ""}.
              </>
            ) : (
              <>
                La gráfica usa los valores{" "}
                <strong className="font-medium text-foreground">provisionales del inserto</strong>:
                media {fmtMean(level.insertMean)} · DS {fmtSd(level.insertSd)}.
              </>
            )}
          </p>
        </div>
        {established && (
          <Button variant="secondary" size="sm" onClick={() => setRevertOpen(true)} disabled={pending}>
            Revertir a provisional
          </Button>
        )}
      </div>

      {eligible.length === 0 ? (
        <p className="mt-3 text-xs text-muted">
          No hay corridas aceptadas en este nivel: no se puede establecer media/DS todavía.
        </p>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">Corridas para el cálculo:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected(defaultSelection(eligible))}
              disabled={pending}
            >
              Últimas {CLSI_MIN_N}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected(new Set(eligible.map((p) => p.resultId)))}
              disabled={pending}
            >
              Todas
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected(new Set())}
              disabled={pending}
            >
              Ninguna
            </Button>
          </div>

          <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-border bg-surface">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface-2 text-muted">
                <tr>
                  <th className="w-10 px-3 py-2 text-left font-medium">Usar</th>
                  <th className="px-3 py-2 text-left font-medium">Corrida</th>
                  <th className="px-3 py-2 text-left font-medium">Fecha</th>
                  <th className="px-3 py-2 text-right font-medium">
                    Valor{unidad ? ` (${unidad})` : ""}
                  </th>
                  <th className="px-3 py-2 text-left font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {eligible.map((p) => (
                  <tr key={p.resultId} className="border-t border-border">
                    <td className="px-3 py-1.5">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 accent-[var(--primary)]"
                        checked={selected.has(p.resultId)}
                        onChange={() => toggle(p.resultId)}
                        disabled={pending}
                        aria-label={`Incluir corrida ${p.seq} del ${ljFormatDate(p.date)}`}
                      />
                    </td>
                    <td className="px-3 py-1.5 text-muted">{p.seq}</td>
                    <td className="px-3 py-1.5 text-foreground">{ljFormatDate(p.date)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-foreground">
                      {p.value.toFixed(decimales)}
                    </td>
                    <td className="px-3 py-1.5">
                      <StatusBadge status={p.status as QcStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-1 text-[11px] text-muted">
            Solo aparecen las corridas no rechazadas: una corrida rechazada tuvo error analítico y
            no puede entrar al cálculo.
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "n seleccionado", value: String(stats.n) },
              { label: "Media", value: fmtMean(stats.mean) },
              { label: "DS", value: fmtSd(stats.sd) },
              { label: "CV %", value: fmtCv(stats.cv) },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border bg-surface px-3 py-2">
                <p className="text-[11px] text-muted">{s.label}</p>
                <p className="text-sm font-semibold tabular-nums text-foreground">{s.value}</p>
              </div>
            ))}
          </div>

          {belowMin && (
            <p className="mt-2 rounded-lg bg-warning-soft px-3 py-2 text-[11px] text-warning">
              Advertencia: CLSI C24 recomienda al menos {CLSI_MIN_N} corridas para establecer la
              media y la DS. Hay {stats.n} seleccionada(s). Puedes aprobar de todas formas si lo
              consideras adecuado, dejando constancia del criterio.
            </p>
          )}
          {stats.n < 2 && (
            <p className="mt-2 text-[11px] text-danger">
              Con menos de 2 corridas no se puede calcular la DS.
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => setApproveOpen(true)} disabled={!canApprove}>
              Aprobar y establecer
            </Button>
            <span className="text-[11px] text-muted">
              Al aprobar, la gráfica pasa a usar esta media y ±DS.
            </span>
          </div>
        </>
      )}

      {error && !approveOpen && !revertOpen && (
        <p className="mt-2 text-xs text-danger">{error}</p>
      )}

      <Modal open={approveOpen} onClose={() => setApproveOpen(false)} title="Aprobar y establecer media/DS">
        <div className="space-y-3">
          <p className="text-xs text-muted">
            {level.lotLabel}. Se establecerán: n {stats.n} · media {fmtMean(stats.mean)} · DS{" "}
            {fmtSd(stats.sd)} · CV {fmtCv(stats.cv)}.
          </p>
          {belowMin && (
            <p className="rounded-lg bg-warning-soft px-3 py-2 text-[11px] text-warning">
              Vas a establecer con {stats.n} corrida(s), por debajo de las {CLSI_MIN_N}{" "}
              recomendadas por CLSI C24.
            </p>
          )}
          <Field label="Aprobado por" hint="Nombre de la profesional responsable.">
            <Input
              value={approvedBy}
              onChange={(e) => setApprovedBy(e.target.value)}
              placeholder="Nombre y apellido"
              autoFocus
            />
          </Field>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setApproveOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button size="sm" onClick={onApprove} disabled={pending || !approvedBy.trim()}>
              {pending ? "Guardando…" : "Confirmar"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={revertOpen} onClose={() => setRevertOpen(false)} title="Revertir a provisional">
        <div className="space-y-3">
          <p className="text-xs text-muted">
            El nivel volverá a usar la media y la DS del inserto (media {fmtMean(level.insertMean)}{" "}
            · DS {fmtSd(level.insertSd)}) y se borrarán los valores establecidos y la firma de
            aprobación. Las corridas registradas no se modifican.
          </p>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setRevertOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button variant="danger" size="sm" onClick={onRevert} disabled={pending}>
              {pending ? "Revirtiendo…" : "Revertir"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
