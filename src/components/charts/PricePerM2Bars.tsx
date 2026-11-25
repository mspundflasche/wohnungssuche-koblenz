"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame, TooltipBox } from "./ChartFrame";
import { INK } from "@/lib/colors";
import { fmtEurM2 } from "@/lib/format";
import type { Listing, OfferType } from "@/lib/types";

interface Row {
  ort: string;
  wert: number;
  anzahl: number;
}

const nf2 = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });

export function PricePerM2Bars({ listings, offer }: { listings: Listing[]; offer: OfferType }) {
  const isRent = offer === "miete";
  const groups = new Map<string, number[]>();
  for (const l of listings) {
    if (l.offer_type !== offer || l.price_per_m2 == null || !l.city) continue;
    const key = l.city;
    groups.set(key, [...(groups.get(key) ?? []), l.price_per_m2]);
  }
  const rows: Row[] = [...groups.entries()]
    .map(([ort, vals]) => ({ ort, wert: vals.reduce((a, b) => a + b, 0) / vals.length, anzahl: vals.length }))
    .sort((a, b) => b.wert - a.wert)
    .slice(0, 10);

  const fmtVal = (v: number) => (isRent ? `${nf2.format(v)} €` : `${nf0.format(v)} €`);

  return (
    <ChartFrame
      title={isRent ? "Kaltmiete pro m² nach Ort" : "Kaufpreis pro m² nach Ort"}
      subtitle={`Durchschnitt der angezeigten Angebote${rows.length === 10 ? ", die 10 teuersten Orte" : ""}`}
      empty={rows.length === 0 ? `Noch keine Angebote ${isRent ? "zur Miete" : "zum Kauf"} mit Preis pro m².` : null}
      table={{
        head: ["Ort", "Ø pro m²", "Angebote"],
        rows: rows.map((r) => [r.ort, fmtEurM2(r.wert), r.anzahl]),
        numeric: [1, 2],
      }}
    >
      <ResponsiveContainer width="100%" height={Math.max(120, rows.length * 30 + 30)}>
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 64, bottom: 0, left: 0 }} barCategoryGap={6}>
          <CartesianGrid horizontal={false} stroke={INK.grid} />
          <XAxis type="number" hide domain={[0, "dataMax"]} />
          <YAxis
            type="category"
            dataKey="ort"
            width={118}
            tick={{ fill: INK.primary, fontSize: 13 }}
            tickLine={false}
            axisLine={{ stroke: INK.axis }}
          />
          <Tooltip
            cursor={{ fill: "rgba(34,48,58,0.05)" }}
            content={({ active, payload }) => {
              const r = active && payload?.[0]?.payload ? (payload[0].payload as Row) : null;
              if (!r) return null;
              return (
                <TooltipBox>
                  <p className="font-semibold">{fmtEurM2(r.wert)}</p>
                  <p className="text-schiefer-2">
                    {r.ort}, {r.anzahl} {r.anzahl === 1 ? "Angebot" : "Angebote"}
                  </p>
                </TooltipBox>
              );
            }}
          />
          <Bar dataKey="wert" fill="#257de0" radius={[0, 4, 4, 0]} maxBarSize={16} isAnimationActive={false}>
            <LabelList
              dataKey="wert"
              position="right"
              formatter={(v: unknown) => fmtVal(Number(v))}
              style={{ fill: INK.secondary, fontSize: 12, fontVariantNumeric: "tabular-nums" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
