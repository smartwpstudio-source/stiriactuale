import { readAllContent } from "./store";

// Rețetele (docs/cloud/gospodarie-bucatarie-turism.md): content/retete/<slug>.json
// + varianta rusă obligatorie în content/retete-ru/<slug>.json, același slug.
// Validare: npm run check:content.

export const COURSES = {
  ciorbe: { ro: "Ciorbe și zeamă", ru: "Супы и чорбы" },
  "fel-principal": { ro: "Feluri principale", ru: "Основные блюда" },
  aluaturi: { ro: "Plăcinte și aluaturi", ru: "Плацинды и выпечка" },
  deserturi: { ro: "Deserturi", ru: "Десерты" },
  aperitive: { ro: "Aperitive", ru: "Закуски" },
  garnituri: { ro: "Garnituri", ru: "Гарниры" },
  conserve: { ro: "Conserve pentru iarnă", ru: "Заготовки на зиму" },
  bauturi: { ro: "Băuturi", ru: "Напитки" },
} as const;

export const DIFFICULTIES = {
  usor: { ro: "ușor", ru: "легко" },
  mediu: { ro: "mediu", ru: "средне" },
  dificil: { ro: "dificil", ru: "сложно" },
} as const;

export type Course = keyof typeof COURSES;
export type Difficulty = keyof typeof DIFFICULTIES;
export type Lang = "ro" | "ru";

export interface Ingredient {
  qty?: string; // "500", "1/2", "1 1/2", "2-3", "după gust"
  unit?: string;
  name: string;
  note?: string;
}

export interface Recipe {
  slug: string;
  title: string;
  description: string;
  updated: string;
  image: { url: string; credit: string; alt: string };
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  difficulty: Difficulty;
  fasting: boolean;
  course: Course;
  region?: string;
  occasions?: string[];
  ingredients: { group?: string; items: Ingredient[] }[];
  steps: { text: string; minutes?: number; name?: string }[]; // name: opțional, pentru JSON-LD (altfel derivat din text)
  tips?: string[];
  mistakes?: string[];
  variants?: { region: string; text: string }[];
  storyHtml?: string;
  sources: { name: string; url: string }[];
  related?: string[];
}

// o dată pe proces în producție, citite pe rând (EMFILE — vezi guides.ts)
const cache: Partial<Record<Lang, Promise<Recipe[]>>> = {};

export function getRecipes(lang: Lang = "ro"): Promise<Recipe[]> {
  if (process.env.NODE_ENV !== "production") return load(lang);
  return (cache[lang] ??= load(lang).catch((e) => ((cache[lang] = undefined), Promise.reject(e))));
}

async function load(lang: Lang): Promise<Recipe[]> {
  const recipes = await readAllContent<Recipe>(lang === "ru" ? "retete-ru" : "retete");
  return recipes.sort((a, b) => a.title.localeCompare(b.title, lang));
}

export async function getRecipe(slug: string, lang: Lang = "ro"): Promise<Recipe | undefined> {
  return (await getRecipes(lang)).find((r) => r.slug === slug);
}

export const getRecipesRu = () => getRecipes("ru");
export const getRecipeRu = (slug: string) => getRecipe(slug, "ru");
export const ruRecipeSlugs = async () => new Set((await getRecipesRu()).map((r) => r.slug));

export const recipePath = (slug: string, lang: Lang = "ro") => (lang === "ru" ? `/ru/retete/${slug}/` : `/retete/${slug}/`);
