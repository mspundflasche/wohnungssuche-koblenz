"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { ListingRow } from "./ListingRow";
import { NewPerDay } from "./charts/NewPerDay";
import { PriceAreaScatter } from "./charts/PriceAreaScatter";
import { PricePerM2Bars } from "./charts/PricePerM2Bars";
import { LegendSwatch } from "./charts/ChartFrame";
import { VERDICT_COLOR } from "@/lib/colors";
import { VERDICT_LABEL, comparablePrice, dayKey, fmtTime, relativeDay, verdictOf } from "@/lib/format";
import type { CurrentUser, Feedback, Listing, Member, SearchProfile, SearchRun, Verdict } from "@/lib/types";

const ListingMap = dynamic(() => import("./ListingMap"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-schiefer-2">Karte wird geladen …</div>,
});

type OfferFilter = "alle" | "miete" | "kauf";
type PropFilter = "alle" | "wohnung" | "haus";
type VerdictFilter = "alle" | Verdict;
type SortKey = "passung" | "neu" | "preis" | "flaeche";

interface Props {
  listings: Listing[];
  feedback: Feedback[];
  profile: SearchProfile | null;
  runs: SearchRun[];
  members: Member[];
  user: CurrentUser;
  demo: boolean;
}

const PAGE = 25;

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="flex items-center gap-2">
      <legend className="sr-only">{label}</legend>
      <span aria-hidden className="text-sm text-schiefer-2">
        {label}
      </span>
      <div className="flex rounded-md border border-linie bg-papier p-0.5">
        {options.map((o) => (
          <label
            key={o.value}
            className={`cursor-pointer rounded px-2.5 py-1 text-sm font-medium has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-rhein ${
              value === o.value ? "bg-schiefer text-white" : "text-schiefer-2 hover:text-schiefer"
            }`}
          >
            <input
              type="radio"
              className="sr-only"
              name={label}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Dashboard({ listings: initialListings, feedback: initialFeedback, profile, runs, members, user, demo }: Props) {
  const [feedback, setFeedback] = useState<Feedback[]>(initialFeedback);
  const [offer, setOffer] = useState<OfferFilter>("alle");
  const [prop, setProp] = useState<PropFilter>("alle");
  const [verdictFilter, setVerdictFilter] = useState<VerdictFilter>("alle");
  const [sort, setSort] = useState<SortKey>("passung");
  const [showInactive, setShowInactive] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [visible, setVisible] = useState(PAGE);
  const [now] = useState(() => Date.now());

  const listings = initialListings;
  const names = useMemo(() => new Map(members.filter((m) => m.display_name).map((m) => [m.email, m.display_name!])), [members]);

  const feedbackByListing = useMemo(() => {
    const m = new Map<string, Feedback[]>();
    for (const f of feedback) m.set(f.listing_id, [...(m.get(f.listing_id) ?? []), f]);
    return m;
  }, [feedback]);

  const verdicts = useMemo(() => {
    const m = new Map<string, Verdict>();
    for (const l of listings) m.set(l.id, verdictOf(feedbackByListing.get(l.id) ?? []));
    return m;
  }, [listings, feedbackByListing]);

  const today = dayKey(new Date(now));
  const weekAgo = now - 7 * 86400000;
  const active = listings.filter((l) => l.status === "aktiv");
  const newToday = active.filter((l) => dayKey(l.first_seen_at) === today);
  const newWeek = active.filter((l) => new Date(l.first_seen_at).getTime() >= weekAgo);
  const unrated = active.filter((l) => verdicts.get(l.id) === "unbewertet" && l.pipeline !== "aussortiert");
  const lastRun = runs[0];
  const blocked = lastRun?.sources?.filter((s) => s.status !== "ok") ?? [];

  const filtered = useMemo(() => {
    const out = listings.filter((l) => {
      if (!showInactive && (l.status === "weg" || l.pipeline === "aussortiert")) return false;
      if (offer !== "alle" && l.offer_type !== offer) return false;
      if (prop !== "alle" && l.property_type !== prop) return false;
      if (verdictFilter !== "alle" && verdicts.get(l.id) !== verdictFilter) return false;
      return true;
    });
    const by: Record<SortKey, (a: Listing, b: Listing) => number> = {
      passung: (a, b) => (b.score ?? -1) - (a.score ?? -1) || b.first_seen_at.localeCompare(a.first_seen_at),
      neu: (a, b) => b.first_seen_at.localeCompare(a.first_seen_at),
      preis: (a, b) => (comparablePrice(a) ?? Infinity) - (comparablePrice(b) ?? Infinity),
      flaeche: (a, b) => (b.area_m2 ?? 0) - (a.area_m2 ?? 0),
    };
    return out.sort(by[sort]);
  }, [listings, showInactive, offer, prop, verdictFilter, verdicts, sort]);

  const onSaved = useCallback((fb: Feedback) => {
    setFeedback((cur) => [fb, ...cur.filter((f) => !(f.listing_id === fb.listing_id && f.user_id === fb.user_id))]);
  }, []);
  const onDeleted = useCallback(
    (listingId: string) => setFeedback((cur) => cur.filter((f) => !(f.listing_id === listingId && f.user_id === user.id))),
    [user.id],
  );

  const selectFromChart = useCallback(
    (id: string) => {
      setSelectedId(id);
      const idx = filtered.findIndex((l) => l.id === id);
      if (idx >= visible) setVisible(idx + 1);
      requestAnimationFrame(() => {
        const el = document.getElementById(`angebot-${id}`);
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
      });
    },
    [filtered, visible],
  );

  const showRent = offer !== "kauf";
  const showBuy = offer !== "miete";
  const mapCenter: [number, number] = [profile?.center_lat ?? 50.3597, profile?.center_lng ?? 7.5978];
  const unlocated = filtered.filter((l) => l.lat == null || l.lng == null).length;

  return (
    <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 pb-20">
      {/* Kopf: was ist neu */}
      <section className="pt-8 pb-6">
        <h1 className="font-cond text-[2.6rem] font-semibold leading-[1.05] sm:text-5xl">
          {newToday.length === 0
            ? "Heute keine neuen Angebote"
            : newToday.length === 1
              ? "1 neues Angebot heute"
              : `${newToday.length} neue Angebote heute`}
        </h1>
        <p className="mt-3 max-w-[72ch] text-schiefer-2">
          {active.length} aktive Angebote im Umkreis von {profile?.radius_km ?? 20} km um {profile?.center_name ?? "Koblenz"}, davon{" "}
          {newWeek.length} aus den letzten 7 Tagen.{" "}
          {unrated.length > 0 && (
            <>
              <strong className="font-semibold text-schiefer">{unrated.length} warten auf eure Bewertung.</strong>{" "}
            </>
          )}
          {lastRun ? (
            <>
              Letzte Suche {relativeDay(lastRun.started_at)} um {fmtTime(lastRun.started_at)} Uhr
              {blocked.length > 0 && <> ({blocked.map((b) => b.name).join(", ")} nicht erreichbar)</>}.
            </>
          ) : (
            <>Die tägliche Suche ist eingerichtet und liefert jeden Morgen neue Angebote.</>
          )}
        </p>
      </section>

      {/* Filter: eine Zeile, gilt für Karte, Liste und Diagramme */}
      <div className="-mx-5 border-y border-linie bg-kalk/95 px-5 py-3 backdrop-blur lg:sticky lg:top-0 lg:z-[500]">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Segmented<OfferFilter>
            label="Angebot"
            value={offer}
            onChange={setOffer}
            options={[
              { value: "alle", label: "Alle" },
              { value: "miete", label: "Miete" },
              { value: "kauf", label: "Kauf" },
            ]}
          />
          <Segmented<PropFilter>
            label="Objekt"
            value={prop}
            onChange={setProp}
            options={[
              { value: "alle", label: "Alle" },
              { value: "wohnung", label: "Wohnung" },
              { value: "haus", label: "Haus" },
            ]}
          />
          <label className="flex items-center gap-2 text-sm text-schiefer-2">
            Bewertung
            <select
              value={verdictFilter}
              onChange={(e) => setVerdictFilter(e.target.value as VerdictFilter)}
              className="rounded-md border border-linie bg-papier px-2 py-1.5 text-sm font-medium text-schiefer"
            >
              <option value="alle">Alle</option>
              <option value="unbewertet">Noch nicht bewertet</option>
              <option value="positiv">Gefällt</option>
              <option value="gemischt">Uneinig</option>
              <option value="negativ">Passt nicht</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-schiefer-2">
            Sortieren nach
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-md border border-linie bg-papier px-2 py-1.5 text-sm font-medium text-schiefer"
            >
              <option value="passung">Passung</option>
              <option value="neu">Neueste zuerst</option>
              <option value="preis">Preis aufsteigend</option>
              <option value="flaeche">Größte Fläche</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-schiefer-2">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="size-4 accent-rhein"
            />
            Aussortierte und nicht mehr verfügbare zeigen
          </label>
          <span className="ml-auto text-sm font-medium" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "Angebot" : "Angebote"}
          </span>
        </div>
      </div>

      {/* Karte + Liste */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="lg:sticky lg:top-[4.75rem] lg:self-start">
          <div className="h-[340px] overflow-hidden rounded-lg border border-linie bg-papier sm:h-[420px] lg:h-[calc(100vh-7rem)]">
            <ListingMap
              listings={filtered}
              verdicts={verdicts}
              center={mapCenter}
              radiusKm={Number(profile?.radius_km ?? 20)}
              selectedId={selectedId}
              hoveredId={hoveredId}
              onSelect={selectFromChart}
            />
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-schiefer-2" aria-label="Legende der Karte">
            {(["positiv", "negativ", "gemischt", "unbewertet"] as Verdict[]).map((v) => (
              <li key={v} className="inline-flex items-center gap-1.5">
                <LegendSwatch color={VERDICT_COLOR[v]} />
                {VERDICT_LABEL[v]}
              </li>
            ))}
            {unlocated > 0 && <li>{unlocated} ohne genaue Lage</li>}
          </ul>
        </div>

        <section aria-label="Angebote" className="min-w-0 overflow-hidden rounded-lg border border-linie bg-papier">
          {filtered.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="font-cond text-2xl font-semibold">Keine Angebote für diese Auswahl</p>
              <p className="mt-2 text-schiefer-2">
                {listings.length === 0
                  ? "Sobald die tägliche Suche gelaufen ist, erscheinen hier die Treffer."
                  : "Setzt die Filter oben zurück oder zeigt auch aussortierte Angebote."}
              </p>
            </div>
          ) : (
            <>
              {filtered.slice(0, visible).map((l) => (
                <ListingRow
                  key={l.id}
                  listing={l}
                  feedback={feedbackByListing.get(l.id) ?? []}
                  profile={profile}
                  user={user}
                  names={names}
                  demo={demo}
                  selected={l.id === selectedId || l.id === hoveredId}
                  isNew={new Date(l.first_seen_at).getTime() >= weekAgo}
                  now={now}
                  onHover={setHoveredId}
                  onFeedbackSaved={onSaved}
                  onFeedbackDeleted={onDeleted}
                />
              ))}
              {visible < filtered.length && (
                <div className="p-4 text-center">
                  <button
                    type="button"
                    onClick={() => setVisible((v) => v + PAGE)}
                    className="rounded-md border border-linie px-4 py-2 text-sm font-medium text-rhein hover:bg-kalk"
                  >
                    {Math.min(PAGE, filtered.length - visible)} weitere zeigen
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* Auswertung */}
      <section aria-labelledby="auswertung" className="mt-14">
        <h2 id="auswertung" className="font-cond text-3xl font-semibold">
          Preise im Überblick
        </h2>
        <p className="mt-1 text-schiefer-2">Klickt auf einen Punkt, um das Angebot in der Liste zu öffnen.</p>
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          {showRent && (
            <PriceAreaScatter listings={filtered} offer="miete" verdicts={verdicts} budget={profile?.rent_max_warm ?? null} onSelect={selectFromChart} />
          )}
          {showBuy && (
            <PriceAreaScatter listings={filtered} offer="kauf" verdicts={verdicts} budget={profile?.buy_max_price ?? null} onSelect={selectFromChart} />
          )}
          {showRent && <PricePerM2Bars listings={filtered} offer="miete" />}
          {showBuy && <PricePerM2Bars listings={filtered} offer="kauf" />}
          <div className="xl:col-span-2">
            <NewPerDay listings={filtered} />
          </div>
        </div>
      </section>
    </main>
  );
}
