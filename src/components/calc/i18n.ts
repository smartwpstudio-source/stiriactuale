import type { CalculatorSlug, Engine, LoanType } from "@/lib/calculators";

// Textele calculatoarelor în română și rusă (/calculatoare/, /ru/calculatoare/).
// Un singur cod: componentele primesc `lang` și iau de aici etichetele; calculul
// (calculators.ts) și parametrii (parametri.json) sunt aceiași. Fără importuri
// de server — fișierul e folosit și în componentele client.
export type Lang = "ro" | "ru";

const LOCALE: Record<Lang, string> = { ro: "ro-MD", ru: "ru-RU" };

// numerele doar la afișare: ro „1.234,56”, ru „1 234,56”
export const num = (n: number, lang: Lang, max = 2) => n.toLocaleString(LOCALE[lang], { maximumFractionDigits: max });

// "2026-10-14" -> 14.10.2026
export const date = (iso: string, lang: Lang) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(LOCALE[lang], { timeZone: "UTC" });

export const money = (n: number, lang: Lang) =>
  `${n.toLocaleString(LOCALE[lang], { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${T[lang].lei}`;

// rusă: 1 день, 2 дня, 5 дней
function ru(n: number, one: string, few: string, many: string) {
  if (!Number.isInteger(n)) return few;
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b === 1) return one;
  if (b > 1 && b < 5) return few;
  return many;
}

