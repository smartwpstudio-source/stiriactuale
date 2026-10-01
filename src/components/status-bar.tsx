import { getLatestArticle } from "@/lib/content/queries";
import { formatTimeAgo } from "@/lib/format-time-ago";

// Semnătura vizuală a site-ului: arată DOAR rezultatul pipeline-ului
// ("ultima știre publicată: acum X min"), niciodată mecanica internă
// (nu "următoarea sincronizare", nu "N surse monitorizate") — vezi
// sistem-design-ui.md secțiunea 1. Dacă nu există încă niciun articol
// publicat, banda nu se afișează deloc — nu se inventează un rezultat fals.
export async function StatusBar() {
  const latest = await getLatestArticle();
  if (!latest) return null;

  return (
    <div className="bg-ink2 text-paper">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-1.5 lg:px-8 font-mono text-xs">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber" />
        <span>ultima știre publicată: {formatTimeAgo(latest.publishedAt)}</span>
      </div>
    </div>
  );
}
