import { getLatestArticle } from "@/lib/content/queries";
import { formatTimeAgo } from "@/lib/format-time-ago";

// Semnătura vizuală a site-ului: arată DOAR rezultatul pipeline-ului
// ("ultima știre publicată: acum X min"), niciodată mecanica internă
// (nu "următoarea sincronizare", nu "N surse monitorizate") — vezi
// sistem-design-ui.md secțiunea 1.
export function StatusBar() {
  const latest = getLatestArticle();

  return (
    <div className="bg-ink2 text-paper">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-1.5 font-mono text-[10.5px]">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber" />
        <span>ultima știre publicată: {formatTimeAgo(latest.publishedAt)}</span>
      </div>
    </div>
  );
}
