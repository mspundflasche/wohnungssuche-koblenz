"use client";

import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartFrame, type LegendItem, TooltipBox } from "./ChartFrame";
import { INK, VERDICT_COLOR, VERDICT_ORDER } from "@/lib/colors";
import { VERDICT_LABEL, comparablePrice, fmtAxisEur, fmtEur, fmtM2, niceTicks } from "@/lib/format";
import type { Listing, OfferType, Verdict } from "@/lib/types";

interface Point {
  id: string;
  x: number;
  y: number;
  title: string;
  city: string;
  verdict: Verdict;
  warm: boolean;
}

const SHAPE: Record<Verdict, LegendItem["shape"]> = {
  positiv: "circle",
  negativ: "square",
  gemischt: "diamond",
  unbewertet: "ring",
};

function Mark({ cx, cy, verdict, onClick }: { cx?: number; cy?: number; verdict: Verdict; onClick?: () => void }) {
  if (cx == null || cy == null) return null;
  const c = VERDICT_COLOR[verdict];
  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      {/* großzügige Trefferfläche */}
      <circle cx={cx} cy={cy} r={12} fill="transparent" />
      {verdict === "positiv" && <circle cx={cx} cy={cy} r={5} fill={c} stroke="#fff" strokeWidth={2} />}
      {verdict === "negativ" && <rect x={cx - 5} y={cy - 5} width={10} height={10} rx={1.5} fill={c} stroke="#fff" strokeWidth={2} />}
      {verdict === "gemischt" && (
        <rect x={cx - 4.5} y={cy - 4.5} width={9} height={9} rx={1} fill={c} stroke="#fff" strokeWidth={2} transform={`rotate(45 ${cx} ${cy})`} />
      )}
      {verdict === "unbewertet" && <circle cx={cx} cy={cy} r={4.5} fill="#fff" stroke={c} strokeWidth={2} />}
    </g>
  );
}

interface Props {
  listings: Listing[];
  offer: OfferType;
  verdicts: Map<string, Verdict>;
  budget: number | null;
  onSelect: (id: string) => void;
}

export function PriceAreaScatter({ listings, offer, verdicts, budget, onSelect }: Props) {
  const points: Point[] = listings
    .filter((l) => l.offer_type === offer && l.area_m2 != null && comparablePrice(l) != null)
    .map((l) => ({
      id: l.id,
      x: l.area_m2!,
      y: comparablePrice(l)!,
      title: l.title,
      city: l.district ? `${l.district} (${l.city})` : (l.city ?? ""),
      verdict: verdicts.get(l.id) ?? "unbewertet",
      warm: l.offer_type === "miete" && l.price_warm != null,
    }));

  const present = VERDICT_ORDER.filter((v) => points.some((p) => p.verdict === v));
  const isRent = offer === "miete";
  const yTicks = niceTicks(0, Math.max(budget ?? 0, ...points.map((p) => p.y)) * 1.04, 5);
  const xs = points.map((p) => p.x);
  const xTicks = niceTicks(Math.min(...xs) - 5, Math.max(...xs) + 5, 6);

  return (
    <ChartFrame
      title={isRent ? "Miete und Wohnfläche" : "Kaufpreis und Wohnfläche"}
      subtitle={isRent ? "Warmmiete (wenn unbekannt: Kaltmiete) je Angebot, Linie = euer Budget" : "Kaufpreis je Angebot, Linie = euer Budget"}
      legend={present.map((v) => ({ label: VERDICT_LABEL[v], color: VERDICT_COLOR[v], shape: SHAPE[v] }))}
      empty={points.length === 0 ? `Noch keine Angebote ${isRent ? "zur Miete" : "zum Kauf"} mit Preis und Fläche.` : null}
      table={{
        head: ["Angebot", "Ort", "Fläche", isRent ? "Miete" : "Preis", "Bewertung"],
        rows: [...points].sort((a, b) => a.y - b.y).map((p) => [p.title, p.city, fmtM2(p.x), `${fmtEur(p.y)}${isRent ? (p.warm ? " warm" : " kalt") : ""}`, VERDICT_LABEL[p.verdict]]),
        numeric: [2, 3],
      }}
    >
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 12, right: 16, bottom: 22, left: 4 }}>
          <CartesianGrid stroke={INK.grid} strokeWidth={1} />
          <XAxis
            type="number"
            dataKey="x"
            name="Wohnfläche"
            domain={[xTicks[0], xTicks[xTicks.length - 1]]}
            ticks={xTicks}
            tickFormatter={(v: number) => String(Math.round(v))}
            tick={{ fill: INK.secondary, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: INK.axis }}
            label={{ value: "Wohnfläche in m²", position: "insideBottom", offset: -14, fill: INK.secondary, fontSize: 12 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Preis"
            domain={[0, yTicks[yTicks.length - 1]]}
            ticks={yTicks}
            tickFormatter={fmtAxisEur}
            tick={{ fill: INK.secondary, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={isRent ? 48 : 64}
          />
          {budget != null && (
            <ReferenceLine
              y={budget}
              stroke={INK.primary}
              strokeWidth={1}
              label={{ value: `Budget ${fmtEur(budget)}`, position: "insideTopRight", fill: INK.primary, fontSize: 12 }}
            />
          )}
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              const p = active && payload?.[0]?.payload ? (payload[0].payload as Point) : null;
              if (!p) return null;
              return (
                <TooltipBox>
                  <p className="font-semibold">
                    {fmtEur(p.y)}
                    {isRent && <span className="font-normal text-schiefer-2"> {p.warm ? "warm" : "kalt"}</span>}, {fmtM2(p.x)}
                  </p>
                  <p className="text-schiefer-2">{p.title}</p>
                  <p className="text-schiefer-2">
                    {p.city}, {VERDICT_LABEL[p.verdict]}
                  </p>
                </TooltipBox>
              );
            }}
          />
          {present.map((v) => (
            <Scatter
              key={v}
              name={VERDICT_LABEL[v]}
              data={points.filter((p) => p.verdict === v)}
              isAnimationActive={false}
              shape={(props: { cx?: number; cy?: number; payload?: Point }) => (
                <Mark cx={props.cx} cy={props.cy} verdict={v} onClick={() => props.payload && onSelect(props.payload.id)} />
              )}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
