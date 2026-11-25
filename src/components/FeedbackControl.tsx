"use client";

import { Check, Star, ThumbsUp, X } from "lucide-react";
import { useState } from "react";
import { NEGATIVE_REASONS, POSITIVE_REASONS, RATING_LABEL, displayName } from "@/lib/format";
import { deleteFeedback, saveFeedback } from "@/lib/mutations";
import type { CurrentUser, Feedback, Rating } from "@/lib/types";

interface Props {
  listingId: string;
  mine: Feedback | null;
  others: Feedback[];
  names: Map<string, string>;
  user: CurrentUser;
  demo: boolean;
  onSaved: (fb: Feedback) => void;
  onDeleted: (listingId: string) => void;
  /** Gründe-Bereich direkt geöffnet anzeigen (Detailseite). */
  expanded?: boolean;
}

const BUTTONS: { rating: Rating; label: string; Icon: typeof X }[] = [
  { rating: -1, label: "Passt nicht", Icon: X },
  { rating: 1, label: "Interessant", Icon: ThumbsUp },
  { rating: 2, label: "Favorit", Icon: Star },
];

export function FeedbackControl({ listingId, mine, others, names, user, demo, onSaved, onDeleted, expanded = false }: Props) {
  const [open, setOpen] = useState(expanded);
  const [reasons, setReasons] = useState<string[]>(mine?.reasons ?? []);
  const [comment, setComment] = useState(mine?.comment ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function persist(rating: Rating, nextReasons: string[], nextComment: string) {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const fb = await saveFeedback(demo, user, listingId, rating, nextReasons, nextComment.trim() || null);
      onSaved(fb);
      setSaved(true);
    } catch (e) {
      setError(`Nicht gespeichert: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  function onRate(rating: Rating) {
    if (mine?.rating === rating) {
      setOpen((o) => !o);
      return;
    }
    // Gründe behalten, wenn die Richtung gleich bleibt (Interessant ↔ Favorit).
    const keep = mine && Math.sign(mine.rating) === Math.sign(rating) ? reasons : [];
    setReasons(keep);
    setOpen(true);
    void persist(rating, keep, comment);
  }

  async function onRemove() {
    setBusy(true);
    setError(null);
    try {
      await deleteFeedback(demo, user, listingId);
      onDeleted(listingId);
      setReasons([]);
      setComment("");
      setOpen(false);
      setSaved(false);
    } catch (e) {
      setError(`Nicht entfernt: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  const reasonOptions = mine ? (mine.rating < 0 ? NEGATIVE_REASONS : POSITIVE_REASONS) : [];
  const dirty =
    mine != null &&
    (reasons.join("|") !== (mine.reasons ?? []).join("|") || (comment.trim() || null) !== (mine.comment || null));

  return (
    <div className="mt-3">
      <div role="group" aria-label="Bewerten" className="flex flex-wrap gap-2">
        {BUTTONS.map(({ rating, label, Icon }) => {
          const active = mine?.rating === rating;
          const tone =
            rating < 0
              ? active
                ? "border-negativ bg-[#fdebe1] text-schiefer"
                : "border-linie hover:border-negativ"
              : active
                ? "border-positiv bg-[#e2edfb] text-schiefer"
                : "border-linie hover:border-positiv";
          return (
            <button
              key={rating}
              type="button"
              aria-pressed={active}
              disabled={busy}
              onClick={() => onRate(rating)}
              className={`inline-flex items-center gap-1.5 rounded-md border bg-papier px-3 py-1.5 text-sm font-medium text-schiefer-2 disabled:opacity-60 ${tone} ${active ? "text-schiefer" : ""}`}
            >
              <Icon
                aria-hidden
                size={16}
                strokeWidth={2.25}
                className={active ? (rating < 0 ? "text-negativ" : "text-positiv") : ""}
                fill={active && rating === 2 ? "currentColor" : "none"}
              />
              {label}
            </button>
          );
        })}
        {mine && !open && (
          <button type="button" onClick={() => setOpen(true)} className="px-1 text-sm font-medium text-rhein hover:underline">
            {mine.reasons.length || mine.comment ? "Gründe ansehen" : "Gründe ergänzen"}
          </button>
        )}
      </div>

      {others.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-sm text-schiefer-2">
          {others.map((o) => (
            <li key={o.id}>
              <span className="font-medium text-schiefer">{displayName(o.user_email, names)}:</span> {RATING_LABEL[o.rating]}
              {o.reasons.length > 0 && <> – {o.reasons.join(", ")}</>}
              {o.comment && <> – „{o.comment}“</>}
            </li>
          ))}
        </ul>
      )}

      {mine && open && (
        <div className="mt-3 rounded-md border border-linie bg-kalk/60 p-3">
          <p className="text-sm font-medium">{mine.rating < 0 ? "Was passt nicht?" : "Was gefällt euch?"}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {reasonOptions.map((r) => {
              const on = reasons.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setReasons((cur) => (on ? cur.filter((x) => x !== r) : [...cur, r]))}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm ${
                    on ? "border-schiefer bg-schiefer text-white" : "border-linie bg-papier text-schiefer hover:border-schiefer-3"
                  }`}
                >
                  {on && <Check aria-hidden size={14} />}
                  {r}
                </button>
              );
            })}
          </div>
          <label className="mt-3 block text-sm font-medium">
            Notiz für die Suche <span className="font-normal text-schiefer-2">(optional)</span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              maxLength={2000}
              placeholder="z. B. Schulweg zu weit, Küche zu klein, toller Garten"
              className="mt-1 block w-full rounded-md border border-linie bg-papier px-2.5 py-2 text-sm placeholder:text-schiefer-3 focus:border-rhein focus:outline-none"
            />
          </label>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={busy || !dirty}
              onClick={() => persist(mine.rating, reasons, comment)}
              className="rounded-md bg-rhein px-3 py-1.5 text-sm font-medium text-white hover:bg-rhein-dunkel disabled:opacity-50"
            >
              Gründe speichern
            </button>
            <button type="button" disabled={busy} onClick={onRemove} className="text-sm font-medium text-schiefer-2 hover:text-schiefer hover:underline">
              Bewertung zurücknehmen
            </button>
            <button type="button" onClick={() => setOpen(false)} className="ml-auto text-sm text-schiefer-2 hover:text-schiefer">
              Schließen
            </button>
          </div>
        </div>
      )}

      <p aria-live="polite" className="min-h-0 text-sm">
        {error && <span className="mt-1 block text-warn">{error}</span>}
        {!error && saved && !busy && <span className="mt-1 block text-gut">Gespeichert – fließt in die nächste Suche ein.</span>}
      </p>
    </div>
  );
}