const RO = {
  lei: "lei",
  daysUnit: "zile",
  yearsUnit: "ani",
  months: (n: number) => `${n} luni`,
  calc: "Calcul",
  salary: {
    knowGross: "Știu salariul brut",
    knowNet: "Știu cât vreau „în mână”",
    grossInput: "Salariul brut lunar",
    netInput: "Salariul net dorit",
    gross: "Salariul brut",
    cnam: (pct: number) => `Asigurare medicală CNAM (${pct}%)`,
    cnas: (pct: number) => `Contribuții sociale CNAS (${pct}%)`,
    tax: (pct: number) => `Impozit pe venit (${pct}%)`,
    net: "Salariul net („în mână”)",
  },
  sick: {
    avg: (m: number) => `Venitul mediu lunar asigurat (ultimele ${m} luni)`,
    stagiu: "Stagiul total de cotizare",
    days: "Zile de concediu medical (din certificat)",
    employer: (d: number, pct: number) => `Primele ${d} zile — plătește angajatorul (${pct}%)`,
    cnas: (d: number, pct: number) => `Restul de ${d} zile — plătește CNAS (${pct}%, după stagiu)`,
    total: (d: number) => `Total pentru ${d} zile`,
  },
  maternity: {
    avg: (m: number) => `Venitul mediu lunar asigurat (ultimele ${m} luni)`,
    duration: "Durata concediului",
    standard: "durata standard",
    option: (n: number) => `${n} zile`,
    percent: "Procent",
    daily: "Indemnizația pe o zi",
    length: "Durata",
    calendarDays: (n: number) => `${n} zile calendaristice`,
    total: "Total estimat",
  },
  vacation: {
    avg: "Salariul mediu lunar din ultimele 3 luni (brut)",
    days: "Zile de concediu (calendaristice)",
    daily: "Pe o zi calendaristică",
    total: (d: number) => `Indemnizația pentru ${d} zile (brut)`,
  },
  unemployment: {
    avg: "Venitul mediu lunar asigurat (ultimele 12 luni)",
    stagiu: "Stagiul total de cotizare",
    monthly: (pct: number) => `Pe lună (${pct}% din venit)`,
    duration: "Durata plății",
    total: "Total pe toată perioada",
    none: (m: number) => `Fără drept la indemnizație: e nevoie de cel puțin ${m} luni de stagiu de cotizare în ultimele 24 de luni.`,
  },
  childcare: {
    avg: "Venitul mediu lunar asigurat (12 luni înainte de naștere)",
    stage: (pct: number, luni: number) => `${pct}% × ${luni} luni`,
    perMonth: "/ lună",
    option: (id: string, name: string) => `Opțiunea ${id}: ${name}`,
    extra: (sum: string, years: number) => `Plus ${sum} lei pe lună, până la ${years} ani`,
    single: "Indemnizația unică la naștere",
  },
  customs: {
    engine: "Tipul motorului",
    engines: {
      benzina: "Benzină",
      diesel: "Motorină (diesel)",
      "hibrid-benzina": "Hibrid benzină (full hybrid)",
      "hibrid-diesel": "Hibrid diesel (full hybrid)",
      "plugin-benzina": "Plug-in hibrid benzină",
      "plugin-diesel": "Plug-in hibrid diesel",
      electric: "Complet electric",
    } as Record<Engine, string>,
    cm3: "Capacitatea cilindrică",
    cm3Unit: "cm³",
    year: "Anul fabricației",
    value: "Valoarea în vamă (contează doar peste 600.000 lei)",
    duty: "Taxa vamală",
    vat: "TVA",
    zero: "0 lei",
    vatValue: "0 lei (scutit)",
    excise: "Acciza",
    exciseElectric: "0 lei (electric)",
    exciseRow: (rate: string, cm3: string, red: number, age: number) =>
      `Acciza: ${rate} lei × ${cm3} cm³${red ? ` − ${red}%` : ""} (${age} ani)`,
    lux: (pct: number) => `Acciza de lux (${pct}% din valoare)`,
    total: "Total de plată la vamă",
  },
  loan: {
    amount: "Suma împrumutată",
    rate: "Dobânda anuală",
    months: "Termenul",
    monthsUnit: "luni",
    type: "Tipul ratelor",
    types: { anuitate: "Rate egale (anuități)", descrescator: "Rate descrescătoare" } as Record<LoanType, string>,
    monthly: "Rata lunară",
    first: "Prima rată",
    last: "Ultima rată",
    interest: "Total dobândă",
    total: "Total de plată",
    year: "Anul",
    principal: "Credit rambursat",
    interestCol: "Dobândă",
    remaining: "Rămas de plată",
    invalid: "Introdu suma și termenul (cel puțin o lună).",
  },
  schengen: {
    trips: "Călătoriile în spațiul Schengen (ziua intrării și a ieșirii se numără)",
    from: "Data intrării",
    to: "Data ieșirii",
    add: "+ adaugă o călătorie",
    remove: "Șterge",
    control: "Data de control",
    controlHint: "Implicit azi. Pentru o călătorie planificată, adaug-o în listă și pune aici ultima ei zi.",
    window: "Perioada de 180 de zile",
    used: "Zile de ședere în această perioadă",
    remaining: "Zile rămase din 90",
    over: (n: number) => `Ai depășit limita de 90 de zile cu ${n} ${n === 1 ? "zi" : "zile"}.`,
  },
  portions: {
    adults: "Adulți (și copii mari)",
    children: "Copii mici (jumătate de porție)",
    reserve: "Porții de rezervă (pentru cei veniți neanunțați)",
    portions: "Porții calculate",
    items: {
      reci: "Bucate reci (răcitură, mezeluri, brânză)",
      salate: "Salate",
      zeama: "Zeamă",
      sarmale: "Sarmale mici",
      friptura: "Friptură (carne gătită)",
      garnitura: "Garnitură (cartofi, mămăligă)",
      dulciuri: "Plăcinte, cozonac, prăjituri",
      paine: "Pâine",
    } as Record<string, string>,
    units: { kg: "kg", l: "l", buc: "buc.", paini: "pâini" } as Record<string, string>,
  },
  property: {
    value: "Valoarea estimată (de pe avizul de plată)",
    rate: (min: number) => `Cota primăriei (minimul legal: ${min}%)`,
    total: "Impozitul pe an",
  },
  road: {
    type: "Tipul vehiculului",
    fixed: "sumă fixă pe an",
    above: "peste pragul anterior",
    upTo: (max: string, unit: string) => `până la ${max} ${unit}`,
    total: "Taxa pe an",
  },
  currency: {
    amountIn: (code: string) => `Suma în ${code}`,
    amountLei: "Suma în lei",
    swap: (from: string, to: string) => `⇅ inversează (${from} → ${to})`,
    inLei: "În lei",
    inCode: (code: string) => `În ${code}`,
    rate: (code: string, v: string) => `1 ${code} = ${v} lei (curs oficial BNM)`,
    unavailable: "Cursul BNM nu e disponibil acum. Revino peste câteva minute.",
    source: (date: string) => `Banca Națională a Moldovei — curs oficial din ${date}`,
  },
  page: {
    home: "Acasă",
    list: "Calculatoare",
    metaTitle: (t: string) => `Calculator: ${t}`,
    listMetaTitle: "Calculatoare: salariu net, concedii, curs valutar",
    listMetaDescription:
      "Calculatoare gratuite pentru Moldova: salariul net din brut, indemnizația de concediu medical și de maternitate, convertor valutar la cursul BNM.",
    listIntro: "Calcule rapide pentru bani și acte în Moldova, cu valorile oficiale în vigoare și sursa fiecăreia.",
    go: "Calculează →",
    guide: "Ghid complet",
    guideText: "Cine plătește, termene, scutiri și cum se achită →",
    guideTexts: {
      "rata-credit": "DAE, comisioane, graficul de rambursare și ce verifici în contract →",
      "portii-eveniment": "Metoda de calcul, colacii de pomană și siguranța la mesele mari →",
    } as Partial<Record<CalculatorSlug, string>>,
    sources: "Surse:",
    other: "Читать на русском",
  },
  notes: {
    taxa_drum: "Suma exactă o confirmă Serviciul Fiscal de Stat.",
    concediu_odihna: "Estimare orientativă; suma exactă o calculează angajatorul.",
    somaj: "Estimare orientativă; suma exactă o stabilește CNAS.",
    crestere_copil: "Estimare orientativă; suma exactă o stabilește CNAS.",
    vamuire_auto: "Estimare orientativă; suma exactă o stabilește Serviciul Vamal.",
    impozit_imobil: "Suma exactă e pe avizul de plată.",
    // calculatoarele fără parametri oficiali (needs: null)
    own: {
      "rata-credit":
        "Calcul orientativ, doar din dobânda anuală. Costul real al creditului include și comisioanele și asigurările: compară ofertele după dobânda anuală efectivă (DAE), pe care banca trebuie să ți-o arate.",
      "regula-90-180":
        "Regula privește șederile de scurtă durată fără viză ale cetățenilor Moldovei cu pașaport biometric. Comisia Europeană are și un calculator oficial pentru regula 90/180. Cei care au cetățenia României sau a altui stat UE nu sunt supuși acestei reguli. Decizia de intrare o ia poliția de frontieră, la frontieră.",
      "portii-eveniment":
        "Repere practice ale redacției, nu norme oficiale, pentru un meniu tradițional cu toate felurile; cu mai multe feluri, porția din fiecare e mai mică. La nuntă, unde masa ține multe ore, unii oaspeți mai iau o porție din felurile calde. Carnea scade la gătit, așa că din carne crudă cumperi mai mult. Colacii de pomană se socotesc după obiceiul locului.",
    } as Partial<Record<CalculatorSlug, string>>,
    generic: (an: number, updated: string) =>
      `Estimare orientativă, cu valorile oficiale pentru ${an} (verificate la ${updated}). Suma exactă o stabilește angajatorul sau instituția care plătește.`,
  },
};

