import "server-only";

import type {
  ClaudeAbgleich,
  CurrentUser,
  Feedback,
  LearnedPreferences,
  LearnedProfile,
  Listing,
  Member,
  SearchProfile,
  SearchRun,
} from "./types";

/*
  Beispieldaten für den Demo-Modus (DEMO_MODE=1, nur lokal).
  Alle Angebote sind erfunden – sie dienen nur dazu, die Oberfläche ohne Datenbank anzusehen.
*/

export const demoUser: CurrentUser = { id: "00000000-0000-0000-0000-000000000001", email: "demo@example.org" };
const partnerId = "00000000-0000-0000-0000-000000000002";

export const demoMembers: Member[] = [
  { email: "demo@example.org", display_name: "Demo", added_at: "2026-11-01T08:00:00Z" },
  { email: "partner@example.org", display_name: "Partner", added_at: "2026-11-01T08:00:00Z" },
];

export const demoProfile: SearchProfile = {
  id: 1,
  center_name: "Koblenz",
  center_lat: 50.3597,
  center_lng: 7.5978,
  radius_km: 20,
  offer_types: ["miete", "kauf"],
  property_types: ["wohnung", "haus"],
  rent_max_warm: 2200,
  buy_max_price: 650000,
  min_rooms: 4,
  min_area_m2: 95,
  require_home_office: true,
  household: "4-köpfige Familie (2 Erwachsene, 2 Kinder), ein Erwachsener arbeitet im Home-Office",
  must_haves: [],
  nice_to_haves: ["garten", "balkon", "stellplatz", "keller"],
  search_places: ["Koblenz", "Lahnstein", "Vallendar", "Bendorf", "Neuwied", "Mülheim-Kärlich"],
  excluded_places: [],
  notes: null,
  updated_at: "2026-11-25T07:00:00Z",
};

type Seed = [
  title: string,
  offer: "miete" | "kauf",
  prop: "wohnung" | "haus",
  price: number,
  warm: number | null,
  area: number,
  rooms: number,
  ho: Listing["home_office"],
  city: string,
  district: string | null,
  lat: number,
  lng: number,
  daysAgo: number,
  score: number,
  features: string[],
];

