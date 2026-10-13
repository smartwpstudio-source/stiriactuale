import { COUNTRY_NAMES, RAION_NAMES, SECTION_LABELS, countryLabel, raionLabel } from "./geo";
import { TOPIC_LABELS } from "./topic-meta";
import type { ArticleFilter } from "./queries";
import type { Section, Topic } from "./types";

// O pagină de listă (secțiune, raion, țară, subiect) descrisă ca date — un
// singur component (HubPage) le randează pe toate, cu paginare /pagina/N/.
export interface Hub {
  title: string;
  description: string;
  basePath: string; // cu "/" final
  crumbs: { label: string; href?: string }[];
  filter: ArticleFilter;
  chips?: { kind: "raion" | "tara"; basePath: string; active?: string };
  place?: { kind: "raioane" | "tari"; slug: string; name: string }; // contacte utile (content/locuri/)
  pillars?: "lumea"; // dosarele-pilon (content/ghiduri, categoria dată), afișate sus ca carduri
}

const home = { label: "Acasă", href: "/" };

export function sectionHub(section: Section): Hub {
  const label = SECTION_LABELS[section];
  const descriptions: Record<Section, string> = {
    regiuni: "Ultimele știri din regiunile și raioanele Republicii Moldova.",
    national: "Ultimele știri naționale din Republica Moldova.",
    international: "Politica mondială, conflictele și marile crize — explicate pentru Moldova: ce înseamnă pentru noi.",
    diaspora: "Știri pentru moldovenii din diaspora.",
  };
  return {
    title: label,
    description: descriptions[section],
    basePath: `/${section}/`,
    crumbs: [home, { label }],
    filter: { section },
    pillars: section === "international" ? "lumea" : undefined,
    chips:
      section === "regiuni"
        ? { kind: "raion", basePath: "/regiuni" }
        : section === "diaspora"
          ? { kind: "tara", basePath: "/diaspora" }
          : undefined,
  };
}

export function raionHub(raion: string): Hub | null {
  if (!(raion in RAION_NAMES)) return null;
  const label = raionLabel(raion);
  return {
    title: `Regiuni — ${label}`,
    description: `Ultimele știri din raionul ${label}.`,
    basePath: `/regiuni/${raion}/`,
    crumbs: [home, { label: "Regiuni", href: "/regiuni/" }, { label }],
    filter: { section: "regiuni", locality: raion },
    chips: { kind: "raion", basePath: "/regiuni", active: raion },
    place: { kind: "raioane", slug: raion, name: label },
  };
}

export function taraHub(tara: string): Hub | null {
  if (!(tara in COUNTRY_NAMES)) return null;
  const label = countryLabel(tara);
  return {
    title: `Diaspora — ${label}`,
    description: `Știri pentru moldovenii din ${label}.`,
    basePath: `/diaspora/${tara}/`,
    crumbs: [home, { label: "Diaspora", href: "/diaspora/" }, { label }],
    filter: { section: "diaspora", country: tara },
    chips: { kind: "tara", basePath: "/diaspora", active: tara },
    place: { kind: "tari", slug: tara, name: label },
  };
}

export function topicHub(topic: string): Hub | null {
  if (!(topic in TOPIC_LABELS)) return null;
  const label = TOPIC_LABELS[topic as Topic];
  return {
    title: `Subiect — ${label}`,
    description: `Toate articolele despre ${label.toLowerCase()}, din toate secțiunile.`,
    basePath: `/subiect/${topic}/`,
    crumbs: [home, { label: "Subiect" }, { label }],
    filter: { topic: topic as Topic },
  };
}

// Rubrica Video: știrile al căror subiect principal e video-ul (YouTube,
// Facebook, postări Telegram), din toate secțiunile.
export function videoHub(): Hub {
  return {
    title: "Video",
    description: "Știri video din Moldova: imaginile momentului, de la sursă — YouTube, Facebook și Telegram.",
    basePath: "/video/",
    crumbs: [home, { label: "Video" }],
    filter: { video: true },
  };
}

// Rubrica Util (2026-10-14): articolele proprii, practice — evenimentele săptămânii,
// anotimpul, calculatoarele și ghidurile în context (src/lib/pipeline/util.ts).
export function utilHub(): Hub {
  return {
    title: "Util",
    description: "Ce faci concret: ghiduri scurte pentru săptămâna aceasta în Moldova — sărbători, termene, anotimp, calculatoare și sfaturi practice.",
    basePath: "/util/",
    crumbs: [home, { label: "Util" }],
    filter: { kind: "util" },
  };
}

// /pagina/1/ nu există (pagina 1 e basePath) — orice altceva decât 2..N -> 404.
export function parsePage(n: string): number | null {
  const page = Number(n);
  return Number.isInteger(page) && page >= 2 && String(page) === n ? page : null;
}

export function pagePath(hub: Hub, page: number): string {
  return page === 1 ? hub.basePath : `${hub.basePath}pagina/${page}/`;
}
