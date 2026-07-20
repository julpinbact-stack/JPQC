import { getLabProfile, getAreasFull, getTriggersFull } from "@/server/config";
import { ConfigClient } from "@/components/configuracion/ConfigClient";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const [profile, areas, triggers] = await Promise.all([
    getLabProfile(),
    getAreasFull(),
    getTriggersFull(),
  ]);

  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-sm text-muted">
        Perfil de la institución y catálogos administrables. Los proveedores de CCE se gestionan en
        el módulo Externo.
      </p>
      <ConfigClient profile={profile} areas={areas} triggers={triggers} />
    </div>
  );
}
