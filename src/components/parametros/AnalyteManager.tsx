"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { AnalyteForm } from "@/components/parametros/AnalyteForm";
import {
  etaSourceLabel,
  type AreaGroup,
  type AnalyteRow,
  type AreaOption,
} from "@/lib/analytes";
import { cn } from "@/lib/utils";

const fmt = (n: number | null) => (n == null ? "—" : String(n));

export function AnalyteManager({
  groups,
  areas,
}: {
  groups: AreaGroup[];
  areas: AreaOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AnalyteRow | null>(null);

  const pendientes = groups
    .flatMap((g) => g.analytes)
    .filter((a) => !a.validated).length;

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (a: AnalyteRow) => {
    setEditing(a);
    setOpen(true);
  };
  const onSaved = () => {
    setOpen(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm">
          {pendientes > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-3 py-1 text-warning">
              <AlertCircle className="h-4 w-4" />
              {pendientes} por validar
            </span>
          ) : (
            <span className="text-muted">Todos los analitos están validados.</span>
          )}
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" />
          Nuevo analito
        </Button>
      </div>

      {groups.map((g) => (
        <section key={g.area.id}>
          <h2 className="mb-2 text-sm font-semibold text-foreground">
            {g.area.nombre}{" "}
            <span className="font-normal text-muted">({g.analytes.length})</span>
          </h2>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted">
                    <th className="px-4 py-2.5 font-medium">Analito</th>
                    <th className="px-4 py-2.5 font-medium">ETa</th>
                    <th className="px-4 py-2.5 font-medium">CVi</th>
                    <th className="px-4 py-2.5 font-medium">CVg</th>
                    <th className="px-4 py-2.5 font-medium">Unidad</th>
                    <th className="px-4 py-2.5 font-medium">Estado</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {g.analytes.map((a) => (
                    <tr
                      key={a.id}
                      className={cn(
                        "border-b border-border/60 last:border-0",
                        !a.activo && "opacity-50"
                      )}
                    >
                      <td className="px-4 py-2.5">
                        <span className="font-medium text-foreground">{a.nombre}</span>
                        {a.metodo && (
                          <span className="block text-[11px] text-muted">{a.metodo}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {a.etaValue == null ? (
                          <span className="text-muted">—</span>
                        ) : (
                          <span>
                            <span className="text-foreground">{a.etaValue}%</span>
                            <span className="ml-1 text-[11px] text-muted">
                              {etaSourceLabel(a.etaSource)}
                            </span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-foreground">{fmt(a.cvi)}</td>
                      <td className="px-4 py-2.5 text-foreground">{fmt(a.cvg)}</td>
                      <td className="px-4 py-2.5 text-muted">{a.unidad ?? "—"}</td>
                      <td className="px-4 py-2.5">
                        {a.validated ? (
                          <span className="inline-flex rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-medium text-success">
                            Validado
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-medium text-warning">
                            Por validar
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(a)}>
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {g.analytes.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-sm text-muted">
                        Sin analitos en esta área.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      ))}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Editar: ${editing.nombre}` : "Nuevo analito"}
      >
        <AnalyteForm
          analyte={editing}
          areas={areas}
          onSaved={onSaved}
          onCancel={() => setOpen(false)}
        />
      </Modal>
    </div>
  );
}
