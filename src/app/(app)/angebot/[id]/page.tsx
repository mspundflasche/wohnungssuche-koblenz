import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingDetailClient } from "./ListingDetailClient";
import { Ortsschild } from "@/components/Ortsschild";
import { PriceBlock } from "@/components/PriceBlock";
import { ScoreMeter } from "@/components/ScoreMeter";
import { getCurrentUser, getFeedback, getListing, getMembers, getProfile, isDemo, requestTime } from "@/lib/data";
import {
  HOME_OFFICE_LABEL,
  criteriaIssues,
  fmtDate,
  fmtEur,
  fmtEurM2,
  fmtKm,
  fmtM2,
  fmtNum,
  listingFacts,
} from "@/lib/format";

export default async function ListingPage({ params }: PageProps<"/angebot/[id]">) {
  const { id } = await params;
  const user = (await getCurrentUser())!;
  const [listing, feedback, profile, members] = await Promise.all([getListing(id), getFeedback(id), getProfile(), getMembers()]);
  if (!listing) notFound();
  const l = listing;
  const issues = criteriaIssues(l, profile);
  const now = requestTime();

  const facts: [string, string][] = [
    ["Angebot", l.offer_type === "miete" ? "Miete" : "Kauf"],
    ["Kaltmiete", l.offer_type === "miete" ? fmtEur(l.price) : ""],
    ["Warmmiete", l.offer_type === "miete" ? fmtEur(l.price_warm) : ""],
    ["Kaufpreis", l.offer_type === "kauf" ? fmtEur(l.price) : ""],
    ["Preis pro m²", l.price_per_m2 != null ? fmtEurM2(l.price_per_m2) : ""],
    ["Zimmer", l.rooms != null ? fmtNum(l.rooms, 1) : ""],
    ["Wohnfläche", l.area_m2 != null ? fmtM2(l.area_m2) : ""],
    ["Grundstück", l.plot_m2 ? fmtM2(l.plot_m2) : ""],
    ["Arbeitszimmer", HOME_OFFICE_LABEL[l.home_office]],
    ["Entfernung", l.distance_km != null ? `${fmtKm(l.distance_km)} bis Koblenz-Mitte` : ""],
    ["Adresse", [l.address, l.postal_code, l.city].filter(Boolean).join(", ")],
    ["Baujahr", l.year_built ? String(l.year_built) : ""],
    ["Energieklasse", l.energy_class ?? ""],
    ["Frei ab", l.available_from ?? ""],
    ["Anbieter", l.provider ?? ""],
    ["Ausstattung", l.features.join(", ")],
    ["Gefunden", `${fmtDate(l.first_seen_at)} über ${l.source}`],
    ["Zuletzt gesehen", fmtDate(l.last_seen_at)],
  ];

  return (
    <main className="mx-auto w-full max-w-[1100px] flex-1 px-5 pt-6 pb-20">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-rhein hover:underline">
        <ArrowLeft aria-hidden size={16} /> Alle Angebote
      </Link>

      <header className="mt-6 grid gap-6 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-start">
        <Ortsschild city={l.city} district={l.district} muted={l.status === "weg"} />
        <div className="min-w-0">
          <h1 className="font-cond text-4xl font-semibold leading-[1.05]">{l.title}</h1>
          <p className="mt-2 text-schiefer-2">{listingFacts(l)}</p>
          {l.status === "weg" && <p className="mt-1 text-sm font-medium text-warn">Nicht mehr online seit {fmtDate(l.last_seen_at)}.</p>}
        </div>
        <PriceBlock listing={l} now={now} large />
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <a
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md bg-rhein px-4 py-2 font-medium text-white hover:bg-rhein-dunkel"
        >
          Inserat bei {l.source} öffnen <ExternalLink aria-hidden size={16} />
        </a>
        <ScoreMeter score={l.score} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-10">
          {(l.ai_summary || l.score_reasons.length > 0 || issues.length > 0) && (
            <section aria-labelledby="einschaetzung">
              <h2 id="einschaetzung" className="font-cond text-2xl font-semibold">
                Einschätzung der Suche
              </h2>
              {l.ai_summary && <p className="mt-2 max-w-[68ch]">{l.ai_summary}</p>}
              {l.score_reasons.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-schiefer-2">
                  {l.score_reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              )}
              {issues.length > 0 && (
                <p className="mt-3 text-sm font-medium text-warn">Abweichungen vom Suchprofil: {issues.map((i) => i.label).join(", ")}</p>
              )}
            </section>
          )}

          {l.description && (
            <section aria-labelledby="beschreibung">
              <h2 id="beschreibung" className="font-cond text-2xl font-semibold">
                Beschreibung aus dem Inserat
              </h2>
              <p className="mt-2 max-w-[68ch] whitespace-pre-line text-schiefer-2">{l.description}</p>
            </section>
          )}

          <ListingDetailClient listingId={l.id} pipeline={l.pipeline} feedback={feedback} members={members} user={user} demo={isDemo()} />
        </div>

        <aside aria-labelledby="eckdaten">
          <h2 id="eckdaten" className="font-cond text-2xl font-semibold">
            Eckdaten
          </h2>
          <dl className="mt-3 divide-y divide-linie-2 rounded-lg border border-linie bg-papier text-sm">
            {facts
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="grid grid-cols-[9rem_minmax(0,1fr)] gap-3 px-4 py-2">
                  <dt className="text-schiefer-2">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
          </dl>
          {l.previous_price != null && (
            <p className="mt-3 text-sm text-schiefer-2">
              Preis geändert am {fmtDate(l.price_changed_at)}: vorher {fmtEur(l.previous_price)}, jetzt {fmtEur(l.price)}.
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}
