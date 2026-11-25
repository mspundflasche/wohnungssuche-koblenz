import { PlacesDiverging, ReasonsBars } from "@/components/charts/LearnCharts";
import { VERDICT_COLOR } from "@/lib/colors";
import { getLearned, getLearnedProfile, getRuns } from "@/lib/data";
import { OFFER_LABEL, RATING_LABEL, fmtDate, fmtEur, fmtEurM2, fmtKm, fmtM2, fmtNum, fmtTime } from "@/lib/format";

const RULE_LABEL: Record<string, string> = {
  bevorzugt: "Kommt gut an",
  meiden: "Eher nicht",
  orte_bevorzugt: "Bevorzugte Orte",
  orte_meiden: "Orte, die eher nicht passen",
  preis: "Preis",
  hinweise: "Hinweise",
};

function RuleValue({ value }: { value: unknown }) {
  if (Array.isArray(value)) {
    return (
      <ul className="mt-1 flex flex-wrap gap-1.5">
        {value.map((v, i) => (
          <li key={i} className="rounded-full border border-linie bg-papier px-2.5 py-0.5 text-sm">
            {String(v)}
          </li>
        ))}
      </ul>
    );
  }
  if (value && typeof value === "object") {
    return (
      <ul className="mt-1 space-y-0.5 text-sm">
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <li key={k}>
            <span className="text-schiefer-2">{k.replaceAll("_", " ")}:</span> {String(v)}
          </li>
        ))}
      </ul>
    );
  }
  return <p className="mt-1 text-sm">{String(value)}</p>;
}

