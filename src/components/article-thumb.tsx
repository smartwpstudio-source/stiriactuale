import Image from "next/image";
import {
  TOPIC_COLORS,
  TOPIC_ICONS,
  FALLBACK_ICON,
  FALLBACK_COLOR,
} from "@/lib/content/topic-meta";
import type { Topic } from "@/lib/content/types";

// Thumb cu tentă de culoare pe subiect (10-15% opacitate) + icon Tabler centrat —
// vezi sistem-design-ui.md secțiunea 5. Când articolul are o imagine (stock
// Magnific, generată sau arhiva proprie din Blob), aceasta înlocuiește
// placeholder-ul — nu se descarcă niciodată imagini de pe site-urile sursă.

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
  imageUrl,
  imageAlt,
  className,
  iconSize = 28,
  sizes = "(max-width: 640px) 100vw, 600px",
  priority = false,
}: {
  topics: Topic[];
  imageUrl?: string;
  imageAlt?: string;
  className?: string;
  iconSize?: number;
  sizes?: string;
  priority?: boolean; // poza principală a paginii: se încarcă imediat, nu leneș (LCP)
}) {
  const topic = topics[0];
  const color = topic ? TOPIC_COLORS[topic] : FALLBACK_COLOR;
  const Icon = topic ? TOPIC_ICONS[topic] : FALLBACK_ICON;

  if (imageUrl) {
    return (
      <div className={`relative overflow-hidden ${className ?? ""}`}>
        <Image
          src={imageUrl}
          alt={imageAlt ?? ""}
          fill
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${BG_CLASSES[color]} ${className ?? ""}`}>
      <Icon size={iconSize} stroke={1.5} className={ICON_CLASSES[color]} />
    </div>
  );
}
