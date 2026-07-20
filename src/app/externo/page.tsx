import { getProviders, getCceResults, getAllAnalyteOpts } from "@/server/cce";
import { CCEClient } from "@/components/externo/CCEClient";

export const dynamic = "force-dynamic";

export default async function ExternoPage() {
  const [providers, results, analytes] = await Promise.all([
    getProviders(),
    getCceResults(),
    getAllAnalyteOpts(),
  ]);

  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-sm text-muted">
        Control de Calidad Externo. Administra tus proveedores (multiproveedor) y los analitos que
        controla cada uno, y registra los resultados de cada ciclo. El sesgo del CCE alimenta la
        métrica Sigma y la incertidumbre en el módulo de Indicadores.
      </p>
      <CCEClient providers={providers} results={results} analytes={analytes} />
    </div>
  );
}
