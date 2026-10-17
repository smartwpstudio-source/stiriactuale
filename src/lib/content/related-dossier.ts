import { getGuide } from "./guides";
import { stripDiacritics } from "@/lib/pipeline/text-normalize";

// știri despre școli și universități din alte țări (text fără diacritice, litere mici)
// lângă o tragedie (elev lovit, copil dispărut) nu punem un ghid de educație
const NO_TRAGEDY = String.raw`(?!.*(a murit|au murit|deced\w*|mortal\w*|\bmorti\b|si-?a pierdut viata|fara viata|cadavr\w*|tragedi\w*|ucis\w*|omor\w*|violat\w*|agres\w*|accident\w*|lovit\w* de|disparut\w*|spitaliz\w*|intoxica\w*|\bars\w*|inec\w*))`;
const NOT_ABROAD = String.raw`(?!.*(romani(a|ei)\b|bucuresti|\biasi\b|franta|frantei|germania|germaniei|italia|italiei|spania|spaniei|rusia|rusiei|moscova|ucraina|ucrainei|\bkiev|\bsua\b|statele unite|american|marea britanie|regatul unit|londra|harvard|oxford|cambridge|sorbona|polonia|israel|turcia|china))`;

// Dosarul-pilon al subiectului („Context”), sus în știre: o știre despre UE
// trimite mereu la dosarul aderării, una despre Tiraspol la Transnistria etc.
// Expresii precise (fără diacritice), în ordinea priorității — Transnistria și
// sancțiunile înaintea UE, care apare în multe știri.
const RULES: [slug: string, re: RegExp][] = [
  ["aderarea-moldovei-la-ue-etape-si-calendar", /aderar\w* (la ue|la uniune|moldovei|europeana)|negocier\w* de aderare|integrar\w* europe|acquis|planul de crestere/],
  ["transnistria-situatia-regiunii-si-impactul", /transnistri|tiraspol|stanga nistrului|krasnoselski/],
  ["ue-rusia-sanctiuni-dosar", /sanctiun\w* (ue |ale ue |europene )?(impotriva |pentru )?(rusi|moscov)|pachet\w* de sanctiuni/],
  ["razboiul-din-ucraina-dosar", /razboi\w* din ucraina|invazi\w* rus|frontul? din ucraina|zelenski/],
  // pilonul armatei: doar termeni moldovenești („militar”, „mobilizare”, „rezerviști”
  // singure apar în știrile despre Rusia, Ucraina, Israel); MApN e ministerul român
  ["armata-nationala-a-moldovei-ghid-complet", /armat\w* national\w*\b(?! (libian|afgan|sirian|congolez|a ucrainei))|statul major al apararii|ministerul apararii(?! (nationale|al (?!republicii moldova)|din |de la (moscova|kiev|bucuresti)|rus|ucrainean|israelian|american|britanic|francez|german))|centr\w* militar\w* teritorial|sectii\w* administrativ-militar|livret\w* militar|adeverint\w* de recrutare|comisi\w* de recrutare|militar\w* moldoveni|contingent\w* (moldovenesc|al armatei nationale)|serviciu\w* civil \(?de alternativ/],
  ["armata-nationala-a-moldovei-ghid-complet", /^(?=.*(moldov|chisinau))(?!.*(rusi[ae]|ucrain|israel|kiev|moscov|putin))(?=.*(serviciu\w* militar|incorpor\w* (in|a|de) |recrut\w*|evidenta militara|mobilizar\w* (generala|partiala|militara|a rezervistilor)|rezervist\w*|exercit\w* militar\w*|bugetul apararii|militar\w* prin contract))/],
  // „UE” singură apare și în știri străine (Letonia, ciuma): doar împreună cu Moldova
  ["aderarea-moldovei-la-ue-etape-si-calendar", /^(?=.*(\bue\b|uniun\w* europe))(?=.*(moldov|chisinau))/],
  // pilonul crizei: când știrea e despre criză în ansamblu, nu doar despre tarif / datorii
  ["criza-energetica-din-moldova-cauze-cronologie-facturi", /criz\w* energetic|criza gazelor|stare\w* de urgenta (in|pe|din) energetic|mgres|cuciurgan|sistar\w* (a )?livrar\w* de gaz/],
  ["moldovagaz-si-datoriile-la-gaz", /moldovagaz|gazprom/],
  ["pretul-gazului-in-moldova-tarif-si-schimbari", /pretul (la )?gaz|tarif\w* (la|pentru) gaz|gazul (se )?scump|metrul cub de gaz/],
  ["independenta-energetica-gaz-si-curent-moldova", /energocom|independent\w* energetic|interconect|linia (electrica|de inalta tensiune)|vulcanesti\W{1,3}(chisinau|balti|suceava)|(linia|lea)\b.{0,40}vulcanesti|securitat\w* energetic/],
  ["reforma-justitiei-vetting-judecatori-procurori", /vetting|evaluar\w* (externa )?a judecator|consiliul superior al magistraturii|reforma justitiei/],
  ["furtul-miliardului-cronologia-dosarului", /furtul miliardului|frauda bancara/],
  ["aeroportul-international-chisinau-concesionare-procese", /aeroport\w* (international )?(din )?chisinau|avia invest/],
  ["reforma-administrativ-teritoriala-raioane-primarii", /reforma administrativ|comasar\w* (a )?primarii|lichidar\w* raioan|amalgamar/],
  ["pensii-si-salarii-indexari-si-calcul", /indexar\w* (a )?pensii|pensiile (se )?indexeaza/],
  // violența în familie și femicidul (rubrica din 2026-10-14) — înaintea escrocheriilor și a pensiilor
  ["violenta-in-familie-in-moldova-cum-o-recunosti-unde-ceri-ajutor-ce-spune-legea", /violent\w* (in|din) famili|violent\w* domestic|violent\w* (impotriva|asupra) (femeilor|femeii|sotiei|partenerei)|femicid|ordin\w* de restrictie|ordonant\w* de protectie|(sot|sotul|sotia|sotie|concubin\w*|fost\w* (sot|partener|iubit)\w*)\b.{0,80}\b(lovit\w*|batut\w*|bataie|agresat\w*|ucis\w*|omor\w*|injunghiat\w*|amenint\w*|sechestrat\w*)|(lovit\w*|batut\w*|agresat\w*|ucis\w*|omor\w*|injunghiat\w*)\b.{0,60}\b(sotia|sotul|concubin\w*|fost\w* (sotie|partenera|iubita))/],
  // escrocheriile înaintea pensiilor: „pensionară păcălită” e despre escroci
  ["escrocheriile-in-moldova-cum-le-recunosti-si-ce-faci", /^(?!.*(electoral|alegeri|\bvot\b|furtul miliardului))(?=.*(escroc|\bfraud(a|e|at)\w*|phishing|pacalit\w*|inselat\w* de|investiti\w* false|schema de investitii|apel\w* fals|sms\w* fals))/],
  // drepturile consumatorului (2026-10-16), după escrocherii („fraudă cu cardul” rămâne la escroci);
  // fără „consumator”, „retur” sau „garanție” singure: consumatorii de gaz, meciul retur, garanțiile bancare
  ["produse-alimentare-expirate-sau-alterate-unde-reclami", /(produs\w*|aliment\w*|carne|lactate)( alimentar\w*)? (expirat\w*|alterat\w*)|termen\w* de valabilitate (expirat|depasit)/],
  ["plata-cu-cardul-contestare-tranzactie-chargeback", /chargeback|contest\w* (o |a )?(tranzacti|plat\w* cu cardul)|tranzacti\w* (neautorizat|contestat)\w*|debitar\w* (dubl|de doua ori)/],
  ["cumparaturi-online-dreptul-de-retur-fara-motiv", /drept\w* de (retur|revocare)|returnar\w* (a )?(produs|marf)\w*/],
  ["drepturile-consumatorului-returnarea-unui-produs-si-garantia", /termen\w* de garantie|garanti\w* (legal\w* )?(de conformitate|a produsului|produselor)/],
  ["drepturile-consumatorului-in-moldova-ghid-complet", /protecti\w* (drepturilor )?consumatorilor|drepturil\w* consumator|\bapcsp\b|isspnpc|supravegherea produselor nealimentare|agenti\w* pentru protectia consumatorilor|clauz\w* abuziv|centrul unic de apel pentru consumatori/],
  // afacerea mică (2026-10-15): IMM, ODA, granturi pentru afaceri, antreprenori independenți
  ["afacerea-mica-in-moldova-imm-ghid-complet", /\bimm\b|intreprinderi\w* mici (si|și) mijlocii|organizati\w* pentru dezvoltarea antreprenoriatului|\boda\b.{0,80}(grant|program|apel|antreprenor)|(grant|program|apel)\w*.{0,80}\boda\b|crestem imm|antreprenoriat\w*|antreprenor\w* independent|regimul (fiscal )?(pentru )?imm/],
  // inteligența artificială (2026-10-15) — după escrocherii: „deepfake cu investiții false” rămâne la escrocherii
  ["inteligenta-artificiala-ghid-practic-moldova", /inteligent\w* artificial|\bdeepfake|chatgpt|\bchatbot|voce\w* clonat|clonar\w* (a )?voc/],
  // pilonul pensiilor („pensiune” = casă de oaspeți, nu intră)
  ["pensiile-in-moldova-tot-ce-trebuie-sa-stii", /\bpensi(a|e|i|ii|ile|ilor|onar\w*)\b|varsta de pensionare|stagiu\w* de cotizare/],
  ["preturile-la-alimente-si-inflatia-date-bns-bnm", /inflati/],
  // cetățenia Moldovei (2026-10-17): redobândire, renunțare, examen; nu cetățenia română, rusă etc.
  ["cetatenia-moldovei-din-rusia-redobandire-recunoastere-acte-taxe", /^(?!.*cetatenia? (romana|romaneasca|romaniei|italiana|rusa|ruseasca|rusiei|bulgara|ucraineana|americana))(?=.*(redobandir\w* (a )?cetateniei|renunt\w* la cetatenie|legea cetateniei|examen\w* (de |pentru )?cetatenie|dubla cetatenie|cetateni(a|ei) (republicii moldova|moldoveneasc\w*|moldovei)))/],
  ["migratia-si-depopularea-moldovei-cifre-oficiale", /depopular|recensamant|exodul|emigrar\w* in masa/],
  // ghidurile-pilon pentru șoferi și amenzi (după dosare: o știre despre UE rămâne la UE)
  ["alcoolul-la-volan-limite-si-sanctiuni", /(beat|baut|ebrietate|alcool\w*|alcoolemi\w*) (la volan|in trafic)|sub influenta alcoolului|alcooltest/],
  ["cum-obtii-permisul-de-conducere-in-moldova-pas-cu-pas", /scoal\w* auto|examen\w* (auto|de conducere|teoretic|practic)|obtiner\w* (a )?permisului|permis\w* de conducere (nou|pentru tineri)/],
  ["reguli-de-circulatie-incalcate-des-si-amenzile", /regulament\w* (circulatiei|de circulatie)|reguli\w* de circulatie|puncte de penalizare|telefonul la volan|centur\w* de siguranta|depasir\w* (neregulamentar|pe linia continua)|exces de viteza|limita de viteza|\bradar\w*/],
  ["amenzile-in-moldova-cine-te-poate-amenda-si-cum-contesti", /\bamend\w*|\bamenz\w*|proces\w*-verbal\w* (de contraventie)?|contraventi\w*/],
  ["inspectia-tehnica-periodica-a-masinii-in-moldova", /inspecti\w* tehnic\w*|revizi\w* tehnic\w*/],
  // pilonul instanțelor: procese, judecătorii, chemări în judecată (după dosarele
  // mari — reforma justiției, furtul miliardului — care au prioritate)
  ["instanta-de-judecata-in-moldova-ghid-practic", /judecatori(a|ei|ile)\b|instant\w* de judecata|chemat\w* in judecata|actiun\w* in instanta|proces\w* (civil|de judecata)|sedint\w* de judecata|curtea de apel|curtea suprema de justitie|\bcsj\b/],
  // accident cu mașini, FĂRĂ morți: ce faci cu asigurarea; lângă o tragedie, nimic
  ["accidentul-usor-constatare-amiabila-si-rca", /^(?!.*(a murit|au murit|deced\w*|mortal\w*|\bmorti\b|si-?a pierdut viata|fara viata|fara suflare|cadavr\w*|tragedi\w*|spulberat\w*|\bgrav\w*|\bars\w*|ucis\w*|victim\w*|teribil\w*))(?=.*(accident\w* (rutier|de circulatie|in lant)|s-au ciocnit|tamponat\w*|coliziun\w*|s-a rasturnat|a lovit (o|un) (masina|automobil)))/],
  // pilonul șoferilor: orice altă știre despre mașini și șoferi (nu accidentele —
  // acolo „șoferul” e la singular și nu e o temă pentru șoferi)
  ["masina-in-moldova-ghidul-complet-al-soferului", /parc\w* auto|inmatricul\w*|vamuir\w*|\bsoferi(i|lor)?\b|automobilist\w*|piata auto|masini(le)? (noi|second|electrice|la mana a doua)|autovehicul\w*|girofar\w*|vinieta|taxa (de|pentru) drum/],
  // încălzirea locuinței (înaintea pilonului întreprinderilor, care prinde și „Termoelectrica”)
  ["sezonul-de-incalzire-2026-2027", /calorifer|sezon\w* de incalzire|agent\w* termic|incalzir\w* centralizat|pornir\w* (a )?(caldurii|incalzirii)|termoficar/],
  // companiile statului: Poșta, trenurile, apoi pilonul (după Moldovagaz, Energocom
  // și Aeroport, care au dosarele lor; „Poșta Română” nu intră)
  ["posta-moldovei-servicii-tarife-urmarire-colete", /posta moldovei/],
  ["calea-ferata-din-moldova-trenuri-rute-bilete", /calea ferata (din|a) moldovei|\bcfm\b|tren\w* (de calatori )?(pe ruta |spre )?(chisinau|ungheni|balti|bucuresti|odesa|iasi|kiev)/],
  // „IS”/„APP” doar cu ghilimele sau context; privatizarea apartamentului nu intră
  ["intreprinderile-de-stat-din-moldova", /intreprinder\w*( \w+){0,2} (de stat|municipal\w*)|\bi\.?s\.? ?["„“«]|agenti\w* proprietatii publice|^(?=.*\bapp\b)(?=.*(privatiz|licitati|intreprinder|director|concurs|proprietat))|privatiz\w*\b(?! (a |al )?(apartament|locuint|cas))|deetatizar\w*|capital\w* (integral |majoritar )?de stat|metalferos|moldelectrica|moldtelecom|(?<!centrala )\btermoelectrica\b/],
  // educația, la final: „elev”, „școală”, „ministerul educației” apar și în știrile
  // din România, Franța etc. (NOT_ABROAD); „școala auto” e prinsă mai sus de permis
  ["bacalaureatul-2027-calendar-probe-contestatii", new RegExp(String.raw`^${NOT_ABROAD}(?=.*(bacalaureat|\bbac-?ul(ui)?\b|\bbac 20\d\d))`)],
  ["admiterea-2027-la-colegii-si-facultati", new RegExp(String.raw`^${NOT_ABROAD}(?=.*(admiter\w* (la |in )?(colegi|scoli\w* profesional|invatamantul profesional|centr\w* de excelenta)|eadmitere\.sime))`)],
  ["admiterea-la-facultate-in-moldova-calendar-si-acte", new RegExp(String.raw`^${NOT_ABROAD}(?=.*(admiter\w* (la |in )?(facultat|universitat|studii superioare|licenta|master|doctorat)|eadmitere|locur\w* bugetare))`)],
  // pilonul: „MEC” doar lângă un termen școlar; „elevator”/„elevat” nu intră
  ["educatia-in-moldova-ghid-complet", new RegExp(String.raw`^${NOT_ABROAD}${NO_TRAGEDY}(?=.*(ministerul educatiei|\bmec\b.*(scoal|elev|profesor|educati|invatamant|student|gradinit)|(scoal|elev|profesor|educati|invatamant|student|gradinit)\w*.*\bmec\b|cadre(le|lor)? didactic\w*|profesor\w* (din|de la) scoal|\belev(ul|ului|a|ei|i|ii|ilor|e|ele|elor)?\b|gradinit\w*|\bscoal(a|ii|ile|ilor)\b|institut\w* de invatamant|\binvatamant\w*|universitat\w* (de stat|din moldova|din chisinau|din balti|tehnica|pedagogic\w*|de medicina)|comasar\w* (a )?scolilor|(optimizar|reorganizar)\w* (a )?(retelei scolare|scolilor)|(testar\w*|evaluar\w*|rezultat\w*|testul) pisa\b|\bpisa 20\d\d|examen\w* de absolvire|anul de studii|anul scolar))`)],
  // rubricile evergreen (2026-10-11): vremea -> calendarul agricol, animalele,
  // casa și blocul, turismul. La final: regulile mai precise de mai sus au prioritate.
  ["calendarul-agricol-al-moldovei-ce-si-cand-semeni", /^(?=.*(inghet|\bbrum[ae]\b|grindin|secet|\bger\b|geruri|canicul|ploi\w* torential))(?=.*(agricult|fermier|recolt|culturi|livez|livad|\bvii\b|viile|vita de vie|podgor|gradin|legum|\bpomi\b|pomicult|cereal|\bgrau\b|porumb|floarea-soarelui|stupin|albin))/],
  ["stropirile-si-albinele-ce-spune-legea", /^(?=.*albin)(?=.*(stropi|pesticid|tratament\w* chimic|otrav|intoxic|mortalitat|au murit))/],
  ["stuparitul-pe-anotimpuri-obligatii-si-lucrari", /apicult|stupin|\bstupi(i|lor)?\b/],
  ["ce-faci-daca-te-musca-un-caine-rabie-maidanezi", /\brabi(e|ei|a)\b|maidanez|caini? fara stapan|(muscat|atacat|sfasiat)\w* de (un |o )?(caine|caini|haita)|haita de caini/],
  ["calatoria-cu-cainele-sau-pisica-in-ue-din-moldova", /^(?=.*(animal\w* de companie|cainele|pisica|\bcaini\b|pisici))(?=.*(calator|frontier|\bvama\b|avion|zbor))/],
  ["animalul-de-companie-in-moldova-acte-vaccin-reguli", /animal\w* de companie|adapost\w* (pentru|de) (animale|caini)|cruzim\w* (fata de|asupra) animal|maltrat\w* (un |a )?(caine|pisic|animal)|microcip/],
  ["intoxicatia-cu-monoxid-de-carbon-semne-prim-ajutor", /monoxid|intoxica\w* cu (fum|gaz)/],
  ["verificarea-gazului-si-a-cosului-de-fum-obligatii", /(explozi\w*|scurger\w*|miros\w*) (de |a )?gaz|\bcos\w* de fum|detector\w* de gaz/],
  ["mucegaiul-in-apartament-cauze-ce-faci-sanatate", /mucegai/],
  ["asociatia-de-proprietari-condominiu-drepturile-locatarilor", /asociati\w* de proprietari|condominiu|\bimgfl\b/],
  ["reparatiile-in-bloc-acoperis-subsol-fatada-cine-plateste", /(acoperis|subsol|fatad|ascensor|\blift)\w* (blocului|blocurilor|de bloc)|reparati\w* (a |la )?(blocului|blocurilor)/],
  ["deseurile-sortare-voluminoase-tarife-salubrizare", /deseur|\bgunoi|salubriz|autosalubritate/],
  ["casa-si-blocul-intretinere-siguranta-drepturi", /incendi\w* (in|intr-un|intr-o) (apartament|bloc|casa|locuint)|locatari\w* (blocului|din bloc)/],
  ["bucataria-moldoveneasca-istorie-feluri-traditii", /bucatari\w* (moldoveneasc|traditional|national)|bucate traditionale|retet\w* traditional/],
  ["moldova-turistica-ce-vizitezi-trasee-vinarii-manastiri", new RegExp(String.raw`^${NOT_ABROAD}(?!.*(bucovin|maramures|bulgari|greci|egipt|antalya|dubai|emirat|muntenegr|georgi|austri|cehi|ungari|budapest|praga|viena|cluj|brasov|sibiu|poiana))(?=.*(turism|turist|orheiul vechi|drumul vinului|iter vitis|agroturism|pensiun\w* (turistic|agroturistic)))`)],
  // escrocheriile (nu frauda electorală sau bancară mare — acelea au dosarele lor) și banii
  ["banii-in-familie-buget-economii-credite-ghid-complet", /dobanz\w* (la|pentru) (depozit|credit)|rata de baza|depozit\w* bancar|credit\w* (de consum|ipotecar|imobiliar)|valor\w* mobiliare de stat|\bevms\b/],
];

export function matchDossier(text: string): string | undefined {
  const t = stripDiacritics(text).toLowerCase();
  return RULES.find(([, re]) => re.test(t))?.[0];
}

// ghidurile cu reguli și amenzi din Moldova: nu la știrile din străinătate
// („Germania: amenda pentru parcare” nu ține de Codul contravențional)
const MOLDOVA_ONLY = new Set([
  "armata-nationala-a-moldovei-ghid-complet",
  "instanta-de-judecata-in-moldova-ghid-practic",
  "masina-in-moldova-ghidul-complet-al-soferului",
  "inspectia-tehnica-periodica-a-masinii-in-moldova",
  "alcoolul-la-volan-limite-si-sanctiuni",
  "accidentul-usor-constatare-amiabila-si-rca",
  "cum-obtii-permisul-de-conducere-in-moldova-pas-cu-pas",
  "reguli-de-circulatie-incalcate-des-si-amenzile",
  "amenzile-in-moldova-cine-te-poate-amenda-si-cum-contesti",
  "intreprinderile-de-stat-din-moldova",
  "calea-ferata-din-moldova-trenuri-rute-bilete",
  "posta-moldovei-servicii-tarife-urmarire-colete",
  "educatia-in-moldova-ghid-complet",
  "bacalaureatul-2027-calendar-probe-contestatii",
  "admiterea-2027-la-colegii-si-facultati",
  "admiterea-la-facultate-in-moldova-calendar-si-acte",
  "calendarul-agricol-al-moldovei-ce-si-cand-semeni",
  "stropirile-si-albinele-ce-spune-legea",
  "stuparitul-pe-anotimpuri-obligatii-si-lucrari",
  "ce-faci-daca-te-musca-un-caine-rabie-maidanezi",
  "calatoria-cu-cainele-sau-pisica-in-ue-din-moldova",
  "animalul-de-companie-in-moldova-acte-vaccin-reguli",
  "intoxicatia-cu-monoxid-de-carbon-semne-prim-ajutor",
  "verificarea-gazului-si-a-cosului-de-fum-obligatii",
  "mucegaiul-in-apartament-cauze-ce-faci-sanatate",
  "asociatia-de-proprietari-condominiu-drepturile-locatarilor",
  "reparatiile-in-bloc-acoperis-subsol-fatada-cine-plateste",
  "deseurile-sortare-voluminoase-tarife-salubrizare",
  "casa-si-blocul-intretinere-siguranta-drepturi",
  "bucataria-moldoveneasca-istorie-feluri-traditii",
  "moldova-turistica-ce-vizitezi-trasee-vinarii-manastiri",
  "escrocheriile-in-moldova-cum-le-recunosti-si-ce-faci",
  "violenta-in-familie-in-moldova-cum-o-recunosti-unde-ceri-ajutor-ce-spune-legea",
  "banii-in-familie-buget-economii-credite-ghid-complet",
  "sezonul-de-incalzire-2026-2027",
  "drepturile-consumatorului-in-moldova-ghid-complet",
  "drepturile-consumatorului-returnarea-unui-produs-si-garantia",
  "cumparaturi-online-dreptul-de-retur-fara-motiv",
  "produse-alimentare-expirate-sau-alterate-unde-reclami",
  "plata-cu-cardul-contestare-tranzactie-chargeback",
]);

// slug-ul dosarului / ghidului-pilon (fără citirea ghidului) — și pentru
// regula „știre cu ghid” din pipeline (guide-rule.ts)
export function dossierSlug(title: string, lead: string, topics: string[] = [], section?: string): string | undefined {
  // subiectul „criză energetică” fără o regulă mai precisă -> pilonul crizei
  const slug = matchDossier(`${title} ${lead}`) ?? (topics.includes("criza-energetica") ? "criza-energetica-din-moldova-cauze-cronologie-facturi" : undefined);
  if (slug && MOLDOVA_ONLY.has(slug) && (section === "diaspora" || section === "international")) return undefined;
  return slug;
}

export async function getRelatedDossier(title: string, lead: string, topics: string[] = [], section?: string) {
  const slug = dossierSlug(title, lead, topics, section);
  return slug ? getGuide(slug) : undefined;
}
