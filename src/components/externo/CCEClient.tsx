"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select } from "@/components/ui/Field";
import { saveProvider, saveCceResult, deleteCceResult } from "@/app/externo/actions";
import { calcBiasPct, calcSDI, type ProviderItem, type CceResultRow, type AnalyteOpt } from "@/lib/cce";

function ProvidersSection({ providers, analytes }: { providers: ProviderItem[]; analytes: AnalyteOpt[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProviderItem | null>(null);
  const [nombre, setNombre] = useState("");
  const [acreditacion, setAcreditacion] = useState("");
  const [activo, setActivo] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const byArea = useMemo(() => {
    const m = new Map<string, AnalyteOpt[]>();
    for (const a of analytes) {
      const arr = m.get(a.areaNombre) ?? [];
      arr.push(a);
      m.set(a.areaNombre, arr);
    }
    return [...m.entries()];
  }, [analytes]);

  const openNew = () => {
    setEditing(null);
    setNombre("");
    setAcreditacion("");
    setActivo(true);
    setSelected(new Set());
    setError(null);
    setOpen(true);
  };
  const openEdit = (p: ProviderItem) => {
    setEditing(p);
    setNombre(p.nombre);
    setAcreditacion(p.acreditacion ?? "");
    setActivo(p.activo);
    setSelected(new Set(p.analyteIds));
    setError(null);
    setOpen(true);
  };
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await saveProvider(editing?.id ?? null, {
        nombre,
        acreditacion,
        activo,
        analyteIds: [...selected],
      });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else setError(res.error);
    });
  };

  return (
    <Card>
      <CardHeader
        title="Proveedores de CCE"
        subtitle="Programas de evaluación externa y los analitos que controla cada uno."
        action={
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4" />
            Nuevo proveedor
          </Button>
        }
      />
      <CardBody className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-5 py-2.5 font-medium">Proveedor</th>
              <th className="px-5 py-2.5 font-medium">Acreditación</th>
              <th className="px-5 py-2.5 font-medium">Analitos</th>
              <th className="px-5 py-2.5 font-medium">Resultados</th>
              <th className="px-5 py-2.5 font-medium">Estado</th>
              <th className="px-5 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {providers.map((p) => (
              <tr key={p.id} className="border-b border-border/60 last:border-0">
                <td className="px-5 py-2.5 font-medium text-foreground">{p.nombre}</td>
                <td className="px-5 py-2.5 text-muted">{p.acreditacion ?? "—"}</td>
                <td className="px-5 py-2.5 text-foreground">{p.analyteIds.length}</td>
                <td className="px-5 py-2.5 text-foreground">{p.resultCount}</td>
                <td className="px-5 py-2.5 text-muted">{p.activo ? "Activo" : "Inactivo"}</td>
                <td className="px-5 py-2.5 text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
            {providers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-muted">
                  Aún no hay proveedores. Crea el primero.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </CardBody>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar proveedor" : "Nuevo proveedor"}>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre" hint="PROASECAL, Bio-Rad EQAS…">
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required autoFocus />
            </Field>
            <Field label="Acreditación" hint="p. ej. ISO/IEC 17043">
              <Input value={acreditacion} onChange={(e) => setAcreditacion(e.target.value)} />
            </Field>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-foreground">Analitos que controla</p>
            <div className="max-h-56 overflow-y-auto rounded-lg border border-border p-2">
              {byArea.map(([area, items]) => (
                <div key={area} className="mb-2">
                  <p className="px-1 text-[11px] uppercase tracking-wide text-muted">{area}</p>
                  {items.map((a) => (
                    <label key={a.id} className="flex items-center gap-2 px-1 py-0.5 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={selected.has(a.id)}
                        onChange={() => toggle(a.id)}
                        className="h-3.5 w-3.5 rounded border-border"
                      />
                      {a.nombre}
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="h-4 w-4 rounded border-border" />
            Activo
          </label>
          {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={pending}>{pending ? "Guardando…" : "Guardar"}</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}

function ResultsSection({
  results,
  providers,
  analytes,
}: {
  results: CceResultRow[];
  providers: ProviderItem[];
  analytes: AnalyteOpt[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [providerId, setProviderId] = useState("");
  const [analyteId, setAnalyteId] = useState("");
  const [ciclo, setCiclo] = useState("");
  const [nivel, setNivel] = useState("");
  const [labResult, setLabResult] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [sdGroup, setSdGroup] = useState("");
  const [evaluacion, setEvaluacion] = useState("");
  const [fecha, setFecha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const lab = Number(labResult);
  const tgt = targetValue.trim() === "" ? null : Number(targetValue);
  const sd = sdGroup.trim() === "" ? null : Number(sdGroup);
  const bias = labResult.trim() !== "" ? calcBiasPct(lab, tgt) : null;
  const sdi = labResult.trim() !== "" ? calcSDI(lab, tgt, sd) : null;

  const openNew = () => {
    setProviderId(providers[0]?.id ?? "");
    setAnalyteId("");
    setCiclo("");
    setNivel("");
    setLabResult("");
    setTargetValue("");
    setSdGroup("");
    setEvaluacion("");
    setFecha("");
    setError(null);
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await saveCceResult(null, {
        providerId,
        analyteId,
        ciclo,
        nivel: nivel || null,
        labResult: lab,
        targetValue: tgt,
        sdGroup: sd,
        evaluacion: evaluacion || null,
        fecha: fecha || null,
      });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else setError(res.error);
    });
  };

  const onDelete = (id: string) => {
    if (!confirm("¿Eliminar este resultado de CCE?")) return;
    start(async () => {
      await deleteCceResult(id);
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader
        title="Resultados del CCE"
        subtitle="El sesgo y el SDI se calculan automáticamente y alimentan los indicadores."
        action={
          <Button size="sm" onClick={openNew} disabled={providers.length === 0}>
            <Plus className="h-4 w-4" />
            Nuevo resultado
          </Button>
        }
      />
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-5 py-2.5 font-medium">Fecha</th>
                <th className="px-5 py-2.5 font-medium">Proveedor</th>
                <th className="px-5 py-2.5 font-medium">Analito</th>
                <th className="px-5 py-2.5 font-medium">Ciclo</th>
                <th className="px-5 py-2.5 font-medium">Resultado</th>
                <th className="px-5 py-2.5 font-medium">Diana</th>
                <th className="px-5 py-2.5 font-medium">Sesgo%</th>
                <th className="px-5 py-2.5 font-medium">SDI</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-2.5 text-muted">{r.fecha ?? "—"}</td>
                  <td className="px-5 py-2.5 text-foreground">{r.providerNombre}</td>
                  <td className="px-5 py-2.5 text-foreground">{r.analyteNombre}</td>
                  <td className="px-5 py-2.5 text-muted">{r.ciclo}</td>
                  <td className="px-5 py-2.5 text-foreground">{r.labResult}</td>
                  <td className="px-5 py-2.5 text-muted">{r.targetValue ?? "—"}</td>
                  <td className="px-5 py-2.5 text-foreground">{r.biasPct != null ? r.biasPct.toFixed(2) : "—"}</td>
                  <td className="px-5 py-2.5 text-foreground">{r.sdi != null ? r.sdi.toFixed(2) : "—"}</td>
                  <td className="px-5 py-2.5 text-right">
                    <Button variant="ghost" size="sm" onClick={() => onDelete(r.id)} disabled={pending}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {results.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-6 text-center text-muted">
                    Sin resultados de CCE registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardBody>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo resultado de CCE">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Proveedor">
              <Select value={providerId} onChange={(e) => setProviderId(e.target.value)}>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </Select>
            </Field>
            <Field label="Analito">
              <Select value={analyteId} onChange={(e) => setAnalyteId(e.target.value)} required>
                <option value="">— Selecciona —</option>
                {analytes.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre} · {a.areaNombre}</option>
                ))}
              </Select>
            </Field>
            <Field label="Ciclo / periodo" hint="p. ej. 2026-07">
              <Input value={ciclo} onChange={(e) => setCiclo(e.target.value)} required />
            </Field>
            <Field label="Nivel" hint="opcional">
              <Input value={nivel} onChange={(e) => setNivel(e.target.value)} />
            </Field>
            <Field label="Resultado del laboratorio">
              <Input type="number" step="any" value={labResult} onChange={(e) => setLabResult(e.target.value)} required />
            </Field>
            <Field label="Valor diana (consenso/par)">
              <Input type="number" step="any" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} />
            </Field>
            <Field label="DS del grupo">
              <Input type="number" step="any" min="0" value={sdGroup} onChange={(e) => setSdGroup(e.target.value)} />
            </Field>
            <Field label="Fecha">
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-lg bg-surface-2 px-3 py-2 text-sm">
            <div>
              <span className="text-muted">Sesgo%: </span>
              <span className="font-medium text-foreground">{bias != null ? bias.toFixed(2) : "—"}</span>
            </div>
            <div>
              <span className="text-muted">SDI: </span>
              <span className="font-medium text-foreground">{sdi != null ? sdi.toFixed(2) : "—"}</span>
            </div>
          </div>

          <Field label="Evaluación" hint="p. ej. Satisfactorio">
            <Input value={evaluacion} onChange={(e) => setEvaluacion(e.target.value)} />
          </Field>

          {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={pending}>{pending ? "Guardando…" : "Guardar"}</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}

export function CCEClient({
  providers,
  results,
  analytes,
}: {
  providers: ProviderItem[];
  results: CceResultRow[];
  analytes: AnalyteOpt[];
}) {
  return (
    <div className="space-y-5">
      <ProvidersSection providers={providers} analytes={analytes} />
      <ResultsSection results={results} providers={providers} analytes={analytes} />
    </div>
  );
}
