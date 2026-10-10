import { RecipeList, recipeListMetadata } from "@/components/recipe-list";

export const revalidate = 3600;

export const metadata = recipeListMetadata("ro");

export default function RecipesPage() {
  return <RecipeList lang="ro" />;
}
