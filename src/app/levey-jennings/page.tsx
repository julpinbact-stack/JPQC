import { getEntryAnalytes } from "@/server/qc-entry";
import { LJClient } from "@/components/levey-jennings/LJClient";

export const dynamic = "force-dynamic";

export default async function LeveyJenningsPage() {
  const analytes = await getEntryAnalytes();

  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-sm text-muted">
        Gráficas de Levey-Jennings por analito y nivel, con líneas de ±1, ±2 y ±3 DS. Cada punto
        se colorea según el estado de la corrida (verde: aceptada, ámbar: advertencia, rojo:
        rechazada).
      </p>
      <LJClient analytes={analytes} />
    </div>
  );
}
