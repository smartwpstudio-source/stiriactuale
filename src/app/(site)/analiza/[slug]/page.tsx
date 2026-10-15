import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/breadcrumb";
import { ShareButtons } from "@/components/share-buttons";
import { TelegramCta } from "@/components/telegram-cta";
import { AuthorBadge } from "@/components/author-badge";
import { sanitizeBody } from "@/lib/content/sanitize";
import { AUTHORS, analysisPath, authorPath, getAnalyses, getAnalysis } from "@/lib/content/analyses";
import { resolveTools } from "@/lib/impact";
import { absoluteUrl } from "@/lib/seo";


export async function generateStaticParams() {
  return (await getAnalyses()).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/analiza/[slug]">): Promise<Metadata> {
  const a = await getAnalysis((await params).slug);
  if (!a) return {};
  const author = AUTHORS[a.author]?.name ?? "";
  const image = `/og/?${new URLSearchParams({ t: a.title, s: `Analiză · ${author}` })}`;
  return {
    title: `${a.title} — analiză de ${author}`,
    description: a.thesis,
    alternates: { canonical: analysisPath(a) },
    authors: [{ name: author, url: authorPath(a.author) }],
    openGraph: { title: a.title, description: a.thesis, type: "article", url: analysisPath(a), images: [{ url: image, width: 1200, height: 630 }] },
  };
}

const h2 = "mt-10 font-serif text-2xl text-ink";
const fmt = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("ro-MD", { day: "numeric", month: "long", year: "numeric" });

export default async function AnalysisPage({ params }: PageProps<"/analiza/[slug]">) {
  const a = await getAnalysis((await params).slug);
  if (!a) notFound();
  const author = AUTHORS[a.author];
  const tools = await resolveTools(a.tools ?? []);
  const url = absoluteUrl(analysisPath(a));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "OpinionNewsArticle",
    headline: a.title,
    description: a.thesis,
    datePublished: a.published,
    dateModified: a.updated ?? a.published,
    inLanguage: "ro",
    mainEntityOfPage: url,
    author: { "@type": "Person", name: author?.name, url: absoluteUrl(authorPath(a.author)) },
    publisher: { "@type": "Organization", name: "Știri Actuale", logo: { "@type": "ImageObject", url: absoluteUrl("/icons/icon-512.png?v=2") } },
    citation: a.sources.map((s) => ({ "@type": "CreativeWork", name: s.name, url: s.url })),
  };
  const link = (s: { name: string; url: string }) => (
    <a href={s.url} target={s.url.startsWith("/") ? undefined : "_blank"} rel="noopener" className="underline hover:text-teal">
      {s.name}
    </a>
  );

  return (
    <article className="mx-auto w-full max-w-[760px] px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Breadcrumb items={[{ label: "Acasă", href: "/" }, { label: "Analiză", href: "/analiza/" }, { label: a.title }]} />
      <span className="mt-3 inline-block rounded bg-ink px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-wide text-white">
        Analiză · opinia autorului
      </span>
      <h1 className="mt-2 font-serif text-3xl leading-tight text-ink sm:text-4xl lg:text-[2.75rem]">{a.title}</h1>
      <p className="mt-4 border-l-4 border-amber pl-4 text-xl italic leading-relaxed text-ink">{a.thesis}</p>
      <div className="mt-5">
        <AuthorBadge slug={a.author} date={a.published} />
        {a.updated && <p className="mt-1 font-mono text-xs text-sub">actualizat la {fmt(a.updated)}</p>}
      </div>
      <ShareButtons url={url} title={a.title} />

      {a.trigger.length > 0 && (
        <p className="mt-6 text-sm text-sub">
          Pornește de la: {a.trigger.map((t, i) => (
            <span key={t.url}>
              {i > 0 && " · "}
              {link(t)}
            </span>
          ))}
        </p>
      )}

      <section className="mt-6 rounded-lg border border-line bg-white p-5">
        <h2 className="font-mono text-xs uppercase tracking-wide text-teal">Ce știm — faptele, cu sursa</h2>
        <ul className="mt-3 space-y-2 text-ink">
          {a.facts.map((f) => (
            <li key={f.text} className="flex gap-2">
              <span className="text-teal">•</span>
              <span>
                {f.text} <span className="text-sm text-sub">({link(f.source)})</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="prose-article mt-6 text-ink" dangerouslySetInnerHTML={{ __html: sanitizeBody(a.bodyHtml) }} />

      <h2 className={h2}>Ce spun cei care nu sunt de acord</h2>
      <div className="prose-article mt-2 rounded-lg bg-white p-5 text-ink" dangerouslySetInnerHTML={{ __html: sanitizeBody(a.counterHtml) }} />

      <h2 className={h2}>Întrebări fără răspuns</h2>
      <ol className="mt-3 list-decimal space-y-3 pl-6 text-ink">
        {a.questions.map((q) => (
          <li key={q.q}>
            {q.q} <span className="block font-mono text-xs uppercase tracking-wide text-amber-ink">pentru: {q.to}</span>
          </li>
        ))}
      </ol>

      {a.next && a.next.length > 0 && (
        <>
          <h2 className={h2}>Ce urmărim mai departe</h2>
          <ul className="mt-3 list-disc space-y-1 pl-6 text-ink">
            {a.next.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </>
      )}

      {tools.length > 0 && (
        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {tools.map((t) => (
            <Link key={t.id} href={t.href} className="rounded bg-teal px-3 py-2 text-sm font-medium text-white hover:bg-teal/90">
              {t.title} →
            </Link>
          ))}
        </div>
      )}

      <aside className="mt-10 rounded border border-line bg-white p-4 text-sm text-sub">
        <p>
          <strong className="text-ink">Surse:</strong>{" "}
          {a.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && ", "}
              {link(s)}
            </span>
          ))}
        </p>
        {a.references && a.references.length > 0 && (
          <p className="mt-2">
            <strong className="text-ink">Materiale de referință:</strong>{" "}
            {a.references.map((s, i) => (
              <span key={s.url}>
                {i > 0 && ", "}
                {link(s)}
              </span>
            ))}
          </p>
        )}
        {a.corrections && a.corrections.length > 0 && (
          <div className="mt-3 border-t border-line pt-3">
            {a.corrections.map((c) => (
              <p key={c.date + c.text}>
                <strong className="text-alert">Corectare, {fmt(c.date)}:</strong> {c.text}
              </p>
            ))}
          </div>
        )}
        <p className="mt-3">{author?.disclosure}</p>
      </aside>

      <TelegramCta />
    </article>
  );
}
