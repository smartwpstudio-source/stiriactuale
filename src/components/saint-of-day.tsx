import Link from "next/link";
import { CALENDAR_PATH, todayChisinau } from "./orthodox-calendar";
import { getSaintDay } from "@/lib/calendar-data";
import { churchDay, formatDay, weekday, yearFeasts } from "@/lib/orthodox";

// „Sfântul zilei” pe prima pagină — stil vechi (majoritatea parohiilor din Moldova), cu
// sărbătoarea mare a zilei dacă e una; trimite spre pilonul calendarului.
export async function SaintOfDay() {
  const today = todayChisinau();
  const { month, day } = churchDay(today, "vechi");
  const [s, feast] = [await getSaintDay(month, day), yearFeasts(today.getUTCFullYear(), "vechi").find((f) => f.date.getTime() === today.getTime())];
  const title = feast?.name ?? s?.sarbatoare;
  return (
    <Link href={CALENDAR_PATH} className="mt-6 block rounded-lg border border-line bg-white p-4 hover:border-teal">
      <span className="block font-mono text-xs uppercase tracking-wide text-sub">
        Calendar ortodox · {weekday(today)}, {formatDay(today)}
      </span>
      {title && <span className="mt-1 block font-serif text-lg text-alert">✝ {title}</span>}
      {s ? (
        <span className="mt-1 block text-[0.95rem] text-ink">{s.sfinti.slice(0, 2).join("; ")}</span>
      ) : (
        !title && <span className="mt-1 block text-[0.95rem] text-ink">Sărbătorile și posturile anului</span>
      )}
      <span className="mt-2 block text-sm text-teal">Vezi calendarul →</span>
    </Link>
  );
}
