import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage } from "@/components/static-page";
import { OWNER, TELEGRAM_URL } from "@/lib/site-info";

export const metadata: Metadata = {
  title: "Despre noi",
  description: "Ce este Stiri actuale, cum sunt realizate știrile și cine răspunde de conținut.",
  alternates: { canonical: "/despre/" },
};

export default function AboutPage() {
  return (
    <StaticPage title="Despre noi">
      <p>
        Stiri actuale este un site de știri din Republica Moldova, pentru cititorii din raioane, din Chișinău și din
        diaspora. Urmărim în primul rând ce îi afectează direct pe oameni: evenimentele din raioane, accidentele și
        cazurile penale, corupția, prețurile și tarifele, legile noi din educație, sănătate și economie, și viața
        moldovenilor plecați peste hotare.
      </p>

      <h2>Cum lucrăm</h2>
      <p>
        Monitorizăm permanent publicațiile de presă din Republica Moldova. Când un subiect e important, redactăm o
        știre scurtă și clară, cu ajutorul unui sistem de inteligență artificială, pornind de la informațiile publicate
        de acele redacții. Fiecare articol indică, la final, sursele originale, cu link către ele.
      </p>
      <p>
        Știrile pe subiecte sensibile — tragedii, victime, acuzații la adresa unor persoane — sunt verificate de un
        editor înainte de publicare; celelalte sunt verificate după publicare și corectate dacă e nevoie. Regulile pe
        care le respectăm sunt descrise în{" "}
        <Link href="/politica-editoriala/">Politica editorială</Link>.
      </p>

      <h2>Cine răspunde de site</h2>
      <p>{OWNER ?? <strong>[proprietarul site-ului — de completat]</strong>}</p>
      <p>
        Pentru sesizări, corecturi sau propuneri de subiecte, vezi pagina <Link href="/contact/">Contact</Link>. Știrile
        noi apar și pe canalul nostru de <a href={TELEGRAM_URL}>Telegram</a>.
      </p>
    </StaticPage>
  );
}