const seeds: Seed[] = [
  ["Reihenendhaus mit Garten am Waldrand", "miete", "haus", 1590, 1980, 138, 5, "ja", "Vallendar", null, 50.3995, 7.6232, 0, 88, ["garten", "keller", "stellplatz"]],
  ["Helle 4-Zimmer-Wohnung mit Balkon und Rheinblick", "miete", "wohnung", 1290, 1610, 112, 4, "moeglich", "Koblenz", "Pfaffendorf", 50.3530, 7.6110, 0, 74, ["balkon", "keller", "aufzug"]],
  ["Doppelhaushälfte, ruhige Lage, Erstbezug nach Sanierung", "kauf", "haus", 529000, null, 146, 6, "ja", "Koblenz", "Karthause", 50.3420, 7.5800, 0, 81, ["garten", "garage", "keller"]],
  ["Freistehendes Einfamilienhaus mit Einliegerwohnung", "kauf", "haus", 649000, null, 210, 8, "ja", "Lahnstein", null, 50.3105, 7.6040, 1, 69, ["garten", "garage", "einliegerwohnung"]],
  ["Maisonette mit Dachterrasse", "miete", "wohnung", 1450, 1820, 123, 5, "ja", "Mülheim-Kärlich", null, 50.3860, 7.4970, 1, 77, ["dachterrasse", "stellplatz"]],
  ["Gepflegtes Reihenmittelhaus, Nähe Grundschule", "kauf", "haus", 398000, null, 128, 5, "moeglich", "Bendorf", "Sayn", 50.4380, 7.5800, 2, 72, ["garten", "keller"]],
  ["Altbauwohnung mit hohen Decken", "miete", "wohnung", 1380, 1760, 118, 4, "unklar", "Koblenz", "Südliche Vorstadt", 50.3500, 7.5930, 2, 58, ["balkon", "altbau"]],
  ["Einfamilienhaus mit großem Grundstück", "kauf", "haus", 459000, null, 155, 6, "ja", "Bassenheim", null, 50.3580, 7.4610, 3, 70, ["garten", "garage", "kamin"]],
  ["Moderne Neubauwohnung, KfW 40", "kauf", "wohnung", 589000, null, 119, 4, "moeglich", "Koblenz", "Metternich", 50.3700, 7.5650, 3, 64, ["balkon", "aufzug", "tiefgarage"]],
  ["Haus mit Moselblick", "miete", "haus", 1950, 2390, 165, 6, "ja", "Winningen", null, 50.3170, 7.5210, 4, 52, ["garten", "terrasse"]],
  ["4-Zimmer-Wohnung im Erdgeschoss mit Gartenanteil", "miete", "wohnung", 1150, 1480, 101, 4, "unklar", "Neuwied", "Heddesdorf", 50.4330, 7.4680, 5, 61, ["garten", "keller"]],
  ["Doppelhaushälfte in Güls", "kauf", "haus", 475000, null, 140, 5, "ja", "Koblenz", "Güls", 50.3500, 7.5500, 6, 83, ["garten", "stellplatz"]],
  ["Großzügige Etagenwohnung", "miete", "wohnung", 1240, 1590, 104, 4, "nein", "Lahnstein", null, 50.3020, 7.6110, 7, 40, ["balkon"]],
  ["Bungalow mit Wintergarten", "kauf", "haus", 612000, null, 150, 5, "moeglich", "Waldesch", null, 50.2970, 7.5600, 8, 66, ["garten", "garage", "wintergarten"]],
  ["Haus mit Rheinblick, renovierungsbedürftig", "kauf", "haus", 349000, null, 170, 7, "ja", "Braubach", null, 50.2730, 7.6440, 9, 48, ["garten"]],
  ["Penthouse-Wohnung", "miete", "wohnung", 2350, 2790, 132, 4, "ja", "Koblenz", "Altstadt", 50.3610, 7.5960, 10, 35, ["dachterrasse", "aufzug"]],
  ["Familienfreundliche Wohnung nahe Kita", "miete", "wohnung", 1090, 1420, 98, 4, "moeglich", "Weißenthurm", null, 50.4170, 7.4500, 12, 63, ["balkon", "keller"]],
  ["Reihenhaus mit Ausbaureserve", "kauf", "haus", 365000, null, 122, 5, "moeglich", "Urmitz", null, 50.4150, 7.5220, 14, 60, ["garten", "keller"]],
  ["Stadtvilla mit Einliegerwohnung", "kauf", "haus", 790000, null, 240, 9, "ja", "Bad Ems", null, 50.3350, 7.7160, 15, 28, ["garten", "garage"]],
  ["Ruhige 5-Zimmer-Wohnung", "miete", "wohnung", 1520, 1890, 126, 5, "ja", "Kaltenengers", null, 50.4180, 7.5420, 16, 71, ["balkon", "stellplatz"]],
  ["Kleines Haus am Ortsrand", "miete", "haus", 1350, 1650, 108, 4, "unklar", "Rhens", null, 50.2810, 7.6200, 18, 55, ["garten"]],
  ["3-Zimmer-Wohnung mit Hobbyraum", "miete", "wohnung", 980, 1260, 92, 3, "moeglich", "Höhr-Grenzhausen", null, 50.4350, 7.6700, 20, 38, ["keller"]],
  ["Einfamilienhaus mit Doppelgarage", "kauf", "haus", 545000, null, 175, 6, "ja", "Andernach", "Eich", 50.4310, 7.3980, 22, 57, ["garten", "garage"]],
  ["Wohnung über zwei Etagen", "kauf", "wohnung", 335000, null, 111, 4, "moeglich", "Koblenz", "Lützel", 50.3700, 7.5900, 25, 59, ["balkon"]],
];

const now = new Date("2026-11-25T07:00:00Z");
const daysAgoIso = (d: number, h = 6) => new Date(now.getTime() - d * 86400000 - h * 3600000).toISOString();

