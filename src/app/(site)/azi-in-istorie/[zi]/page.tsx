import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/breadcrumb";
import { HistoryList } from "@/components/history-list";
import { HISTORY_PATH, dayLabel, dayPath, getHistoryDay, parseDaySlug } from "@/lib/history";

// O pagină pe zi a anului (fără an: „6 octombrie” e aceeași în fiecare an),
// generată la prima vizită și păstrată în cache — nu la build (cost Vercel).

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/azi-in-istorie/[zi]">): Promise<Metadata> {
  const d = parseDaySlug((await params).zi);
  if (!d) return {};
  const label = dayLabel(d.month, d.day);
  const events = await getHistoryDay(d.month, d.day);
  return {
    title: `${label} în istorie: ce s-a întâmplat în această zi`,
    description: `Evenimente, nașteri și decese pe ${label}: ${events.map((e) => e.an).slice(0, 4).join(", ")} — din istoria Moldovei și a lumii, cu sursa fiecăruia.`,
    alternates: { canonical: dayPath(d.month, d.day) },
  };
}

// ziua de dinainte / de după, într-un an bisect (are și 29 februarie)
const shift = (month: number, day: number, by: number) => {
  const x = new Date(Date.UTC(2024, month - 1, day + by));
  return { month: x.getUTCMonth() + 1, day: x.getUTCDate() };
};

export default async function HistoryDayPage({ params }: PageProps<"/azi-in-istorie/[zi]">) {
  const d = parseDaySlug((await params).zi);
  if (!d) notFound();
  const events = await getHistoryDay(d.month, d.day);
  if (!events.length) notFound();
  const label = dayLabel(d.month, d.day);
  const prev = shift(d.month, d.day, -1);
  const next = shift(d.month, d.day, 1);
  return (
    <div className="mx-auto w-full max-w-[760px] px-4 py-8">
      <Breadcrumb items={[{ label: "Acasă", href: "/" }, { label: "Azi în istorie", href: HISTORY_PATH }, { label }]} />
      <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">{label} în istorie</h1>
      <p className="mt-3 text-lg text-sub">Ce s-a întâmplat pe {label}: evenimente din istoria Moldovei și a lumii, nașteri și decese, cu sursa fiecăruia.</p>
      <HistoryList events={events} />
      <nav className="mt-8 flex justify-between gap-4 text-teal">
        <Link prefetch={false} href={dayPath(prev.month, prev.day)} className="hover:underline">← {dayLabel(prev.month, prev.day)}</Link>
        <Link prefetch={false} href={HISTORY_PATH} className="hover:underline">Toate zilele</Link>
        <Link prefetch={false} href={dayPath(next.month, next.day)} className="hover:underline">{dayLabel(next.month, next.day)} →</Link>
      </nav>
    </div>
  );
}
