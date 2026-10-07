import Link from "next/link";
import { IconBook2, IconCalculator, IconFileText } from "@tabler/icons-react";
import { IMPACT_TYPES, type Impact, type Tool } from "@/lib/impact";

const ICONS = { ghid: IconBook2, calc: IconCalculator, model: IconFileText };
const CTA = { ghid: "Citește ghidul", calc: "Calculează", model: "Completează modelul" };
const BADGE = { bani: "bg-alert", reguli: "bg-teal", alerta: "bg-amber-ink", urgent: "bg-alert" };

// „Ce înseamnă pentru tine” — sub lead, înaintea textului; randat pe server.
export function ImpactBlock({ impact, tools, source }: { impact: Impact; tools: Tool[]; source?: string }) {
  const urgent = impact.tip === "urgent" || impact.tip === "alerta";
  const date = new Date(impact.verificat).toLocaleDateString("ro-MD", { timeZone: "Europe/Chisinau", day: "numeric", month: "long" });
  return (
    <section className={`mt-6 rounded-lg border-2 bg-white p-4 sm:p-5 ${urgent ? "border-alert/50" : "border-teal/50"}`}>
      <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide">
        <span className={urgent ? "text-alert" : "text-teal"}>Ce înseamnă pentru tine</span>
        <span className={`rounded px-2 py-0.5 font-semibold text-white ${BADGE[impact.tip]}`}>{IMPACT_TYPES[impact.tip]}</span>
      </p>
      <dl className="mt-3 space-y-2 text-ink">
        <div>
          <dt className="inline font-semibold">Cine: </dt>
          <dd className="inline">{impact.cine}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Ce se schimbă: </dt>
          <dd className="inline">{impact.ce}</dd>
        </div>
        {impact.cand && (
          <div>
            <dt className="inline font-semibold">De când: </dt>
            <dd className="inline">{impact.cand}</dd>
          </div>
        )}
        <div>
          <dt className="font-semibold">Ce faci acum:</dt>
          <dd>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {impact.pasi.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
      {tools.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {tools.map((t) => {
            const Icon = ICONS[t.kind];
            return (
              <Link key={t.id} href={t.href} className="flex items-center gap-2 rounded bg-teal px-3 py-2 text-sm font-medium text-white hover:bg-teal/90">
                <Icon size={18} stroke={1.75} aria-hidden />
                <span>
                  {CTA[t.kind]}: {t.title}
                </span>
              </Link>
            );
          })}
        </div>
      )}
      <p className="mt-3 font-mono text-xs text-sub">
        {source ? `Sursa: ${source} · ` : ""}verificat la {date}
      </p>
    </section>
  );
}
