"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArticleThumb } from "./article-thumb";
import { TopicLabel } from "./topic-label";
import { articleUrl } from "@/lib/content/url";
import type { Article } from "@/lib/content/types";

// Lenta "Ultima oră": toate știrile în ordine, grupate pe zile, care se
// încarcă singure la derulare (ca un flux de Facebook). Ora e afișată absolut
// (14:32), nu relativ — identică pe server și în browser, fără nepotriviri.
const TZ = "Europe/Chisinau";
const dayKey = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
const hour = (iso: string) => new Date(iso).toLocaleTimeString("ro-MD", { hour: "2-digit", minute: "2-digit", timeZone: TZ });

function dayLabel(key: string, today: string, yesterday: string): string {
  if (key === today) return "Azi";
  if (key === yesterday) return "Ieri";
  return new Date(`${key}T12:00:00Z`).toLocaleDateString("ro-MD", { day: "numeric", month: "long", year: "numeric" });
}

export function NewsFeed({
  initial,
  exclude,
  hasMore: initialHasMore,
  today,
}: {
  initial: Article[];
  exclude: string[];
  hasMore: boolean;
  today: string; // AAAA-LL-ZZ la Chișinău, calculat pe server — aceeași valoare la hidratare
}) {
  const [items, setItems] = useState(initial);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  async function loadMore() {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/lenta/?page=${page + 1}`);
      const data = (await res.json()) as { items: Article[]; hasMore: boolean };
      setItems((prev) => {
        const seen = new Set([...exclude, ...prev.map((a) => a.slug)]);
        return [...prev, ...data.items.filter((a) => !seen.has(a.slug))];
      });
      setPage((p) => p + 1);
      setHasMore(data.hasMore);
    } catch {
      // rețea căzută: butonul de mai jos rămâne pentru o nouă încercare
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && loadMore(), { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  });

  const yesterday = new Date(Date.parse(`${today}T12:00:00Z`) - 86400_000).toISOString().slice(0, 10);
  const rows = items.map((a, i) => {
    const key = dayKey(a.publishedAt);
    const isNewDay = i === 0 || key !== dayKey(items[i - 1].publishedAt);
    return { a, header: isNewDay ? dayLabel(key, today, yesterday) : null };
  });

  return (
    <div>
      {rows.map(({ a, header }) => {
        return (
          <div key={a.slug}>
            {header && (
              <h3 className="mt-6 mb-1 font-serif text-xl text-ink first:mt-0">
                {header}
              </h3>
            )}
            <Link href={articleUrl(a)} className="group flex items-start gap-4 border-b border-line py-4">
              <ArticleThumb
                topics={a.topics}
                imageUrl={a.imageUrl}
                imageAlt={a.imageAlt}
                className="aspect-[16/10] w-32 shrink-0 self-start rounded sm:w-56"
                iconSize={32}
                sizes="(max-width: 640px) 128px, 224px"
              />
              <div className="min-w-0">
                <p className="font-mono text-xs text-sub">
                  {hour(a.publishedAt)}
                  {a.topics[0] && <span className="mx-1.5">·</span>}
                  {a.topics[0] && <TopicLabel topic={a.topics[0]} />}
                </p>
                <h4 className="mt-1 font-serif text-lg leading-snug text-ink group-hover:text-teal sm:text-xl">{a.title}</h4>
                {a.lead && <p className="mt-1.5 hidden text-[0.95rem] text-sub sm:line-clamp-2">{a.lead}</p>}
              </div>
            </Link>
          </div>
        );
      })}
      {hasMore && (
        <div ref={sentinel} className="py-6 text-center">
          <button onClick={loadMore} disabled={loading} className="rounded border border-line bg-white px-5 py-2 font-mono text-sm text-ink">
            {loading ? "Se încarcă…" : "Mai multe știri"}
          </button>
        </div>
      )}
    </div>
  );
}
