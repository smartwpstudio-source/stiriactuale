import Link from "next/link";
import { Breadcrumb } from "./breadcrumb";
import { SectionHeading } from "./section-heading";
import { getSaintsMonth, guideForFeast, holidayGuides, type SaintDay } from "@/lib/calendar-data";
import {
  addDays, churchDay, formatDay, monthName, orthodoxEaster, weekday, yearFasts, yearFeasts, type Style,
} from "@/lib/orthodox";

// Pilonul calendarului: sărbători mari, posturi, Paștele și (când există
// datele din content/calendar/sfinti/) sfinții fiecărei zile, pe stil vechi
// (implicit — Mitropolia Moldovei) sau nou (Mitropolia Basarabiei).
export const CALENDAR_PATH = "/calendar-crestin-ortodox/";
export const FIRST_YEAR = 2024;
export const LAST_YEAR = 2035;

export function todayChisinau(): Date {
  const [y, m, d] = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Chisinau" }).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export async function OrthodoxCalendar({ year, style, basePath }: { year: number; style: Style; basePath: string }) {
  const feasts = yearFeasts(year, style);
  const fasts = yearFasts(year, style);
  const [guides, months] = await Promise.all([
    holidayGuides(),
    Promise.all(Array.from({ length: 12 }, (_, i) => getSaintsMonth(i + 1))),
  ]);
  const saintsFor = (civil: Date): SaintDay | null => {
    const { month, day } = churchDay(civil, style);
    return months[month - 1]?.[String(day)] ?? null;
  };
  const hasSaints = months.some(Boolean);
  const easter = orthodoxEaster(year);
  const today = todayChisinau();
  const isThisYear = today.getUTCFullYear() === year;
  const todaySaints = isThisYear ? saintsFor(today) : null;
  const styleLink = (s: Style) => (s === "vechi" ? basePath : `${basePath}?stil=nou`);
  const styleName = style === "vechi" ? "stil vechi" : "stil nou";

  const faq = [
    { q: `Când este Paștele în ${year}?`, a: `Paștele ortodox în ${year} este ${weekday(easter)}, ${formatDay(easter)} ${year} — aceeași dată pe stil vechi și pe stil nou.` },
    { q: "Când este Crăciunul pe stil vechi și pe stil nou?", a: "Pe stil nou, Crăciunul este pe 25 decembrie. Pe stil vechi (Mitropolia Moldovei) este pe 7 ianuarie. În Republica Moldova ambele zile sunt libere." },
    { q: "Ce înseamnă stil vechi și stil nou?", a: "Stilul vechi urmează calendarul iulian: sărbătorile cu dată fixă cad cu 13 zile mai târziu. Stilul nou le ține la data din calendarul civil. Paștele este calculat la fel pentru ambele." },
  ];
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      {/* textele FAQ sunt ale noastre, fără "<" — JSON simplu e sigur */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <Breadcrumb items={[{ label: "Acasă", href: "/" }, { label: "Calendar creștin-ortodox", href: CALENDAR_PATH }, { label: String(year) }]} />
      <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">Calendar creștin-ortodox {year}</h1>
      <p className="mt-3 text-lg text-sub">
        Sărbătorile, posturile și sfinții fiecărei zile în {year}, pe {styleName}. Paștele și sărbătorile legate de el sunt calculate
        după pascalia ortodoxă.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="text-sm text-sub">Stilul:</span>
        {(["vechi", "nou"] as const).map((s) => (
          <Link
            key={s}
            href={styleLink(s)}
            className={`rounded px-3 py-1.5 text-sm ${style === s ? "bg-ink text-white" : "border border-line text-ink hover:border-teal"}`}
          >
            {s === "vechi" ? "Stil vechi (Mitropolia Moldovei)" : "Stil nou (Mitropolia Basarabiei)"}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-teal p-5 text-white">
          <p className="font-mono text-xs uppercase tracking-wide opacity-80">Paștele {year}</p>
          <p className="mt-1 font-serif text-2xl">{weekday(easter)}, {formatDay(easter)}</p>
          <p className="mt-1 text-sm opacity-90">Paștele {year + 1}: {formatDay(orthodoxEaster(year + 1))} {year + 1}</p>
        </div>
        {isThisYear && (
          <div className="rounded-lg border border-line bg-white p-5">
            <p className="font-mono text-xs uppercase tracking-wide text-sub">Astăzi, {weekday(today)}, {formatDay(today)}</p>
            {todaySaints ? (
              <>
                {todaySaints.sarbatoare && <p className="mt-1 font-serif text-xl text-alert">{todaySaints.sarbatoare}</p>}
                <p className="mt-1 text-ink">{todaySaints.sfinti.join("; ")}</p>
              </>
            ) : (
              <p className="mt-1 text-ink">{feasts.find((f) => f.date.getTime() === today.getTime())?.name ?? "Zi obișnuită în calendar."}</p>
            )}
          </div>
        )}
      </div>

      <section className="mt-10">
        <SectionHeading title={`Sărbătorile mari ${year}`} />
        <ul className="mt-2 divide-y divide-line rounded-lg border border-line bg-white">
          {feasts.map((f) => {
            const g = guideForFeast(f.name, guides);
            return (
              <li key={f.name + f.date.toISOString()} className="flex gap-4 px-4 py-2.5">
                <span className="w-28 shrink-0 font-mono text-sm text-sub">
                  {formatDay(f.date)}
                  <span className="block text-xs">{weekday(f.date)}</span>
                </span>
                <span className="text-ink">
                  <span className="text-alert">✝</span>{" "}
                  {g ? (
                    <Link href={`/ghiduri/${g.slug}/`} className="underline hover:text-teal">
                      {f.name}
                    </Link>
                  ) : (
                    f.name
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10">
        <SectionHeading title={`Posturile ${year}`} />
        <ul className="mt-2 divide-y divide-line rounded-lg border border-line bg-white">
          {fasts.map((f) => (
            <li key={f.name} className="px-4 py-2.5 text-ink">
              <span className="font-medium">{f.name}</span>
              <span className="block font-mono text-sm text-sub">
                {formatDay(f.from)} {f.from.getUTCFullYear()} – {formatDay(f.to)} {f.to.getUTCFullYear()}
              </span>
            </li>
          ))}
          <li className="px-4 py-2.5 text-sm text-sub">Miercurea și vinerea sunt zile de post în tot anul, cu excepția săptămânilor fără post.</li>
        </ul>
      </section>

      {hasSaints && (
        <section className="mt-10">
          <SectionHeading title={`Sfinții pe zile, ${year}`} />
          {Array.from({ length: 12 }, (_, m) => {
            const days: Date[] = [];
            for (let d = new Date(Date.UTC(year, m, 1)); d.getUTCMonth() === m; d = addDays(d, 1)) days.push(d);
            return (
              <div key={m} id={monthName(m + 1)} className="mt-6 scroll-mt-6">
                <h2 className="font-serif text-2xl capitalize text-ink">
                  {monthName(m + 1)} {year}
                </h2>
                <ul className="mt-2 divide-y divide-line rounded-lg border border-line bg-white">
                  {days.map((d) => {
                    const s = saintsFor(d);
                    if (!s) return null;
                    return (
                      <li key={d.toISOString()} className="flex gap-4 px-4 py-2">
                        <span className="w-16 shrink-0 font-mono text-sm text-sub">
                          {d.getUTCDate()} <span className="text-xs">{weekday(d).slice(0, 3)}</span>
                        </span>
                        <span className={s.cruce === "rosie" ? "font-medium text-alert" : "text-ink"}>
                          {s.cruce && "✝ "}
                          {s.sarbatoare ? `${s.sarbatoare} — ` : ""}
                          {s.sfinti.join("; ")}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </section>
      )}

      <section className="mt-10">
        <SectionHeading title="Întrebări frecvente" />
        {faq.map((f) => (
          <div key={f.q} className="mt-4">
            <h3 className="font-medium text-ink">{f.q}</h3>
            <p className="mt-1 text-sub">{f.a}</p>
          </div>
        ))}
      </section>

      <nav className="mt-10 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-sub">Alți ani:</span>
        {Array.from({ length: LAST_YEAR - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i)
          .filter((y) => Math.abs(y - year) <= 3 && y !== year)
          .map((y) => (
            <Link
              key={y}
              href={`${CALENDAR_PATH}${y}/${style === "nou" ? "?stil=nou" : ""}`}
              className="rounded border border-line px-2 py-1 text-ink hover:border-teal"
            >
              {y}
            </Link>
          ))}
      </nav>
    </div>
  );
}
