"use client";

import { createClient } from "./supabase/client";
import type { CurrentUser, Feedback, Member, Pipeline, Rating, SearchProfile } from "./types";

/*
  Schreibzugriffe aus dem Browser. Row Level Security in Supabase sorgt dafür,
  dass nur freigeschaltete Mitglieder schreiben – und nur ihr eigenes Feedback.
  Im Demo-Modus wird nichts gespeichert.
*/

export async function saveFeedback(
  demo: boolean,
  user: CurrentUser,
  listingId: string,
  rating: Rating,
  reasons: string[],
  comment: string | null,
): Promise<Feedback> {
  const nowIso = new Date().toISOString();
  if (demo) {
    return {
      id: `local-${listingId}`,
      listing_id: listingId,
      user_id: user.id,
      user_email: user.email,
      rating,
      reasons,
      comment,
      created_at: nowIso,
      updated_at: nowIso,
    };
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("feedback")
    .upsert(
      { listing_id: listingId, user_id: user.id, user_email: user.email.toLowerCase(), rating, reasons, comment },
      { onConflict: "listing_id,user_id" },
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as Feedback;
}

export async function deleteFeedback(demo: boolean, user: CurrentUser, listingId: string) {
  if (demo) return;
  const supabase = createClient();
  const { error } = await supabase.from("feedback").delete().eq("listing_id", listingId).eq("user_id", user.id);
  if (error) throw new Error(error.message);
}

export async function setPipeline(demo: boolean, listingId: string, pipeline: Pipeline) {
  if (demo) return;
  const supabase = createClient();
  const { error } = await supabase.from("listings").update({ pipeline }).eq("id", listingId);
  if (error) throw new Error(error.message);
}

export type ProfileUpdate = Pick<
  SearchProfile,
  | "radius_km"
  | "offer_types"
  | "property_types"
  | "rent_max_warm"
  | "buy_max_price"
  | "min_rooms"
  | "min_area_m2"
  | "require_home_office"
  | "household"
  | "must_haves"
  | "nice_to_haves"
  | "search_places"
  | "excluded_places"
  | "notes"
>;

export async function saveProfile(demo: boolean, user: CurrentUser, update: ProfileUpdate) {
  if (demo) return;
  const supabase = createClient();
  const { error } = await supabase
    .from("search_profile")
    .update({ ...update, updated_by: user.id })
    .eq("id", 1);
  if (error) throw new Error(error.message);
}

export async function addMember(demo: boolean, email: string, displayName: string | null): Promise<Member> {
  const member: Member = { email: email.trim().toLowerCase(), display_name: displayName?.trim() || null, added_at: new Date().toISOString() };
  if (demo) return member;
  const supabase = createClient();
  const { error } = await supabase.from("app_members").insert({ email: member.email, display_name: member.display_name });
  if (error) throw new Error(error.code === "23505" ? "Diese E-Mail ist schon freigeschaltet." : error.message);
  return member;
}

export async function removeMember(demo: boolean, email: string) {
  if (demo) return;
  const supabase = createClient();
  const { error } = await supabase.from("app_members").delete().eq("email", email);
  if (error) throw new Error(error.message);
}
