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

// Arhiva veche are miniaturi gata făcute (384/828 px, scripts/migration/archive-thumbs.ts),
// iar capturile YouTube sunt deja mici: ambele se servesc direct, fără transformări
// Cloudflare Images (5.000 incluse pe lună; 3.350 consumate în 5 zile, 2026-10-18).
const ARCHIVE = "https://media.stiriactuale.info/arhiva/";
const archiveThumb = (src: string, w: number) =>
  `https://media.stiriactuale.info/mini/${w}/arhiva/${src.slice(ARCHIVE.length).replace(/\.[a-z0-9]+$/i, "")}.webp`;

export function ArticleThumb({
  topics,
  imageUrl,
  imageAlt,
  className,
  iconSize = 28,
  sizes = "(max-width: 640px) 100vw, 600px",
  priority = false,
  video = false,
}: {
  topics: Topic[];
  imageUrl?: string;
  imageAlt?: string;
  className?: string;
  iconSize?: number;
  sizes?: string;
  priority?: boolean; // poza principală a paginii: se încarcă imediat, nu leneș (LCP)
  video?: boolean; // articol cu video: semnul ▶ peste imagine
}) {
  const topic = topics[0];
  const color = topic ? TOPIC_COLORS[topic] : FALLBACK_COLOR;
  const Icon = topic ? TOPIC_ICONS[topic] : FALLBACK_ICON;

  if (imageUrl) {
    return (
      <div className={`relative overflow-hidden ${className ?? ""}`}>
        {imageUrl.startsWith(ARCHIVE) ? (
          // eslint-disable-next-line @next/next/no-img-element -- miniaturi gata făcute, fără optimizare
          <img
            src={archiveThumb(imageUrl, 828)}
            srcSet={`${archiveThumb(imageUrl, 384)} 384w, ${archiveThumb(imageUrl, 828)} 828w`}
            sizes={sizes}
            alt={imageAlt ?? ""}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <Image
            src={imageUrl}
            alt={imageAlt ?? ""}
            fill
            sizes={sizes}
            unoptimized={imageUrl.startsWith("https://i.ytimg.com/")}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            className="object-cover"
          />
        )}
        {video && (
          <span className="absolute inset-0 flex items-center justify-center" aria-label="Articol cu video">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-lg text-white">▶</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${BG_CLASSES[color]} ${className ?? ""}`}>
      <Icon size={iconSize} stroke={1.5} className={ICON_CLASSES[color]} />
    </div>
  );
}
