import { getAnalytesGrouped, getAreaOptions } from "@/server/analytes";
import { AnalyteManager } from "@/components/parametros/AnalyteManager";

export const dynamic = "force-dynamic";

export default async function ParametrosPage() {
  const [groups, areas] = await Promise.all([
    getAnalytesGrouped(),
    getAreaOptions(),
  ]);

  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-sm text-muted">
        Catálogo de analitos con sus criterios de calidad. Los valores de ETa (CLIA 2025 /
        Ricós) y de variabilidad biológica (CVi/CVg) vienen precargados y marcados como{" "}
        <span className="text-warning">por validar</span> hasta que los confirmes. Al guardar
        un analito queda validado.
      </p>
      <AnalyteManager groups={groups} areas={areas} />
    </div>
  );
}
