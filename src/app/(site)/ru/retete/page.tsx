import { RecipeList, recipeListMetadata } from "@/components/recipe-list";

// Cuprinsul rețetelor în rusă — același șablon ca /retete/
export const revalidate = 3600;

export const metadata = recipeListMetadata("ru");

export default function RuRecipesPage() {
  return <RecipeList lang="ru" />;
}
