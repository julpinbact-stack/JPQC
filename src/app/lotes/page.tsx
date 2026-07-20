import { getLots } from "@/server/lots";
import { LotManager } from "@/components/lotes/LotManager";

export const dynamic = "force-dynamic";

export default async function LotesPage() {
  const lots = await getLots();

  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-sm text-muted">
        Lotes de material de control de tercera opinión. Cada lote corresponde a un nivel con su
        número de lote y fechas. Dentro de cada lote se registran los valores del inserto (media
        diana y DS) por analito, con cálculo automático del %CV.
      </p>
      <LotManager lots={lots} />
    </div>
  );
}
