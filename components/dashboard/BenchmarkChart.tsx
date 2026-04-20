"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type DimData = {
  dimension: string;
  startup: number;
  media: number;
};

type Props = {
  data: DimData[];
  divisionLabel: string;
  verticalLabel: string;
};

export default function BenchmarkChart({ data, divisionLabel, verticalLabel }: Props) {
  return (
    <div className="bg-white rounded-card border border-border-soft p-6">
      <p className="font-sora font-semibold text-brand-navy mb-1">Comparativa vs tu grupo</p>
      <p className="font-body text-xs text-ink-secondary mb-5">
        Media de {divisionLabel} · {verticalLabel}
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 16, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5d8ea" />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
          <YAxis
            type="category"
            dataKey="dimension"
            width={110}
            tick={{ fontSize: 11, fontFamily: "var(--font-open-sans)", fill: "#6b5b8a" }}
          />
          <Tooltip
            contentStyle={{ fontFamily: "var(--font-open-sans)", fontSize: 12 }}
            formatter={(value) => [`${Number(value).toFixed(0)}`, ""]}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, fontFamily: "var(--font-open-sans)" }}
            formatter={(value) => value === "startup" ? "Tu startup" : "Media del grupo"}
          />
          <Bar dataKey="startup" name="startup" fill="#f4a9aa" radius={[0, 4, 4, 0]} />
          <Bar dataKey="media" name="media" fill="#22183a" radius={[0, 4, 4, 0]} opacity={0.6} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
