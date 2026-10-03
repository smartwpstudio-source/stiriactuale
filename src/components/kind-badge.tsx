// Eticheta tipului de articol: „Pe scurt” (povestea abia începe, se completează)
// sau „Analiză” (comandată de editor). Știrea obișnuită nu are etichetă.
export function KindBadge({ kind, className = "" }: { kind?: string; className?: string }) {
  if (kind !== "pe-scurt" && kind !== "analiza") return null;
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
        kind === "analiza" ? "bg-ink text-white" : "bg-amber/20 text-amber-ink"
      } ${className}`}
    >
      {kind === "analiza" ? "Analiză" : "Pe scurt"}
    </span>
  );
}
