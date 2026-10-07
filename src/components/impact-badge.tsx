import { IMPACT_BADGE, IMPACT_TYPES, type Impact } from "@/lib/impact-types";

const TOOL_HINT = { calc: "🧮 cu calculator", ghid: "📘 cu ghid", model: "📝 cu model" } as const;

// Ecusonul știrilor cu impact în liste: tipul (Bani, Reguli, Alertă, Urgent)
// și, dacă știrea duce la o unealtă de pe site, ce fel de unealtă.
// Fără importuri de server: îl folosește și lenta (componentă de client).
export function ImpactBadge({ impact, className = "" }: { impact?: Impact; className?: string }) {
  if (!impact) return null;
  const kind = impact.unelte[0]?.split(":")[0] as keyof typeof TOOL_HINT | undefined;
  return (
    <span className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-white ${IMPACT_BADGE[impact.tip]}`}>
        {IMPACT_TYPES[impact.tip]}
      </span>
      {kind && TOOL_HINT[kind] && <span className="font-mono text-[11px] text-teal">{TOOL_HINT[kind]}</span>}
    </span>
  );
}
