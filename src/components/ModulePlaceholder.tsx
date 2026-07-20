import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Construction } from "lucide-react";

export function ModulePlaceholder({
  title,
  intro,
  fase,
  features,
}: {
  title: string;
  intro: string;
  fase: string;
  features: string[];
}) {
  return (
    <div className="max-w-3xl space-y-5">
      <Card>
        <CardHeader
          title={title}
          subtitle={intro}
          action={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted">
              <Construction className="h-3.5 w-3.5" />
              {fase}
            </span>
          }
        />
        <CardBody>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
            Funcionalidad planeada
          </p>
          <ul className="space-y-2">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {f}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