export const demoListings: Listing[] = seeds.map((s, i) => {
  const [title, offer, prop, price, warm, area, rooms, ho, city, district, lat, lng, daysAgo, score, features] = s;
  const dLat = (lat - 50.3597) * 111.2;
  const dLng = (lng - 7.5978) * 111.2 * Math.cos((50.36 * Math.PI) / 180);
  return {
    id: `demo-${i + 1}`,
    url: `https://example.org/angebot/${i + 1}`,
    source: i % 3 === 0 ? "ohne-makler.net" : i % 3 === 1 ? "immosuchmaschine.de" : "immowelt.de",
    title,
    offer_type: offer,
    property_type: prop,
    price,
    price_warm: warm,
    previous_price: i === 3 ? 679000 : i === 1 ? 1340 : null,
    price_changed_at: i === 3 || i === 1 ? daysAgoIso(0) : null,
    area_m2: area,
    plot_m2: prop === "haus" ? Math.round(area * 2.6) : null,
    rooms,
    price_per_m2: Math.round((price / area) * 100) / 100,
    home_office: ho,
    city,
    district,
    postal_code: null,
    address: null,
    lat,
    lng,
    distance_km: Math.round(Math.sqrt(dLat * dLat + dLng * dLng) * 10) / 10,
    year_built: 1960 + ((i * 7) % 60),
    energy_class: ["B", "C", "D", "A", "E"][i % 5],
    features,
    description:
      "Beispieltext: Das Objekt liegt in ruhiger Wohnlage. Kindergarten und Grundschule sind fußläufig erreichbar, die Innenstadt von Koblenz ist in etwa 15 Minuten mit dem Auto erreichbar.",
    image_url: null,
    available_from: offer === "miete" ? "01.02.2027" : null,
    provider: i % 2 ? "Privat" : "Makler",
    score,
    score_reasons: [
      score >= 70 ? "Eigenes Zimmer fürs Home-Office" : "Arbeitszimmer nur mit Umbau",
      score >= 60 ? "Im Budget" : "Preis am oberen Rand",
      features.includes("garten") ? "Garten wie gewünscht" : "Kein Garten",
    ],
    ai_summary: "Beispiel: Passt gut zur Familie – vier Zimmer plus Arbeitszimmer, Garten, ruhige Lage.",
    claude_rating: score >= 80 ? 2 : score >= 60 ? 1 : -1,
    claude_note:
      score >= 80
        ? "Beispiel: Das würde ich mir als Erstes ansehen – genug Zimmer für Büro und Kinder, und der Preis lässt Luft."
        : score >= 60
          ? "Beispiel: Grundsätzlich passend, aber ich würde vorher Grundriss und Nebenkosten klären."
          : "Beispiel: Für vier Personen mit Büro zu knapp oder zu teuer – würde ich auslassen.",
    status: daysAgo > 20 ? "weg" : "aktiv",
    pipeline: i === 0 ? "gemerkt" : i === 2 ? "angefragt" : "neu",
    first_seen_at: daysAgoIso(daysAgo),
    last_seen_at: daysAgoIso(daysAgo > 20 ? daysAgo - 5 : 0),
    scored_at: daysAgoIso(0),
  };
});

const fb = (i: number, user: string, email: string, rating: -1 | 1 | 2, reasons: string[], comment: string | null): Feedback => ({
  id: `fb-${i}-${user.slice(-1)}`,
  listing_id: `demo-${i}`,
  user_id: user,
  user_email: email,
  rating,
  reasons,
  comment,
  created_at: daysAgoIso(1),
  updated_at: daysAgoIso(1),
});

export const demoFeedback: Feedback[] = [
  fb(1, demoUser.id, demoUser.email, 2, ["Garten", "Gutes Arbeitszimmer"], "Sofort anrufen!"),
  fb(1, partnerId, "partner@example.org", 1, ["Schöne Lage"], null),
  fb(3, partnerId, "partner@example.org", 1, ["Viel Platz"], "Karthause wäre super wegen Schule"),
  fb(7, demoUser.id, demoUser.email, -1, ["Kein Arbeitszimmer", "Lärm/Verkehr"], "Direkt an der Hauptstraße"),
  fb(10, demoUser.id, demoUser.email, -1, ["Zu teuer"], null),
  fb(10, partnerId, "partner@example.org", 1, ["Schöne Lage"], "Moselblick!"),
  fb(13, demoUser.id, demoUser.email, -1, ["Kein Arbeitszimmer"], null),
  fb(12, demoUser.id, demoUser.email, 2, ["Guter Preis", "Garten"], null),
  fb(16, partnerId, "partner@example.org", -1, ["Zu teuer"], null),
  fb(19, demoUser.id, demoUser.email, -1, ["Zu teuer", "Zu weit weg"], null),
];

export const demoRuns: SearchRun[] = Array.from({ length: 6 }, (_, i) => ({
  id: 6 - i,
  started_at: daysAgoIso(i, 0.5),
  finished_at: daysAgoIso(i, 0.3),
  sources: [
    { name: "ohne-makler.net", status: "ok", found: 9 },
    { name: "immosuchmaschine.de", status: "ok", found: 14 },
    { name: "immowelt.de (Websuche)", status: "ok", found: 6 },
    { name: "ImmoScout24", status: "blockiert", found: 0, note: "Automatischer Abruf gesperrt" },
  ],
  found_count: 29 - i,
  new_count: [3, 2, 2, 2, 1, 1][i],
  updated_count: 20 - i,
  gone_count: i % 2,
  summary: i === 0 ? "3 neue Angebote, davon ein Reihenendhaus in Vallendar mit Garten und Arbeitszimmer (Passung 88)." : null,
}));

