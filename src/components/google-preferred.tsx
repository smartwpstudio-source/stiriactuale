// „Adaugă ca sursă preferată pe Google” (Preferred Sources, Google 2025):
// cititorul bifează site-ul, iar Google îi arată mai des știrile noastre la
// „Știri principale”. Doar un link — fără script, fără date trimise de noi.
export const GOOGLE_PREFERRED_URL = "https://www.google.com/preferences/source?q=stiriactuale.info";

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" width="22" height="22" aria-hidden className="shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.9 6.1C12.4 13.7 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.5 5.8c4.4-4 6.8-10 6.8-17.1z" />
      <path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-2.9-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.6 10.7l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.2-13.5-10l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
    </svg>
  );
}

export function GooglePreferred({ className = "" }: { className?: string }) {
  return (
    <a
      href={GOOGLE_PREFERRED_URL}
      target="_blank"
      rel="noopener"
      className={`inline-flex items-center gap-3 rounded-full bg-[linear-gradient(90deg,#34A853,#4285F4,#FBBC05,#EA4335)] p-[2px] ${className}`}
    >
      <span className="flex items-center gap-3 rounded-full bg-white px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-[#0b2a6f]">
        <GoogleG />
        Adaugă Știri Actuale ca sursă preferată pe Google
      </span>
    </a>
  );
}
