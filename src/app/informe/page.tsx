import { getLabProfile } from "@/server/config";
import { getIndicators } from "@/server/indicators";
import { InformeClient } from "@/components/informe/InformeClient";
import type { ReportRow } from "@/components/informe/ReportPdf";

export const dynamic = "force-dynamic";

export default async function InformePage() {
  const [profile, indicators] = await Promise.all([getLabProfile(), getIndicators()]);

  const rows: ReportRow[] = indicators
    .filter((r) => r.hasEnoughData)
    .map((r) => ({
      nombre: r.nombre,
      areaNombre: r.areaNombre,
      n: r.n,
      cvPct: r.cvPct,
      biasPct: r.biasPct,
      tePct: r.tePct,
      etaPct: r.etaPct,
      sigma: r.sigma,
      uncertaintyU: r.uncertaintyU,
      competent: r.competent,
      biasSource: r.biasSource,
    }));

  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-sm text-muted">
        Informe mensual consolidado del control de calidad analítico, con los indicadores por
        analito, un espacio para el análisis cualitativo y la firma, exportable a PDF para
        habilitación y auditoría.
      </p>
      <InformeClient
        ipsNombre={profile.nombre}
        ipsNit={profile.nit}
        responsable={profile.responsable}
        rows={rows}
      />
    </div>
  );
}
