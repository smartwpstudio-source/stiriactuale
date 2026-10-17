import Link from "next/link";
import { IconBook2 } from "@tabler/icons-react";
import type { Guide } from "@/lib/content/guides";

// "Ghid util" sub știre: ghidul sau dosarul de pe același subiect. Cititorul
// află ce poate face concret, iar Google vede ghidurile legate din articole.
export function RelatedGuide({ guide }: { guide: Guide }) {
  const dosar = guide.category === "dosare";
  return (
    <Link prefetch={false}
      href={`/ghiduri/${guide.slug}/`}
      className="mt-6 flex items-start gap-3 rounded-lg border border-teal/40 bg-white p-4 hover:border-teal"
    >
      <IconBook2 size={24} stroke={1.75} className="mt-0.5 shrink-0 text-teal" aria-hidden />
      <span>
        <span className="block font-mono text-xs uppercase tracking-wide text-teal">
          {dosar ? "Context: dosarul subiectului" : "Ghid util"}
        </span>
        <span className="mt-1 block font-medium leading-snug text-ink">{guide.title}</span>
        <span className="mt-1 block text-sm text-sub">{guide.description}</span>
      </span>
    </Link>
  );
}
