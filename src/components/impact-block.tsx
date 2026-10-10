import { IconBook2, IconCalculator, IconFileText } from "@tabler/icons-react";
import { IMPACT_BADGE, IMPACT_TYPES, type Impact } from "@/lib/impact-types";
import type { Tool } from "@/lib/impact";
import { ToolLink } from "./tool-link";

const ICONS = { ghid: IconBook2, calc: IconCalculator, model: IconFileText };
const TEXT = {
  ro: {
    cta: { ghid: "Citește ghidul", calc: "Calculează", model: "Completează modelul" },
    head: "Ce înseamnă pentru tine",
    tip: IMPACT_TYPES as Record<string, string>,
    cine: "Cine",
    ce: "Ce se schimbă",
    cand: "De când",
    pasi: "Ce faci acum",
    sursa: "Sursa",
    verificat: "verificat la",
    locale: "ro-MD",
  },
  ru: {
    cta: { ghid: "Читать справочник", calc: "Рассчитать", model: "Заполнить образец" },
    head: "Что это значит для вас",
    tip: { bani: "Деньги", reguli: "Правила", alerta: "Внимание", urgent: "Срочно" } as Record<string, string>,
    cine: "Кого касается",
    ce: "Что меняется",
    cand: "С какого момента",
    pasi: "Что делать сейчас",
    sursa: "Источник",
    verificat: "проверено",
    locale: "ru-RU",
  },
};

// „Ce înseamnă pentru tine” — sub lead, înaintea textului; randat pe server.
// lang="ru": știrea tradusă (/ru/novosti/), cu blocul tradus și uneltele rusești.
export function ImpactBlock({ slug, impact, tools, source, lang = "ro" }: { slug: string; impact: Impact; tools: Tool[]; source?: string; lang?: "ro" | "ru" }) {
  const L = TEXT[lang];
  const urgent = impact.tip === "urgent" || impact.tip === "alerta";
  const date = new Date(impact.verificat).toLocaleDateString(L.locale, { timeZone: "Europe/Chisinau", day: "numeric", month: "long" });
  return (
    <section className={`mt-6 rounded-lg border-2 bg-white p-4 sm:p-5 ${urgent ? "border-alert/50" : "border-teal/50"}`}>
      <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide">
        <span className={urgent ? "text-alert" : "text-teal"}>{L.head}</span>
        <span className={`rounded px-2 py-0.5 font-semibold text-white ${IMPACT_BADGE[impact.tip]}`}>{L.tip[impact.tip]}</span>
      </p>
      <dl className="mt-3 space-y-2 text-ink">
        <div>
          <dt className="inline font-semibold">{L.cine}: </dt>
          <dd className="inline">{impact.cine}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">{L.ce}: </dt>
          <dd className="inline">{impact.ce}</dd>
        </div>
        {impact.cand && (
          <div>
            <dt className="inline font-semibold">{L.cand}: </dt>
            <dd className="inline">{impact.cand}</dd>
          </div>
        )}
        <div>
          <dt className="font-semibold">{L.pasi}:</dt>
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
              <ToolLink key={t.id} slug={slug} href={t.href} className="flex items-center gap-2 rounded bg-teal px-3 py-2 text-sm font-medium text-white hover:bg-teal/90">
                <Icon size={18} stroke={1.75} aria-hidden />
                <span>
                  {L.cta[t.kind]}: {t.title}
                </span>
              </ToolLink>
            );
          })}
        </div>
      )}
      <p className="mt-3 font-mono text-xs text-sub">
        {source ? `${L.sursa}: ${source} · ` : ""}{L.verificat} {date}
      </p>
    </section>
  );
}
