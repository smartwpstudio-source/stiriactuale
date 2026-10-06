import type { HistoryEvent } from "@/lib/history";
import { yearLabel } from "@/lib/history";

// Lista evenimentelor unei zile, în ordinea anilor; cele din istoria
// Moldovei marcate.
export function HistoryList({ events }: { events: HistoryEvent[] }) {
  return (
    <ol className="mt-6 space-y-4">
      {events.map((e) => (
        <li key={`${e.an}-${e.text.slice(0, 20)}`} className="flex gap-4 rounded border border-line bg-white p-4">
          <span className="w-20 shrink-0 font-mono text-lg font-semibold text-teal">{yearLabel(e.an)}</span>
          <span className="text-ink">
            {e.moldova && (
              <span className="mr-2 inline-block rounded bg-amber/20 px-1.5 py-0.5 font-mono text-xs uppercase tracking-wide text-amber-ink">
                Moldova
              </span>
            )}
            {e.text}{" "}
            <a href={e.sursa} target="_blank" rel="noopener" className="text-sm text-sub underline hover:text-ink">
              sursa
            </a>
          </span>
        </li>
      ))}
    </ol>
  );
}
