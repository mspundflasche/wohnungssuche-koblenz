export type OfferType = "miete" | "kauf";
export type PropertyType = "wohnung" | "haus";
export type HomeOffice = "ja" | "moeglich" | "unklar" | "nein";
export type Pipeline = "neu" | "gemerkt" | "angefragt" | "besichtigung" | "aussortiert";
export type Rating = -1 | 1 | 2;

export interface Listing {
  id: string;
  url: string;
  source: string;
  title: string;
  offer_type: OfferType;
  property_type: PropertyType;
  price: number | null;
  price_warm: number | null;
  previous_price: number | null;
  price_changed_at: string | null;
  area_m2: number | null;
  plot_m2: number | null;
  rooms: number | null;
  price_per_m2: number | null;
  home_office: HomeOffice;
  city: string | null;
  district: string | null;
  postal_code: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  distance_km: number | null;
  year_built: number | null;
  energy_class: string | null;
  features: string[];
  description: string | null;
  image_url: string | null;
  available_from: string | null;
  provider: string | null;
  score: number | null;
  score_reasons: string[];
  ai_summary: string | null;
  /** Claudes eigene Bewertung auf der Skala der Familie. */
  claude_rating: Rating | null;
  claude_note: string | null;
  status: "aktiv" | "weg";
  pipeline: Pipeline;
  first_seen_at: string;
  last_seen_at: string;
  scored_at: string | null;
}

export interface Feedback {
  id: string;
  listing_id: string;
  user_id: string;
  user_email: string | null;
  rating: Rating;
  reasons: string[];
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface SearchProfile {
  id: number;
  center_name: string;
  center_lat: number;
  center_lng: number;
  radius_km: number;
  offer_types: OfferType[];
  property_types: PropertyType[];
  rent_max_warm: number | null;
  buy_max_price: number | null;
  min_rooms: number;
  min_area_m2: number | null;
  require_home_office: boolean;
  household: string;
  must_haves: string[];
  nice_to_haves: string[];
  search_places: string[];
  excluded_places: string[];
  notes: string | null;
  updated_at: string;
}

export interface SearchRun {
  id: number;
  started_at: string;
  finished_at: string | null;
  sources: { name: string; status: string; found?: number; note?: string }[];
  found_count: number;
  new_count: number;
  updated_count: number;
  gone_count: number;
  summary: string | null;
}

export interface LearnedPreferences {
  id: number;
  created_at: string;
  feedback_count: number;
  summary: string;
  rules: Record<string, unknown>;
}

export interface Member {
  email: string;
  display_name: string | null;
  added_at: string;
}

export interface LearnedProfile {
  feedback_total: number;
  positiv: number;
  favoriten: number;
  negativ: number;
  bewertete_angebote: number;
  nach_ort: { ort: string; positiv: number; negativ: number }[];
  nach_typ: { angebot: OfferType; objekt: PropertyType; positiv: number; negativ: number }[];
  gruende_negativ: { grund: string; anzahl: number }[];
  gruende_positiv: { grund: string; anzahl: number }[];
  merkmale: { merkmal: string; positiv: number; negativ: number }[];
  kennzahlen: {
    angebot: OfferType;
    bewertung: "positiv" | "negativ";
    anzahl: number;
    preis_avg: number | null;
    preis_max: number | null;
    preis_m2_avg: number | null;
    flaeche_avg: number | null;
    zimmer_avg: number | null;
    distanz_avg: number | null;
  }[];
  kommentare: {
    datum: string;
    bewertung: Rating;
    titel: string;
    ort: string | null;
    angebot: OfferType;
    gruende: string[];
    kommentar: string;
  }[];
}

export interface CurrentUser {
  id: string;
  email: string;
}

/** Gemeinsame Einschätzung der Familie zu einem Angebot. */
export type Verdict = "unbewertet" | "positiv" | "negativ" | "gemischt";

export interface ClaudeAbgleich {
  verglichen: number;
  einig: number;
  claude_zu_optimistisch: number;
  claude_zu_kritisch: number;
  familie_uneinig: number;
  abweichungen: {
    titel: string;
    ort: string | null;
    angebot: OfferType;
    ergebnis: "claude_zu_optimistisch" | "claude_zu_kritisch";
    claude: Rating;
    claude_notiz: string | null;
    gruende_familie: string[] | null;
    kommentare_familie: string | null;
  }[];
}
