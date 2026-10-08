import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ShareButtons } from "@/components/share-buttons";
import { sanitizeBody, splitAfterParagraph } from "@/lib/content/sanitize";
import { ADSENSE_IN_ARTICLE_SLOT } from "@/lib/adsense";
import { AdSlot } from "@/components/ad-slot";
import { getGuideRu, localizeLinks, ruPath, ruSlugs } from "@/lib/content/guides-ru";
import { absoluteUrl } from "@/lib/seo";

// Ghidurile în rusă: fără generateStaticParams — nu se construiesc la fiecare
// push (minute de build plătite pe Vercel). Pagina se generează la prima
// vizită și rămâne în cache o zi; un deploy nou o regenerează.
export const revalidate = 86400;

// listă goală = nimic la build, dar pagina e statică (ISR): după prima
// generare se servește din cache, nu se mai randează la fiecare cerere
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/ru/ghiduri/[slug]">): Promise<Metadata> {
  const g = await getGuideRu((await params).slug);
  if (!g) return {};
  const url = ruPath(g.slug);
  const image = `/og/?${new URLSearchParams({ t: g.title, s: "Справочник" })}`;
  return {
    title: g.title,
    description: g.description,
    // legătura dintre limbi pentru Google (hreflang); pagina românească, dacă există
    alternates: { canonical: url, languages: g.ruOnly ? { ru: url } : { ro: `/ghiduri/${g.slug}/`, ru: url } },
    openGraph: { title: g.title, description: g.description, type: "article", url, locale: "ru_MD", images: [{ url: image, width: 1200, height: 630 }] },
  };
}

const DATE: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };

export default async function RuGuidePage({ params }: PageProps<"/ru/ghiduri/[slug]">) {
  const g = await getGuideRu((await params).slug);
  if (!g) notFound();
  const url = absoluteUrl(ruPath(g.slug));
  const updated = new Date(`${g.updated}T12:00:00Z`).toLocaleDateString("ru-RU", DATE);
  const body = localizeLinks(sanitizeBody(g.bodyHtml, g.title), await ruSlugs());
  const [head, tail] = ADSENSE_IN_ARTICLE_SLOT ? splitAfterParagraph(body, 3) : [body, ""];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: g.title,
      description: g.description,
      dateModified: g.updated,
      inLanguage: "ru",
      mainEntityOfPage: url,
      citation: g.sources.map((s) => ({ "@type": "CreativeWork", name: s.name, url: s.url })),
      author: { "@type": "Organization", name: "Știri Actuale", url: absoluteUrl("/") },
      publisher: { "@type": "Organization", name: "Știri Actuale", logo: { "@type": "ImageObject", url: absoluteUrl("/icons/icon-512.png?v=2") } },
    },
    ...(g.faq?.length
      ? [{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: g.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }]
      : []),
  ];

  return (
    <article lang="ru" className="mx-auto w-full max-w-[760px] px-4 py-8">
      {jsonLd.map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d).replace(/</g, "\\u003c") }} />
      ))}
      <nav className="font-mono text-xs uppercase tracking-wide text-sub">
        <Link href="/" className="hover:text-ink">Știri Actuale</Link> › Справочник
      </nav>
      <h1 className="mt-3 font-serif text-3xl leading-tight text-ink sm:text-4xl lg:text-[2.75rem]">{g.title}</h1>
      <p className="mt-4 font-mono text-sm text-sub">
        Справочник · обновлено {updated}
        {!g.ruOnly && (
          <>
            {" · "}
            <Link href={`/ghiduri/${g.slug}/`} lang="ro" className="text-teal underline">
              Citește în română
            </Link>
          </>
        )}
      </p>
      <ShareButtons url={url} title={g.title} />
      <p className="mt-6 text-xl font-medium leading-relaxed text-ink">{g.description}</p>

      <div className="prose-article mt-4 text-ink" dangerouslySetInnerHTML={{ __html: head }} />
      {tail && <AdSlot slot={ADSENSE_IN_ARTICLE_SLOT} />}
      {tail && <div className="prose-article text-ink" dangerouslySetInnerHTML={{ __html: tail }} />}

      {g.faq && g.faq.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif text-2xl text-ink">Частые вопросы</h2>
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
          Информация проверена на дату обновления по официальным источникам ниже. Правила, сборы и сроки могут меняться —
          перед визитом уточните на сайте учреждения.
        </p>
        <p className="mt-2">
          Источники:{" "}
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
    </article>
  );
}
