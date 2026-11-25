export function ScoreMeter({ score }: { score: number | null }) {
  if (score == null) {
    return <span className="text-sm text-schiefer-3">Passung wird bei der nächsten Suche berechnet</span>;
  }
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="relative h-1.5 w-24 overflow-hidden rounded-full bg-rhein-hell"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
        aria-label="Passung"
      >
        <span className="absolute inset-y-0 left-0 rounded-full bg-rhein" style={{ width: `${Math.max(3, score)}%` }} />
      </span>
      <span className="text-sm font-semibold">Passung {score}</span>
    </span>
  );
}
