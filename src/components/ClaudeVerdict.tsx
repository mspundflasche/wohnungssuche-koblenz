import { Star, ThumbsUp, X } from "lucide-react";
import { RATING_LABEL } from "@/lib/format";
import type { Listing } from "@/lib/types";

const ICON = { [-1]: X, 1: ThumbsUp, 2: Star } as const;

/**
 * Claudes eigene Bewertung eines Angebots – gleiche Skala wie die der Familie,
 * damit man sie direkt vergleichen kann.
 */
export function ClaudeVerdict({ listing, full = false }: { listing: Listing; full?: boolean }) {
  const r = listing.claude_rating;
  if (r == null) return null;
  const Icon = ICON[r];
  const tone = r < 0 ? "text-negativ" : "text-positiv";

  return (
    <div className={`flex flex-wrap items-start gap-x-2 gap-y-1 text-sm ${full ? "" : "mt-2"}`}>
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-linie bg-kalk px-2.5 py-0.5 font-medium text-schiefer">
        <Icon aria-hidden size={14} strokeWidth={2.25} className={tone} fill={r === 2 ? "currentColor" : "none"} />
        Claude: {RATING_LABEL[r]}
      </span>
      {listing.claude_note && (
        <span className={`min-w-0 flex-1 basis-56 text-schiefer-2 ${full ? "text-[0.95rem]" : "line-clamp-2"}`}>
          {listing.claude_note}
        </span>
      )}
    </div>
  );
}