export const demoLearned: LearnedPreferences[] = [
  {
    id: 1,
    created_at: daysAgoIso(0),
    feedback_count: 10,
    summary:
      "Beispiel: Ihr bevorzugt Häuser mit Garten und einem echten, abtrennbaren Arbeitszimmer. Wohnungen an Hauptstraßen und alles über 2.300 € warm fallen durch. Karthause, Güls und Vallendar kommen gut an; bei Bad Ems wart ihr wegen der Entfernung skeptisch.",
    rules: {
      bevorzugt: ["Garten", "Arbeitszimmer mit Tür", "Karthause", "Güls", "Vallendar"],
      meiden: ["Hauptstraße", "über 2.300 € warm", "Bad Ems"],
    },
  },
];

export function demoLearnedProfile(): LearnedProfile {
  return {
    feedback_total: demoFeedback.length,
    positiv: demoFeedback.filter((f) => f.rating > 0).length,
    favoriten: demoFeedback.filter((f) => f.rating === 2).length,
    negativ: demoFeedback.filter((f) => f.rating < 0).length,
    bewertete_angebote: new Set(demoFeedback.map((f) => f.listing_id)).size,
    nach_ort: [
      { ort: "Koblenz", positiv: 3, negativ: 1 },
      { ort: "Vallendar", positiv: 2, negativ: 0 },
      { ort: "Winningen", positiv: 1, negativ: 1 },
      { ort: "Lahnstein", positiv: 0, negativ: 1 },
      { ort: "Bad Ems", positiv: 0, negativ: 1 },
    ],
    nach_typ: [],
    gruende_negativ: [
      { grund: "Zu teuer", anzahl: 3 },
      { grund: "Kein Arbeitszimmer", anzahl: 2 },
      { grund: "Lärm/Verkehr", anzahl: 1 },
      { grund: "Zu weit weg", anzahl: 1 },
    ],
    gruende_positiv: [
      { grund: "Schöne Lage", anzahl: 2 },
      { grund: "Garten", anzahl: 2 },
      { grund: "Gutes Arbeitszimmer", anzahl: 1 },
      { grund: "Viel Platz", anzahl: 1 },
      { grund: "Guter Preis", anzahl: 1 },
    ],
    merkmale: [],
    kennzahlen: [
      { angebot: "miete", bewertung: "positiv", anzahl: 3, preis_avg: 2050, preis_max: 2390, preis_m2_avg: 11.6, flaeche_avg: 147, zimmer_avg: 5.3, distanz_avg: 5.6 },
      { angebot: "miete", bewertung: "negativ", anzahl: 4, preis_avg: 2110, preis_max: 2790, preis_m2_avg: 13.9, flaeche_avg: 119, zimmer_avg: 4, distanz_avg: 3.9 },
      { angebot: "kauf", bewertung: "positiv", anzahl: 3, preis_avg: 502000, preis_max: 529000, preis_m2_avg: 3487, flaeche_avg: 143, zimmer_avg: 5.3, distanz_avg: 2.6 },
      { angebot: "kauf", bewertung: "negativ", anzahl: 1, preis_avg: 790000, preis_max: 790000, preis_m2_avg: 3292, flaeche_avg: 240, zimmer_avg: 9, distanz_avg: 8.6 },
    ],
    kommentare: demoFeedback
      .filter((f) => f.comment)
      .map((f) => {
        const l = demoListings.find((x) => x.id === f.listing_id)!;
        return { datum: f.updated_at, bewertung: f.rating, titel: l.title, ort: l.city, angebot: l.offer_type, gruende: f.reasons, kommentar: f.comment! };
      }),
  };
}

export const demoAbgleich: ClaudeAbgleich = {
  verglichen: 7,
  einig: 5,
  claude_zu_optimistisch: 1,
  claude_zu_kritisch: 1,
  familie_uneinig: 1,
  abweichungen: [
    {
      titel: "Altbauwohnung mit hohen Decken",
      ort: "Koblenz",
      angebot: "miete",
      ergebnis: "claude_zu_optimistisch",
      claude: 1,
      claude_notiz: "Beispiel: Schöner Altbau, Büro müsste man klären.",
      gruende_familie: ["Kein Arbeitszimmer", "Lärm/Verkehr"],
      kommentare_familie: "Direkt an der Hauptstraße",
    },
    {
      titel: "Doppelhaushälfte in Güls",
      ort: "Koblenz",
      angebot: "kauf",
      ergebnis: "claude_zu_kritisch",
      claude: -1,
      claude_notiz: "Beispiel: Etwas weit draußen.",
      gruende_familie: ["Guter Preis", "Garten"],
      kommentare_familie: null,
    },
  ],
};