type Dict = typeof RO;

const RU: Dict = {
  lei: "лей",
  daysUnit: "дней",
  yearsUnit: "лет",
  months: (n) => `${n} ${ru(n, "месяц", "месяца", "месяцев")}`,
  calc: "Расчёт",
  salary: {
    knowGross: "Знаю зарплату брутто",
    knowNet: "Знаю, сколько хочу «на руки»",
    grossInput: "Зарплата брутто в месяц",
    netInput: "Желаемая зарплата на руки",
    gross: "Зарплата брутто",
    cnam: (pct) => `Медицинское страхование CNAM (${pct}%)`,
    cnas: (pct) => `Социальные взносы CNAS (${pct}%)`,
    tax: (pct) => `Подоходный налог (${pct}%)`,
    net: "Зарплата на руки (нетто)",
  },
  sick: {
    avg: (m) => `Среднемесячный застрахованный доход (за последние ${m} ${ru(m, "месяц", "месяца", "месяцев")})`,
    stagiu: "Общий страховой стаж",
    days: "Дни больничного (по больничному листу)",
    employer: (d, pct) => `Первые ${d} ${ru(d, "день", "дня", "дней")} — платит работодатель (${pct}%)`,
    cnas: (d, pct) => `Остальные ${d} ${ru(d, "день", "дня", "дней")} — платит CNAS (${pct}%, по стажу)`,
    total: (d) => `Итого за ${d} ${ru(d, "день", "дня", "дней")}`,
  },
  maternity: {
    avg: (m) => `Среднемесячный застрахованный доход (за последние ${m} ${ru(m, "месяц", "месяца", "месяцев")})`,
    duration: "Продолжительность отпуска",
    standard: "стандартная продолжительность",
    option: (n) => `${n} ${ru(n, "день", "дня", "дней")}`,
    percent: "Процент",
    daily: "Пособие за один день",
    length: "Продолжительность",
    calendarDays: (n) => `${n} ${ru(n, "календарный день", "календарных дня", "календарных дней")}`,
    total: "Итого (ориентировочно)",
  },
  vacation: {
    avg: "Средняя месячная зарплата за последние 3 месяца (брутто)",
    days: "Дни отпуска (календарные)",
    daily: "За один календарный день",
    total: (d) => `Отпускные за ${d} ${ru(d, "день", "дня", "дней")} (брутто)`,
  },
  unemployment: {
    avg: "Среднемесячный застрахованный доход (за последние 12 месяцев)",
    stagiu: "Общий страховой стаж",
    monthly: (pct) => `В месяц (${pct}% дохода)`,
    duration: "Срок выплаты",
    total: "Итого за весь период",
    none: (m) => `Права на пособие нет: нужно не менее ${m} месяцев страхового стажа за последние 24 месяца.`,
  },
  childcare: {
    avg: "Среднемесячный застрахованный доход (12 месяцев до рождения ребёнка)",
    stage: (pct, luni) => `${pct}% × ${luni} мес.`,
    perMonth: "/ мес.",
    option: (id, name) => `Вариант ${id}: ${name}`,
    extra: (sum, years) => `Плюс ${sum} лей в месяц, до ${years} ${ru(years, "года", "лет", "лет")}`,
    single: "Единовременное пособие при рождении",
  },
  customs: {
    engine: "Тип двигателя",
    engines: {
      benzina: "Бензин",
      diesel: "Дизель",
      "hibrid-benzina": "Бензиновый гибрид (full hybrid)",
      "hibrid-diesel": "Дизельный гибрид (full hybrid)",
      "plugin-benzina": "Бензиновый плагин-гибрид (plug-in)",
      "plugin-diesel": "Дизельный плагин-гибрид (plug-in)",
      electric: "Полностью электрический",
    },
    cm3: "Объём двигателя",
    cm3Unit: "см³",
    year: "Год выпуска",
    value: "Таможенная стоимость (важна только свыше 600 000 лей)",
    duty: "Таможенная пошлина",
    vat: "НДС (TVA)",
    zero: "0 лей",
    vatValue: "0 лей (освобождение)",
    excise: "Акциз",
    exciseElectric: "0 лей (электромобиль)",
    exciseRow: (rate, cm3, red, age) =>
      `Акциз: ${rate} лей × ${cm3} см³${red ? ` − ${red}%` : ""} (${age} ${ru(age, "год", "года", "лет")})`,
    lux: (pct) => `Акциз на роскошь (${pct}% стоимости)`,
    total: "Итого к оплате на таможне",
  },
  loan: {
    amount: "Сумма кредита",
    rate: "Годовая процентная ставка",
    months: "Срок",
    monthsUnit: "мес.",
    type: "Тип платежей",
    types: { anuitate: "Равные платежи (аннуитет)", descrescator: "Убывающие платежи" },
    monthly: "Ежемесячный платёж",
    first: "Первый платёж",
    last: "Последний платёж",
    interest: "Всего процентов",
    total: "Всего к оплате",
    year: "Год",
    principal: "Погашено долга",
    interestCol: "Проценты",
    remaining: "Остаток долга",
    invalid: "Укажите сумму и срок (не менее одного месяца).",
  },
  schengen: {
    trips: "Поездки в Шенгенскую зону (день въезда и день выезда считаются)",
    from: "Дата въезда",
    to: "Дата выезда",
    add: "+ добавить поездку",
    remove: "Удалить",
    control: "Дата проверки",
    controlHint: "По умолчанию — сегодня. Для планируемой поездки добавьте её в список и укажите здесь её последний день.",
    window: "Период 180 дней",
    used: "Дней пребывания за этот период",
    remaining: "Осталось дней из 90",
    over: (n) => `Лимит в 90 дней превышен на ${n} ${ru(n, "день", "дня", "дней")}.`,
  },
  portions: {
    adults: "Взрослые (и дети постарше)",
    children: "Маленькие дети (половина порции)",
    reserve: "Запасные порции (для пришедших без приглашения)",
    portions: "Расчётных порций",
    items: {
      reci: "Холодные закуски (холодец, колбасы, брынза)",
      salate: "Салаты",
      zeama: "Зама",
      sarmale: "Маленькие голубцы (сармале)",
      friptura: "Жаркое (готовое мясо)",
      garnitura: "Гарнир (картофель, мамалыга)",
      dulciuri: "Плачинты, куличи, пирожные",
      paine: "Хлеб",
    },
    units: { kg: "кг", l: "л", buc: "шт.", paini: "буханок" },
  },
  property: {
    value: "Оценочная стоимость (из платёжного извещения)",
    rate: (min) => `Ставка примэрии (законный минимум: ${min}%)`,
    total: "Налог за год",
  },
  road: {
    type: "Тип транспортного средства",
    fixed: "фиксированная сумма в год",
    above: "свыше предыдущего порога",
    upTo: (max, unit) => `до ${max} ${unit}`,
    total: "Сбор за год",
  },
  currency: {
    amountIn: (code) => `Сумма в ${code}`,
    amountLei: "Сумма в леях",
    swap: (from, to) => `⇅ поменять направление (${from} → ${to})`,
    inLei: "В леях",
    inCode: (code) => `В ${code}`,
    rate: (code, v) => `1 ${code} = ${v} лей (официальный курс BNM)`,
    unavailable: "Курс BNM сейчас недоступен. Попробуйте через несколько минут.",
    source: (date) => `Национальный банк Молдовы (BNM) — официальный курс на ${date}`,
  },
  page: {
    home: "Știri Actuale",
    list: "Калькуляторы",
    metaTitle: (t) => `Калькулятор: ${t}`,
    listMetaTitle: "Калькуляторы: зарплата на руки, отпуска, курс валют",
    listMetaDescription:
      "Бесплатные калькуляторы для Молдовы: зарплата на руки из брутто, пособия по больничному и по беременности и родам, конвертер валют по курсу BNM.",
    listIntro: "Быстрые расчёты по деньгам и документам в Молдове — с действующими официальными значениями и источником каждого.",
    go: "Рассчитать →",
    guide: "Подробный справочник",
    guideText: "Кто платит, сроки, льготы и как оплатить →",
    guideTexts: {
      "rata-credit": "Эффективная ставка (DAE), комиссии, график погашения и что проверить в договоре →",
      "portii-eveniment": "Как считать, колачи на поминки и безопасность на больших застольях →",
    },
    sources: "Источники:",
    other: "Citește în română",
  },
  notes: {
    taxa_drum: "Точную сумму подтверждает Государственная налоговая служба (SFS).",
    concediu_odihna: "Ориентировочный расчёт; точную сумму рассчитывает работодатель.",
    somaj: "Ориентировочный расчёт; точную сумму устанавливает CNAS.",
    crestere_copil: "Ориентировочный расчёт; точную сумму устанавливает CNAS.",
    vamuire_auto: "Ориентировочный расчёт; точную сумму устанавливает Таможенная служба (Serviciul Vamal).",
    impozit_imobil: "Точная сумма указана в платёжном извещении.",
    own: {
      "rata-credit":
        "Ориентировочный расчёт только по годовой процентной ставке. Реальная стоимость кредита включает также комиссии и страховки: сравнивайте предложения по эффективной годовой ставке (DAE), которую банк обязан вам показать.",
      "regula-90-180":
        "Правило касается краткосрочного безвизового пребывания граждан Молдовы с биометрическим паспортом. У Европейской комиссии есть и официальный калькулятор правила 90/180. На тех, у кого есть гражданство Румынии или другой страны ЕС, это правило не распространяется. Решение о въезде принимает пограничная полиция на границе.",
      "portii-eveniment":
        "Практические ориентиры редакции, а не официальные нормы — для традиционного меню со всеми блюдами; чем больше блюд, тем меньше порция каждого. На свадьбе, где застолье длится много часов, некоторые гости берут добавку горячего. Мясо при готовке ужаривается, поэтому сырого мяса покупайте больше. Колачи на поминки считают по местному обычаю.",
    },
    generic: (an, updated) =>
      `Ориентировочный расчёт по официальным значениям на ${an} год (проверены ${updated}). Точную сумму устанавливает работодатель или учреждение, которое производит выплату.`,
  },
};

