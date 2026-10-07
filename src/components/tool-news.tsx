import { ArticleRow } from "./article-row";
import { SectionHeading } from "./section-heading";
import { getToolNews } from "@/lib/content/queries";

// Pe ghid / calculator: știrile care l-au recomandat în blocul de impact —
// legătura în sens invers (știre -> ghid -> știre).
export async function ToolNews({ tool }: { tool: string }) {
  const news = await getToolNews(tool, 4);
  if (!news.length) return null;
  return (
    <section className="mt-10">
      <SectionHeading title="Ultimele știri care schimbă asta" />
      <div className="mt-2">
        {news.map((a) => (
          <ArticleRow key={a.slug} article={a} variant="small" />
        ))}
      </div>
    </section>
  );
}
