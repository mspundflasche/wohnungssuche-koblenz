"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame, TooltipBox } from "./ChartFrame";
import { INK } from "@/lib/colors";
import { dayKey } from "@/lib/format";
import type { Listing } from "@/lib/types";

interface Row {
  key: string;
  label: string;
  long: string;
  anzahl: number;
}

const short = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "numeric", timeZone: "Europe/Berlin" });
const long = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Berlin" });

export function NewPerDay({ listings, days = 30 }: { listings: Listing[]; days?: number }) {
  const counts = new Map<string, number>();
  for (const l of listings) {
    const k = dayKey(l.first_seen_at);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const rows: Row[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    const k = dayKey(d);
    rows.push({ key: k, label: short.format(d), long: long.format(d), anzahl: counts.get(k) ?? 0 });
  }
  const total = rows.reduce((a, r) => a + r.anzahl, 0);

  return (
    <ChartFrame
      title="Neue Angebote pro Tag"
      subtitle={`Letzte ${days} Tage, zusammen ${total}`}
      empty={total === 0 ? "In den letzten 30 Tagen wurden noch keine Angebote gefunden." : null}
      table={{ head: ["Tag", "Neue Angebote"], rows: rows.filter((r) => r.anzahl > 0).map((r) => [r.long, r.anzahl]), numeric: [1] }}
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -18 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke={INK.grid} />
          <XAxis
            dataKey="label"
            tick={{ fill: INK.secondary, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: INK.axis }}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis allowDecimals={false} tick={{ fill: INK.secondary, fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(34,48,58,0.05)" }}
            content={({ active, payload }) => {
              const r = active && payload?.[0]?.payload ? (payload[0].payload as Row) : null;
              if (!r) return null;
              return (
                <TooltipBox>
                  <p className="font-semibold">
                    {r.anzahl} {r.anzahl === 1 ? "neues Angebot" : "neue Angebote"}
                  </p>
                  <p className="text-schiefer-2">{r.long}</p>
                </TooltipBox>
              );
            }}
          />
          <Bar dataKey="anzahl" fill="#257de0" radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
