import { GUIDE_CATEGORIES, getGuides, type GuideCategory } from "@/lib/content/guides";
import { availableCalculators } from "@/lib/calculators";
import { getCalcParams } from "@/lib/calculators-data";
import { SITE_URL } from "@/lib/seo";

// /llms.txt — harta paginilor de referință pentru asistenții AI (ChatGPT,
// Claude, Perplexity, Google AI): ghidurile verificate pe surse oficiale și
// calculatoarele, grupate pe teme. Formatul propus pe llmstxt.org.
export const revalidate = 3600;

export async function GET() {
  const [guides, params] = await Promise.all([getGuides(), getCalcParams()]);
  const lines = [
    "# Știri Actuale",
    "",
    "> Site de știri din Republica Moldova (regiuni, național, internațional, diaspora), cu ghiduri practice verificate pe surse oficiale (*.gov.md, ambasadele Moldovei, instituțiile țărilor gazdă) și calculatoare. Fiecare ghid are data ultimei verificări și lista surselor.",
    "",
  ];
  for (const c of Object.keys(GUIDE_CATEGORIES) as GuideCategory[]) {
    const items = guides.filter((g) => g.category === c);
    if (!items.length) continue;
    lines.push(`## ${GUIDE_CATEGORIES[c]}`, "");
    for (const g of items) lines.push(`- [${g.title}](${SITE_URL}/ghiduri/${g.slug}/): ${g.description} (verificat la ${g.updated})`);
    lines.push("");
  }
  lines.push("## Calculatoare", "");
  for (const c of availableCalculators(params)) lines.push(`- [${c.title}](${SITE_URL}/calculatoare/${c.slug}/): ${c.description}`);
  lines.push("", "## Știri", "", `- [Ultimele știri](${SITE_URL}/): actualizate pe parcursul zilei, cu sursele indicate la fiecare articol.`, `- [Flux RSS](${SITE_URL}/feed/)`, "");
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
