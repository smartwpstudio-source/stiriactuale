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
}

const home = { label: "Acasă", href: "/" };

export function sectionHub(section: Section): Hub {
  const label = SECTION_LABELS[section];
  const descriptions: Record<Section, string> = {
    regiuni: "Ultimele știri din regiunile și raioanele Republicii Moldova.",
    national: "Ultimele știri naționale din Republica Moldova.",
    international: "Știri internaționale cu impact pentru Republica Moldova.",
    diaspora: "Știri pentru moldovenii din diaspora.",
  };
  return {
    title: label,
    description: descriptions[section],
    basePath: `/${section}/`,
    crumbs: [home, { label }],
    filter: { section },
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

// /pagina/1/ nu există (pagina 1 e basePath) — orice altceva decât 2..N -> 404.
export function parsePage(n: string): number | null {
  const page = Number(n);
  return Number.isInteger(page) && page >= 2 && String(page) === n ? page : null;
}

export function pagePath(hub: Hub, page: number): string {
  return page === 1 ? hub.basePath : `${hub.basePath}pagina/${page}/`;
}
