import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { IconFileText } from "@tabler/icons-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { ComplaintForm } from "@/components/complaint-form";
import { EmbedCode } from "@/components/calc/embed-code";
import { COMPLAINT_MODELS, loadComplaintModel, modelPath, modelText, type ComplaintLang } from "@/lib/complaint-models";
import { ruPath } from "@/lib/content/guides-ru";
import { SITE_URL } from "@/lib/seo";

// Paginile modelelor de reclamații, în română (/modele-reclamatii/) și rusă
// (/ru/modele-reclamatii/) — același cod, textele interfeței din T. Scrisoarea
// generată e mereu în română (vezi ComplaintForm).
const T = {
  ro: {
    home: "Acasă",
    list: "Modele de reclamații",
    listTitle: "Modele de reclamații și plângeri gata de completat",
    listDescription:
      "Modele gratuite de reclamație la bancă, asigurător, executor, notar, avocat, primărie, operator mobil, spital sau magazin online. Completezi și descarci în Word sau PDF.",
    listIntro:
      "Scrisori gata de completat, cu temeiul legal și termenul de răspuns. Completezi câmpurile și descarci reclamația în Word sau PDF — datele tale nu se trimit nicăieri.",
    listNote: null,
    whereLead: "Nu știi cui să te adresezi? Vezi ghidul",
    whereLink: "Unde reclami: toate instituțiile",
    whereHref: "/ghiduri/unde-reclami-ghid-cu-toate-institutiile/",
    cta: "Completează modelul →",
    model: "Model",
    intro: "Completează câmpurile, apoi descarcă scrisoarea în Word sau PDF. Câmpurile goale rămân între paranteze, ca să le scrii de mână.",
    tip: null,
    steps: null,
    guideLabel: "Ghid complet",
    guideText: "Unde depui reclamația, termenele de răspuns și ce faci dacă nu primești răspuns.",
    disclaimer: (d: string) => `Model informativ, verificat pe sursele oficiale din ghid la ${d}. Nu înlocuiește consultația unui jurist.`,
    other: "Читать на русском",
    otherLang: "ru",
  },
  ru: {
    home: "Главная",
    list: "Образцы жалоб",
    listTitle: "Образцы жалоб в Молдове: заполнить и скачать в Word или PDF",
    listDescription:
      "Бесплатные образцы жалоб в банк, страховщику, на судебного исполнителя, нотариуса, адвоката, в примэрию, оператору связи, на больницу или интернет-магазин.",
    listIntro:
      "Готовые письма с правовым основанием и сроком ответа. Заполните поля и скачайте жалобу в Word или PDF — ваши данные никуда не отправляются.",
    listNote:
      "Подсказки и поля — на русском, а сам текст жалобы составляется на румынском: это официальный язык, на котором учреждения принимают обращения.",
    whereLead: "Не знаете, куда обращаться? Смотрите справочник",
    whereLink: "Куда жаловаться: все учреждения",
    whereHref: ruPath("unde-reclami-ghid-cu-toate-institutiile"),
    cta: "Заполнить образец →",
    model: "Образец",
    intro: "Заполните поля, затем скачайте письмо в Word или PDF. Незаполненные поля останутся в квадратных скобках, чтобы вписать их от руки.",
    tip: "Всё, что вы вписываете, попадает в румынский текст жалобы. Имена, адреса и названия пишите так, как они указаны в документах (латиницей), а описание ситуации — по возможности тоже по-румынски.",
    steps: [
      "Заполните поля и проверьте румынский текст жалобы.",
      "Скачайте его в Word или сохраните в PDF, распечатайте в двух экземплярах и подпишите.",
      "Подайте жалобу лично и попросите поставить на вашем экземпляре входящий номер и дату — или отправьте заказным письмом с уведомлением о вручении. Если учреждение принимает обращения по e-mail или онлайн, можно и так.",
      "Сохраните свой экземпляр и подтверждение подачи: от даты регистрации отсчитываются сроки.",
      "Куда именно подавать, сколько ждать ответа и что делать, если его нет, — в справочнике ниже.",
    ],
    guideLabel: "Полный справочник",
    guideText: "Куда подавать жалобу, сроки ответа и что делать, если ответа нет.",
    disclaimer: (d: string) =>
      `Образец носит информационный характер и проверен по официальным источникам из справочника (${d}). Не заменяет консультацию юриста.`,
    other: "Citește în română",
    otherLang: "ro",
  },
} as const;

const DATE: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };

const languages = (slug?: string) => ({ ro: modelPath("ro", slug), ru: modelPath("ru", slug) });

export function complaintListMetadata(lang: ComplaintLang): Metadata {
  const t = T[lang];
  const url = modelPath(lang);
  return {
    title: t.listTitle,
    description: t.listDescription,
    alternates: { canonical: url, languages: languages() },
    ...(lang === "ru" && { openGraph: { title: t.listTitle, description: t.listDescription, url, locale: "ru_MD" } }),
  };
}

