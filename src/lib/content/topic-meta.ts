import {
  IconCar,
  IconGavel,
  IconScale,
  IconPhoneCall,
  IconCoin,
  IconBolt,
  IconHeartbeat,
  IconUsers,
  IconPalette,
  IconBallFootball,
  IconNews,
  type Icon,
} from "@tabler/icons-react";
import type { Topic } from "./types";

export const TOPIC_LABELS: Record<Topic, string> = {
  accidente: "Accidente",
  criminal: "Criminal",
  coruptie: "Corupție",
  "alerta-112": "Alertă 112",
  economic: "Economic",
  "criza-energetica": "Criză energetică",
  sanatate: "Sănătate",
  social: "Social",
  cultura: "Cultură",
  sport: "Sport",
};

// roșu = accidente/criminal/alertă 112/corupție (strict rezervat, niciodată decorativ)
// amber = economic/criză energetică/sănătate
// teal = social/cultură/sport/diaspora generic — vezi sistem-design-ui.md secțiunea 2 și 5
export type TopicColor = "alert" | "amber" | "teal";

export const TOPIC_COLORS: Record<Topic, TopicColor> = {
  accidente: "alert",
  criminal: "alert",
  coruptie: "alert",
  "alerta-112": "alert",
  economic: "amber",
  "criza-energetica": "amber",
  sanatate: "amber",
  social: "teal",
  cultura: "teal",
  sport: "teal",
};

export const TOPIC_ICONS: Record<Topic, Icon> = {
  accidente: IconCar,
  criminal: IconGavel,
  coruptie: IconScale,
  "alerta-112": IconPhoneCall,
  economic: IconCoin,
  "criza-energetica": IconBolt,
  sanatate: IconHeartbeat,
  social: IconUsers,
  cultura: IconPalette,
  sport: IconBallFootball,
};

// Fallback pentru articole fără niciun subiect din cele 10 canonice
// (ex. național/internațional generic) — teal neutru, icon generic de știre.
export const FALLBACK_ICON: Icon = IconNews;
export const FALLBACK_COLOR: TopicColor = "teal";
