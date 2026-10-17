import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { ShareButtons } from "@/components/share-buttons";
import { TelegramCta } from "@/components/telegram-cta";
import { sanitizeBody } from "@/lib/content/sanitize";
import { AdBody } from "@/components/ad-body";
import { ADSENSE_IN_ARTICLE_SLOT } from "@/lib/adsense";
import { AdSlot } from "@/components/ad-slot";
import { GUIDE_CATEGORIES, getGuide } from "@/lib/content/guides";
import { absoluteUrl } from "@/lib/seo";
import Link from "next/link";
import { modelForGuide } from "@/lib/complaint-models";
import { ToolNews } from "@/components/tool-news";
import { RelatedCalculator } from "@/components/related-calculator";
import { getGuideCalculators } from "@/lib/content/related-calculator";
import { ruPath, ruSlugs } from "@/lib/content/guides-ru";

// Ghidurile nu se mai construiesc la build (sute de pagini = minute de build
// plătite la fiecare push): se generează la prima vizită și rămân în cache.
// Slug necunoscut -> notFound() mai jos.
// „Ultimele știri care schimbă asta” se schimbă odată cu știrile
export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/ghiduri/[slug]">): Promise<Metadata> {
  const g = await getGuide((await params).slug);
  if (!g) return {};
  const url = `/ghiduri/${g.slug}/`;
  const image = `/og/?${new URLSearchParams({ t: g.title, s: "Ghid" })}`;
  const ru = (await ruSlugs()).has(g.slug);
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: url, ...(ru && { languages: { ro: url, ru: ruPath(g.slug) } }) },
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
      <p className="mt-4 font-mono text-sm text-sub">
        Ghid · actualizat la {updated}
        {(await ruSlugs()).has(g.slug) && (
          <>
            {" · "}
            <Link prefetch={false} href={ruPath(g.slug)} lang="ru" className="text-teal underline">
              Читать на русском
            </Link>
          </>
        )}
      </p>
      <ShareButtons url={url} title={g.title} />
      <p className="mt-6 text-xl font-medium leading-relaxed text-ink">{g.description}</p>
      {(await getGuideCalculators(g.slug, g.title, g.description)).map((c) => (
        <RelatedCalculator key={c.slug} calc={c} />
      ))}
      {(() => {
        const model = modelForGuide(g.slug);
        return (
          model && (
            <Link prefetch={false}
              href={`/modele-reclamatii/${model.slug}/`}
              className="mt-5 block rounded-lg border-2 border-teal/50 bg-white p-4 hover:border-teal"
            >
              <span className="block font-mono text-xs uppercase tracking-wide text-teal">Model gata de completat</span>
              <span className="mt-1 block font-medium text-ink">Completează modelul de reclamație și descarcă-l în Word sau PDF →</span>
            </Link>
          )
        );
      })()}
      <ToolNews tool={`ghid:${g.slug}`} />

      {(() => {
        // blocuri de-a lungul ghidului (AdBody) și unul la final
        return (
          <>
            <AdBody html={sanitizeBody(g.bodyHtml, g.title)} />
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

      <TelegramCta />
    </article>
  );
}
