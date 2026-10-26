import { IconBrandFacebook, IconBrandWhatsapp } from "@tabler/icons-react";

// Sus, sub titlu și dată: butoane pline, în culorile rețelelor — Facebook,
// WhatsApp și Telegram sunt canalele pe care cititorii din Moldova trimit
// știrile mai departe (cererea proprietarului, 2026-10-04 / 10-05). Fără Telegram din
// 2026-10-26: două butoane Telegram (trimite + abonare) îi încurcau pe cititori; rămâne
// abonarea, pe rândul de sub ele.
export function ShareButtons({ url, title }: { url: string; title: string }) {
  // două butoane egale, pe tot rândul
  const button = "inline-flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-2 text-sm font-medium text-white sm:gap-2 sm:px-3";
  return (
    // pe telefon textul scurt, ca butoanele să încapă pe un rând
    <div className="mt-4 flex items-center gap-2">
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Distribuie pe Facebook"
        className={`${button} bg-[#1877f2] hover:bg-[#166fe5]`}
      >
        <IconBrandFacebook size={18} stroke={1.75} />
        <span className="sm:hidden">Facebook</span>
        <span className="hidden sm:inline">Distribuie pe Facebook</span>
      </a>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Trimite pe WhatsApp"
        className={`${button} bg-[#25d366] hover:bg-[#1ebe5b]`}
      >
        <IconBrandWhatsapp size={18} stroke={1.75} />
        <span className="sm:hidden">WhatsApp</span>
        <span className="hidden sm:inline">Trimite pe WhatsApp</span>
      </a>
    </div>
  );
}
