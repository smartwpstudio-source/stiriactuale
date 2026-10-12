import { readAllContent } from "./store";

// Analizele semnate (concept 2026-10-07): opinia autorului, cu faptele
// verificate și sursele lor. Fișiere în content/analize/<slug>.json, scrise de
// redactor (Claude) după fișa autorului și publicate DOAR după aprobarea lui —
// fluxul e în docs/analiza.md. Citite la build, ca ghidurile.
export interface Source {
  name: string;
  url: string;
}

export interface Analysis {
  slug: string;
  title: string;
  thesis: string; // teza în 1-2 fraze: sub titlu, în Google și în distribuire
  author: string; // cheia din AUTHORS
  published: string; // AAAA-LL-ZZ
  updated?: string;
  trigger: Source[]; // știrea / știrile de la care pornește (linkuri interne „/national/…” sau externe)
  facts: { text: string; source: Source }[]; // „Ce știm”: 3-7 fapte, fiecare cu sursa
  bodyHtml: string; // analiza propriu-zisă
  counterHtml: string; // „Ce spun cei care nu sunt de acord” + răspunsul autorului
  questions: { q: string; to: string }[]; // „Întrebări fără răspuns” și cui le sunt adresate
  next?: string[]; // „Ce urmărim mai departe”
  sources: Source[];
  references?: Source[]; // materialele autorului: video, transcript, documente
  tools?: string[]; // ghiduri / calculatoare legate (id-uri ca în blocul de impact)
  corrections?: { date: string; text: string }[];
}

export const AUTHORS: Record<string, { name: string; role: string; bio: string; disclosure: string; photo?: string }> = {
  "radu-druta": {
    name: "Radu Druță",
    role: "Fondator, redactor și autor",
    photo: "/autori/radu-druta.jpg",
    bio: "Fondator, redactor și autor al ziarului Drochia Reporter și al portalului Știri Actuale Info. Are o experiență de 10 ani în jurnalism.",
    disclosure:
      "Declarație de interese: membru al Partidului Schimbării, fără funcții în partid. Analizele exprimă opinia personală a autorului; faptele din ele sunt verificate și au sursă, iar critica se aplică tuturor, indiferent de tabără.",
  },
};

export async function getAnalyses(): Promise<Analysis[]> {
  const all = await readAllContent<Analysis>("analize");
  return all.sort((a, b) => b.published.localeCompare(a.published));
}

export async function getAnalysis(slug: string) {
  return (await getAnalyses()).find((a) => a.slug === slug);
}

// Analizele care pornesc de la o știre (linkul ei intern în `trigger`)
export async function analysesForArticle(path: string) {
  return (await getAnalyses()).filter((a) => a.trigger.some((t) => t.url === path || t.url.endsWith(path)));
}

export const analysisPath = (a: { slug: string }) => `/analiza/${a.slug}/`;
export const authorPath = (slug: string) => `/autor/${slug}/`;

// Ultima analiză, pentru prima pagină: doar dacă e mai nouă de `days` zile
// (analizele nu au ritm fix — una veche nu stă la nesfârșit sus).
export async function recentAnalysis(days = 30) {
  const [last] = await getAnalyses();
  return last && Date.now() - Date.parse(`${last.published}T12:00:00Z`) < days * 86400_000 ? last : null;
}
