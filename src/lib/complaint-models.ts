import { getGuide } from "./content/guides";
import { getGuideRu, type GuideRu } from "./content/guides-ru";
import { decodeEntities } from "./html-entities";

// Modele de reclamații completabile (/modele-reclamatii/). Textul NU e
// duplicat aici: e secțiunea „Model de …” din ghidul legat, citită la build —
// ghidul și modelul rămân mereu la fel. Câmpurile = parantezele drepte.
export const COMPLAINT_MODELS = [
  { slug: "banca-asigurator-ocn", guide: "reclamatia-la-banca-asigurator-sau-ocn-noile-reguli", title: "Reclamație la bancă, asigurător sau OCN", description: "Comision nejustificat, tranzacție necunoscută, refuz de rambursare: reclamația scrisă după noile reguli CNPF, cu termen de răspuns de 15 zile lucrătoare." },
  { slug: "asigurator-despagubire", guide: "asiguratorul-nu-plateste-despagubirea-rca-casco", title: "Reclamație la asigurător: despăgubire RCA sau CASCO neplătită", description: "Asigurătorul întârzie, refuză sau plătește prea puțin: reclamația cu termenele din Legea RCA și Codul civil." },
  { slug: "colectori-datorii", guide: "colectorii-de-datorii-ce-au-voie-si-unde-reclami", title: "Scrisoare către colectorii de datorii", description: "Ceri copia contractului și calculul datoriei și oprești apelurile către rude, colegi și angajator." },
  { slug: "executor-judecatoresc", guide: "executorul-judecatoresc-drepturile-debitorului-si-plangerea", title: "Plângere împotriva executorului judecătoresc", description: "Plângere disciplinară pentru încălcări ale executorului: sechestru pe bunuri neurmăribile, rețineri peste limită, lipsă de informare." },
  { slug: "notar", guide: "plangere-impotriva-notarului-taxe-refuz-greseli", title: "Plângere împotriva notarului", description: "Notarul a refuzat actul, a cerut prea mult sau a greșit: plângerea la Colegiul disciplinar al notarilor." },
  { slug: "avocat", guide: "plangere-impotriva-avocatului-contract-onorariu", title: "Plângere împotriva avocatului", description: "Avocatul nu și-a făcut treaba sau nu returnează onorariul: plângerea la Comisia pentru etică și disciplină." },
  { slug: "petitie-primarie-minister", guide: "petitia-la-primarie-sau-minister-termen-de-raspuns", title: "Petiție la primărie, minister sau altă autoritate", description: "Petiția după Codul administrativ, cu termenul legal de răspuns de 30 de zile." },
  { slug: "operator-telefonie-internet", guide: "plangere-operator-telefonie-internet-anrceti", title: "Reclamație la operatorul de telefonie sau internet", description: "Factură greșită, abonament nesolicitat, internet care nu merge: reclamația la operator, apoi la ARCOM." },
  { slug: "medic-spital", guide: "plangere-medic-sau-spital-plati-ilegale-cnam", title: "Plângere împotriva medicului sau spitalului", description: "Plăți cerute ilegal, refuz de asistență, atitudine necorespunzătoare: plângerea la instituție și la CNAM." },
  { slug: "magazin-online", guide: "cumparaturi-online-colet-nelivrat-cum-reclami", title: "Reclamație la magazinul online: comandă nelivrată", description: "Ai plătit și produsul nu a venit: ceri livrarea sau banii înapoi, cu temeiul din Codul civil și Legea protecției consumatorilor." },
  { slug: "garantie-chirie", guide: "garantia-de-la-chirie-nereturnata-ce-faci", title: "Somație pentru returnarea garanției de la chirie", description: "Proprietarul nu-ți dă înapoi garanția: somația scrisă înainte de instanță." },
  { slug: "contestatie-amenda", guide: "amenzile-in-moldova-cine-te-poate-amenda-si-cum-contesti", title: "Contestație la procesul-verbal de amendă", description: "Contești amenda de la Poliție, primărie, ANSA sau alt agent constatator: contestația în 15 zile, cu probele și cererea de anulare." },
  { slug: "apartament-constructie-intarziat", guide: "apartament-in-constructie-intarziat-drepturile-cumparatorului", title: "Somație către dezvoltator: apartament predat cu întârziere", description: "Dezvoltatorul a depășit termenul din contract: somația cu penalitățile și termenul final." },
] as const;

