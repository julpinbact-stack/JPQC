"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import type { LotRow, LotInput } from "@/lib/lots";
import { saveLot } from "@/app/lotes/actions";

type Props = {
  lot: LotRow | null;
  onSaved: (id: string) => void;
  onCancel: () => void;
};

export function LotForm({ lot, onSaved, onCancel }: Props) {
  const [fabricante, setFabricante] = useState(lot?.fabricante ?? "");
  const [nombreComercial, setNombreComercial] = useState(lot?.nombreComercial ?? "");
  const [levelLabel, setLevelLabel] = useState(lot?.levelLabel ?? "");
  const [levelIndex, setLevelIndex] = useState(String(lot?.levelIndex ?? 1));
  const [numeroLote, setNumeroLote] = useState(lot?.numeroLote ?? "");
  const [vencimiento, setVencimiento] = useState(lot?.vencimiento ?? "");
  const [apertura, setApertura] = useState(lot?.apertura ?? "");
  const [activo, setActivo] = useState(lot?.activo ?? true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload: LotInput = {
      fabricante,
      nombreComercial,
      levelLabel,
      levelIndex: Number(levelIndex),
      numeroLote,
      vencimiento: vencimiento || null,
      apertura: apertura || null,
      activo,
    };
    startTransition(async () => {
      const res = await saveLot(lot?.id ?? null, payload);
      if (res.ok) onSaved(res.data!.id);
      else setError(res.error);
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Fabricante" hint="p. ej. Bio-Rad, Randox">
          <Input value={fabricante} onChange={(e) => setFabricante(e.target.value)} required autoFocus />
        </Field>
        <Field label="Nombre comercial" hint="opcional, p. ej. Liquichek">
          <Input value={nombreComercial} onChange={(e) => setNombreComercial(e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Nivel" hint="Nivel 1, Bajo…">
          <Input value={levelLabel} onChange={(e) => setLevelLabel(e.target.value)} required />
        </Field>
        <Field label="N.º de nivel" hint="1, 2, 3…">
          <Input
            type="number"
            min="1"
            max="10"
            value={levelIndex}
            onChange={(e) => setLevelIndex(e.target.value)}
          />
        </Field>
        <Field label="Número de lote">
          <Input value={numeroLote} onChange={(e) => setNumeroLote(e.target.value)} required />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha de apertura">
          <Input type="date" value={apertura} onChange={(e) => setApertura(e.target.value)} />
        </Field>
        <Field label="Fecha de vencimiento">
          <Input type="date" value={vencimiento} onChange={(e) => setVencimiento(e.target.value)} />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={activo}
          onChange={(e) => setActivo(e.target.checked)}
          className="h-4 w-4 rounded border-border"
        />
        Lote activo (vigente)
      </label>

      {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
