/** Zona horaria del laboratorio. Ancla el "hoy" del servidor sin importar dónde se despliegue. */
export const LAB_TIME_ZONE = "America/Bogota";

/**
 * Fecha de hoy ("YYYY-MM-DD") en la zona horaria del laboratorio.
 * Se compara como texto porque el formato ISO ya ordena cronológicamente.
 * Anclarlo a la zona del laboratorio evita que, en horas de la noche, el
 * servidor acepte la fecha de mañana por estar ya en el día siguiente en UTC.
 */
export function todayInLabTz(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: LAB_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