export const T: Record<Lang, Dict> = { ro: RO, ru: RU };

// Titlul și descrierea fiecărui calculator în rusă (în română sunt în CALCULATORS).
const CALC_RU: Record<CalculatorSlug, { title: string; description: string }> = {
  "convertor-valutar": {
    title: "Конвертер валют",
    description: "Леи в евро, доллары, румынские леи и обратно — по официальному курсу Национального банка Молдовы (BNM) на сегодня.",
  },
  "salariu-net": {
    title: "Зарплата на руки",
    description: "Сколько вы получаете «на руки» из зарплаты брутто: подоходный налог, CNAM и CNAS, шаг за шагом.",
  },
  "concediu-medical": {
    title: "Пособие по больничному",
    description: "Сколько вы получите за дни болезни — в зависимости от дохода и страхового стажа.",
  },
  "concediu-maternitate": {
    title: "Пособие по беременности и родам",
    description: "Ориентировочная сумма за отпуск по беременности и родам — по застрахованному доходу.",
  },
  "concediu-odihna": {
    title: "Отпускные",
    description: "Сколько вы получите за ежегодный отпуск — по средней зарплате за последние 3 месяца.",
  },
  "indemnizatie-somaj": {
    title: "Пособие по безработице",
    description: "Сколько вы будете получать в месяц и сколько месяцев — по застрахованному доходу и страховому стажу.",
  },
  "indemnizatie-crestere-copil": {
    title: "Пособие по уходу за ребёнком",
    description: "Три варианта (30%, 60%, 90%): сколько вы получите в месяц и всего, плюс единовременное пособие при рождении.",
  },
  "vamuire-auto": {
    title: "Растаможка автомобиля (акциз)",
    description: "Сколько платить на таможне за машину, ввезённую из-за границы: акциз по типу двигателя, объёму и году выпуска.",
  },
  "impozit-imobil": {
    title: "Налог на дом и землю",
    description: "Ежегодный налог на недвижимость — из оценочной стоимости и ставки, утверждённой примэрией.",
  },
  "taxa-drum": {
    title: "Сбор за пользование дорогами",
    description: "Сколько платить в год за автомобиль, мотоцикл, прицеп или автобус — по ставкам Налогового кодекса.",
  },
  "rata-credit": {
    title: "Платёж по кредиту",
    description: "Ежемесячный платёж, общая сумма к оплате и проценты по кредиту — равными (аннуитетными) или убывающими платежами.",
  },
  "regula-90-180": {
    title: "Правило 90/180 дней в Шенгенской зоне",
    description: "Сколько дней вы уже пробыли и сколько осталось из 90 разрешённых в любой период 180 дней — по датам поездок.",
  },
  "portii-eveniment": {
    title: "Сколько порций на свадьбу, крестины или поминки",
    description: "Сколько нужно холодных закусок, замы, голубцов, жаркого, гарнира, сладкого и хлеба — по числу гостей.",
  },
};

