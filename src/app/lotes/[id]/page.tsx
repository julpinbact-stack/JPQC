import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getLotDetail, getActiveAnalytes } from "@/server/lots";
import { Card, CardBody } from "@/components/ui/Card";
import { TargetManager } from "@/components/lotes/TargetManager";
import { formatDate } from "@/lib/lots";

export const dynamic = "force-dynamic";

export default async function LotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [lot, analytes] = await Promise.all([getLotDetail(id), getActiveAnalytes()]);
  if (!lot) notFound();

  const info: { label: string; value: string }[] = [
    { label: "Fabricante", value: lot.fabricante },
    { label: "Nombre comercial", value: lot.nombreComercial ?? "—" },
    { label: "Nivel", value: `${lot.levelLabel} (N.º ${lot.levelIndex})` },
    { label: "Número de lote", value: lot.numeroLote },
    { label: "Apertura", value: formatDate(lot.apertura) },
    { label: "Vencimiento", value: formatDate(lot.vencimiento) },
  ];

  return (
    <div className="space-y-5">
      <Link
        href="/lotes"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a lotes
      </Link>

      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-foreground">
          {lot.fabricante} · {lot.levelLabel}
        </h1>
        {lot.activo ? (
          <span className="inline-flex rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-medium text-success">
            Vigente
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted">
            Inactivo
          </span>
        )}
      </div>

      <Card>
        <CardBody>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            {info.map((i) => (
              <div key={i.label}>
                <dt className="text-[11px] uppercase tracking-wide text-muted">{i.label}</dt>
                <dd className="text-sm text-foreground">{i.value}</dd>
              </div>
            ))}
          </dl>
        </CardBody>
      </Card>

      <TargetManager lotId={lot.id} targets={lot.targets} allAnalytes={analytes} />
    </div>
  );
}
