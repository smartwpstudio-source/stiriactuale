import { getLatestArticle } from "@/lib/content/queries";
import { TimeAgo } from "./time-ago";

// Semnătura vizuală a site-ului: arată DOAR rezultatul pipeline-ului
// ("ultima știre publicată: acum X min"), niciodată mecanica internă
// (nu "următoarea sincronizare", nu "N surse monitorizate") — vezi
// sistem-design-ui.md secțiunea 1. Dacă nu există încă niciun articol
// publicat, banda nu se afișează deloc — nu se inventează un rezultat fals.
export async function StatusBar() {
  const latest = await getLatestArticle();
  if (!latest) return null;

  // Un singur element, fără blocuri înăuntru (2026-11-21): anunțurile automate AdSense intrau
  // ÎN bandă, înaintea textului (390 px pe telefon, CLS 0,438 în Search Console), un loc
  // pe care zonele excluse din AdSense nu-l acoperă. În <p> nu mai au unde intra.
  // Lățimea ca a paginii (max-w-7xl = 80rem, px-4 / lg:px-8) vine din padding.
  return (
    <p className="bg-ink2 py-1.5 px-[max(1rem,calc((100%_-_80rem)/2_+_1rem))] font-mono text-xs text-paper lg:px-[max(2rem,calc((100%_-_80rem)/2_+_2rem))]">
      <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-amber align-middle" />
      ultima știre publicată: <TimeAgo iso={latest.publishedAt} />
    </p>
  );
}
