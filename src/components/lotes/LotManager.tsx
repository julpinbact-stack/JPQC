"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { LotForm } from "@/components/lotes/LotForm";
import { formatDate, type LotRow } from "@/lib/lots";
import { cn } from "@/lib/utils";

export function LotManager({ lots }: { lots: LotRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LotRow | null>(null);

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (l: LotRow) => {
    setEditing(l);
    setOpen(true);
  };
  const onSaved = (id: string) => {
    const wasNew = !editing;
    setOpen(false);
    if (wasNew) router.push(`/lotes/${id}`);
    else router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {lots.length} {lots.length === 1 ? "lote registrado" : "lotes registrados"}
        </p>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" />
          Nuevo lote
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-4 py-2.5 font-medium">Fabricante</th>
                <th className="px-4 py-2.5 font-medium">Nivel</th>
                <th className="px-4 py-2.5 font-medium">N.º lote</th>
                <th className="px-4 py-2.5 font-medium">Apertura</th>
                <th className="px-4 py-2.5 font-medium">Vence</th>
                <th className="px-4 py-2.5 font-medium">Analitos</th>
                <th className="px-4 py-2.5 font-medium">Estado</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {lots.map((l) => (
                <tr
                  key={l.id}
                  className={cn(
                    "border-b border-border/60 last:border-0 hover:bg-surface-2/50",
                    !l.activo && "opacity-50"
                  )}
                >
                  <td className="px-4 py-2.5">
                    <Link href={`/lotes/${l.id}`} className="font-medium text-foreground hover:text-primary">
                      {l.fabricante}
                    </Link>
                    {l.nombreComercial && (
                      <span className="block text-[11px] text-muted">{l.nombreComercial}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-foreground">{l.levelLabel}</td>
                  <td className="px-4 py-2.5 text-foreground">{l.numeroLote}</td>
                  <td className="px-4 py-2.5 text-muted">{formatDate(l.apertura)}</td>
                  <td className="px-4 py-2.5 text-muted">{formatDate(l.vencimiento)}</td>
                  <td className="px-4 py-2.5 text-foreground">{l.targetCount}</td>
                  <td className="px-4 py-2.5">
                    {l.activo ? (
                      <span className="inline-flex rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-medium text-success">
                        Vigente
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(l)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Link href={`/lotes/${l.id}`}>
                        <Button variant="ghost" size="sm">
                          Metas
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {lots.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted">
                    Aún no hay lotes. Crea el primero con “Nuevo lote”.
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
        title={editing ? `Editar lote: ${editing.fabricante} ${editing.levelLabel}` : "Nuevo lote de control"}
      >
        <LotForm lot={editing} onSaved={onSaved} onCancel={() => setOpen(false)} />
      </Modal>
    </div>
  );
}
