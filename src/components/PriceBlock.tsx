import { TrendingDown, TrendingUp } from "lucide-react";
import { fmtEur } from "@/lib/format";
import type { Listing } from "@/lib/types";

export function PriceBlock({ listing: l, now, large = false }: { listing: Listing; now: number; large?: boolean }) {
  const big = large ? "text-3xl" : "text-[1.35rem]";
  const isRent = l.offer_type === "miete";
  const main = isRent ? (l.price_warm ?? l.price) : l.price;
  const mainLabel = isRent ? (l.price_warm != null ? "warm" : "kalt") : null;
  const secondary = isRent
    ? l.price_warm != null && l.price != null
      ? `${fmtEur(l.price)} kalt`
      : null
    : l.price_per_m2 != null
      ? `${fmtEur(Math.round(l.price_per_m2))}/m²`
      : null;

  const changed =
    l.previous_price != null &&
    l.price != null &&
    l.price_changed_at != null &&
    now - new Date(l.price_changed_at).getTime() < 21 * 86400000;
  const down = changed && l.price! < l.previous_price!;

  return (
    <div className="sm:text-right">
      <p className={`font-cond ${big} font-semibold leading-none`}>
        {main == null ? "Preis auf Anfrage" : fmtEur(main)}
        {mainLabel && <span className="ml-1 font-sans text-sm font-normal text-schiefer-2">{mainLabel}</span>}
      </p>
      {secondary && <p className="mt-1 text-sm text-schiefer-2">{secondary}</p>}
      {changed && (
        <p className={`mt-1 inline-flex items-center gap-1 text-sm font-medium ${down ? "text-gut" : "text-warn"}`}>
          {down ? <TrendingDown aria-hidden size={15} /> : <TrendingUp aria-hidden size={15} />}
          {down ? "gesenkt" : "erhöht"}, vorher {fmtEur(l.previous_price)}
        </p>
      )}
    </div>
  );
}