export default async function LernstandPage() {
  const [learned, profile, runs] = await Promise.all([getLearned(5), getLearnedProfile(), getRuns(30)]);
  const latest = learned[0];
  const p = profile;

  return (
    <main className="mx-auto w-full max-w-[1100px] flex-1 px-5 pt-8 pb-20">
      <h1 className="font-cond text-5xl font-semibold leading-none">Was die Suche von euch gelernt hat</h1>
      <p className="mt-3 max-w-[70ch] text-schiefer-2">
        Jeden Morgen liest die Suche eure Bewertungen, Gründe und Notizen, fasst sie hier zusammen und bewertet damit neue
        Angebote. Je mehr ihr bewertet, desto genauer wird die Passung.
      </p>

      <section aria-labelledby="zusammenfassung" className="mt-10">
        <h2 id="zusammenfassung" className="font-cond text-3xl font-semibold">
          Aktueller Stand
        </h2>
        {latest ? (
          <div className="mt-4 rounded-lg border border-linie bg-papier p-5 sm:p-6">
            <p className="text-sm text-schiefer-2">
              Stand {fmtDate(latest.created_at)}, {fmtTime(latest.created_at)} Uhr, aus {latest.feedback_count} Bewertungen
            </p>
            <p className="mt-3 max-w-[70ch] text-[1.05rem] leading-relaxed whitespace-pre-line">{latest.summary}</p>
            {Object.keys(latest.rules ?? {}).length > 0 && (
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                {Object.entries(latest.rules).map(([k, v]) => (
                  <div key={k}>
                    <dt className="font-medium">{RULE_LABEL[k] ?? k.replaceAll("_", " ")}</dt>
                    <dd>
                      <RuleValue value={v} />
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        ) : (
          <p className="mt-3 max-w-[70ch] rounded-lg border border-dashed border-linie bg-papier p-5 text-schiefer-2">
            Noch nichts gelernt. Bewertet ein paar Angebote mit „Passt nicht“, „Interessant“ oder „Favorit“ und nennt Gründe –
            die nächste tägliche Suche wertet das aus und schreibt hier ihre Zusammenfassung hinein.
          </p>
        )}
      </section>

      {p && p.feedback_total > 0 && (
        <section aria-labelledby="feedback" className="mt-14">
          <h2 id="feedback" className="font-cond text-3xl font-semibold">
            Euer Feedback in Zahlen
          </h2>
          <p className="mt-2 max-w-[70ch] text-schiefer-2">
            <strong className="text-schiefer">{p.feedback_total} Bewertungen</strong> zu {p.bewertete_angebote} Angeboten:{" "}
            {p.positiv} gefallen ({p.favoriten} davon als Favorit), {p.negativ} passen nicht.
          </p>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <PlacesDiverging data={p.nach_ort} />
            </div>
            <ReasonsBars title="Warum etwas nicht passt" data={p.gruende_negativ} color={VERDICT_COLOR.negativ} />
            <ReasonsBars title="Was euch gefällt" data={p.gruende_positiv} color={VERDICT_COLOR.positiv} />
          </div>

          {p.kennzahlen.length > 0 && (
            <div className="mt-8 overflow-x-auto rounded-lg border border-linie bg-papier p-4 sm:p-5">
              <h3 className="font-cond text-xl font-semibold">Was gefällt, was nicht – im Durchschnitt</h3>
              <table className="chart-table mt-3 min-w-[640px]">
                <thead>
                  <tr>
                    <th>Angebot</th>
                    <th>Bewertung</th>
                    <th className="num">Anzahl</th>
                    <th className="num">Ø Preis</th>
                    <th className="num">Höchster Preis</th>
                    <th className="num">Ø pro m²</th>
                    <th className="num">Ø Fläche</th>
                    <th className="num">Ø Zimmer</th>
                    <th className="num">Ø Entfernung</th>
                  </tr>
                </thead>
                <tbody>
                  {p.kennzahlen.map((k) => (
                    <tr key={`${k.angebot}-${k.bewertung}`}>
                      <td>{OFFER_LABEL[k.angebot]}</td>
                      <td>{k.bewertung === "positiv" ? "Gefällt" : "Passt nicht"}</td>
                      <td className="num">{k.anzahl}</td>
                      <td className="num">{fmtEur(k.preis_avg)}</td>
                      <td className="num">{fmtEur(k.preis_max)}</td>
                      <td className="num">{fmtEurM2(k.preis_m2_avg)}</td>
                      <td className="num">{fmtM2(k.flaeche_avg)}</td>
                      <td className="num">{fmtNum(k.zimmer_avg, 1)}</td>
                      <td className="num">{fmtKm(k.distanz_avg)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-xs text-schiefer-2">Mietpreise: Warmmiete, wenn bekannt. Preis pro m² bei Miete: Kaltmiete.</p>
            </div>
          )}

          {p.kommentare.length > 0 && (
            <div className="mt-8">
              <h3 className="font-cond text-xl font-semibold">Eure Notizen</h3>
              <ul className="mt-3 divide-y divide-linie-2 rounded-lg border border-linie bg-papier">
                {p.kommentare.map((c, i) => (
                  <li key={i} className="px-4 py-3">
                    <p>„{c.kommentar}“</p>
                    <p className="mt-0.5 text-sm text-schiefer-2">
                      {RATING_LABEL[c.bewertung]} zu „{c.titel}“{c.ort ? ` in ${c.ort}` : ""}, {fmtDate(c.datum)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section aria-labelledby="laeufe" className="mt-14">
        <h2 id="laeufe" className="font-cond text-3xl font-semibold">
          Tägliche Suchläufe
        </h2>
        {runs.length === 0 ? (
          <p className="mt-2 text-schiefer-2">Noch kein Suchlauf. Die erste tägliche Suche läuft am nächsten Morgen.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-linie bg-papier p-4 sm:p-5">
            <table className="chart-table min-w-[720px]">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th className="num">Gefunden</th>
                  <th className="num">Neu</th>
                  <th className="num">Aktualisiert</th>
                  <th className="num">Nicht mehr da</th>
                  <th>Quellen</th>
                  <th>Zusammenfassung</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className="whitespace-nowrap">
                      {fmtDate(r.started_at)}, {fmtTime(r.started_at)}
                    </td>
                    <td className="num">{r.found_count}</td>
                    <td className="num">{r.new_count}</td>
                    <td className="num">{r.updated_count}</td>
                    <td className="num">{r.gone_count}</td>
                    <td>
                      {(r.sources ?? []).map((s) => (
                        <span key={s.name} className={`block ${s.status === "ok" ? "" : "text-warn"}`}>
                          {s.name}: {s.status === "ok" ? `${s.found ?? 0} Treffer` : s.status}
                        </span>
                      ))}
                    </td>
                    <td className="max-w-[40ch] text-schiefer-2">{r.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
