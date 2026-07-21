import { getEntryAnalytes } from "@/server/qc-entry";
import { LJClient } from "@/components/levey-jennings/LJClient";

export const dynamic = "force-dynamic";

export default async function LeveyJenningsPage() {
  const analytes = await getEntryAnalytes();

  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-sm text-muted">
        Gráficas de Levey-Jennings por analito y nivel, con líneas de ±1, ±2 y ±3 DS. El eje X
        muestra el día del mes de cada corrida. Cada punto se colorea según el estado de la corrida
        (verde: aceptada, ámbar: advertencia, rojo hueco: rechazada, visible pero fuera de la línea
        y de los cálculos). Bajo cada gráfica puedes establecer la media y la DS del laboratorio a
        partir de las corridas aceptadas.
      </p>
      <LJClient analytes={analytes} />
    </div>
  );
}
