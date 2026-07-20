"use client";

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
import type { LJLevel } from "@/lib/lj";

const STATUS_COLOR: Record<string, string> = {
  ACEPTADA: "var(--success)",
  ADVERTENCIA: "var(--warning)",
  RECHAZADA: "var(--danger)",
};

type DotProps = {
  cx?: number;
  cy?: number;
  payload?: { status: string };
};

function StatusDot({ cx, cy, payload }: DotProps) {
  if (cx == null || cy == null) return <g />;
  const color = STATUS_COLOR[payload?.status ?? ""] ?? "var(--muted)";
  return <circle cx={cx} cy={cy} r={4} fill={color} stroke="var(--surface)" strokeWidth={1} />;
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
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 10, right: 40, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
          <XAxis
            dataKey="seq"
            tick={{ fontSize: 11, fill: "var(--muted)" }}
            stroke="var(--border)"
          />
          <YAxis
            domain={[mean - 4 * sd, mean + 4 * sd]}
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
            labelFormatter={(l) => `Corrida ${l}`}
            formatter={(value, _name, item) => {
              const p = item.payload as { z: number; status: string };
              return [`${fmt(Number(value))}  (z ${p.z.toFixed(2)}, ${p.status})`, "Valor"];
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
          <Line
            type="linear"
            dataKey="value"
            stroke="var(--primary)"
            strokeWidth={1.5}
            dot={<StatusDot />}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
