import { IconBrandFacebook, IconBrandX } from "@tabler/icons-react";

// Iconițe monocrome (sub / hover amber) — niciodată culorile oficiale de
// brand Facebook/X, cf. sistem-design-ui.md secțiunea 5 ("Bloc de share +
// Telegram") și regula de restrângere din secțiunea 6.
export function ShareButtons({ url, title }: { url: string; title: string }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    {
      label: "Distribuie pe Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      Icon: IconBrandFacebook,
    },
    {
      label: "Distribuie pe X",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      Icon: IconBrandX,
    },
  ];

  return (
    <div className="mt-6 flex items-center gap-4">
      <span className="font-mono text-[11px] uppercase tracking-wide text-sub">Distribuie</span>
      <div className="flex items-center gap-3">
        {links.map(({ label, href, Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="text-sub hover:text-amber"
          >
            <Icon size={18} stroke={1.75} />
          </a>
        ))}
      </div>
    </div>
  );
}