export function calcText<C extends { slug: CalculatorSlug; title: string; description: string }>(c: C, lang: Lang) {
  return lang === "ru" ? { ...c, ...CALC_RU[c.slug] } : c;
}

export const calcPath = (slug: string, lang: Lang) => `${lang === "ru" ? "/ru" : ""}/calculatoare/${slug}/`;
export const calcListPath = (lang: Lang) => (lang === "ru" ? "/ru/calculatoare/" : "/calculatoare/");

// Textele din parametri.json (verificați în română) traduse în rusă. Lipsă
// traducere -> rămâne textul românesc (mai bine nelocalizat decât greșit).
const MATERNITY_RU: Record<number, string> = {
  126: "обычные роды",
  140: "осложнённые роды или двойня",
  182: "трое и более детей",
};
const CHILDCARE_RU: Record<string, string> = {
  A: "30% до 3 лет",
  B: "60% в первый год, 30% во второй",
  C: "90% в течение 12 месяцев",
};
const ROAD_RU: Record<string, { nume: string; camp?: string }> = {
  autoturism: { nume: "Легковой автомобиль (бензин, дизель, гибрид)", camp: "Объём двигателя" },
  "autoturism-electric": { nume: "Полностью электрический легковой автомобиль", camp: "Полная масса (из свидетельства о регистрации)" },
  motocicleta: { nume: "Мотоцикл, мопед, скутер, мотороллер", camp: "Объём двигателя" },
  "moped-electric": { nume: "Мопед, скутер, мотороллер с электродвигателем" },
  "motocicleta-electrica": { nume: "Мотоцикл с электродвигателем" },
  remorca: { nume: "Прицеп", camp: "Грузоподъёмность" },
  semiremorca: { nume: "Полуприцеп", camp: "Грузоподъёмность" },
  tractor: { nume: "Седельный тягач, трактор (несельскохозяйственный)" },
  camion: { nume: "Грузовик и другие самоходные транспортные средства", camp: "Полная масса" },
  autobuz: { nume: "Автобус, микроавтобус", camp: "Количество мест (без места водителя)" },
};
const UNIT_RU: Record<string, string> = { "cm³": "см³", kg: "кг", t: "т", locuri: "мест" };

