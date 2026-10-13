import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { AnalysisCard } from "@/components/analysis-card";
import { AuthorBadge } from "@/components/author-badge";
import { AUTHORS, authorPath, getAnalyses } from "@/lib/content/analyses";
import { absoluteUrl } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(AUTHORS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/autor/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const a = AUTHORS[slug];
  return a ? { title: `${a.name} — analize și opinii`, description: a.bio, alternates: { canonical: authorPath(slug) } } : {};
}

export default async function AuthorPage({ params }: PageProps<"/autor/[slug]">) {
  const { slug } = await params;
  const a = AUTHORS[slug];
  if (!a) notFound();
  const list = (await getAnalyses()).filter((x) => x.author === slug);
  const jsonLd = { "@context": "https://schema.org", "@type": "Person", name: a.name, jobTitle: a.role, description: a.bio, url: absoluteUrl(authorPath(slug)) };
  return (
    <div className="mx-auto w-full max-w-[860px] px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Breadcrumb items={[{ label: "Acasă", href: "/" }, { label: a.name }]} />
      <div className="mt-4">
        <AuthorBadge slug={slug} />
      </div>
      <h1 className="sr-only">{a.name}</h1>
      <p className="mt-5 text-lg text-ink">{a.bio}</p>
      <p className="mt-3 rounded border border-line bg-white p-4 text-sm text-sub">{a.disclosure}</p>
      <h2 className="mt-10 font-serif text-2xl text-ink">Analizele autorului</h2>
      <div className="mt-4 space-y-5">
        {list.map((x) => (
          <AnalysisCard key={x.slug} a={x} />
        ))}
        {list.length === 0 && <p className="text-sub">Prima analiză apare în curând.</p>}
      </div>
    </div>
  );
}
