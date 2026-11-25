interface Props {
  city: string | null;
  district?: string | null;
  size?: "md" | "lg";
  muted?: boolean;
}

/**
 * Ortsname im Stil des gelben Ortsschilds. Bei Stadtteilen steht – wie auf dem
 * echten Schild – der Stadtteil groß und die Stadt klein darunter.
 */
export function Ortsschild({ city, district, size = "md", muted = false }: Props) {
  const name = district || city || "Ort unbekannt";
  const sub = district && city ? `Stadt ${city}` : null;
  return (
    <span
      className={`ortsschild ${size === "lg" ? "ortsschild-lg" : ""} ${muted ? "ortsschild-muted" : ""}`}
      aria-label={sub ? `${name}, ${sub}` : name}
    >
      <span className="ortsschild-name">{name}</span>
      {sub && <span className="ortsschild-sub">{sub}</span>}
    </span>
  );
}
