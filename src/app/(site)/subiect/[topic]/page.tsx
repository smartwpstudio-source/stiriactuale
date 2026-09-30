import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { ArticleRow } from "@/components/article-row";
import { getArticlesByTopic } from "@/lib/content/queries";
import { TOPIC_LABELS } from "@/lib/content/topic-meta";
import type { Topic } from "@/lib/content/types";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

// Pagină hub pe subiect — listează articole din toate secțiunile, cf.
// arhitectura-site-nou-taxonomie-pwa-seo.md secțiunea 3. Breadcrumb-ul reflectă
// "Subiect", NU secțiunea (subiectul e etichetă, nu ierarhie).
export const revalidate = 60;

// Cele 10 subiecte sunt un set fix, cunoscut la build — nu depinde de DB.
export function generateStaticParams() {
  return Object.keys(TOPIC_LABELS).map((topic) => ({ topic }));
}

function isKnownTopic(value: string): value is Topic {
  return value in TOPIC_LABELS;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}): Promise<Metadata> {
  const { topic } = await params;
  if (!isKnownTopic(topic)) return {};
  const label = TOPIC_LABELS[topic];
  return {
    title: `Subiect — ${label}`,
    description: `Toate articolele despre ${label.toLowerCase()}, din toate secțiunile.`,
    alternates: { canonical: `/subiect/${topic}/` },
  };
}

export default async function SubiectHubPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  if (!isKnownTopic(topic)) notFound();

  const articles = await getArticlesByTopic(topic);
  const label = TOPIC_LABELS[topic];

  const jsonLd = breadcrumbJsonLd([
    { name: "Acasă", url: absoluteUrl("/") },
    { name: "Subiect", url: absoluteUrl("/subiect/") },
    { name: label, url: absoluteUrl(`/subiect/${topic}/`) },
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Breadcrumb items={[{ label: "Acasă", href: "/" }, { label: "Subiect" }, { label }]} />
      <h1 className="mt-2 font-serif text-2xl text-ink">Subiect — {label}</h1>
      <div className="mt-6">
        {articles.length === 0 && (
          <p className="font-mono text-sm text-sub">Niciun articol publicat încă.</p>
        )}
        {articles.map((a) => (
          <ArticleRow key={a.slug} article={a} />
        ))}
      </div>
    </div>
  );
}
