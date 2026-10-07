import { getGuides } from "./content/guides";
import { rankGuides } from "./content/related-guide";
import { availableCalculators } from "./calculators";
import { getCalcParams } from "./calculators-data";
import { COMPLAINT_MODELS } from "./complaint-models";

// Blocul „Ce înseamnă pentru tine” (concept editorial 2026-10-07): la știrile
// cu consecință reală, cine e afectat, ce se schimbă, de când, ce faci acum și
// 0-2 unelte de pe site (ghid, calculator, model de reclamație). Scris de
// pipeline în același apel cu știrea, editabil / dezactivabil în /admin.
import { IMPACT_TYPES, type Impact, type ImpactType } from "./impact-types";
export { IMPACT_TYPES, type Impact, type ImpactType };

export interface Tool {
  id: string;
  title: string;
  href: string;
  kind: "ghid" | "calc" | "model";
}

// Uneltele propuse modelului pentru o știre: toate calculatoarele și modelele
// de reclamații (puține) + ghidurile cele mai apropiate după cuvinte.
export async function toolCandidates(text: string): Promise<Tool[]> {
  const [guides, params] = await Promise.all([getGuides(), getCalcParams()]);
  return [
    ...availableCalculators(params).map((c) => ({ id: `calc:${c.slug}`, title: `Calculator: ${c.title}`, href: `/calculatoare/${c.slug}/`, kind: "calc" as const })),
    ...COMPLAINT_MODELS.map((m) => ({ id: `model:${m.slug}`, title: `Model: ${m.title}`, href: `/modele-reclamatii/${m.slug}/`, kind: "model" as const })),
    ...rankGuides(text, guides.filter((g) => g.category !== "orase"), 8).map((g) => ({ id: `ghid:${g.slug}`, title: `Ghid: ${g.title}`, href: `/ghiduri/${g.slug}/`, kind: "ghid" as const })),
  ];
}

// Toate uneltele existente, după id — pentru afișare și pentru admin.
export async function resolveTools(ids: string[]): Promise<Tool[]> {
  if (!ids.length) return [];
  const [guides, params] = await Promise.all([getGuides(), getCalcParams()]);
  return ids.flatMap((id): Tool[] => {
    const [kind, slug] = id.split(":");
    if (kind === "calc") {
      const c = availableCalculators(params).find((x) => x.slug === slug);
      return c ? [{ id, title: c.title, href: `/calculatoare/${slug}/`, kind }] : [];
    }
    if (kind === "model") {
      const m = COMPLAINT_MODELS.find((x) => x.slug === slug);
      return m ? [{ id, title: m.title, href: `/modele-reclamatii/${slug}/`, kind }] : [];
    }
    const g = kind === "ghid" ? guides.find((x) => x.slug === slug) : undefined;
    return g ? [{ id, title: g.title, href: `/ghiduri/${slug}/`, kind: "ghid" }] : [];
  });
}

// Orice cifră din bloc (sumă, procent, dată, an) trebuie să existe în textul
// surselor — altfel blocul se aruncă. Plasa de siguranță contra cifrelor
// inventate: un bloc greșit strică exact încrederea pe care o construim.
// ponytail: verifică numerele, nu și sensul lor („crește” vs „scade”).
export function numbersInSource(text: string, source: string): boolean {
  const norm = (s: string) => s.replace(/(\d)[\s .](?=\d{3}\b)/g, "$1");
  const src = norm(source);
  return (norm(text).match(/\d+(?:[.,]\d+)?/g) ?? []).every(
    (n) => src.includes(n) || src.includes(n.replace(",", ".")) || src.includes(n.replace(".", ",")),
  );
}

// Răspunsul modelului -> bloc valid sau nimic.
export function validateImpact(raw: unknown, source: string, allowedTools: string[]): Impact | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const tip = r.tip as ImpactType;
  const impact: Impact = {
    tip,
    cine: str(r.cine, 140),
    ce: str(r.ce, 260),
    cand: str(r.cand, 120) || undefined,
    pasi: (Array.isArray(r.pasi) ? r.pasi : []).map((p) => str(p, 160)).filter(Boolean).slice(0, 3),
    unelte: [...new Set((Array.isArray(r.unelte) ? r.unelte : []).filter((u): u is string => allowedTools.includes(u as string)))].slice(0, 2),
    verificat: new Date().toISOString(),
  };
  if (!(tip in IMPACT_TYPES) || !impact.cine || !impact.ce || !impact.pasi.length) return null;
  // alertele: data de expirare, dacă e plauzibilă (azi … +60 de zile)
  const pana = typeof r.pana === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.pana) ? r.pana : "";
  const today = new Date().toISOString().slice(0, 10);
  if ((tip === "alerta" || tip === "urgent") && pana >= today && pana <= new Date(Date.now() + 60 * 86400_000).toISOString().slice(0, 10)) impact.pana = pana;
  const all = [impact.cine, impact.ce, impact.cand ?? "", ...impact.pasi].join(" ");
  return numbersInSource(all, source) ? impact : null;
}

