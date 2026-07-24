/**
 * Modo DEMOSTRACIÓN (datos ficticios).
 *
 * Fuente única de verdad para la bandera de servidor `DEMO_MODE`: la usan tanto
 * la franja de aviso (DemoBanner) como el layout (para reservar el espacio del
 * borde inferior). Se evalúa en tiempo de ejecución en el servidor —todas las
 * páginas son `force-dynamic`, así que nunca queda horneada en el build.
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}
