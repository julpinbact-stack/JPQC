"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { calcInsertCv, type TargetRow, type AnalyteOption, type TargetInput } from "@/lib/lots";
import { saveTarget } from "@/app/lotes/actions";

type Props = {
  lotId: string;
  target: TargetRow | null;
  analyteOptions: AnalyteOption[];
  onSaved: () => void;
  onCancel: () => void;
};

export function TargetForm({ lotId, target, analyteOptions, onSaved, onCancel }: Props) {
  const [analyteId, setAnalyteId] = useState(target?.analyteId ?? analyteOptions[0]?.id ?? "");
  const [insertMean, setInsertMean] = useState(
    target?.insertMean != null ? String(target.insertMean) : ""
  );
  const [insertSd, setInsertSd] = useState(
    target?.insertSd != null ? String(target.insertSd) : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const mean = Number(insertMean);
  const sd = Number(insertSd);
  const cv = insertMean && insertSd ? calcInsertCv(mean, sd) : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload: TargetInput = { analyteId, insertMean: mean, insertSd: sd };
    startTransition(async () => {
      const res = await saveTarget(lotId, target?.id ?? null, payload);
      if (res.ok) onSaved();
      else setError(res.error);
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Analito">
        {target ? (
          <Input value={target.analyteNombre} disabled />
        ) : (
          <Select value={analyteId} onChange={(e) => setAnalyteId(e.target.value)}>
            {analyteOptions.length === 0 && <option value="">— Sin analitos disponibles —</option>}
            {analyteOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre} · {a.areaNombre}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Media diana (inserto)">
          <Input
            type="number"
            step="any"
            min="0"
            value={insertMean}
            onChange={(e) => setInsertMean(e.target.value)}
            required
            autoFocus
          />
        </Field>
        <Field label="DS (inserto)">
          <Input
            type="number"
            step="any"
            min="0"
            value={insertSd}
            onChange={(e) => setInsertSd(e.target.value)}
            required
          />
        </Field>
      </div>

      <div className="rounded-lg bg-surface-2 px-3 py-2 text-sm">
        <span className="text-muted">%CV del inserto: </span>
        <span className="font-medium text-foreground">
          {cv != null ? `${cv.toFixed(2)}%` : "—"}
        </span>
      </div>

      {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending || (!target && analyteOptions.length === 0)}>
          {pending ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
