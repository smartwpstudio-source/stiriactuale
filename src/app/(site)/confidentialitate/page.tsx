import type { Metadata } from "next";
import { ContactEmail, StaticPage } from "@/components/static-page";
import { CONTACT_EMAIL, OWNER } from "@/lib/site-info";

export const metadata: Metadata = {
  title: "Politica de confidențialitate",
  description: "Ce date prelucrează site-ul, ce cookie-uri folosește și ce drepturi ai.",
  alternates: { canonical: "/confidentialitate/" },
};

export default function PrivacyPage() {
  return (
    <StaticPage title="Politica de confidențialitate" updated="octombrie 2026">
      <h2>Cine prelucrează datele</h2>
      <p>
        Operatorul site-ului stiriactuale.info este {OWNER ?? <strong>[proprietarul site-ului — de completat]</strong>}.
        Contact pentru orice întrebare despre datele personale: <ContactEmail email={CONTACT_EMAIL} />.
      </p>

      <h2>Ce date prelucrăm</h2>
      <p>
        Site-ul nu are conturi de utilizator, formulare de înregistrare sau comentarii, deci nu colectăm nume, adrese
        de email sau alte date pe care să ni le dai direct. Datele prelucrate sunt:
      </p>
      <ul>
        <li>
          <strong>date tehnice de acces</strong> (adresa IP, tipul browserului, pagina accesată), înregistrate
          automat de furnizorul de găzduire (Vercel) pentru funcționarea și securitatea site-ului;
        </li>
        <li>
          <strong>date prelucrate de Google AdSense</strong> pentru afișarea reclamelor, prin cookie-uri și
          tehnologii similare — descrise mai jos;
        </li>
        <li>
          <strong>mesajele pe care ni le trimiți</strong> pe email, folosite doar pentru a-ți răspunde.
        </li>
      </ul>

      <h2>Cookie-uri și reclame</h2>
      <p>
        Site-ul este finanțat din reclame afișate prin Google AdSense. Google și partenerii săi pot folosi cookie-uri
        pentru a afișa reclame, a măsura eficiența lor și, cu acordul tău, a le personaliza pe baza vizitelor
        anterioare pe acest site și pe alte site-uri. La prima vizită îți cerem acordul printr-un mesaj de
        consimțământ; îl poți schimba oricând din linkul „Setări confidențialitate” afișat de acel mesaj.
      </p>
      <p>
        Detalii despre cum folosește Google datele:{" "}
        <a href="https://policies.google.com/technologies/partner-sites">policies.google.com/technologies/partner-sites</a>
        . Poți dezactiva reclamele personalizate din{" "}
        <a href="https://adssettings.google.com">setările de reclame Google</a>.
      </p>

      <h2>Cât timp păstrăm datele</h2>
      <p>
        Datele tehnice de acces se păstrează conform politicii furnizorului de găzduire, de regulă câteva zile.
        Mesajele primite pe email se păstrează cât e nevoie pentru a le rezolva.
      </p>

      <h2>Drepturile tale</h2>
      <p>
        Conform legislației Republicii Moldova privind protecția datelor cu caracter personal și, pentru cititorii din
        Uniunea Europeană, Regulamentului general privind protecția datelor (GDPR), ai dreptul să ceri acces la
        datele tale, rectificarea sau ștergerea lor, să te opui prelucrării și să îți retragi consimțământul. Scrie-ne
        la adresa de mai sus. Poți depune o plângere la Centrul Național pentru Protecția Datelor cu Caracter Personal
        sau la autoritatea de protecție a datelor din țara în care locuiești.
      </p>
    </StaticPage>
  );
}
