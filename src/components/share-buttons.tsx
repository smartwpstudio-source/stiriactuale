import { IconBrandFacebook, IconBrandX } from "@tabler/icons-react";

// Facebook: buton plin, în culoarea Facebook (cererea proprietarului,
// 2026-10-04 — Facebook e principala sursă de cititori; distribuirea se face
// de mână, fără postarea automată). X rămâne iconiță monocromă.
export function ShareButtons({ url, title }: { url: string; title: string }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="mt-6 flex flex-wrap items-center gap-4">
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded bg-[#1877f2] px-4 py-2 font-medium text-white hover:bg-[#166fe5]"
      >
        <IconBrandFacebook size={20} stroke={1.75} />
        Distribuie pe Facebook
      </a>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Distribuie pe X"
        className="text-sub hover:text-amber-ink"
      >
        <IconBrandX size={18} stroke={1.75} />
      </a>
    </div>
  );
}
