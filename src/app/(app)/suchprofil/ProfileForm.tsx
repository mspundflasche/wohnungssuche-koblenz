"use client";

import { useState } from "react";
import { saveProfile, type ProfileUpdate } from "@/lib/mutations";
import type { CurrentUser, OfferType, PropertyType, SearchProfile } from "@/lib/types";

const toList = (s: string) =>
  s
    .split(/[,\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s.replace(/\./g, "").replace(",", ".")));

export function ProfileForm({ profile, user, demo }: { profile: SearchProfile; user: CurrentUser; demo: boolean }) {
  const [offerTypes, setOfferTypes] = useState<OfferType[]>(profile.offer_types);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>(profile.property_types);
  const [radius, setRadius] = useState(String(profile.radius_km));
  const [rentMax, setRentMax] = useState(profile.rent_max_warm?.toString() ?? "");
  const [buyMax, setBuyMax] = useState(profile.buy_max_price?.toString() ?? "");
  const [minRooms, setMinRooms] = useState(String(profile.min_rooms));
  const [minArea, setMinArea] = useState(profile.min_area_m2?.toString() ?? "");
  const [requireHo, setRequireHo] = useState(profile.require_home_office);
  const [household, setHousehold] = useState(profile.household);
  const [mustHaves, setMustHaves] = useState(profile.must_haves.join(", "));
  const [niceToHaves, setNiceToHaves] = useState(profile.nice_to_haves.join(", "));
  const [places, setPlaces] = useState(profile.search_places.join(", "));
  const [excluded, setExcluded] = useState(profile.excluded_places.join(", "));
  const [notes, setNotes] = useState(profile.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const update: ProfileUpdate = {
      radius_km: Number(radius),
      offer_types: offerTypes,
      property_types: propertyTypes,
      rent_max_warm: numOrNull(rentMax),
      buy_max_price: numOrNull(buyMax),
      min_rooms: Number(minRooms.replace(",", ".")),
      min_area_m2: numOrNull(minArea),
      require_home_office: requireHo,
      household: household.trim(),
      must_haves: toList(mustHaves),
      nice_to_haves: toList(niceToHaves),
      search_places: toList(places),
      excluded_places: toList(excluded),
      notes: notes.trim() || null,
    };
    if (!update.offer_types.length || !update.property_types.length) {
      setMsg({ ok: false, text: "Wählt mindestens eine Angebotsart und eine Objektart." });
      return;
    }
    if (!(update.radius_km > 0) || !(update.min_rooms > 0)) {
      setMsg({ ok: false, text: "Umkreis und Zimmerzahl müssen größer als 0 sein." });
      return;
    }
    setBusy(true);
    try {
      await saveProfile(demo, user, update);
      setMsg({ ok: true, text: "Gespeichert. Die nächste tägliche Suche nutzt die neuen Kriterien." });
    } catch (err) {
      setMsg({ ok: false, text: `Nicht gespeichert: ${(err as Error).message}` });
    } finally {
      setBusy(false);
    }
  }

  const input =
    "mt-1 block w-full rounded-md border border-linie bg-papier px-3 py-2 text-base focus:border-rhein focus:outline-none focus:ring-2 focus:ring-rhein/20";
  const check = "inline-flex items-center gap-2 rounded-md border border-linie bg-papier px-3 py-2 text-sm font-medium";

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-3 font-cond text-2xl font-semibold">Was sucht ihr?</legend>
        <div>
          <p className="text-sm font-medium">Angebot</p>
          <div className="mt-1 flex gap-2">
            {(["miete", "kauf"] as OfferType[]).map((o) => (
              <label key={o} className={check}>
                <input type="checkbox" className="size-4 accent-rhein" checked={offerTypes.includes(o)} onChange={() => setOfferTypes((c) => toggle(c, o))} />
                {o === "miete" ? "Miete" : "Kauf"}
              </label>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium">Objekt</p>
          <div className="mt-1 flex gap-2">
            {(["wohnung", "haus"] as PropertyType[]).map((o) => (
              <label key={o} className={check}>
                <input type="checkbox" className="size-4 accent-rhein" checked={propertyTypes.includes(o)} onChange={() => setPropertyTypes((c) => toggle(c, o))} />
                {o === "wohnung" ? "Wohnung" : "Haus"}
              </label>
            ))}
          </div>
        </div>
        <label className="text-sm font-medium">
          Höchste Warmmiete in €
          <input inputMode="numeric" value={rentMax} onChange={(e) => setRentMax(e.target.value)} className={input} />
        </label>
        <label className="text-sm font-medium">
          Höchster Kaufpreis in €
          <input inputMode="numeric" value={buyMax} onChange={(e) => setBuyMax(e.target.value)} className={input} />
        </label>
        <label className="text-sm font-medium">
          Mindestens Zimmer (inkl. Wohnzimmer)
          <input inputMode="decimal" value={minRooms} onChange={(e) => setMinRooms(e.target.value)} className={input} />
        </label>
        <label className="text-sm font-medium">
          Mindestens Wohnfläche in m²
          <input inputMode="numeric" value={minArea} onChange={(e) => setMinArea(e.target.value)} className={input} />
        </label>
        <label className="text-sm font-medium">
          Umkreis um Koblenz in km
          <input inputMode="numeric" value={radius} onChange={(e) => setRadius(e.target.value)} className={input} />
        </label>
        <label className={`${check} self-end`}>
          <input type="checkbox" className="size-4 accent-rhein" checked={requireHo} onChange={(e) => setRequireHo(e.target.checked)} />
          Eigener Raum fürs Home-Office ist Pflicht
        </label>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="mb-3 font-cond text-2xl font-semibold">Wünsche und Orte</legend>
        <label className="block text-sm font-medium">
          Haushalt
          <input value={household} onChange={(e) => setHousehold(e.target.value)} className={input} />
        </label>
        <label className="block text-sm font-medium">
          Muss vorhanden sein <span className="font-normal text-schiefer-2">(durch Komma getrennt)</span>
          <input value={mustHaves} onChange={(e) => setMustHaves(e.target.value)} placeholder="z. B. Garten, Stellplatz" className={input} />
        </label>
        <label className="block text-sm font-medium">
          Wäre schön <span className="font-normal text-schiefer-2">(durch Komma getrennt)</span>
          <input value={niceToHaves} onChange={(e) => setNiceToHaves(e.target.value)} className={input} />
        </label>
        <label className="block text-sm font-medium">
          Orte, in denen gezielt gesucht wird
          <textarea value={places} onChange={(e) => setPlaces(e.target.value)} rows={3} className={input} />
        </label>
        <label className="block text-sm font-medium">
          Orte ausschließen
          <input value={excluded} onChange={(e) => setExcluded(e.target.value)} placeholder="z. B. Neuwied" className={input} />
        </label>
        <label className="block text-sm font-medium">
          Hinweise für die Suche
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="z. B. Grundschule in Laufweite wichtig, kein Erdgeschoss an der Hauptstraße, Einzug ab Sommer 2027"
            className={input}
          />
        </label>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={busy} className="rounded-md bg-rhein px-5 py-2.5 font-medium text-white hover:bg-rhein-dunkel disabled:opacity-50">
          {busy ? "Speichert …" : "Suchprofil speichern"}
        </button>
        {msg && (
          <p role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-gut" : "text-warn"}`}>
            {msg.text}
          </p>
        )}
      </div>
    </form>
  );
}