export const maternityCase = (zile: number, ro: string, lang: Lang) => (lang === "ru" ? (MATERNITY_RU[zile] ?? ro) : ro);
export const childcareOption = (id: string, ro: string, lang: Lang) => (lang === "ru" ? (CHILDCARE_RU[id] ?? ro) : ro);
export const roadCategory = (id: string, ro: string, lang: Lang) => (lang === "ru" ? (ROAD_RU[id]?.nume ?? ro) : ro);
export const roadField = (id: string, ro: string, lang: Lang) => (lang === "ru" ? (ROAD_RU[id]?.camp ?? ro) : ro);
export const unit = (u: string, lang: Lang) => (lang === "ru" ? (UNIT_RU[u] ?? u) : u);

// Notele lungi din parametri.json. `h` = amprenta (noteHash) textului românesc
// tradus: când nota românească se schimbă (alte cifre, alt articol), traducerea
// veche nu se mai afișează — apare nota românească până la o traducere nouă.
export type NoteKey = "taxa_drum" | "concediu_odihna" | "somaj" | "crestere_copil" | "vamuire_auto" | "impozit_imobil";
const NOTES_RU: Record<NoteKey, { h: string; ru: string }> = {
  taxa_drum: {
    h: "4pargr",
    ru: "Ставки из Приложения № 1 к Разделу IX Налогового кодекса (Codul fiscal) (редакция, действующая с 25.06.2026; не изменились и в редакции с 01.01.2027). Для легковых автомобилей ставка применяется ко всему объёму двигателя (у электромобилей — ко всей массе), а не только к части в пределах ступени. Сбор платится раз в год, до технического осмотра; для машин с техосмотром раз в 2 года сбор остаётся ежегодным. Освобождены: лица с ограниченными возможностями опорно-двигательного аппарата (ст. 343).",
  },
  concediu_odihna: {
    h: "xg432f",
    ru: "Минимальный ежегодный отпуск — 28 календарных дней, без учёта нерабочих праздничных дней (Трудовой кодекс (Codul muncii), ст. 113). Отпускные рассчитываются из средней зарплаты за последние 3 календарных месяца (Постановление Правительства (HG) № 426/2004): заработок за 3 месяца делится на фактически отработанные дни и приводится к календарному дню. Калькулятор считает по среднему месяцу в 30,4 дня; точная сумма зависит от отработанных дней и праздников в эти 3 месяца. Отпускные выплачиваются не позднее чем за 3 дня до начала отпуска (ст. 117).",
  },
  somaj: {
    h: "1ykyibu",
    ru: "Пособие по безработице составляет 40% среднемесячного застрахованного дохода за последние 12 месяцев (из последних 24) при условии страхового стажа не менее 12 месяцев за последние 24 месяца (Закон № 105/2018, ст. 43, 45). Срок выплаты зависит от общего стажа: 5 месяцев (до 10 лет), 7 месяцев (10–15 лет), 9 месяцев (свыше 15 лет) — ст. 46. Закон ограничивает пособие средней месячной зарплатой по экономике за предыдущий год; сумму этого предела в леях сообщает Национальная касса социального страхования (CNAS). Статус безработного получают в Национальном агентстве занятости (ANOFM), выплачивает пособие CNAS.",
  },
  crestere_copil: {
    h: "ulsq2n",
    ru: "Для застрахованного родителя (стаж не менее 3 лет или 9 месяцев за последние 24): база — застрахованный доход за 12 месяцев до рождения ребёнка, делённый на 12, с ограничением в 5 прогнозируемых средних зарплат (87 000 лей в месяц на 2026 год). Национальная касса социального страхования (CNAS) по умолчанию назначает вариант 30% до 3 лет; его можно изменить один раз, пока ребёнку не исполнится 1 год (Закон № 289/2004, ст. 18). Кроме того, единовременное пособие при рождении — 21 886 лей (2026, на каждого ребёнка) и 1 000 лей в месяц до 2 лет (Постановление Правительства (HG) № 1478/2002). Незастрахованные получают единовременное пособие и 1 000 лей в месяц.",
  },
  vamuire_auto: {
    h: "1xi3xkr",
    ru: "Для легковых автомобилей (товарная позиция 8703) таможенная пошлина составляет 0% независимо от страны происхождения, а ввоз освобождён от НДС (TVA) (Налоговый кодекс (Codul fiscal), ст. 103). Остаётся акциз: ставка в леях за см³ из Приложения № 2 к Разделу IV — по типу двигателя, объёму и возрасту (считается по году выпуска), умноженная на объём. Для обычных гибридов ставка снижена на 25% (кроме micro и mild hybrid), для плагин-гибридов — на 50% (ст. 124 ч. (18)). При таможенной стоимости свыше 600 000 лей добавляется акциз на роскошь — 2–10% стоимости. Полностью электрических автомобилей нет в приложении об акцизах, поэтому акциз они не платят (вывод из закона). Ограничения по возрасту при ввозе нет.",
  },
  impozit_imobil: {
    h: "70e9lj",
    ru: "Налог на недвижимое имущество = оценочная (кадастровая) стоимость × ставка, утверждённая местным советом (Налоговый кодекс (Codul fiscal), ст. 280–282). Для жилья закон устанавливает только минимум — 0,05%; конкретная ставка и оценочная стоимость указаны в платёжном извещении от примэрии, которое приходит до 15 июня. Физические лица платят всю сумму до 30 июня. Пенсионеры, люди с ограниченными возможностями и другие категории освобождены от налога на жильё по месту жительства — в пределах стоимости, установленной примэрией (ст. 283).",
  },
};

export function noteHash(s: string) {
  let x = 5381;
  for (let i = 0; i < s.length; i++) x = ((x * 33) ^ s.charCodeAt(i)) >>> 0;
  return x.toString(36);
}

export function noteText(key: NoteKey, ro: string, lang: Lang) {
  const t = NOTES_RU[key];
  return lang === "ru" && t.h === noteHash(ro) ? t.ru : ro;
}
