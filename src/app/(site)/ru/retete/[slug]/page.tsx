import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecipePage, recipeMetadata } from "@/components/recipe-page";
import { getRecipe, getRecipeRu } from "@/lib/content/recipes";

// Ca /ru/ghiduri: nimic la build, pagina se generează la prima vizită.
export const revalidate = 604800; // 7 zile: conținutul se schimbă doar la publicare; fiecare regenerare costă CPU

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/ru/retete/[slug]">): Promise<Metadata> {
  const r = await getRecipeRu((await params).slug);
  return r ? recipeMetadata(r, "ru", !!(await getRecipe(r.slug))) : {};
}

export default async function Page({ params }: PageProps<"/ru/retete/[slug]">) {
  const r = await getRecipeRu((await params).slug);
  if (!r) notFound();
  return <RecipePage r={r} lang="ru" hasOther={!!(await getRecipe(r.slug))} />;
}