export type ComplaintModel = (typeof COMPLAINT_MODELS)[number];
export type ComplaintLang = "ro" | "ru";

// Versiunea rusă (/ru/modele-reclamatii/): titlul și descrierea traduse aici;
// etichetele câmpurilor vin din „Образец …” al ghidului rusesc. Scrisoarea
// rămâne în română — instituțiile o primesc în limba de stat.
export const COMPLAINT_MODELS_RU: Record<ComplaintModel["slug"], { title: string; description: string }> = {
  "banca-asigurator-ocn": { title: "Жалоба в банк, страховщику или ОКН (OCN)", description: "Необоснованная комиссия, неизвестная транзакция, отказ в возврате денег: письменная жалоба по новым правилам Национальной комиссии по финансовому рынку (CNPF), срок ответа — 15 рабочих дней." },
  "asigurator-despagubire": { title: "Жалоба страховщику: не выплачено возмещение по RCA или КАСКО", description: "Страховщик затягивает выплату, отказывает или платит слишком мало: жалоба со сроками из Закона об RCA и Гражданского кодекса." },
  "colectori-datorii": { title: "Письмо коллекторам", description: "Запрашиваете копию договора и расчёт долга и требуете прекратить звонки родственникам, коллегам и работодателю." },
  "executor-judecatoresc": { title: "Жалоба на судебного исполнителя", description: "Дисциплинарная жалоба на нарушения судебного исполнителя: арест имущества, на которое нельзя обращать взыскание, удержания сверх лимита, отсутствие информирования." },
  notar: { title: "Жалоба на нотариуса", description: "Нотариус отказал в нотариальном действии, потребовал слишком много или ошибся: жалоба в Дисциплинарную коллегию нотариусов." },
  avocat: { title: "Жалоба на адвоката", description: "Адвокат не выполнил свою работу или не возвращает гонорар: жалоба в Комиссию по этике и дисциплине." },
  "petitie-primarie-minister": { title: "Петиция в примэрию, министерство или другой орган", description: "Петиция по Административному кодексу (Codul administrativ) с установленным законом сроком ответа 30 дней." },
  "operator-telefonie-internet": { title: "Жалоба на оператора связи или интернет-провайдера", description: "Неверный счёт, навязанная подписка, не работает интернет: жалоба оператору, затем в Национальное агентство по регулированию в области коммуникаций (ARCOM)." },
  "medic-spital": { title: "Жалоба на врача или больницу", description: "Незаконно требовали деньги, отказали в помощи, некорректное отношение: жалоба в учреждение и в Национальную медицинскую страховую компанию (CNAM)." },
  "magazin-online": { title: "Жалоба в интернет-магазин: заказ не доставлен", description: "Вы заплатили, а товар не пришёл: требуете доставку или возврат денег на основании Гражданского кодекса и Закона о защите прав потребителей." },
  "garantie-chirie": { title: "Претензия о возврате залога за аренду жилья", description: "Хозяин не возвращает залог: письменная претензия до обращения в суд." },
  "contestatie-amenda": { title: "Жалоба на протокол о штрафе", description: "Обжалуете штраф полиции, примэрии, Национального агентства по безопасности пищевых продуктов (ANSA) или другого констатирующего агента: жалоба в течение 15 дней, с доказательствами и требованием отменить протокол." },
  "apartament-constructie-intarziat": { title: "Претензия застройщику: квартира сдана с опозданием", description: "Застройщик нарушил срок по договору: претензия с неустойкой и окончательным сроком." },
};

/** Titlul și descrierea modelului în limba paginii. */
export const modelText = (m: ComplaintModel, lang: ComplaintLang): { title: string; description: string } =>
  lang === "ru" ? COMPLAINT_MODELS_RU[m.slug] : m;
/** /modele-reclamatii/[slug/] sau /ru/modele-reclamatii/[slug/] */
export const modelPath = (lang: ComplaintLang, slug?: string) => `${lang === "ru" ? "/ru" : ""}/modele-reclamatii/${slug ? `${slug}/` : ""}`;

// Un paragraf = text simplu și câmpuri; câmpul e eticheta din paranteze.
export type Part = string | { field: number; label: string; long: boolean };
export interface Template {
  paragraphs: Part[][];
  // hint: textul dinaintea câmpului, când eticheta se repetă („data” de 4 ori);
  // today: „Data: [data]” de la semnătură — completat cu data de azi
  fields: { label: string; long: boolean; hint?: string; today?: boolean }[];
}

