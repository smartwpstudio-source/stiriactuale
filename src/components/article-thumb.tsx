import {
  TOPIC_COLORS,
  TOPIC_ICONS,
  FALLBACK_ICON,
  FALLBACK_COLOR,
} from "@/lib/content/topic-meta";
import type { Topic } from "@/lib/content/types";

// Thumb cu tentă de culoare pe subiect (10-15% opacitate) + icon Tabler centrat —
// vezi sistem-design-ui.md secțiunea 5. Placeholder până există imagini reale
// (generate de pipeline-ul AI, pasul 7) — nu se descarcă niciodată imagini de pe
// site-ul sursă, per decizia din plan-implementare-agregator-stiri-ai.md secțiunea 3.6.

const BG_CLASSES = {
  alert: "bg-alert/[0.12]",
  amber: "bg-amber/[0.12]",
  teal: "bg-teal/[0.12]",
} as const;

const ICON_CLASSES = {
  alert: "text-alert",
  amber: "text-amber",
  teal: "text-teal",
} as const;

export function ArticleThumb({
  topics,
  className,
  iconSize = 28,
}: {
  topics: Topic[];
  className?: string;
  iconSize?: number;
}) {
  const topic = topics[0];
  const color = topic ? TOPIC_COLORS[topic] : FALLBACK_COLOR;
  const Icon = topic ? TOPIC_ICONS[topic] : FALLBACK_ICON;

  return (
    <div className={`flex items-center justify-center ${BG_CLASSES[color]} ${className ?? ""}`}>
      <Icon size={iconSize} stroke={1.5} className={ICON_CLASSES[color]} />
    </div>
  );
}
