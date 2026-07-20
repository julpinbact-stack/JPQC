"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Input } from "@/components/ui/Field";
import { saveLabProfile, saveArea, saveTrigger } from "@/app/configuracion/actions";
import type { LabProfileData, AreaItem, TriggerItem } from "@/lib/config";

function ProfileForm({ profile }: { profile: LabProfileData }) {
  const router = useRouter();
  const [nombre, setNombre] = useState(profile.nombre);
  const [nit, setNit] = useState(profile.nit ?? "");
  const [direccion, setDireccion] = useState(profile.direccion ?? "");
  const [responsable, setResponsable] = useState(profile.responsable ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const res = await saveLabProfile({ nombre, nit, direccion, responsable });
      setMsg(res.ok ? "Guardado." : res.error);
      if (res.ok) router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader title="Perfil de la IPS" subtitle="Aparece en el encabezado de los informes." />
      <CardBody>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre de la IPS">
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </Field>
            <Field label="NIT">
              <Input value={nit} onChange={(e) => setNit(e.target.value)} />
            </Field>
            <Field label="Dirección">
              <Input value={direccion} onChange={(e) => setDireccion(e.target.value)} />
            </Field>
            <Field label="Responsable">
              <Input value={responsable} onChange={(e) => setResponsable(e.target.value)} />
            </Field>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Guardar perfil"}
            </Button>
            {msg && <span className="text-xs text-muted">{msg}</span>}
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

type AreaDraft = { nombre: string; defaultLevels: string; orden: string; activo: boolean };

function AreasSection({ areas }: { areas: AreaItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AreaItem | null>(null);
  const [draft, setDraft] = useState<AreaDraft>({ nombre: "", defaultLevels: "2", orden: "0", activo: true });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const openNew = () => {
    setEditing(null);
    setDraft({ nombre: "", defaultLevels: "2", orden: String(areas.length + 1), activo: true });
    setError(null);
    setOpen(true);
  };
  const openEdit = (a: AreaItem) => {
    setEditing(a);
    setDraft({ nombre: a.nombre, defaultLevels: String(a.defaultLevels), orden: String(a.orden), activo: a.activo });
    setError(null);
    setOpen(true);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await saveArea(editing?.id ?? null, {
        nombre: draft.nombre,
        defaultLevels: Number(draft.defaultLevels),
        orden: Number(draft.orden),
        activo: draft.activo,
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
        title="Áreas"
        subtitle="Catálogo de áreas del laboratorio."
        action={
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4" />
            Nueva área
          </Button>
        }
      />
      <CardBody className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-5 py-2.5 font-medium">Área</th>
              <th className="px-5 py-2.5 font-medium">Niveles</th>
              <th className="px-5 py-2.5 font-medium">Orden</th>
              <th className="px-5 py-2.5 font-medium">Estado</th>
              <th className="px-5 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {areas.map((a) => (
              <tr key={a.id} className="border-b border-border/60 last:border-0">
                <td className="px-5 py-2.5 font-medium text-foreground">{a.nombre}</td>
                <td className="px-5 py-2.5 text-foreground">{a.defaultLevels}</td>
                <td className="px-5 py-2.5 text-muted">{a.orden}</td>
                <td className="px-5 py-2.5 text-muted">{a.activo ? "Activa" : "Inactiva"}</td>
                <td className="px-5 py-2.5 text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(a)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardBody>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar área" : "Nueva área"}>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Nombre">
            <Input value={draft.nombre} onChange={(e) => setDraft({ ...draft, nombre: e.target.value })} required autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Niveles esperados">
              <Input type="number" min="1" max="10" value={draft.defaultLevels} onChange={(e) => setDraft({ ...draft, defaultLevels: e.target.value })} />
            </Field>
            <Field label="Orden">
              <Input type="number" min="0" value={draft.orden} onChange={(e) => setDraft({ ...draft, orden: e.target.value })} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={draft.activo} onChange={(e) => setDraft({ ...draft, activo: e.target.checked })} className="h-4 w-4 rounded border-border" />
            Activa
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

type TriggerDraft = { nombre: string; orden: string; activo: boolean };

function TriggersSection({ triggers }: { triggers: TriggerItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TriggerItem | null>(null);
  const [draft, setDraft] = useState<TriggerDraft>({ nombre: "", orden: "0", activo: true });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const openNew = () => {
    setEditing(null);
    setDraft({ nombre: "", orden: String(triggers.length + 1), activo: true });
    setError(null);
    setOpen(true);
  };
  const openEdit = (t: TriggerItem) => {
    setEditing(t);
    setDraft({ nombre: t.nombre, orden: String(t.orden), activo: t.activo });
    setError(null);
    setOpen(true);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await saveTrigger(editing?.id ?? null, {
        nombre: draft.nombre,
        orden: Number(draft.orden),
        activo: draft.activo,
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
        title="Eventos disparadores"
        subtitle="Motivos de una corrida de control."
        action={
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4" />
            Nuevo evento
          </Button>
        }
      />
      <CardBody className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-5 py-2.5 font-medium">Evento</th>
              <th className="px-5 py-2.5 font-medium">Orden</th>
              <th className="px-5 py-2.5 font-medium">Estado</th>
              <th className="px-5 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {triggers.map((t) => (
              <tr key={t.id} className="border-b border-border/60 last:border-0">
                <td className="px-5 py-2.5 font-medium text-foreground">{t.nombre}</td>
                <td className="px-5 py-2.5 text-muted">{t.orden}</td>
                <td className="px-5 py-2.5 text-muted">{t.activo ? "Activo" : "Inactivo"}</td>
                <td className="px-5 py-2.5 text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardBody>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar evento" : "Nuevo evento"}>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Nombre">
            <Input value={draft.nombre} onChange={(e) => setDraft({ ...draft, nombre: e.target.value })} required autoFocus />
          </Field>
          <Field label="Orden">
            <Input type="number" min="0" value={draft.orden} onChange={(e) => setDraft({ ...draft, orden: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={draft.activo} onChange={(e) => setDraft({ ...draft, activo: e.target.checked })} className="h-4 w-4 rounded border-border" />
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

export function ConfigClient({
  profile,
  areas,
  triggers,
}: {
  profile: LabProfileData;
  areas: AreaItem[];
  triggers: TriggerItem[];
}) {
  return (
    <div className="space-y-5">
      <ProfileForm profile={profile} />
      <AreasSection areas={areas} />
      <TriggersSection triggers={triggers} />
    </div>
  );
}
