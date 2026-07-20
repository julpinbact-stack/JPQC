import { getEntryAnalytes, getTriggerEvents } from "@/server/qc-entry";
import { EntryClient } from "@/components/ingreso/EntryClient";

export const dynamic = "force-dynamic";

export default async function IngresoPage() {
  const [analytes, triggers] = await Promise.all([
    getEntryAnalytes(),
    getTriggerEvents(),
  ]);

  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-sm text-muted">
        Ingreso diario de las corridas de control. Selecciona un analito, ingresa el resultado de
        cada nivel y el sistema evalúa las reglas de Westgard (según la métrica Sigma) en tiempo
        real antes de guardar.
      </p>
      <EntryClient analytes={analytes} triggers={triggers} />
    </div>
  );
}
