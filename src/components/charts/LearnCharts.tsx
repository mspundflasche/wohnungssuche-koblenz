"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame, TooltipBox } from "./ChartFrame";
import { INK, VERDICT_COLOR } from "@/lib/colors";
import type { LearnedProfile } from "@/lib/types";

/** Orte: Zustimmung nach rechts (blau), Ablehnung nach links (orange). */
export function PlacesDiverging({ data }: { data: LearnedProfile["nach_ort"] }) {
  const rows = data
    .slice(0, 12)
    .map((d) => ({ ort: d.ort, positiv: d.positiv, negativ: -d.negativ, pos: d.positiv, neg: d.negativ }));
  const max = Math.max(1, ...rows.map((r) => Math.max(r.pos, r.neg)));

  return (
    <ChartFrame
      title="Orte: gefällt oder passt nicht"
      subtitle="Anzahl eurer Bewertungen je Ort"
      legend={[
        { label: "Passt nicht", color: VERDICT_COLOR.negativ, shape: "rect" },
        { label: "Gefällt", color: VERDICT_COLOR.positiv, shape: "rect" },
      ]}
      empty={rows.length === 0 ? "Noch keine Bewertungen mit Ortsangabe." : null}
      table={{ head: ["Ort", "Gefällt", "Passt nicht"], rows: rows.map((r) => [r.ort, r.pos, r.neg]), numeric: [1, 2] }}
    >
      <ResponsiveContainer width="100%" height={Math.max(120, rows.length * 32 + 24)}>
        <BarChart data={rows} layout="vertical" stackOffset="sign" margin={{ top: 0, right: 28, bottom: 0, left: 0 }} barCategoryGap={6}>
          <CartesianGrid horizontal={false} stroke={INK.grid} />
          <XAxis type="number" domain={[-max * 1.12, max * 1.12]} hide />
          <YAxis type="category" dataKey="ort" width={118} tick={{ fill: INK.primary, fontSize: 13 }} tickLine={false} axisLine={false} />
          <ReferenceLine x={0} stroke={INK.axis} />
          <Tooltip
            cursor={{ fill: "rgba(34,48,58,0.05)" }}
            content={({ active, payload }) => {
              const r = active && payload?.[0]?.payload ? (payload[0].payload as (typeof rows)[number]) : null;
              if (!r) return null;
              return (
                <TooltipBox>
                  <p className="font-semibold">
                    {r.pos} gefällt, {r.neg} passt nicht
                  </p>
                  <p className="text-schiefer-2">{r.ort}</p>
                </TooltipBox>
              );
            }}
          />
          <Bar dataKey="negativ" stackId="s" fill={VERDICT_COLOR.negativ} radius={[4, 0, 0, 4]} maxBarSize={16} isAnimationActive={false}>
            <LabelList
              dataKey="neg"
              content={(props) => {
                const { x, y, width, height, value } = props as { x: number; y: number; width: number; height: number; value: number };
                if (!value) return null;
                const left = Math.min(x, x + width);
                return (
                  <text x={left - 6} y={y + height / 2} dy="0.35em" textAnchor="end" fill={INK.secondary} fontSize={12}>
                    {value}
                  </text>
                );
              }}
            />
          </Bar>
          <Bar dataKey="positiv" stackId="s" fill={VERDICT_COLOR.positiv} radius={[0, 4, 4, 0]} maxBarSize={16} isAnimationActive={false}>
            <LabelList
              dataKey="pos"
              content={(props) => {
                const { x, y, width, height, value } = props as { x: number; y: number; width: number; height: number; value: number };
                if (!value) return null;
                const right = Math.max(x, x + width);
                return (
                  <text x={right + 6} y={y + height / 2} dy="0.35em" textAnchor="start" fill={INK.secondary} fontSize={12}>
                    {value}
                  </text>
                );
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function ReasonsBars({ title, data, color }: { title: string; data: { grund: string; anzahl: number }[]; color: string }) {
  const rows = data.slice(0, 10);
  return (
    <ChartFrame
      title={title}
      subtitle="Wie oft ihr den Grund angeklickt habt"
      empty={rows.length === 0 ? "Noch keine Gründe angegeben." : null}
      table={{ head: ["Grund", "Anzahl"], rows: rows.map((r) => [r.grund, r.anzahl]), numeric: [1] }}
    >
      <ResponsiveContainer width="100%" height={Math.max(100, rows.length * 30 + 20)}>
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 32, bottom: 0, left: 0 }} barCategoryGap={6}>
          <XAxis type="number" hide domain={[0, "dataMax"]} allowDecimals={false} />
          <YAxis type="category" dataKey="grund" width={170} tick={{ fill: INK.primary, fontSize: 13 }} tickLine={false} axisLine={{ stroke: INK.axis }} />
          <Tooltip
            cursor={{ fill: "rgba(34,48,58,0.05)" }}
            content={({ active, payload }) => {
              const r = active && payload?.[0]?.payload ? (payload[0].payload as { grund: string; anzahl: number }) : null;
              if (!r) return null;
              return (
                <TooltipBox>
                  <p className="font-semibold">{r.anzahl}×</p>
                  <p className="text-schiefer-2">{r.grund}</p>
                </TooltipBox>
              );
            }}
          />
          <Bar dataKey="anzahl" fill={color} radius={[0, 4, 4, 0]} maxBarSize={16} isAnimationActive={false}>
            <LabelList dataKey="anzahl" position="right" style={{ fill: INK.secondary, fontSize: 12 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
