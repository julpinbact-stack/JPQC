// Tipos client-safe para Configuración.

export type LabProfileData = {
  nombre: string;
  nit: string | null;
  direccion: string | null;
  responsable: string | null;
};

export type AreaItem = {
  id: string;
  nombre: string;
  defaultLevels: number;
  orden: number;
  activo: boolean;
};

export type TriggerItem = {
  id: string;
  nombre: string;
  orden: number;
  activo: boolean;
};

export type ActionResult = { ok: true } | { ok: false; error: string };
