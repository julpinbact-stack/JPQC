import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ─────────────────────────────────────────────────────────────
// Datos semilla (editables luego desde la app)
// Ref: docs/SDD.md §5.3
// ─────────────────────────────────────────────────────────────

const AREAS: { nombre: string; defaultLevels: number; orden: number }[] = [
  { nombre: "Química clínica", defaultLevels: 2, orden: 1 },
  { nombre: "Química especial", defaultLevels: 3, orden: 2 },
  { nombre: "Hematología", defaultLevels: 3, orden: 3 },
  { nombre: "Coagulación", defaultLevels: 2, orden: 4 },
  { nombre: "Inmunoensayo", defaultLevels: 3, orden: 5 },
];

const TRIGGER_EVENTS: string[] = [
  "Rutina",
  "Calibración",
  "Cambio de reactivo",
  "Cambio de lote de control",
  "Verificación post-avería",
  "Mantenimiento",
];

// Analitos con su referencia de calidad precargada.
//  - eta: Error Total permitido (%). Fuente: CLIA 2025; donde CLIA no regula, Ricós/EFLM
//    deseable calculado = 0.25·√(CVi²+CVg²) + 1.65·(0.5·CVi).
//  - cvi/cvg: variación biológica (Ricós/EFLM).
//  Microalbuminuria queda en MANUAL (la PO la ingresa). Valores por validar por la PO.
//  Fuentes: westgard.com CLIA 2025 y Desirable Biological Variation Database. Ref: docs/SDD.md §5.3.
type EtaSourceSeed = "CLIA" | "RICOS_DES" | "MANUAL";
type AnalyteSeed = {
  nombre: string;
  area: string;
  unidad: string;
  decimales?: number;
  eta?: number | null;
  etaSource?: EtaSourceSeed;
  cvi?: number | null;
  cvg?: number | null;
};

const ANALYTES: AnalyteSeed[] = [
  // Química clínica
  { nombre: "Glucosa", area: "Química clínica", unidad: "mg/dL", eta: 8, etaSource: "CLIA", cvi: 5.6, cvg: 7.5 },
  { nombre: "Colesterol total", area: "Química clínica", unidad: "mg/dL", eta: 10, etaSource: "CLIA", cvi: 5.95, cvg: 15.3 },
  { nombre: "Triglicéridos", area: "Química clínica", unidad: "mg/dL", eta: 15, etaSource: "CLIA", cvi: 19.9, cvg: 32.7 },
  { nombre: "Creatinina", area: "Química clínica", unidad: "mg/dL", eta: 10, etaSource: "CLIA", cvi: 5.95, cvg: 14.7 },
  { nombre: "Ácido úrico", area: "Química clínica", unidad: "mg/dL", eta: 10, etaSource: "CLIA", cvi: 8.6, cvg: 17.5 },
  { nombre: "Nitrógeno ureico (BUN)", area: "Química clínica", unidad: "mg/dL", eta: 9, etaSource: "CLIA", cvi: 12.1, cvg: 18.7 },
  { nombre: "TGO (AST)", area: "Química clínica", unidad: "U/L", eta: 15, etaSource: "CLIA", cvi: 12.3, cvg: 23.1 },
  { nombre: "TGP (ALT)", area: "Química clínica", unidad: "U/L", eta: 15, etaSource: "CLIA", cvi: 19.4, cvg: 41.6 },
  { nombre: "Bilirrubina total", area: "Química clínica", unidad: "mg/dL", eta: 20, etaSource: "CLIA", cvi: 21.8, cvg: 28.4 },
  { nombre: "Bilirrubina directa", area: "Química clínica", unidad: "mg/dL", eta: 44.6, etaSource: "RICOS_DES", cvi: 36.8, cvg: 43.2 },
  { nombre: "Fosfatasa alcalina", area: "Química clínica", unidad: "U/L", eta: 20, etaSource: "CLIA", cvi: 6.45, cvg: 26.1 },
  { nombre: "Amilasa", area: "Química clínica", unidad: "U/L", eta: 20, etaSource: "CLIA", cvi: 8.7, cvg: 28.3 },
  // Química especial
  { nombre: "Hemoglobina glicada (HbA1c)", area: "Química especial", unidad: "%", eta: 8, etaSource: "CLIA", cvi: 1.9, cvg: 5.7 },
  { nombre: "Microalbuminuria", area: "Química especial", unidad: "mg/L", etaSource: "MANUAL" },
  // Hematología
  { nombre: "Leucocitos (WBC)", area: "Hematología", unidad: "10³/µL", eta: 10, etaSource: "CLIA", cvi: 11.4, cvg: 21.3 },
  { nombre: "Eritrocitos (RBC)", area: "Hematología", unidad: "10⁶/µL", decimales: 2, eta: 4, etaSource: "CLIA", cvi: 3.2, cvg: 6.3 },
  { nombre: "Hematocrito", area: "Hematología", unidad: "%", decimales: 1, eta: 4, etaSource: "CLIA", cvi: 2.7, cvg: 6.41 },
  { nombre: "Hemoglobina", area: "Hematología", unidad: "g/dL", decimales: 1, eta: 4, etaSource: "CLIA", cvi: 2.85, cvg: 6.8 },
  { nombre: "%IDE (RDW)", area: "Hematología", unidad: "%", decimales: 1, eta: 4.6, etaSource: "RICOS_DES", cvi: 3.5, cvg: 5.7 },
  { nombre: "VCM (MCV)", area: "Hematología", unidad: "fL", decimales: 1, eta: 2.4, etaSource: "RICOS_DES", cvi: 1.4, cvg: 4.85 },
  { nombre: "CMH (HCM)", area: "Hematología", unidad: "pg", decimales: 1, eta: 2.5, etaSource: "RICOS_DES", cvi: 1.4, cvg: 5.2 },
  { nombre: "CMHC (CHCM)", area: "Hematología", unidad: "g/dL", decimales: 1, eta: 1.3, etaSource: "RICOS_DES", cvi: 1.06, cvg: 1.2 },
  { nombre: "Plaquetas", area: "Hematología", unidad: "10³/µL", decimales: 0, eta: 25, etaSource: "CLIA", cvi: 9.1, cvg: 21.9 },
  // Coagulación
  { nombre: "Tiempo de protrombina (PT)", area: "Coagulación", unidad: "s", decimales: 1, eta: 15, etaSource: "CLIA", cvi: 4.0, cvg: 6.8 },
  { nombre: "Tiempo de tromboplastina (PTT)", area: "Coagulación", unidad: "s", decimales: 1, eta: 4.5, etaSource: "RICOS_DES", cvi: 2.7, cvg: 8.6 },
  // Inmunoensayo
  { nombre: "TSH", area: "Inmunoensayo", unidad: "µUI/mL", decimales: 3, eta: 20, etaSource: "CLIA", cvi: 19.3, cvg: 24.6 },
  { nombre: "PSA", area: "Inmunoensayo", unidad: "ng/mL", decimales: 2, eta: 20, etaSource: "CLIA", cvi: 18.1, cvg: 72.4 },
  { nombre: "T4 libre", area: "Inmunoensayo", unidad: "ng/dL", decimales: 2, eta: 15, etaSource: "CLIA", cvi: 5.7, cvg: 12.1 },
];

