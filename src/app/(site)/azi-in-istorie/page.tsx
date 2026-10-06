import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/breadcrumb";
import { HistoryList } from "@/components/history-list";
import { todayChisinau } from "@/components/orthodox-calendar";
import { HISTORY_PATH, MONTHS, dayLabel, dayPath, getHistoryDay, historyDays } from "@/lib/history";

// Pagina de azi: se schimbă singură la miezul nopții (revalidare din oră în oră).
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Azi în istorie: ce s-a întâmplat în această zi",
  description: "Evenimente din istoria Moldovei și a lumii pentru fiecare zi a anului: bătălii, tratate, descoperiri, nașteri și decese, cu sursa fiecăruia.",
  alternates: { canonical: HISTORY_PATH },
};

export default async function HistoryIndexPage() {
  const t = todayChisinau();
  const month = t.getUTCMonth() + 1;
  const day = t.getUTCDate();
  const [events, days] = await Promise.all([getHistoryDay(month, day), historyDays()]);
  return (
    <div className="mx-auto w-full max-w-[760px] px-4 py-8">
      <Breadcrumb items={[{ label: "Acasă", href: "/" }, { label: "Azi în istorie" }]} />
      <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">Azi în istorie: {dayLabel(month, day)}</h1>
      <p className="mt-3 text-lg text-sub">Ce s-a întâmplat în această zi, în istoria Moldovei și a lumii.</p>
      {events.length > 0 && (
        <>
          <HistoryList events={events} />
          <Link href={dayPath(month, day)} className="mt-4 inline-block text-teal hover:underline">
            Pagina zilei de {dayLabel(month, day)} →
          </Link>
        </>
      )}
      <h2 className="mt-12 font-serif text-2xl text-ink">Toate zilele anului</h2>
      {MONTHS.map((name, i) => {
        const inMonth = days.filter((d) => d.month === i + 1);
        return (
          inMonth.length > 0 && (
            <section key={name} className="mt-6">
              <h3 className="font-serif text-lg capitalize text-ink">{name}</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {inMonth.map((d) => (
                  <li key={d.day}>
                    <Link href={dayPath(d.month, d.day)} className="block min-w-10 rounded border border-line bg-white px-2 py-1 text-center text-sm text-ink hover:border-teal">
                      {d.day}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )
        );
      })}
    </div>
  );
}
