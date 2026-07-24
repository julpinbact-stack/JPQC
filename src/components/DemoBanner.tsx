import { AlertTriangle } from "lucide-react";
import { isDemoMode } from "@/lib/demo";

/**
 * Franja de aviso para entornos de DEMOSTRACIÓN, fijada al borde INFERIOR del
 * viewport (queda siempre visible al hacer scroll).
 *
 * Se renderiza solo cuando `DEMO_MODE` vale "true" — la MISMA bandera que activa
 * el seed de datos ficticios en el arranque (docker/entrypoint.sh). En un
 * despliegue real del laboratorio la variable no se define y esta franja no
 * aparece, de modo que la UI nunca advierte "datos de prueba" sobre datos reales.
 *
 * El layout reserva un `padding-bottom` equivalente cuando el modo demo está
 * activo, para que esta franja fija no tape el contenido ni el pie del sidebar.
 */
export function DemoBanner() {
  if (!isDemoMode()) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-2 border-t border-warning/40 bg-warning-soft px-4 py-2 text-center text-xs text-warning shadow-[0_-1px_4px_rgba(0,0,0,0.08)]"
    >
      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
      <p>
        <span className="font-semibold">Datos de demostración.</span> Este entorno
        contiene información ficticia con fines de demostración. No debe usarse para
        decisiones clínicas, control de calidad real ni procesos de habilitación.
      </p>
    </div>
  );
}
