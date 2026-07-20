import { getIndicators, type IndicatorRow } from "@/server/indicators";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

const f = (n: number | null, d = 2) => (n == null ? "—" : n.toFixed(d));

function SigmaCell({ sigma }: { sigma: number | null }) {
  if (sigma == null) return <span className="text-muted">—</span>;
  const color =
    sigma >= 6
      ? "text-success"
      : sigma >= 4
        ? "text-foreground"
        : sigma >= 3
          ? "text-warning"
          : "text-danger";
  return <span className={`font-medium ${color}`}>{sigma.toFixed(2)}</span>;
}

export default async function IndicadoresPage() {
  const rows = await getIndicators();
  const withData = rows.filter((r) => r.hasEnoughData);

  return (
    <div className="space-y-5">
      <p className="max-w-3xl text-sm text-muted">
        Indicadores de competencia analítica por analito: imprecisión (CV), inexactitud (sesgo),
        error total (ET) frente al ETa, métrica Sigma e incertidumbre expandida (U). Se calculan
        con los datos acumulados (mínimo 5 corridas por nivel). El sesgo es{" "}
        <span className="text-warning">provisional vs inserto</span> hasta integrar el CCE.
      </p>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-4 py-2.5 font-medium">Analito</th>
                <th className="px-4 py-2.5 font-medium">n</th>
                <th className="px-4 py-2.5 font-medium">CV%</th>
                <th className="px-4 py-2.5 font-medium">Sesgo%</th>
                <th className="px-4 py-2.5 font-medium">ET%</th>
                <th className="px-4 py-2.5 font-medium">ETa%</th>
                <th className="px-4 py-2.5 font-medium">Sigma</th>
                <th className="px-4 py-2.5 font-medium">U%</th>
                <th className="px-4 py-2.5 font-medium">Competente</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: IndicatorRow) => (
                <tr key={r.analyteId} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-foreground">{r.nombre}</span>
                    <span className="block text-[11px] text-muted">{r.areaNombre}</span>
                  </td>
                  <td className="px-4 py-2.5 text-foreground">{r.n}</td>
                  {r.hasEnoughData ? (
                    <>
                      <td className="px-4 py-2.5 text-foreground">{f(r.cvPct)}</td>
                      <td className="px-4 py-2.5 text-foreground">
                        {f(r.biasPct)}
                        {r.biasSource && (
                          <span
                            className={`ml-1 text-[10px] ${r.biasSource === "CCE" ? "text-success" : "text-warning"}`}
                          >
                            {r.biasSource === "CCE" ? "CCE" : "ins."}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-foreground">{f(r.tePct)}</td>
                      <td className="px-4 py-2.5 text-muted">{f(r.etaPct, 1)}</td>
                      <td className="px-4 py-2.5">
                        <SigmaCell sigma={r.sigma} />
                      </td>
                      <td className="px-4 py-2.5 text-foreground">{f(r.uncertaintyU)}</td>
                      <td className="px-4 py-2.5">
                        {r.competent == null ? (
                          <span className="text-muted">—</span>
                        ) : r.competent ? (
                          <span className="inline-flex rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-medium text-success">
                            Sí
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-medium text-danger">
                            No
                          </span>
                        )}
                      </td>
                    </>
                  ) : (
                    <td colSpan={7} className="px-4 py-2.5 text-xs text-muted">
                      Datos insuficientes (se requieren ≥ 5 corridas por nivel).
                    </td>
                  )}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-muted">
                    No hay analitos con lotes de control activos. Registra lotes e ingresa corridas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {rows.length > 0 && withData.length === 0 && (
        <p className="text-xs text-muted">
          Aún no hay suficientes corridas para calcular indicadores. Ingresa al menos 5 corridas por
          nivel en el módulo de Ingreso diario.
        </p>
      )}
    </div>
  );
}
