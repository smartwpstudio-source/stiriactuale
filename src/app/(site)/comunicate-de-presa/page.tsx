import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage } from "@/components/static-page";
import { PressOrderForm } from "@/components/press-order-form";

export const metadata: Metadata = {
  title: "Publică un comunicat de presă",
  description: "Comunicatul tău pe Știri Actuale, pe pagina de Facebook și pe canalul de Telegram: 500 de lei. Pentru afaceri, evenimente, cultură, sport, ONG-uri.",
  alternates: { canonical: "/comunicate-de-presa/" },
};

// Oferta de comunicate plătite (editorul, 2026-11-09): un singur pachet, 500 de lei. Fără politică.
// Linkurile sunt „sponsored” (regula Google pentru linkurile plătite), materialul e marcat ca plătit.
export default function PressReleaseOfferPage() {
  return (
    <StaticPage title="Publică un comunicat de presă">
      <p>
        Ai o veste despre afacerea ta, un eveniment, un concert, o competiție sau un proiect? O publicăm pe Știri Actuale și o
        ducem la cititorii noștri din raioane, din Chișinău și din diaspora.
      </p>

      <h2>Pachetul: 500 de lei</h2>
      <ul>
        <li>Publicare pe site, în rubrica <Link prefetch={false} href="/comunicate/">Comunicate</Link>, cu poza ta și linkul spre site-ul tău;</li>
        <li>Distribuire pe pagina de Facebook a Știri Actuale;</li>
        <li>Distribuire pe canalul de Telegram al Știri Actuale;</li>
        <li>Articolul rămâne pe site permanent și se găsește în Google.</li>
      </ul>

      <h2>Ce publicăm</h2>
      <ul>
        <li>Afaceri: deschideri, produse și servicii noi, angajări, premii;</li>
        <li>Evenimente, cultură, sport, educație, proiecte ale ONG-urilor și ale primăriilor.</li>
      </ul>
      <p>
        Nu publicăm materiale politice sau electorale, jocuri de noroc fără licență, produse interzise, înșelătoare sau atacuri la
        adresa altor persoane.
      </p>

      <h2>Reguli</h2>
      <ul>
        <li>
          Comunicatul apare marcat „Comunicat de presă · material plătit”. Nu îl prezentăm ca știre a redacției și nu intră în
          fluxul de știri.
        </li>
        <li>Textul e al tău. Corectăm doar greșelile de scriere; dacă e nevoie de alte schimbări, te întrebăm înainte.</li>
        <li>Linkurile din comunicat sunt marcate „sponsorizat”, cum cer regulile Google pentru materialele plătite.</li>
        <li>Publicăm în cel mult 2 zile lucrătoare de la plată.</li>
      </ul>

      <h2>Cum comanzi</h2>
      <ol>
        <li>Completezi formularul de mai jos;</li>
        <li>Îți trimitem factura pe e-mail; plata se face prin transfer sau Paynet;</li>
        <li>După plată, publicăm și îți trimitem linkurile spre articol și postări.</li>
      </ol>

      <PressOrderForm />

      <h2>Datele firmei</h2>
      <p>
        Serviciul e prestat de „DEE ECO SUPORT” S.R.L., IDNO 1022602002881, MD-5233, s. Țarigrad, r. Drochia, Republica
        Moldova.
      </p>
    </StaticPage>
  );
}
