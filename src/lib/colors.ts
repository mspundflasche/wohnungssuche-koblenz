import type { Verdict } from "./types";

/** Datenfarben – identisch zu den CSS-Tokens in globals.css. */
export const VERDICT_COLOR: Record<Verdict, string> = {
  positiv: "#257de0",
  negativ: "#f47230",
  gemischt: "#00b894",
  unbewertet: "#7d8a92",
};

export const INK = {
  primary: "#22303a",
  secondary: "#55636d",
  grid: "#e5e9e7",
  axis: "#c2c9c6",
  surface: "#ffffff",
  rhein: "#1c5d80",
};

/** Feste Reihenfolge für Legenden. */
export const VERDICT_ORDER: Verdict[] = ["positiv", "negativ", "gemischt", "unbewertet"];
