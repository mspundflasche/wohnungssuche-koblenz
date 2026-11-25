import "server-only";

import { cache } from "react";
import { createClient } from "./supabase/server";
import {
  demoFeedback,
  demoLearned,
  demoLearnedProfile,
  demoListings,
  demoMembers,
  demoProfile,
  demoRuns,
  demoUser,
} from "./demo";
import type {
  CurrentUser,
  Feedback,
  LearnedPreferences,
  LearnedProfile,
  Listing,
  Member,
  SearchProfile,
  SearchRun,
} from "./types";

export const isDemo = () => process.env.DEMO_MODE === "1";

/** Zeitpunkt der Anfrage (Server-Komponenten werden pro Anfrage gerendert). */
export const requestTime = cache(() => Date.now());

/** Spalten ohne die großen Rohdaten. */
const LISTING_COLUMNS =
  "id,url,source,title,offer_type,property_type,price,price_warm,previous_price,price_changed_at,area_m2,plot_m2,rooms,price_per_m2,home_office,city,district,postal_code,address,lat,lng,distance_km,year_built,energy_class,features,description,image_url,available_from,provider,score,score_reasons,ai_summary,status,pipeline,first_seen_at,last_seen_at,scored_at";

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (isDemo()) return demoUser;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : "" };
});

/** Mitglieder sehen die Mitgliederliste (RLS) – eine leere Liste heißt: kein Zugriff. */
export const getMembers = cache(async (): Promise<Member[]> => {
  if (isDemo()) return demoMembers;
  const supabase = await createClient();
  const { data, error } = await supabase.from("app_members").select("email,display_name,added_at").order("added_at");
  if (error) throw new Error(`Mitglieder konnten nicht geladen werden: ${error.message}`);
  return data ?? [];
});

export const getProfile = cache(async (): Promise<SearchProfile | null> => {
  if (isDemo()) return demoProfile;
  const supabase = await createClient();
  const { data, error } = await supabase.from("search_profile").select("*").eq("id", 1).maybeSingle();
  if (error) throw new Error(`Suchprofil konnte nicht geladen werden: ${error.message}`);
  return data as SearchProfile | null;
});

export async function getListings(): Promise<Listing[]> {
  if (isDemo()) return demoListings;
  const supabase = await createClient();
  const since = new Date(Date.now() - 60 * 86400000).toISOString();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_COLUMNS)
    .or(`status.eq.aktiv,last_seen_at.gte.${since}`)
    .order("first_seen_at", { ascending: false })
    .limit(1500);
  if (error) throw new Error(`Angebote konnten nicht geladen werden: ${error.message}`);
  return (data ?? []) as unknown as Listing[];
}

export async function getListing(id: string): Promise<Listing | null> {
  if (isDemo()) return demoListings.find((l) => l.id === id) ?? null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("listings").select(LISTING_COLUMNS).eq("id", id).maybeSingle();
  if (error) return null;
  return data as unknown as Listing | null;
}

export async function getFeedback(listingId?: string): Promise<Feedback[]> {
  if (isDemo()) return listingId ? demoFeedback.filter((f) => f.listing_id === listingId) : demoFeedback;
  const supabase = await createClient();
  let q = supabase.from("feedback").select("*").order("updated_at", { ascending: false }).limit(5000);
  if (listingId) q = q.eq("listing_id", listingId);
  const { data, error } = await q;
  if (error) throw new Error(`Bewertungen konnten nicht geladen werden: ${error.message}`);
  return (data ?? []) as Feedback[];
}

export async function getRuns(limit = 30): Promise<SearchRun[]> {
  if (isDemo()) return demoRuns.slice(0, limit);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("search_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Suchläufe konnten nicht geladen werden: ${error.message}`);
  return (data ?? []) as SearchRun[];
}

export async function getLearned(limit = 5): Promise<LearnedPreferences[]> {
  if (isDemo()) return demoLearned;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("learned_preferences")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Lernstand konnte nicht geladen werden: ${error.message}`);
  return (data ?? []) as LearnedPreferences[];
}

export async function getLearnedProfile(): Promise<LearnedProfile | null> {
  if (isDemo()) return demoLearnedProfile();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("learned_profile");
  if (error) throw new Error(`Auswertung konnte nicht geladen werden: ${error.message}`);
  return data as LearnedProfile | null;
}
