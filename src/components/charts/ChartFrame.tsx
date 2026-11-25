"use client";

import type { ReactNode } from "react";

export interface LegendItem {
  label: string;
  color: string;
  shape?: "circle" | "square" | "diamond" | "ring" | "rect" | "line";
}

export function LegendSwatch({ color, shape = "circle" }: { color: string; shape?: LegendItem["shape"] }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="shrink-0">
      {shape === "circle" && <circle cx="7" cy="7" r="5" fill={color} />}
      {shape === "ring" && <circle cx="7" cy="7" r="4.5" fill="#fff" stroke={color} strokeWidth="2" />}
      {shape === "square" && <rect x="2.5" y="2.5" width="9" height="9" rx="1.5" fill={color} />}
      {shape === "diamond" && <rect x="3" y="3" width="8" height="8" rx="1" fill={color} transform="rotate(45 7 7)" />}
      {shape === "rect" && <rect x="1" y="3" width="12" height="8" rx="2" fill={color} />}
      {shape === "line" && <line x1="1" y1="7" x2="13" y2="7" stroke={color} strokeWidth="2" />}
    </svg>
  );
}

interface Props {
  title: string;
  subtitle?: string;
  legend?: LegendItem[];
  table?: { head: string[]; rows: (string | number)[][]; numeric?: number[] };
  empty?: string | null;
  children: ReactNode;
}

/** Diagramm-Rahmen: Titel, Legende über dem Plot, Tabellenansicht als Alternative. */
export function ChartFrame({ title, subtitle, legend, table, empty, children }: Props) {
  return (
    <figure className="flex min-w-0 flex-col rounded-lg border border-linie bg-papier p-4 sm:p-5">
      <figcaption>
        <h3 className="font-cond text-xl font-semibold leading-tight">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-schiefer-2">{subtitle}</p>}
      </figcaption>
      {legend && legend.length > 1 && !empty && (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-schiefer-2">
          {legend.map((item) => (
            <li key={item.label} className="inline-flex items-center gap-1.5">
              <LegendSwatch color={item.color} shape={item.shape} />
              {item.label}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 min-w-0">
        {empty ? <p className="py-10 text-center text-sm text-schiefer-2">{empty}</p> : children}
      </div>
      {table && !empty && table.rows.length > 0 && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-rhein hover:underline">Als Tabelle zeigen</summary>
          <div className="mt-2 max-h-72 overflow-auto">
            <table className="chart-table">
              <thead>
                <tr>
                  {table.head.map((h, i) => (
                    <th key={h} className={table.numeric?.includes(i) ? "num" : ""}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((r, ri) => (
                  <tr key={ri}>
                    {r.map((c, ci) => (
                      <td key={ci} className={table.numeric?.includes(ci) ? "num" : ""}>
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </figure>
  );
}

/** Einheitlicher Tooltip-Kasten: Wert vorne, Bezeichnung dahinter. */
export function TooltipBox({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none max-w-64 rounded-md border border-linie bg-papier px-3 py-2 text-sm shadow-[0_2px_10px_rgba(34,48,58,0.14)]">
      {children}
    </div>
  );
}
