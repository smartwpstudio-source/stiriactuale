import Link from "next/link";

export function SectionFilterChips({
  basePath,
  items,
  active,
}: {
  basePath: string;
  items: { slug: string; label: string }[];
  active?: string;
}) {
  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      <li>
        <Link
          href={basePath}
          className={`rounded border px-2.5 py-1 font-mono text-xs ${
            !active
              ? "border-amber text-amber-ink"
              : "border-line text-sub hover:border-amber hover:text-amber-ink"
          }`}
        >
          Toate
        </Link>
      </li>
      {items.map((item) => (
        <li key={item.slug}>
          <Link
            href={`${basePath}/${item.slug}`}
            className={`rounded border px-2.5 py-1 font-mono text-xs ${
              active === item.slug
                ? "border-amber text-amber-ink"
                : "border-line text-sub hover:border-amber hover:text-amber-ink"
            }`}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
