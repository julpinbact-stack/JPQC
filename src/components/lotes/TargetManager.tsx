"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { TargetForm } from "@/components/lotes/TargetForm";
import { deleteTarget } from "@/app/lotes/actions";
import type { TargetRow, AnalyteOption } from "@/lib/lots";

export function TargetManager({
  lotId,
  targets,
  allAnalytes,
}: {
  lotId: string;
  targets: TargetRow[];
  allAnalytes: AnalyteOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TargetRow | null>(null);
  const [pending, startTransition] = useTransition();

  const usedIds = new Set(targets.map((t) => t.analyteId));
  const available = allAnalytes.filter((a) => !usedIds.has(a.id));

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (t: TargetRow) => {
    setEditing(t);
    setOpen(true);
  };
  const onSaved = () => {
    setOpen(false);
    router.refresh();
  };
  const onDelete = (t: TargetRow) => {
    if (!confirm(`¿Eliminar la meta de ${t.analyteNombre}?`)) return;
    startTransition(async () => {
      await deleteTarget(lotId, t.id);
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Valores del inserto por analito{" "}
          <span className="font-normal text-muted">({targets.length})</span>
        </h2>
        <Button onClick={openNew} size="sm">
          <Plus className="h-4 w-4" />
          Agregar analito
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-4 py-2.5 font-medium">Analito</th>
                <th className="px-4 py-2.5 font-medium">Área</th>
                <th className="px-4 py-2.5 font-medium">Media diana</th>
                <th className="px-4 py-2.5 font-medium">DS</th>
                <th className="px-4 py-2.5 font-medium">%CV inserto</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {targets.map((t) => (
                <tr key={t.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-foreground">{t.analyteNombre}</span>
                    {t.unidad && <span className="ml-1 text-[11px] text-muted">{t.unidad}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-muted">{t.areaNombre}</td>
                  <td className="px-4 py-2.5 text-foreground">{t.insertMean}</td>
                  <td className="px-4 py-2.5 text-foreground">{t.insertSd}</td>
                  <td className="px-4 py-2.5 text-foreground">
                    {t.insertCv != null ? `${t.insertCv.toFixed(2)}%` : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(t)}
                        disabled={pending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {targets.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted">
                    Sin valores de inserto. Agrega el primer analito de este lote.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Editar meta: ${editing.analyteNombre}` : "Agregar valor de inserto"}
      >
        <TargetForm
          lotId={lotId}
          target={editing}
          analyteOptions={available}
          onSaved={onSaved}
          onCancel={() => setOpen(false)}
        />
      </Modal>
    </div>
  );
}
