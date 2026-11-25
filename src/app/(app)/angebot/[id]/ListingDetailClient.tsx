"use client";

import { useState } from "react";
import { FeedbackControl } from "@/components/FeedbackControl";
import { PIPELINE_LABEL } from "@/lib/format";
import { setPipeline } from "@/lib/mutations";
import type { CurrentUser, Feedback, Member, Pipeline } from "@/lib/types";

interface Props {
  listingId: string;
  pipeline: Pipeline;
  feedback: Feedback[];
  members: Member[];
  user: CurrentUser;
  demo: boolean;
}

export function ListingDetailClient({ listingId, pipeline: initialPipeline, feedback: initial, members, user, demo }: Props) {
  const [feedback, setFeedback] = useState(initial);
  const [pipeline, setPipe] = useState<Pipeline>(initialPipeline);
  const [pipeMsg, setPipeMsg] = useState<string | null>(null);
  const names = new Map(members.filter((m) => m.display_name).map((m) => [m.email, m.display_name!]));
  const mine = feedback.find((f) => f.user_id === user.id) ?? null;
  const others = feedback.filter((f) => f.user_id !== user.id);

  async function changePipeline(p: Pipeline) {
    const prev = pipeline;
    setPipe(p);
    setPipeMsg(null);
    try {
      await setPipeline(demo, listingId, p);
      setPipeMsg(`Status: ${PIPELINE_LABEL[p]}`);
    } catch (e) {
      setPipe(prev);
      setPipeMsg(`Nicht gespeichert: ${(e as Error).message}`);
    }
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="bewerten">
        <h2 id="bewerten" className="font-cond text-2xl font-semibold">
          Eure Bewertung
        </h2>
        <p className="mt-1 text-sm text-schiefer-2">Jede Bewertung und jeder Grund fließt in die nächste tägliche Suche ein.</p>
        <FeedbackControl
          listingId={listingId}
          mine={mine}
          others={others}
          names={names}
          user={user}
          demo={demo}
          expanded
          onSaved={(fb) => setFeedback((cur) => [fb, ...cur.filter((f) => f.user_id !== fb.user_id)])}
          onDeleted={() => setFeedback((cur) => cur.filter((f) => f.user_id !== user.id))}
        />
      </section>

      <section aria-labelledby="stand">
        <h2 id="stand" className="font-cond text-2xl font-semibold">
          Wie weit seid ihr?
        </h2>
        <div role="radiogroup" aria-label="Stand" className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(PIPELINE_LABEL) as Pipeline[]).map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={pipeline === p}
              onClick={() => changePipeline(p)}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                pipeline === p ? "border-schiefer bg-schiefer text-white" : "border-linie bg-papier text-schiefer-2 hover:border-schiefer-3 hover:text-schiefer"
              }`}
            >
              {PIPELINE_LABEL[p]}
            </button>
          ))}
        </div>
        <p aria-live="polite" className="mt-2 text-sm text-schiefer-2">
          {pipeMsg}
        </p>
      </section>
    </div>
  );
}
