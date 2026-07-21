"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { isRejected, ljDayOfMonth, ljFormatDate, type LJLevel, type LJPoint } from "@/lib/lj";

const STATUS_COLOR: Record<string, string> = {
  ACEPTADA: "var(--success)",
  ADVERTENCIA: "var(--warning)",
  RECHAZADA: "var(--danger)",
};

/**
 * Fila de la gráfica. La serie `lineValue` lleva `null` en las corridas
 * rechazadas para que la línea de tendencia las salte; `rejectedValue` lleva
 * solo esas, y se dibuja sin línea (marcador hueco rojo).
 */
type ChartRow = LJPoint & {
  day: string;
  dateLabel: string;
  lineValue: number | null;
  rejectedValue: number | null;
};

type DotProps = {
  cx?: number;
  cy?: number;
  payload?: ChartRow;
};

/** Punto de una corrida válida: relleno según el estado (aceptada/advertencia). */
function StatusDot({ cx, cy, payload }: DotProps) {
  if (cx == null || cy == null || !payload) return <g />;
  const color = STATUS_COLOR[payload.status] ?? "var(--muted)";
  return <circle cx={cx} cy={cy} r={4} fill={color} stroke="var(--surface)" strokeWidth={1} />;
}

/** Punto de una corrida rechazada: hueco y con borde grueso rojo (dato descartado). */
function RejectedDot({ cx, cy, payload }: DotProps) {
  if (cx == null || cy == null || !payload) return <g />;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill="var(--surface)"
      stroke="var(--danger)"
      strokeWidth={2.5}
    />
  );
}

export function LJChart({
  level,
  decimales,
}: {
  level: LJLevel;
  decimales: number;
}) {
  const { mean, sd, points } = level;
  const fmt = (v: number) => v.toFixed(decimales);

  const rows = useMemo<ChartRow[]>(
    () =>
      points.map((p) => {
        const rejected = isRejected(p.status);
        return {
          ...p,
          day: ljDayOfMonth(p.date),
          dateLabel: ljFormatDate(p.date),
          lineValue: rejected ? null : p.value,
          rejectedValue: rejected ? p.value : null,
        };
      }),
    [points]
  );

  /**
   * El eje mantiene `seq` como categoría (es único por corrida) y solo cambia
   * la etiqueta al día del mes. Si hay varias corridas el mismo día, el día se
   * repite: es aceptable y no colapsa los puntos.
   */
  const dayBySeq = useMemo(() => {
    const m = new Map<number, string>();
    for (const r of rows) m.set(r.seq, r.day);
    return m;
  }, [rows]);

  const rejectedCount = rows.filter((r) => r.rejectedValue != null).length;

  /**
   * Dominio Y: ±4 DS, ampliado si algún punto queda fuera. Las corridas
   * rechazadas suelen ser desviaciones grandes y tienen que verse igualmente.
   */
  const yDomain = useMemo<[number, number]>(() => {
    let lo = mean - 4 * sd;
    let hi = mean + 4 * sd;
    for (const p of points) {
      if (p.value < lo) lo = p.value - 0.5 * sd;
      if (p.value > hi) hi = p.value + 0.5 * sd;
    }
    return [lo, hi];
  }, [points, mean, sd]);

  if (points.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted">
        Sin corridas registradas para este nivel todavía.
      </div>
    );
  }

  const lines = [
    { y: mean + 3 * sd, color: "var(--danger)", label: "+3s" },
    { y: mean + 2 * sd, color: "var(--warning)", label: "+2s" },
    { y: mean + 1 * sd, color: "var(--border)", label: "+1s" },
    { y: mean, color: "var(--primary)", label: "media" },
    { y: mean - 1 * sd, color: "var(--border)", label: "-1s" },
    { y: mean - 2 * sd, color: "var(--warning)", label: "-2s" },
    { y: mean - 3 * sd, color: "var(--danger)", label: "-3s" },
  ];

  return (
    <div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 10, right: 40, bottom: 18, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
            <XAxis
              dataKey="seq"
              tickFormatter={(v) => dayBySeq.get(Number(v)) ?? String(v)}
              tick={{ fontSize: 11, fill: "var(--muted)" }}
              stroke="var(--border)"
              label={{
                value: "Día del mes",
                position: "insideBottom",
                offset: -12,
                fontSize: 10,
                fill: "var(--muted)",
              }}
            />
            <YAxis
              domain={yDomain}
              tick={{ fontSize: 11, fill: "var(--muted)" }}
              tickFormatter={fmt}
              stroke="var(--border)"
              width={52}
            />
            <Tooltip
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelFormatter={(label, payload) => {
                const row = payload?.[0]?.payload as ChartRow | undefined;
                return row ? `Corrida ${row.seq} · ${row.dateLabel}` : `Corrida ${label}`;
              }}
              formatter={(value, _name, item) => {
                const p = item.payload as ChartRow;
                const name = isRejected(p.status) ? "Valor (descartado)" : "Valor";
                return [`${fmt(Number(value))}  (z ${p.z.toFixed(2)}, ${p.status})`, name];
              }}
            />
            {lines.map((ln) => (
              <ReferenceLine
                key={ln.label}
                y={ln.y}
                stroke={ln.color}
                strokeDasharray={ln.label === "media" ? undefined : "4 3"}
                strokeWidth={ln.label === "media" ? 1.5 : 1}
                label={{
                  value: ln.label,
                  position: "right",
                  fontSize: 10,
                  fill: "var(--muted)",
                }}
              />
            ))}
            {/* Tendencia: solo corridas válidas. connectNulls salta las rechazadas. */}
            <Line
              type="linear"
              dataKey="lineValue"
              name="Valor"
              stroke="var(--primary)"
              strokeWidth={1.5}
              dot={<StatusDot />}
              activeDot={{ r: 5 }}
              connectNulls
              isAnimationActive={false}
            />
            {/* Corridas rechazadas: visibles, sin línea, marcador hueco rojo. */}
            <Line
              type="linear"
              dataKey="rejectedValue"
              name="Rechazada"
              stroke="none"
              strokeWidth={0}
              dot={<RejectedDot />}
              activeDot={{ r: 6, fill: "var(--surface)", stroke: "var(--danger)", strokeWidth: 2.5 }}
              legendType="none"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--success)" }} />
          Aceptada
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--warning)" }} />
          Advertencia
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full border-2 bg-surface"
            style={{ borderColor: "var(--danger)" }}
          />
          Rechazada (fuera de la línea)
        </span>
        <span>El eje X muestra el día del mes de cada corrida.</span>
      </div>
      <p className="mt-1 text-[11px] text-muted">
        Las corridas rechazadas se muestran como evidencia de auditoría, pero{" "}
        <strong className="font-medium text-foreground">no entran en ningún cálculo</strong> ni se
        conectan a la línea de tendencia: se les aplicó acción correctiva y se repitió la corrida.
        {rejectedCount > 0 && ` En este nivel hay ${rejectedCount} corrida(s) rechazada(s).`}
      </p>
    </div>
  );
}
