import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail, StaticPage } from "@/components/static-page";
import { ADDRESS, CONTACT_EMAIL, OWNER, PHONE, TELEGRAM_URL } from "@/lib/site-info";

export const metadata: Metadata = {
  title: "Contact",
  description: "Cum ne poți scrie: sesizări, corecturi, subiecte.",
  alternates: { canonical: "/contact/" },
};

export default function ContactPage() {
  return (
    <StaticPage title="Contact">
      <p>
        <strong>Redacția Știri Actuale</strong>
        <br />
        Fondator: {OWNER}
        <br />
        Adresa: {ADDRESS}
        <br />
        Telefon: <a href={`tel:${PHONE.replace(/\s/g, "")}`}>{PHONE}</a>
      </p>
      <p>
        Email: <ContactEmail email={CONTACT_EMAIL} />
      </p>
      <p>
        Telegram: <a href={TELEGRAM_URL}>{TELEGRAM_URL.replace("https://", "")}</a>
      </p>

      <h2>Ne poți scrie pentru</h2>
      <ul>
        <li>
          <strong>corecturi</strong> — o greșeală de fapt într-un articol. Trimite linkul articolului și ce anume e
          greșit; corectăm cât mai repede și menționăm corectura în text;
        </li>
        <li>
          <strong>dreptul la replică</strong> — dacă ești vizat într-un articol și vrei să-ți prezinți poziția;
        </li>
        <li>
          <strong>subiecte</strong> — un eveniment din localitatea ta despre care crezi că trebuie să se scrie.
        </li>
      </ul>
      <p>
        Cum tratăm sesizările e descris în <Link href="/politica-editoriala/">Politica editorială</Link>.
      </p>
    </StaticPage>
  );
}
