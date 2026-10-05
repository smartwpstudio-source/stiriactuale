// Eticheta tipului de articol: „Pe scurt” (povestea abia începe, se completează),
// „Analiză” (comandată de editor) sau „Continuare” (urmarea unei știri deja
// publicate — să nu pară aceeași știre de două ori). Știrea obișnuită nu are etichetă.
export function KindBadge({ kind, continues, className = "" }: { kind?: string; continues?: boolean; className?: string }) {
  const label = kind === "analiza" ? "Analiză" : kind === "pe-scurt" ? "Pe scurt" : continues ? "Continuare" : null;
  if (!label) return null;
  const color = kind === "analiza" ? "bg-ink text-white" : kind === "pe-scurt" ? "bg-amber/20 text-amber-ink" : "bg-teal/15 text-teal";
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${color} ${className}`}>
      {label}
    </span>
  );
}
