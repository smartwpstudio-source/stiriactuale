import type { Metadata } from "next";
import { WithSideAd } from "@/components/side-ad";
import { AdSlot } from "@/components/ad-slot";
import Link from "next/link";
import { IconCalculator } from "@tabler/icons-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { EmbedCode } from "@/components/calc/embed-code";
import { loadCalculator } from "@/components/calc/calculator-body";
import { T, calcListPath, calcPath, calcText, type Lang } from "@/components/calc/i18n";
import { ToolNews } from "@/components/tool-news";
import { availableCalculators, CALCULATORS } from "@/lib/calculators";
import { getCalcParams } from "@/lib/calculators-data";
import { ruPath, ruSlugs } from "@/lib/content/guides-ru";
import { SITE_URL } from "@/lib/seo";

// Paginile calculatoarelor în română și rusă (/calculatoare/, /ru/calculatoare/):
// același șablon, textele din i18n.ts. Legătura dintre limbi (hreflang) e slug-ul.
// Pe varianta rusă lipsesc „Știri recente” (știrile sunt în română) și codul de
// inserare (widget-ul /embed/ e în română).

const other = (lang: Lang): Lang => (lang === "ru" ? "ro" : "ru");

function languages(path: (l: Lang) => string) {
  return { ro: path("ro"), ru: path("ru") };
}

function ruOpenGraph(title: string, description: string, url: string): Metadata["openGraph"] {
  return {
    title,
    description,
    url,
    siteName: "Știri Actuale",
    locale: "ru_MD",
    images: [{ url: `/og/?${new URLSearchParams({ t: title, s: "Калькулятор" })}`, width: 1200, height: 630 }],
  };
}

function OtherLanguage({ lang, href }: { lang: Lang; href: string }) {
  return (
    <p className="mt-3 font-mono text-sm">
      <Link prefetch={false} href={href} lang={other(lang)} className="text-teal underline">
        {T[lang].page.other}
      </Link>
    </p>
  );
}

export function calculatorsListMetadata(lang: Lang): Metadata {
  const t = T[lang].page;
  const url = calcListPath(lang);
  return {
    title: t.listMetaTitle,
    description: t.listMetaDescription,
    alternates: { canonical: url, languages: languages(calcListPath) },
    ...(lang === "ru" && { openGraph: ruOpenGraph(t.listMetaTitle, t.listMetaDescription, url) }),
  };
}

export async function CalculatorsList({ lang }: { lang: Lang }) {
  const t = T[lang].page;
  const list = availableCalculators(await getCalcParams()).map((c) => calcText(c, lang));
  return (
    <div lang={lang} className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      <Breadcrumb items={[{ label: t.home, href: "/" }, { label: t.list }]} />
      <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">{t.list}</h1>
      <p className="mt-3 max-w-2xl text-lg text-sub">{t.listIntro}</p>
      <OtherLanguage lang={lang} href={calcListPath(other(lang))} />
      <ul className="mt-8 grid max-w-5xl gap-5 md:grid-cols-2">
        {list.map((c) => (
          <li key={c.slug}>
            <Link prefetch={false}
              href={calcPath(c.slug, lang)}
              className="flex h-full flex-col rounded-lg border border-line bg-white p-5 transition-shadow hover:border-teal hover:shadow-md"
            >
              <IconCalculator size={28} stroke={1.75} className="text-teal" aria-hidden />
              <span className="mt-3 font-serif text-xl leading-snug text-ink">{c.title}</span>
              <span className="mt-2 flex-1 text-[0.95rem] text-sub">{c.description}</span>
              <span className="mt-4 font-medium text-teal">{t.go}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function calculatorMetadata(slug: string, lang: Lang): Metadata {
  const found = CALCULATORS.find((x) => x.slug === slug);
  if (!found) return {};
  const c = calcText(found, lang);
  const url = calcPath(c.slug, lang);
  const title = T[lang].page.metaTitle(c.title);
  return {
    title,
    description: c.description,
    alternates: { canonical: url, languages: languages((l) => calcPath(c.slug, l)) },
    ...(lang === "ru" && { openGraph: ruOpenGraph(title, c.description, url) }),
  };
}

// null = calculator inexistent sau fără parametri (pagina dă notFound)
export async function CalculatorView({ slug, lang }: { slug: string; lang: Lang }) {
  const r = await loadCalculator(slug, lang);
  if (!r) return null;
  const t = T[lang].page;
  // calculatoarele înrudite (doar cele disponibile)
  const see: readonly string[] = "see" in r.calc ? r.calc.see : [];
  const seeCalcs = see.length ? availableCalculators(await getCalcParams()).filter((c) => see.includes(c.slug)).map((c) => calcText(c, lang)) : [];
  // ghidul pereche: în rusă doar dacă există traducerea
  const guide = "guide" in r.calc ? r.calc.guide : undefined;
  const guideHref = guide && (lang === "ro" ? `/ghiduri/${guide}/` : (await ruSlugs()).has(guide) ? ruPath(guide) : undefined);
  return (
    <WithSideAd>
    <div lang={lang} className="mx-auto w-full max-w-[640px] px-4 py-8">
      <Breadcrumb items={[{ label: t.home, href: "/" }, { label: t.list, href: calcListPath(lang) }, { label: r.calc.title }]} />
      <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">{r.calc.title}</h1>
      <p className="mt-3 text-lg text-sub">{r.calc.description}</p>
      <OtherLanguage lang={lang} href={calcPath(slug, other(lang))} />
      {lang === "ro" && <ToolNews tool={`calc:${slug}`} />}
      <div className="mt-6">{r.body}</div>
      {guideHref && (
        <Link prefetch={false} href={guideHref} className="mt-6 block rounded border border-line bg-white p-4 text-ink hover:border-teal">
          <span className="block font-mono text-xs uppercase tracking-wide text-teal">{t.guide}</span>
          <span className="mt-1 block font-medium">{t.guideTexts[r.calc.slug] ?? t.guideText}</span>
        </Link>
      )}
      {seeCalcs.length > 0 && (
        <div className="mt-6 rounded border border-line bg-white p-4">
          <span className="block font-mono text-xs uppercase tracking-wide text-teal">{t.see}</span>
          <ul className="mt-1 space-y-1">
            {seeCalcs.map((c) => (
              <li key={c.slug}>
                <Link prefetch={false} href={calcPath(c.slug, lang)} className="font-medium text-ink hover:text-teal">
                  {c.title} →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {"recipes" in r.calc && (
        <Link prefetch={false} href={lang === "ru" ? "/ru/retete/" : "/retete/"} className="mt-6 block rounded border border-line bg-white p-4 text-ink hover:border-teal">
          <span className="block font-mono text-xs uppercase tracking-wide text-teal">{t.recipes}</span>
          <span className="mt-1 block font-medium">{t.recipesText}</span>
        </Link>
      )}
      {/* reclama după calculator și legături, nu lângă butoane (clicuri accidentale) */}
      <AdSlot display />
      {r.note && <p className="mt-6 text-sm text-sub">{r.note}</p>}
      {r.sources.length > 0 && (
        <p className="mt-2 text-sm text-sub">
          {t.sources}{" "}
          {r.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && ", "}
              <a href={s.url} target="_blank" rel="noopener" className="underline hover:text-ink">{s.name}</a>
            </span>
          ))}
        </p>
      )}
      {lang === "ro" && <EmbedCode slug={slug} title={r.calc.title} siteUrl={SITE_URL} />}
    </div>
    </WithSideAd>
  );
}
