import { HubPage, hubMetadata } from "@/components/hub-page";
import { sectionHub, parsePage } from "@/lib/content/hubs";

// Listă ISR, randată de HubPage — vezi src/lib/content/hubs.ts.
export const revalidate = 3600; // la cerere din pipeline (/api/revalidate/), ceasul e doar plasă

// Listă goală = nimic la build, fiecare URL se generează la prima vizită și
// apoi se servește din cache (ISR). Fără ea, ruta ar fi randată la FIECARE
// cerere, deși are `revalidate`.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/regiuni/pagina/[n]">) {
  const { n } = await params;
  return hubMetadata(sectionHub("regiuni"), parsePage(n) ?? 1);
}

export default async function Page({ params }: PageProps<"/regiuni/pagina/[n]">) {
  const { n } = await params;
  return <HubPage hub={sectionHub("regiuni")} page={parsePage(n)} />;
}
