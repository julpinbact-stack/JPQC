import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { mean as statMean, sd as statSd } from "../src/lib/qc/stats";
import { evaluateWestgard, type LevelMeasurement } from "../src/lib/qc/westgard";
import { selectRulesBySigma } from "../src/lib/qc/sigma";

// ════════════════════════════════════════════════════════════════════════════
// SEED DE DEMOSTRACIÓN — datos FICTICIOS para mostrar gráficas e informes.
//
// ⚠️  NO es data clínica. Se activa aparte del seed base (catálogos + analitos)
//     y SOLO cuando DEMO_MODE=true en el arranque (docker/entrypoint.sh).
//     Un despliegue real del laboratorio NUNCA lo ejecuta.
//
// Genera, sobre los catálogos existentes:
//   · Lotes de control de tercera opinión por área y nivel.
//   · Metas (inserto) por lote-nivel × analito; algunas ya "establecidas".
//   · ~26 corridas de CCI por analito con series realistas (PRNG determinista),
//     con violaciones Westgard inyectadas para ver ADVERTENCIA/RECHAZADA.
//   · Resultados de CCE (2 proveedores) que alimentan el sesgo de indicadores.
//
// Los z-score y estados se calculan con el MISMO motor que usa la app
// (evaluateWestgard / selectRulesBySigma), de modo que Levey-Jennings,
// indicadores e informe queden 100 % coherentes.
//
// Es idempotente: si ya existen lotes, no hace nada (no pisa datos reales).
// ════════════════════════════════════════════════════════════════════════════

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ── PRNG determinista (mulberry32) para una demo reproducible en cada deploy ──
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Muestra normal estándar N(0,1) mediante Box-Muller, usando el PRNG dado. */
function randn(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function round(x: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(x * f) / f;
}

const SEED = 0x1a2b3c4d;
const N_RUNS = 26; // corridas por analito (≈ 3 días de separación → ~10 semanas)
const RUN_SPACING_DAYS = 3;

const OPERADORES = ["Q.F. L. Gómez", "Bact. M. Ruiz", "T.L. J. Pérez"];

// ── Configuración de la data por analito ─────────────────────────────────────
// means: media del inserto por nivel (su longitud = niveles del área).
// cv: coeficiente de variación (%) del material → DS = media·cv/100.
type DemoCfg = { cv: number; means: number[] };

const DEMO: Record<string, DemoCfg> = {
  // Química clínica (2 niveles)
  Glucosa: { cv: 2.5, means: [95, 265] },
  "Colesterol total": { cv: 2.5, means: [135, 245] },
  "Triglicéridos": { cv: 3.0, means: [115, 215] },
  Creatinina: { cv: 3.0, means: [1.0, 4.8] },
  "Ácido úrico": { cv: 3.0, means: [4.6, 9.2] },
  "Nitrógeno ureico (BUN)": { cv: 3.0, means: [16, 52] },
  "TGO (AST)": { cv: 4.0, means: [42, 175] },
  "TGP (ALT)": { cv: 4.0, means: [38, 150] },
  "Bilirrubina total": { cv: 4.0, means: [1.1, 4.6] },
  "Bilirrubina directa": { cv: 6.0, means: [0.5, 2.4] },
  "Fosfatasa alcalina": { cv: 3.0, means: [95, 320] },
  Amilasa: { cv: 3.0, means: [85, 300] },
  // Química especial (3 niveles)
  "Hemoglobina glicada (HbA1c)": { cv: 2.0, means: [5.6, 7.6, 10.4] },
  Microalbuminuria: { cv: 5.0, means: [22, 65, 150] },
  // Hematología (3 niveles)
  "Leucocitos (WBC)": { cv: 3.0, means: [3.6, 7.6, 17.5] },
  "Eritrocitos (RBC)": { cv: 2.0, means: [3.1, 4.8, 5.7] },
  Hematocrito: { cv: 2.0, means: [29, 42, 52] },
  Hemoglobina: { cv: 2.0, means: [9.8, 14.0, 17.4] },
  "%IDE (RDW)": { cv: 2.5, means: [12.6, 14.2, 16.0] },
  "VCM (MCV)": { cv: 1.5, means: [80, 90, 100] },
  "CMH (HCM)": { cv: 1.5, means: [27, 30, 33] },
  "CMHC (CHCM)": { cv: 1.2, means: [32.5, 34, 35.5] },
  Plaquetas: { cv: 4.0, means: [95, 250, 440] },
  // Coagulación (2 niveles)
  "Tiempo de protrombina (PT)": { cv: 3.0, means: [12.5, 26] },
  "Tiempo de tromboplastina (PTT)": { cv: 3.0, means: [31, 58] },
  // Inmunoensayo (3 niveles)
  TSH: { cv: 5.0, means: [0.45, 3.8, 24] },
  PSA: { cv: 5.0, means: [1.6, 6.0, 19] },
  "T4 libre": { cv: 4.0, means: [0.85, 1.4, 3.4] },
};

// Material de control por área.
const LOT_BRANDS: Record<string, { fabricante: string; nombreComercial: string }> = {
  "Química clínica": { fabricante: "Bio-Rad", nombreComercial: "Lyphochek" },
  "Química especial": { fabricante: "Bio-Rad", nombreComercial: "Diabetes Control" },
  "Hematología": { fabricante: "Sysmex", nombreComercial: "e-CHECK" },
  "Coagulación": { fabricante: "Stago", nombreComercial: "STA Coag Control" },
  "Inmunoensayo": { fabricante: "Bio-Rad", nombreComercial: "Immunoassay Plus" },
};

// Violaciones Westgard inyectadas: clave `analito|nivel|indiceCorrida` → z forzado.
// Construyen, de forma determinista, ejemplos visibles de cada tipo de regla.
const INJECT: Record<string, number> = {
  "Glucosa|2|12": 3.4, // 1_3s (rechazo)
  "Creatinina|1|9": 2.4, // 1_2s (advertencia) …
  "Creatinina|1|10": 2.5, // … + 2_2s entre corridas (rechazo)
  "Colesterol total|1|6": 1.4, // inicio de racha 4_1s …
  "Colesterol total|1|7": 1.4,
  "Colesterol total|1|8": 1.4,
  "Colesterol total|1|9": 1.4, // … 4_1s (rechazo) en la 4.ª
  "TGP (ALT)|2|14": 2.3, // 1_2s (advertencia)
  "TSH|3|15": -2.6, // 1_2s (advertencia)
};

function injection(analyte: string, levelIndex: number, runIndex: number): number | null {
  const key = `${analyte}|${levelIndex}|${runIndex}`;
  return key in INJECT ? INJECT[key] : null;
}

// ── Utilidades de fecha (script normal: new Date() está permitido) ────────────
const NOW = new Date();

function runDate(i: number): Date {
  // i cronológico (0 = más antigua). La última corrida cae ~hoy.
  const daysAgo = (N_RUNS - 1 - i) * RUN_SPACING_DAYS;
  const d = new Date(NOW);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(8, 0, 0, 0);
  return d;
}

function monthLabel(offsetMonthsAgo: number): { ciclo: string; fecha: Date } {
  const d = new Date(Date.UTC(NOW.getUTCFullYear(), NOW.getUTCMonth() - offsetMonthsAgo, 15, 12));
  const ciclo = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  return { ciclo, fecha: d };
}

// ════════════════════════════════════════════════════════════════════════════

async function main() {
  // Guarda de idempotencia / seguridad: si ya hay lotes, no tocamos nada.
  const lotCount = await prisma.controlLot.count();
  if (lotCount > 0) {
    console.log("● Demo omitida: ya existen lotes de control (no se pisan datos).");
    return;
  }

  const areas = await prisma.area.findMany();
  const analytes = await prisma.analyte.findMany({ include: { area: true } });
  if (analytes.length === 0) {
    console.error("✗ No hay analitos. Ejecuta primero el seed base: `prisma db seed`.");
    process.exit(1);
  }

  const rutina = await prisma.triggerEvent.findFirst({ where: { nombre: "Rutina" } });

  // ── Perfil de la IPS (demostración) ────────────────────────────────────────
  const perfil = await prisma.labProfile.findFirst();
  const perfilData = {
    nombre: "IPS Laboratorio Clínico Demo S.A.S.",
    nit: "900.123.456-7",
    direccion: "Calle 100 # 15-20, Bogotá D.C.",
    responsable: "Q.F. Diana López — Coordinadora de Calidad",
  };
  if (perfil) {
    await prisma.labProfile.update({ where: { id: perfil.id }, data: perfilData });
  } else {
    await prisma.labProfile.create({ data: perfilData });
  }
  console.log("✓ Perfil de la IPS (demo) configurado");

  // ── Lotes de control por área (uno por nivel) ──────────────────────────────
  const venc = new Date(NOW);
  venc.setUTCFullYear(venc.getUTCFullYear() + 1);
  const apertura = new Date(NOW);
  apertura.setUTCDate(apertura.getUTCDate() - (N_RUNS - 1) * RUN_SPACING_DAYS - 5);

  const areaLots = new Map<string, { id: string; levelIndex: number }[]>();
  for (const area of areas) {
    const brand = LOT_BRANDS[area.nombre] ?? { fabricante: "Control", nombreComercial: "QC" };
    const lots: { id: string; levelIndex: number }[] = [];
    for (let lvl = 1; lvl <= area.defaultLevels; lvl++) {
      const lot = await prisma.controlLot.create({
        data: {
          fabricante: brand.fabricante,
          nombreComercial: brand.nombreComercial,
          levelLabel: `Nivel ${lvl}`,
          levelIndex: lvl,
          numeroLote: `DEMO-${slug(area.nombre)}-N${lvl}-2026`,
          vencimiento: venc,
          apertura,
          activo: true,
        },
      });
      lots.push({ id: lot.id, levelIndex: lvl });
    }
    areaLots.set(area.nombre, lots);
  }
  const totalLots = [...areaLots.values()].reduce((n, l) => n + l.length, 0);
  console.log(`✓ ${totalLots} lotes de control creados`);

  // ── Proveedores de CCE ─────────────────────────────────────────────────────
  const providers = [
    { nombre: "Bio-Rad EQAS", acreditacion: "ISO/IEC 17043" },
    { nombre: "PROLAB (ICQC)", acreditacion: "ISO/IEC 17043" },
  ];
  const providerIds: string[] = [];
  for (const p of providers) {
    const created = await prisma.externalQcProvider.upsert({
      where: { nombre: p.nombre },
      update: { acreditacion: p.acreditacion },
      create: p,
    });
    providerIds.push(created.id);
  }
  console.log(`✓ ${providerIds.length} proveedores de CCE`);

  // ── Por analito: metas, corridas de CCI, establecimiento y CCE ─────────────
  let totalRuns = 0;
  let totalResults = 0;
  let establecidos = 0;
  let totalCce = 0;

  let idx = 0;
  for (const analyte of analytes) {
    const cfg = DEMO[analyte.nombre];
    if (!cfg) {
      idx++;
      continue;
    }
    const lots = areaLots.get(analyte.area.nombre) ?? [];
    const levelCount = Math.min(cfg.means.length, lots.length);
    if (levelCount === 0) {
      idx++;
      continue;
    }
    const decimals = analyte.decimales;
    const rng = mulberry32(SEED + idx * 7919);

    // Metas por nivel (valores del inserto).
    const targets: {
      targetId: string;
      lotId: string;
      levelIndex: number;
      mean: number;
      sd: number;
      cv: number;
    }[] = [];
    for (let li = 0; li < levelCount; li++) {
      const mu = cfg.means[li];
      const sdv = round((mu * cfg.cv) / 100, Math.max(decimals, 3));
      const lot = lots[li];
      const t = await prisma.lotAnalyteTarget.create({
        data: {
          lotId: lot.id,
          analyteId: analyte.id,
          insertMean: mu,
          insertSd: sdv,
          insertCv: cfg.cv,
          status: "PROVISIONAL",
        },
      });
      targets.push({
        targetId: t.id,
        lotId: lot.id,
        levelIndex: lot.levelIndex,
        mean: mu,
        sd: sdv,
        cv: cfg.cv,
      });
    }

    // Corridas de CCI (cronológicas), construyendo el historial de z como la app.
    const rules = selectRulesBySigma(null, targets.length).rules;
    const history: number[][] = targets.map(() => []);
    const acceptedValues: number[][] = targets.map(() => []);

    for (let r = 0; r < N_RUNS; r++) {
      const fecha = runDate(r);
      const measurements: LevelMeasurement[] = [];
      const perLevel: { lotId: string; value: number; z: number; li: number }[] = [];

      targets.forEach((t, li) => {
        const inj = injection(analyte.nombre, t.levelIndex, r);
        const zRaw = inj != null ? inj : randn(rng) * 0.9;
        const value = round(t.mean + zRaw * t.sd, decimals);
        const z = (value - t.mean) / t.sd;
        measurements.push({ levelIndex: t.levelIndex, z, history: history[li].slice() });
        perLevel.push({ lotId: t.lotId, value, z, li });
      });

      const evalR = evaluateWestgard(measurements, rules);

      await prisma.qcRun.create({
        data: {
          fecha,
          triggerEventId: rutina?.id ?? null,
          operador: OPERADORES[Math.floor(rng() * OPERADORES.length)],
          results: {
            create: perLevel.map((p) => ({
              analyteId: analyte.id,
              lotId: p.lotId,
              value: p.value,
              zScore: p.z,
              rulesViolated: evalR.violated,
              status: evalR.status,
              correctiveAction:
                evalR.status === "RECHAZADA"
                  ? "Se repitió la corrida tras verificar calibración y reactivo."
                  : null,
            })),
          },
        },
      });
      totalRuns++;
      totalResults += perLevel.length;

      // Las RECHAZADAS no alimentan historial ni estadística (igual que la app).
      if (evalR.status !== "RECHAZADA") {
        perLevel.forEach((p) => {
          history[p.li].push(p.z);
          acceptedValues[p.li].push(p.value);
        });
      }
    }

    // Establecer metas (analitos pares) cuando hay ≥20 corridas aceptadas.
    if (idx % 2 === 0) {
      for (let li = 0; li < targets.length; li++) {
        const vals = acceptedValues[li];
        if (vals.length >= 20) {
          await prisma.lotAnalyteTarget.update({
            where: { id: targets[li].targetId },
            data: {
              establishedMean: round(statMean(vals), Math.max(decimals, 3)),
              establishedSd: round(statSd(vals), Math.max(decimals, 3)),
              nEstablished: vals.length,
              status: "ESTABLECIDA",
              approvedBy: perfilData.responsable,
              approvedAt: runDate(N_RUNS - 1),
            },
          });
          establecidos++;
        }
      }
    }

    // CCE: 3 ciclos recientes en un proveedor (alterno), alimenta el sesgo.
    const providerId = providerIds[idx % providerIds.length];
    await prisma.providerAnalyte.upsert({
      where: { providerId_analyteId: { providerId, analyteId: analyte.id } },
      update: {},
      create: { providerId, analyteId: analyte.id },
    });
    const crng = mulberry32(SEED + idx * 104729 + 17);
    const target = cfg.means[Math.min(1, cfg.means.length - 1)];
    const sdGroup = round((target * cfg.cv * 1.6) / 100, Math.max(decimals, 3));
    for (let m = 3; m >= 1; m--) {
      const { ciclo, fecha } = monthLabel(m);
      const biasPct = round(randn(crng) * 1.6, 2);
      const labResult = round(target * (1 + biasPct / 100), decimals);
      const sdi = round((labResult - target) / (sdGroup || 1), 2);
      await prisma.externalQc.create({
        data: {
          analyteId: analyte.id,
          providerId,
          ciclo,
          nivel: "Nivel 2",
          labResult,
          targetValue: target,
          sdGroup,
          sdi,
          biasPct,
          evaluacion: Math.abs(sdi) <= 2 ? "Satisfactorio" : "Cuestionable",
          fecha,
        },
      });
      totalCce++;
    }

    idx++;
    if (idx % 6 === 0) console.log(`  … ${idx}/${analytes.length} analitos procesados`);
  }

  console.log(
    `✓ CCI: ${totalRuns} corridas, ${totalResults} resultados · ` +
      `${establecidos} metas establecidas`
  );
  console.log(`✓ CCE: ${totalCce} resultados externos`);
}

/** Simplifica un nombre de área para usarlo en el número de lote. */
function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 6)
    .toUpperCase();
}

main()
  .then(() => console.log("Seed de demostración completado."))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
