import Link from "next/link";
import { getToolNews } from "@/lib/content/queries";
import { articleUrl } from "@/lib/content/url";
import { formatTimeAgo } from "@/lib/format-time-ago";

// Sus pe ghid / calculator: știrile care l-au recomandat în blocul de impact —
// legătura în sens invers (știre -> ghid -> știre) și semnul că subiectul e actual.
export async function ToolNews({ tool }: { tool: string }) {
  const news = await getToolNews(tool, 3);
  if (!news.length) return null;
  return (
    <section className="mt-5 rounded-lg border border-line bg-white p-4">
      <h2 className="font-mono text-xs uppercase tracking-wide text-teal">📰 Știri recente despre asta</h2>
      <ul className="mt-2 space-y-2">
        {news.map((a) => (
          <li key={a.slug}>
            <Link href={articleUrl(a)} className="font-medium leading-snug text-ink hover:text-teal">
              {a.title}
            </Link>
            <span className="ml-2 font-mono text-xs text-sub">{formatTimeAgo(a.publishedAt)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
