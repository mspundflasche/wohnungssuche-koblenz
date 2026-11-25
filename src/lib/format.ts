import type { Feedback, HomeOffice, Listing, SearchProfile, Verdict } from "./types";

const eur0 = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eur2 = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num1 = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });
const num0 = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });

export const fmtEur = (v: number | null | undefined) => (v == null ? "–" : eur0.format(v));
export const fmtEurM2 = (v: number | null | undefined) => (v == null ? "–" : `${eur2.format(v)}/m²`);
export const fmtNum = (v: number | null | undefined, digits: 0 | 1 = 0) =>
  v == null ? "–" : digits === 1 ? num1.format(v) : num0.format(v);
export const fmtM2 = (v: number | null | undefined) => (v == null ? "–" : `${num1.format(v)} m²`);
export const fmtKm = (v: number | null | undefined) => (v == null ? "" : `${num1.format(v)} km`);

/** Kompakte Achsenbeschriftung: 1.500 / 450 Tsd. / 1,2 Mio. */
export function fmtAxisEur(v: number) {
  if (Math.abs(v) >= 1_000_000) return `${num1.format(v / 1_000_000)} Mio.`;
  if (Math.abs(v) >= 10_000) return `${num0.format(v / 1000)} Tsd.`;
  return num0.format(v);
}

const dateFmt = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Berlin" });
const dayFmt = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", timeZone: "Europe/Berlin" });
const timeFmt = new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });
const dayKeyFmt = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Europe/Berlin" });

export const fmtDate = (iso: string | null | undefined) => (iso ? dateFmt.format(new Date(iso)) : "–");
export const fmtDay = (iso: string) => dayFmt.format(new Date(iso));
export const fmtTime = (iso: string) => timeFmt.format(new Date(iso));
/** YYYY-MM-DD in Berliner Zeit. */
export const dayKey = (d: Date | string) => dayKeyFmt.format(typeof d === "string" ? new Date(d) : d);

export function relativeDay(iso: string, now = new Date()) {
  const a = dayKey(iso);
  const today = dayKey(now);
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  if (a === today) return "heute";
  if (a === dayKey(y)) return "gestern";
  return `am ${fmtDay(iso)}`;
}

export const HOME_OFFICE_LABEL: Record<HomeOffice, string> = {
  ja: "Arbeitszimmer vorhanden",
  moeglich: "Arbeitszimmer möglich",
  unklar: "Arbeitszimmer unklar",
  nein: "Kein Arbeitszimmer",
};

export const OFFER_LABEL = { miete: "Miete", kauf: "Kauf" } as const;
export const PROPERTY_LABEL = { wohnung: "Wohnung", haus: "Haus" } as const;

export const PIPELINE_LABEL = {
  neu: "Neu",
  gemerkt: "Gemerkt",
  angefragt: "Angefragt",
  besichtigung: "Besichtigung",
  aussortiert: "Aussortiert",
} as const;

export const RATING_LABEL = { [-1]: "Passt nicht", 1: "Interessant", 2: "Favorit" } as Record<number, string>;

export const VERDICT_LABEL: Record<Verdict, string> = {
  unbewertet: "Noch nicht bewertet",
  positiv: "Gefällt",
  negativ: "Passt nicht",
  gemischt: "Uneinig",
};

/** Gesamturteil aus allen Bewertungen der Familie. */
export function verdictOf(feedback: Feedback[]): Verdict {
  if (feedback.length === 0) return "unbewertet";
  const pos = feedback.some((f) => f.rating > 0);
  const neg = feedback.some((f) => f.rating < 0);
  if (pos && neg) return "gemischt";
  return pos ? "positiv" : "negativ";
}

/** Preis, der mit dem Budget verglichen wird: Warmmiete (sonst Kaltmiete) bzw. Kaufpreis. */
export function comparablePrice(l: Listing) {
  return l.offer_type === "miete" ? (l.price_warm ?? l.price) : l.price;
}

export interface CriteriaIssue {
  key: string;
  label: string;
}

/** Harte Kriterien aus dem Suchprofil prüfen – nur Verstöße zurückgeben. */
export function criteriaIssues(l: Listing, p: SearchProfile | null): CriteriaIssue[] {
  if (!p) return [];
  const issues: CriteriaIssue[] = [];
  const price = comparablePrice(l);
  const budget = l.offer_type === "miete" ? p.rent_max_warm : p.buy_max_price;
  if (budget != null && price != null && price > budget) {
    issues.push({ key: "budget", label: `${fmtEur(price - budget)} über Budget` });
  }
  if (l.rooms != null && l.rooms < p.min_rooms) {
    issues.push({ key: "rooms", label: `nur ${fmtNum(l.rooms, 1)} Zimmer` });
  }
  if (p.min_area_m2 != null && l.area_m2 != null && l.area_m2 < p.min_area_m2) {
    issues.push({ key: "area", label: `nur ${fmtM2(l.area_m2)}` });
  }
  if (l.distance_km != null && l.distance_km > p.radius_km) {
    issues.push({ key: "distance", label: `${fmtKm(l.distance_km)} entfernt` });
  }
  if (p.require_home_office && l.home_office === "nein") {
    issues.push({ key: "ho", label: "kein Arbeitszimmer" });
  }
  return issues;
}

export function displayName(email: string | null | undefined, names: Map<string, string>) {
  if (!email) return "Jemand";
  return names.get(email) ?? email.split("@")[0];
}

export const NEGATIVE_REASONS = [
  "Zu teuer",
  "Zu klein",
  "Zu wenige Zimmer",
  "Kein Arbeitszimmer",
  "Ort gefällt nicht",
  "Zu weit weg",
  "Renovierungsbedarf",
  "Kein Garten/Balkon",
  "Schlechter Energiewert",
  "Grundriss",
  "Lärm/Verkehr",
  "Schon vergeben",
];

export const POSITIVE_REASONS = [
  "Guter Preis",
  "Viel Platz",
  "Schöne Lage",
  "Garten",
  "Ruhig",
  "Gutes Arbeitszimmer",
  "Modern/saniert",
  "Kurze Wege zu Schule/Kita",
  "Gute Anbindung",
];

export function listingFacts(l: Listing) {
  const parts = [`${PROPERTY_LABEL[l.property_type]} ${l.offer_type === "miete" ? "zur Miete" : "zum Kauf"}`];
  if (l.rooms != null) parts.push(`${fmtNum(l.rooms, 1)} Zimmer`);
  if (l.area_m2 != null) parts.push(fmtM2(l.area_m2));
  if (l.plot_m2) parts.push(`${fmtM2(l.plot_m2)} Grundstück`);
  return parts.join(", ");
}

/** Glatte Achsenschritte (1, 2, 2,5, 5 × 10ⁿ) für einen Wertebereich. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!isFinite(min) || !isFinite(max) || max <= min) return [Math.floor(min || 0), Math.ceil((max || 0) + 1)];
  const raw = (max - min) / Math.max(1, count - 1);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= end + step / 2; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}
