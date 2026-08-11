// Date fixture — set reprezentativ de articole pentru testarea componentelor și SEO
// (pasul 4). NU sunt știri reale. Sursa de conținut reală (migrare WP și/sau pipeline
// AI, pasul 7) e o decizie separată, luată explicit ulterior.

import type { Article } from "./types";

function minutesAgo(n: number): string {
  return new Date(Date.now() - n * 60_000).toISOString();
}

export const articles: Article[] = [
  {
    slug: "barbat-retinut-la-straseni-dupa-un-jaf-soldat-cu-pagube-de-peste-200-000-de-lei",
    title: "Bărbat reținut la Strășeni după un jaf soldat cu pagube de peste 200.000 de lei",
    lead: "Un bărbat de 34 de ani a fost reținut de polițiști la câteva ore după ce a pătruns într-un depozit din Strășeni și a sustras bunuri în valoare de peste 200.000 de lei.",
    bodyHtml:
      "<h2>Ce s-a întâmplat</h2><p>Potrivit poliției, incidentul a avut loc în cursul nopții, iar suspectul a fost identificat cu ajutorul camerelor de supraveghere din zonă.</p><h2>Ancheta continuă</h2><p>Bărbatul a fost reținut pentru 72 de ore, iar autoritățile verifică dacă a mai fost implicat în fapte similare.</p>",
    section: "regiuni",
    locality: "straseni",
    topics: ["criminal"],
    publishedAt: minutesAgo(18),
    sourceCount: 6,
  },
  {
    slug: "accident-rutier-la-drochia-doua-persoane-ranite-dupa-coliziunea-a-trei-autoturisme",
    title: "Accident rutier la Drochia: două persoane rănite după coliziunea a trei autoturisme",
    lead: "Trei mașini au fost implicate într-un accident produs pe traseul Drochia–Bălți, iar două persoane au fost transportate la spital cu răni ușoare.",
    bodyHtml:
      "<h2>Circumstanțele accidentului</h2><p>Potrivit primelor informații, unul dintre șoferi nu a păstrat distanța regulamentară în trafic.</p><h2>Traficul, afectat temporar</h2><p>Circulația a fost restricționată pe un sens pentru aproximativ o oră, cât au durat cercetările la fața locului.</p>",
    section: "regiuni",
    locality: "drochia",
    topics: ["accidente"],
    publishedAt: minutesAgo(52),
    sourceCount: 4,
  },
  {
    slug: "festival-de-muzica-populara-la-orhei-mii-de-vizitatori-asteptati",
    title: "Festival de muzică populară la Orhei, mii de vizitatori așteptați",
    lead: "Ediția de vară a festivalului de muzică populară revine la Orhei în acest weekend, cu artiști din toată țara.",
    bodyHtml:
      "<h2>Program</h2><p>Evenimentul se desfășoară pe parcursul a două zile, cu concerte, târg de meșteșugari și activități pentru copii.</p><h2>Acces</h2><p>Intrarea este liberă, iar organizatorii recomandă sosirea din timp din cauza afluxului mare de vizitatori.</p>",
    section: "regiuni",
    locality: "orhei",
    topics: ["cultura"],
    publishedAt: minutesAgo(140),
    sourceCount: 3,
  },
  {
    slug: "alerta-112-la-balti-interventie-a-echipajelor-de-urgenta-pentru-un-incendiu",
    title: "Alertă 112 la Bălți: intervenție a echipajelor de urgență pentru un incendiu",
    lead: "Pompierii au intervenit pentru stingerea unui incendiu izbucnit într-o anexă gospodărească din municipiul Bălți, fără victime.",
    bodyHtml:
      "<h2>Intervenția</h2><p>Echipajele au ajuns la fața locului în câteva minute și au reușit să limiteze extinderea flăcărilor.</p><h2>Cauze</h2><p>Cauza probabilă este o defecțiune electrică, urmează stabilirea exactă a acesteia.</p>",
    section: "regiuni",
    locality: "balti",
    topics: ["alerta-112"],
    publishedAt: minutesAgo(200),
    sourceCount: 2,
  },
  {
    slug: "proiect-comunitar-la-cahul-aduce-imbunatatiri-infrastructurii-locale",
    title: "Proiect comunitar la Cahul aduce îmbunătățiri infrastructurii locale",
    lead: "Un proiect finanțat din fonduri locale și europene va moderniza mai multe străzi și spații publice din Cahul.",
    bodyHtml:
      "<h2>Ce se schimbă</h2><p>Lucrările includ reabilitarea carosabilului și extinderea iluminatului stradal în trei cartiere.</p><h2>Termen</h2><p>Autoritățile locale estimează finalizarea lucrărilor până la finalul anului.</p>",
    section: "regiuni",
    locality: "cahul",
    topics: ["social"],
    publishedAt: minutesAgo(310),
    sourceCount: 2,
  },
  {
    slug: "anre-anunta-noi-tarife-la-energie-electrica-incepand-cu-luna-viitoare",
    title: "ANRE anunță noi tarife la energie electrică începând cu luna viitoare",
    lead: "Agenția Națională pentru Reglementare în Energetică a aprobat noi tarife la electricitate, aplicabile din prima zi a lunii viitoare.",
    bodyHtml:
      "<h2>Ce se schimbă</h2><p>Ajustarea vine pe fondul evoluției prețurilor pe piața regională de energie.</p><h2>Impact pentru consumatori</h2><p>Autoritățile recomandă verificarea facturilor și a opțiunilor de eficiență energetică disponibile.</p>",
    section: "national",
    topics: ["economic", "criza-energetica"],
    publishedAt: minutesAgo(75),
    sourceCount: 7,
  },
  {
    slug: "procurorii-anticoruptie-deschid-o-anchetamai-privind-achizitii-publice-suspecte",
    title: "Procurorii anticorupție deschid o anchetă privind achiziții publice suspecte",
    lead: "O anchetă a fost deschisă după ce mai multe contracte de achiziții publice au fost semnalate ca fiind supraevaluate.",
    bodyHtml:
      "<h2>Ce se investighează</h2><p>Procurorii verifică dacă procedurile de licitație au fost respectate la mai multe contracte derulate în ultimul an.</p><h2>Etapa actuală</h2><p>Ancheta se află la început, iar autoritățile nu au confirmat nume de persoane vizate.</p>",
    section: "national",
    topics: ["coruptie"],
    publishedAt: minutesAgo(160),
    sourceCount: 5,
  },
  {
    slug: "ministerul-sanatatii-anunta-o-campanie-nationala-de-vaccinare-gratuita",
    title: "Ministerul Sănătății anunță o campanie națională de vaccinare gratuită",
    lead: "Campania se va derula în toate raioanele țării și vizează populația din grupele de risc.",
    bodyHtml:
      "<h2>Cine se poate vaccina</h2><p>Programările se pot face la medicul de familie sau direct la centrele comunitare desemnate.</p><h2>Durata campaniei</h2><p>Autoritățile estimează o durată de câteva săptămâni, în funcție de stocurile disponibile.</p>",
    section: "national",
    topics: ["sanatate"],
    publishedAt: minutesAgo(400),
    sourceCount: 4,
  },
  {
    slug: "uniunea-europeana-anunta-un-nou-pachet-de-sprijin-pentru-republica-moldova",
    title: "Uniunea Europeană anunță un nou pachet de sprijin pentru Republica Moldova",
    lead: "Sprijinul vizează în special infrastructura energetică și reformele din justiție.",
    bodyHtml:
      "<h2>Ce cuprinde pachetul</h2><p>Fondurile vor fi direcționate către proiecte de infrastructură și programe de asistență tehnică.</p><h2>Reacții</h2><p>Oficialii europeni au subliniat continuitatea sprijinului acordat R. Moldova în procesul de aderare.</p>",
    section: "international",
    topics: [],
    publishedAt: minutesAgo(95),
    sourceCount: 8,
  },
  {
    slug: "val-de-solidaritate-in-europa-pentru-comunitatea-moldoveneasca",
    title: "Val de solidaritate în Europa pentru comunitatea moldovenească",
    lead: "Mai multe organizații europene s-au alăturat unor inițiative de sprijin pentru comunitățile moldovenești din diaspora.",
    bodyHtml:
      "<h2>Inițiativele</h2><p>Acțiunile includ evenimente culturale și campanii de strângere de fonduri.</p><h2>Impact</h2><p>Organizatorii speră ca inițiativele să continue și în lunile următoare.</p>",
    section: "international",
    topics: ["social"],
    publishedAt: minutesAgo(260),
    sourceCount: 3,
  },
  {
    slug: "comunitatea-moldovenilor-din-italia-organizeaza-un-eveniment-cultural-la-roma",
    title: "Comunitatea moldovenilor din Italia organizează un eveniment cultural la Roma",
    lead: "Evenimentul reunește artiști și meșteșugari moldoveni stabiliți în Italia, cu scopul de a promova tradițiile locale.",
    bodyHtml:
      "<h2>Programul evenimentului</h2><p>Sunt așteptate ateliere de meșteșugărit, muzică live și degustări de bucate tradiționale.</p><h2>Comunitatea</h2><p>Organizatorii estimează participarea a câtorva sute de persoane din toată regiunea.</p>",
    section: "diaspora",
    country: "italia",
    topics: ["social"],
    publishedAt: minutesAgo(130),
    sourceCount: 3,
  },
  {
    slug: "un-sportiv-moldovean-din-franta-obtine-o-performanta-notabila-la-un-turneu-regional",
    title: "Un sportiv moldovean din Franța obține o performanță notabilă la un turneu regional",
    lead: "Sportivul, stabilit de câțiva ani în Franța, s-a calificat în finala unui turneu regional important din categoria sa.",
    bodyHtml:
      "<h2>Parcursul</h2><p>A ajuns în finală după o serie de meciuri disputate în fața unor adversari puternici.</p><h2>Ce urmează</h2><p>Finala este programată pentru weekendul viitor.</p>",
    section: "diaspora",
    country: "franta",
    topics: ["sport"],
    publishedAt: minutesAgo(340),
    sourceCount: 2,
  },
];
