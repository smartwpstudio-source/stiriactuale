import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail, StaticPage } from "@/components/static-page";
import { CONTACT_EMAIL } from "@/lib/site-info";

export const metadata: Metadata = {
  title: "Publicitate",
  description: "Publicitate pe Știri Actuale: bannere, articole sponsorizate marcate, prezență în ghiduri și pe canalele noastre. Scrie-ne pentru condiții.",
  alternates: { canonical: "/publicitate/" },
};

// Fără cifre de audiență aici: le trimitem la cerere, actualizate, din
// statistici reale (nu promitem ce nu putem arăta).
export default function AdvertisingPage() {
  return (
    <StaticPage title="Publicitate">
      <p>
        Știri Actuale e citit de oameni din raioane, din Chișinău și din diaspora — pentru știri, dar și pentru ghidurile
        practice, calculatoare și calendarul sărbătorilor, la care revin în fiecare lună.
      </p>

      <h2>Ce putem face împreună</h2>
      <ul>
        <li>
          <strong>Bannere</strong> pe site, pe prima pagină sau în secțiuni (Regiuni, Național, Diaspora), pe o perioadă
          stabilită;
        </li>
        <li>
          <strong>Articole sponsorizate</strong> — scrise clar și util, marcate vizibil „Material publicitar”, cu linkuri
          marcate ca sponsorizate;
        </li>
        <li>
          <strong>Prezență în ghiduri și în calendar</strong> — pentru afaceri potrivite subiectului (ex. agenții de turism
          la ghidurile de călătorie, servicii pentru diaspora la ghidurile pe țări);
        </li>
        <li>
          <strong>Distribuire</strong> pe pagina de Facebook și pe canalul de Telegram.
        </li>
      </ul>

      <h2>Reguli</h2>
      <ul>
        <li>Materialele publicitare sunt marcate întotdeauna ca atare — nu le prezentăm ca știri.</li>
        <li>Nu publicăm publicitate politică ascunsă, jocuri de noroc fără licență, produse interzise sau înșelătoare.</li>
        <li>
          Redacția decide independent ce publică în știri; un contract de publicitate nu influențează conținutul editorial
          (vezi <Link prefetch={false} href="/politica-editoriala/">politica editorială</Link>).
        </li>
      </ul>

      <h2>Contact</h2>
      <p>
        Scrie-ne la <ContactEmail email={CONTACT_EMAIL} /> cu ce dorești să promovezi și perioada. Îți trimitem condițiile
        și statisticile de audiență actualizate.
      </p>
    </StaticPage>
  );
}
