import type { Metadata } from "next";
import Link from "next/link";
import { listArticles } from "@/lib/content/queries";
import { ArticleRow } from "@/components/article-row";
import { StaticPage } from "@/components/static-page";

export const revalidate = 3600; // la cerere din pipeline / admin (/api/revalidate/), ceasul e doar plasă

export const metadata: Metadata = {
  title: "Comunicate de presă",
  description: "Comunicatele de presă ale firmelor, organizațiilor și instituțiilor, publicate pe Știri Actuale (materiale plătite).",
  alternates: { canonical: "/comunicate/" },
};

export default async function PressReleasesPage() {
  const { items } = await listArticles({ kind: "comunicat" }, 1, 48, false);
  return (
    <StaticPage title="Comunicate de presă">
      <p>
        Materiale plătite, transmise de firme și organizații. Vrei să publici și tu?{" "}
        <Link prefetch={false} href="/comunicate-de-presa/">Vezi oferta</Link>.
      </p>
      <div className="not-prose mt-4">
        {items.length ? items.map((a) => <ArticleRow key={a.slug} article={a} />) : <p className="text-sub">Încă nu sunt comunicate publicate.</p>}
      </div>
    </StaticPage>
  );
}
