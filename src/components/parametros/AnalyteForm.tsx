"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import {
  ETA_SOURCE_OPTIONS,
  type AnalyteRow,
  type AreaOption,
  type AnalyteInput,
} from "@/lib/analytes";
import { saveAnalyte } from "@/app/parametros/actions";

type Props = {
  analyte: AnalyteRow | null;
  areas: AreaOption[];
  onSaved: () => void;
  onCancel: () => void;
};

const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s));

export function AnalyteForm({ analyte, areas, onSaved, onCancel }: Props) {
  const [nombre, setNombre] = useState(analyte?.nombre ?? "");
  const [areaId, setAreaId] = useState(analyte?.areaId ?? areas[0]?.id ?? "");
  const [unidad, setUnidad] = useState(analyte?.unidad ?? "");
  const [decimales, setDecimales] = useState(String(analyte?.decimales ?? 2));
  const [metodo, setMetodo] = useState(analyte?.metodo ?? "");
  const [equipo, setEquipo] = useState(analyte?.equipo ?? "");
  const [etaSource, setEtaSource] = useState(analyte?.etaSource ?? "MANUAL");
  const [etaValue, setEtaValue] = useState(
    analyte?.etaValue != null ? String(analyte.etaValue) : ""
  );
  const [cvi, setCvi] = useState(analyte?.cvi != null ? String(analyte.cvi) : "");
  const [cvg, setCvg] = useState(analyte?.cvg != null ? String(analyte.cvg) : "");
  const [activo, setActivo] = useState(analyte?.activo ?? true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await saveAnalyte(analyte?.id ?? null, {
        nombre,
        areaId,
        unidad,
        decimales: Number(decimales),
        metodo,
        equipo,
        etaSource: etaSource as AnalyteInput["etaSource"],
        etaValue: numOrNull(etaValue),
        cvi: numOrNull(cvi),
        cvg: numOrNull(cvg),
        activo,
      });
      if (res.ok) onSaved();
      else setError(res.error);
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Nombre del analito">
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required autoFocus />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Área">
          <Select value={areaId} onChange={(e) => setAreaId(e.target.value)}>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Unidad" hint="p. ej. mg/dL, U/L, %">
          <Input value={unidad} onChange={(e) => setUnidad(e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Fuente ETa">
          <Select value={etaSource} onChange={(e) => setEtaSource(e.target.value)}>
            {ETA_SOURCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="ETa (%)" hint="Error total permitido">
          <Input
            type="number"
            step="0.1"
            min="0"
            value={etaValue}
            onChange={(e) => setEtaValue(e.target.value)}
          />
        </Field>
        <Field label="Decimales">
          <Input
            type="number"
            min="0"
            max="6"
            value={decimales}
            onChange={(e) => setDecimales(e.target.value)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="CVi (%)" hint="Variabilidad biológica intraindividual">
          <Input type="number" step="0.01" min="0" value={cvi} onChange={(e) => setCvi(e.target.value)} />
        </Field>
        <Field label="CVg (%)" hint="Variabilidad biológica interindividual">
          <Input type="number" step="0.01" min="0" value={cvg} onChange={(e) => setCvg(e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Método">
          <Input value={metodo} onChange={(e) => setMetodo(e.target.value)} />
        </Field>
        <Field label="Equipo">
          <Input value={equipo} onChange={(e) => setEquipo(e.target.value)} />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={activo}
          onChange={(e) => setActivo(e.target.checked)}
          className="h-4 w-4 rounded border-border"
        />
        Analito activo
      </label>

      {error && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">{error}</p>
      )}

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
