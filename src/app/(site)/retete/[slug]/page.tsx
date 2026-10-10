import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecipePage, recipeMetadata } from "@/components/recipe-page";
import { getRecipe, ruRecipeSlugs } from "@/lib/content/recipes";

// Ca /ru/ghiduri: nimic la build (minute de build plătite), pagina se
// generează la prima vizită și rămâne în cache o zi.
export const revalidate = 86400;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/retete/[slug]">): Promise<Metadata> {
  const r = await getRecipe((await params).slug);
  return r ? recipeMetadata(r, "ro", (await ruRecipeSlugs()).has(r.slug)) : {};
}

export default async function Page({ params }: PageProps<"/retete/[slug]">) {
  const r = await getRecipe((await params).slug);
  if (!r) notFound();
  return <RecipePage r={r} lang="ro" hasOther={(await ruRecipeSlugs()).has(r.slug)} />;
}