const strip = (html: string) => decodeEntities(html.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
const isLong = (label: string) => label.length > 40 || /descri|faptel/i.test(label);

// Parantezele de pe primul nivel sunt câmpuri ([cererea: suma de [suma] lei]
// = un singur câmp, cu eticheta fără parantezele interioare). [semnătura] nu e
// câmp: rămâne linie de semnat de mână. Sfârșitul = „Semnătura: [semnătura]”,
// nu orice „semnătură” din text („contra semnătură” la garanția de chirie).
// Același parser citește și „Образец” din ghidul rusesc (Кому … Подпись).
export function parseTemplate(sectionHtml: string): Template {
  const paras = [...sectionHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => strip(m[1]));
  const start = paras.findIndex((p) => /^(Către\b|Кому:)/.test(p));
  const end = paras.findIndex((p, i) => i >= start && /\[(semnătur|подпис)|(Semnătura|Подпись):/i.test(p));
  const letter = start < 0 ? [] : paras.slice(start, end < 0 ? undefined : end + 1);
  const fields: Template["fields"] = [];
  const paragraphs = letter.map((text) => {
    const parts: Part[] = [];
    let buf = "";
    let depth = 0;
    let label = "";
    for (const ch of text) {
      if (ch === "[") {
        if (depth === 0) {
          if (buf) parts.push(buf);
          buf = "";
          label = "";
        }
        depth++;
      } else if (ch === "]" && depth > 0) {
        depth--;
        if (depth === 0) {
          const l = label.trim();
          if (/^(semnătur|подпис)/i.test(l)) parts.push("____________");
          else {
            const before = parts.map((x) => (typeof x === "string" ? x : "…")).join("") + buf;
            const hint = before.trim().split(/\s+/).slice(-5).join(" ");
            fields.push({ label: l, long: isLong(l), hint, today: /^(Data|Дата):?$/.test(before.trim()) });
            parts.push({ field: fields.length - 1, label: l, long: isLong(l) });
          }
        }
      } else if (depth > 0) label += ch;
      else buf += ch;
    }
    if (buf) parts.push(buf);
    return parts;
  });
  const repeated = (l: string) => fields.filter((f) => f.label === l).length > 1;
  for (const f of fields) if (!repeated(f.label) || !f.hint) delete f.hint;
  return { paragraphs, fields };
}

// lang "ru": scrisoarea rămâne cea românească; etichetele câmpurilor (și
// indiciile) vin din modelul rusesc, câmp cu câmp — aceleași paranteze, în
// aceeași ordine. `explain` = modelul rusesc, doar ca explicație (nu se depune).
// Dacă ghidul rusesc lipsește sau nu se potrivește, rămân etichetele românești
// (`ruFields: false` — check:content îl semnalează).
export async function loadComplaintModel(slug: string, lang: ComplaintLang = "ro") {
  const model = COMPLAINT_MODELS.find((m) => m.slug === slug);
  if (!model) return null;
  const guide = await getGuide(model.guide);
  const section = guide?.bodyHtml.match(/<h2>Model[^<]*<\/h2>([\s\S]*?)(?=<h2>|$)/)?.[1];
  if (!guide || !section) return null;
  const template = parseTemplate(section);
  if (!template.paragraphs.length) return null;
  const base = { model, guide, template, guideRu: undefined as GuideRu | undefined, explain: undefined as string[] | undefined, ruFields: false };
  if (lang === "ro") return base;
  const guideRu = await getGuideRu(model.guide);
  const ruSection = guideRu?.bodyHtml.match(/<h2>Образ[^<]*<\/h2>([\s\S]*?)(?=<h2>|$)/)?.[1];
  const ru = ruSection ? parseTemplate(ruSection) : undefined;
  if (!ru || ru.fields.length !== template.fields.length) return { ...base, guideRu };
  const fields = template.fields.map((f, i) => ({ ...f, label: ru.fields[i].label, hint: ru.fields[i].hint }));
  const explain = ru.paragraphs.map((ps) =>
    ps.map((p) => (typeof p === "string" ? p : `[${p.label}]`)).join("").replace(/\s+/g, " ").trim(),
  );
  return { ...base, template: { ...template, fields }, guideRu, explain, ruFields: true };
}

export const modelForGuide = (guideSlug: string) => COMPLAINT_MODELS.find((m) => m.guide === guideSlug);
