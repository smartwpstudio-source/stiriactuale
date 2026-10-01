import Link from "next/link";

// Logo-ul orizontal: cutia albastră cu "ȘTIRI·ACTUALE" și punctul negru —
// forma logo-ului vechi stiriactuale.info, cu numele complet al site-ului.
export function Logo() {
  return (
    <Link
      href="/"
      aria-label="Știri actuale — prima pagină"
      className="inline-flex items-center rounded-md bg-[#0047ab] px-3 pb-1.5 pt-1 font-logo text-xl leading-none tracking-wide text-white sm:px-3.5 sm:text-2xl"
    >
      ȘTIRI
      <span className="mx-[0.08em] mb-[0.05em] inline-block h-[0.3em] w-[0.3em] self-end rounded-full bg-[#111]" aria-hidden />
      ACTUALE
    </Link>
  );
}
