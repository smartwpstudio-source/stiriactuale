import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { ShareButtons } from "@/components/share-buttons";
import { TelegramCta } from "@/components/telegram-cta";
import { sanitizeBody, splitAfterParagraph } from "@/lib/content/sanitize";
import { ADSENSE_IN_ARTICLE_SLOT } from "@/lib/adsense";
import { AdSlot } from "@/components/ad-slot";
import { GUIDE_CATEGORIES, getGuide, getGuides } from "@/lib/content/guides";
import { absoluteUrl } from "@/lib/seo";

// Ghidurile sunt statice: generate la build din content/ghiduri/*.json.
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getGuides()).map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps<"/ghiduri/[slug]">): Promise<Metadata> {
  const g = await getGuide((await params).slug);
  if (!g) return {};
  const url = `/ghiduri/${g.slug}/`;
  const image = `/og/?${new URLSearchParams({ t: g.title, s: "Ghid" })}`;
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: url },
    openGraph: { title: g.title, description: g.description, type: "article", url, images: [{ url: image, width: 1200, height: 630 }] },
  };
}

const DATE: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };

export default async function GuidePage({ params }: PageProps<"/ghiduri/[slug]">) {
  const g = await getGuide((await params).slug);
  if (!g) notFound();
  const url = absoluteUrl(`/ghiduri/${g.slug}/`);
  const updated = new Date(`${g.updated}T12:00:00Z`).toLocaleDateString("ro-MD", DATE);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: g.title,
      description: g.description,
      dateModified: g.updated,
      inLanguage: "ro",
      mainEntityOfPage: url,
      // sursele oficiale consultate — semnal de încredere pentru Google și asistenții AI
      citation: g.sources.map((s) => ({ "@type": "CreativeWork", name: s.name, url: s.url })),
      author: { "@type": "Organization", name: "Știri Actuale", url: absoluteUrl("/") },
      publisher: { "@type": "Organization", name: "Știri Actuale", logo: { "@type": "ImageObject", url: absoluteUrl("/icons/icon-512.png?v=2") } },
    },
    ...(g.faq?.length
      ? [
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: g.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          },
        ]
      : []),
  ];

  return (
    <article className="mx-auto w-full max-w-[760px] px-4 py-8">
      {jsonLd.map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d).replace(/</g, "\u003c") }} />
      ))}
      <Breadcrumb items={[{ label: "Acasă", href: "/" }, { label: "Ghiduri", href: "/ghiduri/" }, { label: GUIDE_CATEGORIES[g.category] }]} />
      <h1 className="mt-3 font-serif text-3xl leading-tight text-ink sm:text-4xl lg:text-[2.75rem]">{g.title}</h1>
      <p className="mt-4 font-mono text-sm text-sub">Ghid · actualizat la {updated}</p>
      <p className="mt-6 text-xl font-medium leading-relaxed text-ink">{g.description}</p>

      {(() => {
        // ghidurile sunt lungi și citite atent: un bloc după paragraful 3, unul la final
        const [head, tail] = ADSENSE_IN_ARTICLE_SLOT ? splitAfterParagraph(sanitizeBody(g.bodyHtml, g.title), 3) : [sanitizeBody(g.bodyHtml), ""];
        return (
          <>
            <div className="prose-article mt-4 text-ink" dangerouslySetInnerHTML={{ __html: head }} />
            {tail && <AdSlot slot={ADSENSE_IN_ARTICLE_SLOT} />}
            {tail && <div className="prose-article text-ink" dangerouslySetInnerHTML={{ __html: tail }} />}
            {ADSENSE_IN_ARTICLE_SLOT && <AdSlot slot={ADSENSE_IN_ARTICLE_SLOT} />}
          </>
        );
      })()}

      {g.faq && g.faq.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif text-2xl text-ink">Întrebări frecvente</h2>
          <div className="mt-3 divide-y divide-line rounded border border-line bg-white">
            {g.faq.map((f) => (
              <details key={f.q} className="group p-4">
                <summary className="cursor-pointer font-medium text-ink">{f.q}</summary>
                <p className="mt-2 text-ink/90">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <aside className="mt-8 rounded border border-line bg-white p-4 text-sm text-sub">
        <p>
          Informațiile sunt verificate la data actualizării, pe sursele oficiale de mai jos. Regulile, taxele și
          termenele se pot schimba — înainte de a merge la ghișeu, verifică pe site-ul instituției.
        </p>
        <p className="mt-2">
          Surse:{" "}
          {g.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && ", "}
              <a href={s.url} target="_blank" rel="noopener" className="underline hover:text-ink">
                {s.name}
              </a>
            </span>
          ))}
        </p>
      </aside>

      <ShareButtons url={url} title={g.title} />
      <TelegramCta />
    </article>
  );
}
