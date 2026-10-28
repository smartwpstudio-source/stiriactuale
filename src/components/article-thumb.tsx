import Image from "next/image";
import {
  TOPIC_COLORS,
  TOPIC_ICONS,
  FALLBACK_ICON,
  FALLBACK_COLOR,
} from "@/lib/content/topic-meta";
import type { Topic } from "@/lib/content/types";
import { miniUrl } from "@/lib/media-url";

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

// Toate pozele din R2 au miniaturi gata făcute (384/828 px: putMedia din lib/media.ts,
// cele vechi prin scripts/migration/archive-thumbs.ts), iar capturile YouTube sunt deja
// mici: se servesc direct, fără transformări Cloudflare Images (5.000 incluse pe lună).

export function ArticleThumb({
  topics,
  imageUrl,
  imageAlt,
  className,
  iconSize = 28,
  sizes = "(max-width: 640px) 100vw, 600px",
  priority = false,
  video = false,
  contain = false,
}: {
  topics: Topic[];
  imageUrl?: string;
  imageAlt?: string;
  className?: string;
  iconSize?: number;
  sizes?: string;
  priority?: boolean; // poza principală a paginii: se încarcă imediat, nu leneș (LCP)
  video?: boolean; // articol cu video: semnul ▶ peste imagine
  contain?: boolean; // cardul (steaguri, sigle, simboluri) întreg, pe fundal din el estompat — nu tăiat
}) {
  const topic = topics[0];
  const color = topic ? TOPIC_COLORS[topic] : FALLBACK_COLOR;
  const Icon = topic ? TOPIC_ICONS[topic] : FALLBACK_ICON;

  if (imageUrl) {
    const mini = miniUrl(imageUrl, 828);
    const fit = contain ? "object-contain" : "object-cover";
    return (
      <div className={`relative overflow-hidden ${className ?? ""}`}>
        {mini ? (
          <>
            {contain && (
              // eslint-disable-next-line @next/next/no-img-element -- miniaturi gata făcute, fără optimizare
              <img src={miniUrl(imageUrl, 384)!} alt="" aria-hidden decoding="async" className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl" />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element -- miniaturi gata făcute, fără optimizare */}
            <img
              src={mini}
              srcSet={`${miniUrl(imageUrl, 384)} 384w, ${mini} 828w`}
              sizes={sizes}
              alt={imageAlt ?? ""}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : undefined}
              decoding="async"
              className={`absolute inset-0 h-full w-full ${fit}`}
            />
          </>
        ) : (
          <>
            {contain && (
              <Image src={imageUrl} alt="" aria-hidden fill sizes={sizes} className="scale-110 object-cover blur-2xl" />
            )}
            <Image
              src={imageUrl}
              alt={imageAlt ?? ""}
              fill
              sizes={sizes}
              unoptimized={imageUrl.startsWith("https://i.ytimg.com/")}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : undefined}
              className={fit}
            />
          </>
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
