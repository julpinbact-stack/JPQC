"use client";

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";

export type ReportRow = {
  nombre: string;
  areaNombre: string;
  n: number;
  cvPct: number | null;
  biasPct: number | null;
  tePct: number | null;
  etaPct: number | null;
  sigma: number | null;
  uncertaintyU: number | null;
  competent: boolean | null;
  biasSource: "CCE" | "inserto" | null;
};

export type ReportData = {
  ipsNombre: string;
  ipsNit: string | null;
  responsable: string | null;
  periodo: string;
  generado: string;
  analisis: string;
  firmadoPor: string;
  rows: ReportRow[];
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, color: "#0f1b2d", fontFamily: "Helvetica" },
  h1: { fontSize: 14, fontWeight: 700 },
  sub: { fontSize: 9, color: "#5b6b7f", marginTop: 2 },
  section: { marginTop: 14 },
  sectionTitle: { fontSize: 10, fontWeight: 700, marginBottom: 6, color: "#0e7490" },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#dde3ea" },
  headRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#0e7490", backgroundColor: "#eef2f7" },
  cell: { paddingVertical: 3, paddingHorizontal: 3 },
  hcell: { paddingVertical: 4, paddingHorizontal: 3, fontWeight: 700, fontSize: 8, color: "#5b6b7f" },
  analysis: { borderWidth: 0.5, borderColor: "#dde3ea", borderRadius: 4, padding: 8, minHeight: 60, fontSize: 9 },
  sign: { marginTop: 40, flexDirection: "row", justifyContent: "space-between" },
  signBox: { width: "45%", borderTopWidth: 0.5, borderTopColor: "#0f1b2d", paddingTop: 4, fontSize: 8 },
});

// Anchos de columna (proporción)
const W = { analito: 3, n: 0.8, cv: 1, sesgo: 1.2, et: 1, eta: 1, sigma: 1, u: 1, comp: 1.2 };

const f = (v: number | null, d = 2) => (v == null ? "—" : v.toFixed(d));

function ReportDocument({ data }: { data: ReportData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.h1}>{data.ipsNombre || "Laboratorio Clínico"}</Text>
          <Text style={styles.sub}>
            Informe de Control de Calidad Analítico{data.ipsNit ? ` · NIT ${data.ipsNit}` : ""}
          </Text>
          <Text style={styles.sub}>
            Periodo: {data.periodo}    ·    Generado: {data.generado}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Indicadores de competencia analítica</Text>
          <View style={styles.headRow}>
            <Text style={[styles.hcell, { flex: W.analito }]}>Analito</Text>
            <Text style={[styles.hcell, { flex: W.n }]}>n</Text>
            <Text style={[styles.hcell, { flex: W.cv }]}>CV%</Text>
            <Text style={[styles.hcell, { flex: W.sesgo }]}>Sesgo%</Text>
            <Text style={[styles.hcell, { flex: W.et }]}>ET%</Text>
            <Text style={[styles.hcell, { flex: W.eta }]}>ETa%</Text>
            <Text style={[styles.hcell, { flex: W.sigma }]}>Sigma</Text>
            <Text style={[styles.hcell, { flex: W.u }]}>U%</Text>
            <Text style={[styles.hcell, { flex: W.comp }]}>Competente</Text>
          </View>
          {data.rows.map((r, i) => (
            <View style={styles.row} key={i}>
              <Text style={[styles.cell, { flex: W.analito }]}>
                {r.nombre} ({r.areaNombre})
              </Text>
              <Text style={[styles.cell, { flex: W.n }]}>{r.n}</Text>
              <Text style={[styles.cell, { flex: W.cv }]}>{f(r.cvPct)}</Text>
              <Text style={[styles.cell, { flex: W.sesgo }]}>
                {f(r.biasPct)}{r.biasSource ? ` ${r.biasSource === "CCE" ? "(CCE)" : "(ins)"}` : ""}
              </Text>
              <Text style={[styles.cell, { flex: W.et }]}>{f(r.tePct)}</Text>
              <Text style={[styles.cell, { flex: W.eta }]}>{f(r.etaPct, 1)}</Text>
              <Text style={[styles.cell, { flex: W.sigma }]}>{f(r.sigma)}</Text>
              <Text style={[styles.cell, { flex: W.u }]}>{f(r.uncertaintyU)}</Text>
              <Text style={[styles.cell, { flex: W.comp }]}>
                {r.competent == null ? "—" : r.competent ? "Sí" : "No"}
              </Text>
            </View>
          ))}
          {data.rows.length === 0 && (
            <Text style={{ padding: 6, color: "#5b6b7f" }}>
              Sin analitos con datos suficientes en el periodo.
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Análisis cualitativo</Text>
          <Text style={styles.analysis}>{data.analisis || " "}</Text>
        </View>

        <View style={styles.sign}>
          <View style={styles.signBox}>
            <Text>{data.firmadoPor || " "}</Text>
            <Text style={{ color: "#5b6b7f" }}>Responsable del control de calidad</Text>
          </View>
          <View style={styles.signBox}>
            <Text> </Text>
            <Text style={{ color: "#5b6b7f" }}>Fecha</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export function ReportDownload({ data }: { data: ReportData }) {
  return (
    <PDFDownloadLink
      document={<ReportDocument data={data} />}
      fileName={`Informe-CCI-${data.periodo}.pdf`}
    >
      {({ loading }) => (
        <span className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">
          {loading ? "Generando PDF…" : "Descargar PDF"}
        </span>
      )}
    </PDFDownloadLink>
  );
}