async function main() {
  // Perfil de la IPS (solo si no existe ninguno)
  const perfil = await prisma.labProfile.findFirst();
  if (!perfil) {
    await prisma.labProfile.create({
      data: { nombre: "Laboratorio Clínico (configurar en Configuración)" },
    });
    console.log("✓ LabProfile creado");
  }

  // Áreas
  const areaByName = new Map<string, string>();
  for (const a of AREAS) {
    const area = await prisma.area.upsert({
      where: { nombre: a.nombre },
      update: { defaultLevels: a.defaultLevels, orden: a.orden },
      create: a,
    });
    areaByName.set(a.nombre, area.id);
  }
  console.log(`✓ ${AREAS.length} áreas`);

  // Eventos disparadores
  for (let i = 0; i < TRIGGER_EVENTS.length; i++) {
    await prisma.triggerEvent.upsert({
      where: { nombre: TRIGGER_EVENTS[i] },
      update: { orden: i + 1 },
      create: { nombre: TRIGGER_EVENTS[i], orden: i + 1 },
    });
  }
  console.log(`✓ ${TRIGGER_EVENTS.length} eventos disparadores`);

  // Analitos (idempotente por nombre+área). Rellena la referencia de calidad sin
  // sobrescribir ediciones de la PO (solo completa cuando ETa y CVi están vacíos).
  let creados = 0;
  let actualizados = 0;
  for (const an of ANALYTES) {
    const areaId = areaByName.get(an.area);
    if (!areaId) throw new Error(`Área no encontrada para analito ${an.nombre}: ${an.area}`);
    const ref = {
      etaValue: an.eta ?? null,
      etaSource: an.etaSource ?? "MANUAL",
      cvi: an.cvi ?? null,
      cvg: an.cvg ?? null,
    };
    const existe = await prisma.analyte.findFirst({
      where: { nombre: an.nombre, areaId },
    });
    if (!existe) {
      await prisma.analyte.create({
        data: {
          nombre: an.nombre,
          areaId,
          unidad: an.unidad,
          decimales: an.decimales ?? 2,
          ...ref,
        },
      });
      creados++;
    } else if (
      existe.etaValue == null &&
      existe.cvi == null &&
      (an.eta != null || an.cvi != null)
    ) {
      await prisma.analyte.update({ where: { id: existe.id }, data: ref });
      actualizados++;
    }
  }
  console.log(
    `✓ analitos: ${creados} creados, ${actualizados} actualizados con referencia, ` +
      `${ANALYTES.length - creados - actualizados} sin cambios`
  );
}

main()
  .then(() => console.log("Seed completado."))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
