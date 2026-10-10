import type { Metadata } from "next";
import Link from "next/link";
import { IconBook2, IconCalculator, IconFileText, IconToolsKitchen2 } from "@tabler/icons-react";
import { SectionHeading } from "@/components/section-heading";
import { ArticleThumb } from "@/components/article-thumb";
import { listRuArticles } from "@/lib/content/queries";
import { RU_NEWS_PUBLIC, ruNewsPath } from "@/lib/ru-news-public";

// Prima pagină în rusă: ultimele știri traduse + uneltele rusești.
export const revalidate = 3600;

const TITLE = "Новости Молдовы на русском";
const DESCRIPTION =
  "Главные новости Молдовы на русском языке: новые правила, цены и тарифы, новости Бельц, Гагаузии, Тараклии и диаспоры — с практическими справочниками и калькуляторами.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/ru/", ...(RU_NEWS_PUBLIC && { languages: { ro: "/", ru: "/ru/" } }) },
  ...(!RU_NEWS_PUBLIC && { robots: { index: false, follow: true } }),
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/ru/", locale: "ru_MD" },
};

const BLOCKS = [
  { href: "/ru/ghiduri/", icon: IconBook2, title: "Справочники", text: "Документы, пенсии, пособия, авто, работа — пошагово, по официальным источникам." },
  { href: "/ru/calculatoare/", icon: IconCalculator, title: "Калькуляторы", text: "Зарплата нетто, отпускные, пособия, налоги и сборы — по действующим ставкам." },
  { href: "/ru/modele-reclamatii/", icon: IconFileText, title: "Образцы жалоб", text: "Готовые жалобы и претензии: заполните и скачайте в Word или PDF." },
  { href: "/ru/retete/", icon: IconToolsKitchen2, title: "Рецепты", text: "Молдавская кухня: традиционные блюда шаг за шагом." },
];

const DATE: Intl.DateTimeFormatOptions = { timeZone: "Europe/Chisinau", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" };

export default async function RuHomePage() {
  const news = await listRuArticles(30);
  return (
    <div lang="ru" className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
      <section className="min-w-0">
        <h1 className="font-serif text-3xl text-ink sm:text-4xl">{TITLE}</h1>
        <p className="mt-3 max-w-2xl text-lg text-sub">
          Важные новости для русскоязычных читателей: что меняется, кого касается и что делать.
        </p>
        <p className="mt-2 font-mono text-sm">
          <Link href="/" lang="ro" hrefLang="ro" className="text-teal underline hover:text-amber-ink">
            Știri în română
          </Link>
        </p>
        <div className="mt-8">
          <SectionHeading title="Последние новости" />
          {news.length === 0 ? (
            <p className="mt-4 rounded border border-line bg-white p-4 text-sub">
              Первые новости на русском появятся совсем скоро. А пока — справочники, калькуляторы и образцы жалоб на русском.
            </p>
          ) : (
            <ul className="mt-1">
              {news.map(({ article, ru }) => (
                <li key={article.slug} className="border-b border-line py-4 last:border-b-0">
                  <Link href={ruNewsPath(article.slug)} className="group grid grid-cols-[1fr_96px] gap-4 sm:grid-cols-[1fr_160px]">
                    <span className="min-w-0">
                      <span className="block font-serif text-xl leading-snug text-ink group-hover:text-teal">{ru.title}</span>
                      <span className="mt-1 line-clamp-2 block text-sub">{ru.lead}</span>
                      <span className="mt-1 block font-mono text-xs text-sub">{new Date(article.publishedAt).toLocaleString("ru-RU", DATE)}</span>
                    </span>
                    <ArticleThumb topics={article.topics} imageUrl={article.imageUrl} imageAlt={ru.title} className="aspect-video w-full rounded" iconSize={28} sizes="160px" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <aside>
        <SectionHeading title="Полезное" />
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {BLOCKS.map(({ href, icon: Icon, title, text }) => (
            <Link key={href} href={href} className="flex items-start gap-3 rounded-lg border border-line bg-white p-4 hover:border-teal">
              <Icon size={24} stroke={1.75} className="mt-0.5 shrink-0 text-teal" aria-hidden />
              <span>
                <span className="block font-medium text-ink">{title}</span>
                <span className="mt-0.5 block text-sm text-sub">{text}</span>
              </span>
            </Link>
          ))}
        </div>
      </aside>
    </div>
  );
}
