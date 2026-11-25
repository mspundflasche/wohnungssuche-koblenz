"use client";

import { Briefcase } from "lucide-react";
import Link from "next/link";
import { ClaudeVerdict } from "./ClaudeVerdict";
import { FeedbackControl } from "./FeedbackControl";
import { Ortsschild } from "./Ortsschild";
import { PriceBlock } from "./PriceBlock";
import { ScoreMeter } from "./ScoreMeter";
import {
  HOME_OFFICE_LABEL,
  PIPELINE_LABEL,
  criteriaIssues,
  fmtDate,
  fmtKm,
  listingFacts,
  relativeDay,
} from "@/lib/format";
import type { CurrentUser, Feedback, Listing, SearchProfile } from "@/lib/types";

interface Props {
  listing: Listing;
  feedback: Feedback[];
  profile: SearchProfile | null;
  user: CurrentUser;
  names: Map<string, string>;
  demo: boolean;
  selected: boolean;
  isNew: boolean;
  now: number;
  onHover: (id: string | null) => void;
  onFeedbackSaved: (fb: Feedback) => void;
  onFeedbackDeleted: (listingId: string) => void;
}


const HO_TONE = { ja: "text-gut", moeglich: "text-schiefer", unklar: "text-schiefer-2", nein: "text-warn" } as const;

export function ListingRow({
  listing: l,
  feedback,
  profile,
  user,
  names,
  demo,
  selected,
  isNew,
  now,
  onHover,
  onFeedbackSaved,
  onFeedbackDeleted,
}: Props) {
  const mine = feedback.find((f) => f.user_id === user.id) ?? null;
  const others = feedback.filter((f) => f.user_id !== user.id);
  const issues = criteriaIssues(l, profile);
  const gone = l.status === "weg";

  return (
    <article
      id={`angebot-${l.id}`}
      onMouseEnter={() => onHover(l.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(l.id)}
      className={`grid grid-cols-1 gap-3 border-b border-linie-2 px-4 py-5 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-4 sm:px-5 ${
        selected ? "bg-rhein-hell/45" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 sm:flex-col sm:flex-nowrap sm:pt-0.5 sm:text-center">
        <Ortsschild city={l.city} district={l.district} muted={gone} />
        {l.distance_km != null && <span className="text-xs text-schiefer-2">{fmtKm(l.distance_km)} entfernt</span>}
        {isNew && !gone && <span className="text-xs font-semibold text-rhein">neu {relativeDay(l.first_seen_at)}</span>}
        {l.pipeline !== "neu" && (
          <span className="rounded bg-schiefer px-1.5 py-0.5 text-[0.7rem] font-medium text-white">{PIPELINE_LABEL[l.pipeline]}</span>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <h3 className="w-full min-w-0 max-w-[46ch] font-cond sm:w-auto text-[1.3rem] font-semibold leading-tight">
            <Link href={`/angebot/${l.id}`} className="hover:text-rhein hover:underline">
              {l.title}
            </Link>
          </h3>
          <PriceBlock listing={l} now={now} />
        </div>

        <p className="mt-1 text-[0.95rem] text-schiefer-2">{listingFacts(l)}</p>
        <p className={`mt-1 inline-flex items-center gap-1.5 text-sm font-medium ${HO_TONE[l.home_office]}`}>
          <Briefcase aria-hidden size={15} />
          {HOME_OFFICE_LABEL[l.home_office]}
        </p>

        {gone && <p className="mt-1 text-sm text-schiefer-2">Nicht mehr online seit {fmtDate(l.last_seen_at)}</p>}

        {issues.length > 0 && (
          <ul aria-label="Abweichungen vom Suchprofil" className="mt-2 flex flex-wrap gap-1.5">
            {issues.map((i) => (
              <li key={i.key} className="rounded bg-[#fbeae3] px-2 py-0.5 text-xs font-medium text-warn">
                {i.label}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          <ScoreMeter score={l.score} />
          {l.score_reasons[0] && <span className="text-sm text-schiefer-2">{l.score_reasons.slice(0, 2).join(", ")}</span>}
        </div>

        <ClaudeVerdict listing={l} />

        <FeedbackControl
          listingId={l.id}
          mine={mine}
          others={others}
          names={names}
          user={user}
          demo={demo}
          onSaved={onFeedbackSaved}
          onDeleted={onFeedbackDeleted}
        />
      </div>
    </article>
  );
}
