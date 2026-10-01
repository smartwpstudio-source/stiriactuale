import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail, StaticPage } from "@/components/static-page";
import { FEEDS } from "@/lib/pipeline/sources";
import { CONTACT_EMAIL } from "@/lib/site-info";

export const metadata: Metadata = {
  title: "Politica editorială",
  description: "Cum alegem, redactăm și corectăm știrile — inclusiv folosirea inteligenței artificiale.",
  alternates: { canonical: "/politica-editoriala/" },
};

export default function EditorialPolicyPage() {
  return (
    <StaticPage title="Politica editorială" updated="octombrie 2026">
      <h2>Surse</h2>
      <p>
        Știrile pornesc de la informațiile publicate de redacții din Republica Moldova. Sursele urmărite în mod
        curent: {FEEDS.map((f) => f.name).join(", ")}. Pe lângă acestea, editorul poate adăuga manual subiecte
        relatate de alte publicații. Sursa originală e indicată nominal în text și, cu link, la finalul fiecărui
        articol.
      </p>

      <h2>Automatizare și inteligență artificială</h2>
      <p>
        Știrile sunt reale: fiecare pornește de la informații publicate de sursele de mai sus și le indică la final.
        Pentru viteză, textul este redactat cu ajutorul unui sistem de inteligență artificială, care lucrează după
        reguli stricte: nu adaugă informații care nu apar în surse (nume, cifre, locuri,
        declarații), rescrie textul cu propriile cuvinte în loc să-l copieze și atribuie fiecare informație sursei ei.
        Articolele pe subiecte sensibile — decese, violență, victime, minori, acuzații de infracțiuni sau corupție la
        adresa unor persoane — sunt verificate de un editor <strong>înainte</strong> de publicare. Celelalte (prețuri,
        legi, decizii, evenimente) se publică imediat și sunt verificate de editor <strong>după</strong> publicare;
        greșelile se corectează, iar articolele cu probleme se retrag.
      </p>

      <h2>Ce publicăm</h2>
      <p>
        Prioritate au știrile cu efect direct asupra cititorilor: evenimentele din raioane, accidentele, cazurile
        penale și de corupție, prețurile, tarifele și legile noi, subiectele care îi privesc pe moldovenii din
        diaspora. Nu publicăm horoscoape, conținut publicitar deghizat în știre sau zvonuri neconfirmate.
      </p>

      <h2>Reguli pentru subiecte sensibile</h2>
      <ul>
        <li>
          <strong>Prezumția de nevinovăție.</strong> Până la o hotărâre definitivă, persoanele sunt „bănuite”,
          „învinuite” sau „acuzate”, niciodată prezentate ca vinovate.
        </li>
        <li>
          <strong>Acuzațiile sunt atribuite</strong> celor care le formulează (procurori, poliție, denunțători) și nu
          sunt prezentate ca fapte.
        </li>
        <li>
          <strong>Minorii și victimele violenței domestice sau sexuale.</strong> Nu le publicăm numele și nici detalii
          prin care ar putea fi identificați.
        </li>
        <li>
          <strong>Victimele adulte ale accidentelor.</strong> Le publicăm numele doar dacă a fost comunicat oficial de
          autorități (Poliție, IGSU, Procuratură) și indicăm de unde provine. Familiile pot cere eliminarea lui —
          vezi Corecturi, mai jos.
        </li>
        <li>Fără detalii macabre, fără senzaționalism, fără judecăți de valoare.</li>
      </ul>

      <h2>Imagini</h2>
      <p>
        Fotografiile sunt ilustrative, din bănci de imagini licențiate, și nu înfățișează persoanele sau locurile
        din articol, cu excepția cazurilor în care se precizează altfel. Imaginile generate cu inteligență artificială
        sunt marcate „Imagine generată AI”. La accidente, crime și victime folosim doar imagini cu obiecte și locuri,
        nu cu oameni.
      </p>

      <h2>Corecturi și drept la replică</h2>
      <p>
        Dacă găsești o greșeală de fapt sau ești vizat într-un articol, scrie-ne la{" "}
        <ContactEmail email={CONTACT_EMAIL} /> (detalii pe pagina <Link href="/contact/">Contact</Link>). Corectăm
        erorile cât mai repede, iar corecturile de fond sunt menționate în articol. Poziția persoanei vizate se adaugă
        în articol sau se publică separat.
      </p>
    </StaticPage>
  );
}