export function complaintModelMetadata(slug: string, lang: ComplaintLang): Metadata {
  const m = COMPLAINT_MODELS.find((x) => x.slug === slug);
  if (!m) return {};
  const { title, description } = modelText(m, lang);
  const url = modelPath(lang, m.slug);
  return {
    title: `${T[lang].model}: ${title}`,
    description,
    alternates: { canonical: url, languages: languages(m.slug) },
    ...(lang === "ru" && { openGraph: { title: `${T.ru.model}: ${title}`, description, url, locale: "ru_MD" } }),
  };
}

function LangLink({ lang, href }: { lang: ComplaintLang; href: string }) {
  const t = T[lang];
  return (
    <p className="mt-2 font-mono text-sm print:hidden">
      <Link prefetch={false} href={href} lang={t.otherLang} hrefLang={t.otherLang} className="text-teal underline">
        {t.other}
      </Link>
    </p>
  );
}

export function ComplaintModelsList({ lang }: { lang: ComplaintLang }) {
  const t = T[lang];
  const other = lang === "ru" ? "ro" : "ru";
  return (
    <div lang={lang} className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      <Breadcrumb items={[{ label: t.home, href: "/" }, { label: t.list }]} />
      <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">{t.list}</h1>
      <LangLink lang={lang} href={modelPath(other)} />
      <p className="mt-3 max-w-2xl text-lg text-sub">{t.listIntro}</p>
      {t.listNote && <p className="mt-2 max-w-2xl text-sub">{t.listNote}</p>}
      <p className="mt-2 max-w-2xl text-sub">
        {t.whereLead}{" "}
        <Link prefetch={false} href={t.whereHref} className="underline hover:text-ink">
          {t.whereLink}
        </Link>
        .
      </p>
      <ul className="mt-8 grid max-w-5xl gap-5 md:grid-cols-2">
        {COMPLAINT_MODELS.map((m) => {
          const { title, description } = modelText(m, lang);
          return (
            <li key={m.slug}>
              <Link prefetch={false}
                href={modelPath(lang, m.slug)}
                className="flex h-full flex-col rounded-lg border border-line bg-white p-5 transition-shadow hover:border-teal hover:shadow-md"
              >
                <IconFileText size={28} stroke={1.75} className="text-teal" aria-hidden />
                <span className="mt-3 font-serif text-xl leading-snug text-ink">{title}</span>
                <span className="mt-2 flex-1 text-[0.95rem] text-sub">{description}</span>
                <span className="mt-4 font-medium text-teal">{t.cta}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export async function ComplaintModelView({ slug, lang }: { slug: string; lang: ComplaintLang }) {
  const r = await loadComplaintModel(slug, lang);
  if (!r) notFound();
  const t = T[lang];
  const { title, description } = modelText(r.model, lang);
  const other = lang === "ru" ? "ro" : "ru";
  // în rusă: ghidul rusesc, dacă există; data verificării în format rusesc
  const guide = r.guideRu ?? r.guide;
  const guideHref = r.guideRu ? ruPath(r.guideRu.slug) : `/ghiduri/${r.guide.slug}/`;
  const checked = lang === "ru" ? new Date(`${r.guide.updated}T12:00:00Z`).toLocaleDateString("ru-RU", DATE) : r.guide.updated;
  return (
    <div lang={lang} className="mx-auto w-full max-w-[680px] px-4 py-8">
      <div className="print:hidden">
        <Breadcrumb items={[{ label: t.home, href: "/" }, { label: t.list, href: modelPath(lang) }, { label: title }]} />
        <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">
          {t.model}: {title}
        </h1>
        <LangLink lang={lang} href={modelPath(other, slug)} />
        <p className="mt-3 text-lg text-sub">{description}</p>
        <p className="mt-3 text-sm text-sub">{t.intro}</p>
        {t.tip && <p className="mt-2 text-sm text-sub">{t.tip}</p>}
      </div>
      <div className="mt-6">
        <ComplaintForm template={r.template} title={r.model.title} lang={lang} explain={r.explain} />
      </div>
      <div className="print:hidden">
        {t.steps && (
          <section className="mt-8">
            <h2 className="font-serif text-xl text-ink">Как подать жалобу</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-[0.95rem] leading-relaxed text-ink">
              {t.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </section>
        )}
        <Link prefetch={false} href={guideHref} className="mt-8 block rounded border border-line bg-white p-4 text-ink hover:border-teal">
          <span className="block font-mono text-xs uppercase tracking-wide text-teal">{t.guideLabel}</span>
          <span className="mt-1 block font-medium">{guide.title} →</span>
          <span className="mt-1 block text-sm text-sub">{t.guideText}</span>
        </Link>
        <p className="mt-4 text-xs text-sub">{t.disclaimer(checked)}</p>
        {lang === "ro" && (
          <EmbedCode slug={`reclamatie-${slug}`} src={`/embed/reclamatie/${slug}/`} title={r.model.title} siteUrl={SITE_URL} kind="model" />
        )}
      </div>
    </div>
  );
}
