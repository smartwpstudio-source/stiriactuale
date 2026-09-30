import { HubPage, hubMetadata } from "@/components/hub-page";
import { sectionHub, parsePage } from "@/lib/content/hubs";

// Listă ISR, randată de HubPage — vezi src/lib/content/hubs.ts.
export const revalidate = 60;

// Listă goală = nimic la build, fiecare URL se generează la prima vizită și
// apoi se servește din cache (ISR). Fără ea, ruta ar fi randată la FIECARE
// cerere, deși are `revalidate`.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/diaspora/pagina/[n]">) {
  const { n } = await params;
  return hubMetadata(sectionHub("diaspora"), parsePage(n) ?? 1);
}

export default async function Page({ params }: PageProps<"/diaspora/pagina/[n]">) {
  const { n } = await params;
  return <HubPage hub={sectionHub("diaspora")} page={parsePage(n)} />;
}
