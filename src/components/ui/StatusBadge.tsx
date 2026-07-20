import { cn } from "@/lib/utils";

export type QcStatus = "ACEPTADA" | "ADVERTENCIA" | "RECHAZADA";

const STYLES: Record<QcStatus, string> = {
  ACEPTADA: "bg-success-soft text-success",
  ADVERTENCIA: "bg-warning-soft text-warning",
  RECHAZADA: "bg-danger-soft text-danger",
};

const LABELS: Record<QcStatus, string> = {
  ACEPTADA: "Aceptada",
  ADVERTENCIA: "Advertencia",
  RECHAZADA: "Rechazada",
};

export function StatusBadge({ status }: { status: QcStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STYLES[status]
      )}
    >
      {LABELS[status]}
    </span>
  );
}
