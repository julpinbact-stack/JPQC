"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquarePlus } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { addFollowUp } from "@/app/auditoria/actions";
import { ljFormatDate } from "@/lib/lj";
import { cn } from "@/lib/utils";
import type { AuditCell, AuditRow } from "@/lib/audit";

export function AuditTable({
  rows,
  columns,
  showAnalyte,
}: {
  rows: AuditRow[];
  columns: number[];
  showAnalyte: boolean;
}) {
  const [editing, setEditing] = useState<AuditRow | null>(null);

  if (rows.length === 0) {
    return (
      <p className="px-5 py-10 text-center text-sm text-muted">
        No hay corridas que coincidan con el rango y el filtro seleccionados.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-surface-2 text-left text-xs text-muted">
            <tr>
              <th className="px-4 py-2.5 font-medium">Fecha{showAnalyte && " · Analito"}</th>
              {columns.map((n) => (
                <th key={n} className="px-4 py-2.5 font-medium">
                  Nivel {n}
                </th>
              ))}
              <th className="px-4 py-2.5 font-medium">Observaciones</th>
              <th className="px-4 py-2.5 font-medium">Validación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr
                key={r.runId}
                className={cn(
                  "align-top",
                  r.status === "RECHAZADA" && "bg-danger-soft/40",
                  r.status === "ADVERTENCIA" && "bg-warning-soft/40"
                )}
              >
                <td className="whitespace-nowrap px-4 py-3">
                  <p className="font-medium tabular-nums text-foreground">{ljFormatDate(r.fecha)}</p>
                  {showAnalyte && (
                    <p className="text-xs text-muted">
                      {r.analyteNombre} · {r.areaNombre}
                    </p>
                  )}
                  {r.unidad && <p className="text-[11px] text-muted">{r.unidad}</p>}
                </td>
                {columns.map((n) => (
                  <td key={n} className="whitespace-nowrap px-4 py-3">
                    <LevelCell cell={r.levels[n]} decimales={r.decimales} />
                  </td>
                ))}
                <td className="min-w-[260px] max-w-md px-4 py-3">
                  <Observations row={r} onFollowUp={() => setEditing(r)} />
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <StatusBadge status={r.status} />
                  <RulesLine row={r} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FollowUpModal row={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function LevelCell({ cell, decimales }: { cell?: AuditCell; decimales: number }) {
  if (!cell) return <span className="text-muted">—</span>;
  const absZ = cell.z == null ? 0 : Math.abs(cell.z);
  return (
    <div title={`${cell.lotLabel} · Lote ${cell.numeroLote}`}>
      <p className="font-mono tabular-nums text-foreground">{cell.value.toFixed(decimales)}</p>
      {cell.z != null && (
        <p
          className={cn(
            "font-mono text-xs tabular-nums",
            absZ > 3 ? "text-danger" : absZ > 2 ? "text-warning" : "text-muted"
          )}
        >
          z {cell.z >= 0 ? "+" : ""}
          {cell.z.toFixed(2)}
        </p>
      )}
    </div>
  );
}

function RulesLine({ row }: { row: AuditRow }) {
  // Solo se guardan las reglas de rechazo; la advertencia proviene de 1_2s.
  const rules = row.violated.length > 0 ? row.violated : row.status === "ADVERTENCIA" ? ["1_2s"] : [];
  if (rules.length === 0) return null;
  return <p className="mt-1 font-mono text-xs text-muted">{rules.join(", ")}</p>;
}

function Observations({ row, onFollowUp }: { row: AuditRow; onFollowUp: () => void }) {
  const meta = [row.trigger, row.operador && `Operador: ${row.operador}`].filter(Boolean);
  return (
    <div className="space-y-1.5 text-xs">
      {meta.length > 0 && <p className="text-muted">{meta.join(" · ")}</p>}
      {row.notas?.trim() && <p className="whitespace-pre-line text-foreground">{row.notas}</p>}
      {row.correctiveAction?.trim() && (
        <p className="whitespace-pre-line text-foreground">
          <span className="font-medium">Acción correctiva: </span>
          {row.correctiveAction}
        </p>
      )}
      {row.followUp?.trim() && (
        <div className="rounded-md border border-border bg-surface-2 px-2 py-1.5">
          <p className="mb-0.5 font-medium text-foreground">Seguimiento</p>
          <p className="whitespace-pre-line text-muted">{row.followUp}</p>
        </div>
      )}
      <button
        type="button"
        onClick={onFollowUp}
        className="inline-flex items-center gap-1 text-primary hover:underline"
      >
        <MessageSquarePlus className="h-3.5 w-3.5" />
        Agregar seguimiento
      </button>
    </div>
  );
}

function FollowUpModal({ row, onClose }: { row: AuditRow | null; onClose: () => void }) {
  const router = useRouter();
  const [entry, setEntry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const close = () => {
    setEntry("");
    setError(null);
    onClose();
  };

  const save = () => {
    if (!row) return;
    startTransition(async () => {
      const res = await addFollowUp({ runId: row.runId, entry });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      close();
      router.refresh();
    });
  };

  return (
    <Modal
      open={row != null}
      onClose={close}
      title={row ? `Seguimiento · ${row.analyteNombre} · ${ljFormatDate(row.fecha)}` : ""}
    >
      {row && (
        <div className="space-y-3">
          {row.followUp?.trim() && (
            <div className="max-h-40 overflow-y-auto rounded-md bg-surface-2 px-3 py-2 text-xs text-muted whitespace-pre-line">
              {row.followUp}
            </div>
          )}
          <textarea
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            rows={4}
            maxLength={1000}
            autoFocus
            placeholder="Ej.: Se verificó calibración; corrida repetida el 12/09 dentro de ±2 DS. Se cierra el hallazgo."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-[11px] text-muted">
            La entrada queda fechada y firmada con tu usuario. No modifica los resultados ni las
            observaciones originales, y las entradas anteriores se conservan.
          </p>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={close} disabled={pending}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={pending || entry.trim().length === 0}>
              {pending ? "Guardando…" : "Guardar seguimiento"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
