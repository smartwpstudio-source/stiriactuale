import { HubPage, hubMetadata } from "@/components/hub-page";
import { utilHub, parsePage } from "@/lib/content/hubs";

// Listă ISR, randată de HubPage — vezi src/lib/content/hubs.ts.
export const revalidate = 3600; // la cerere din pipeline (/api/revalidate/), ceasul e doar plasă

// Listă goală = nimic la build, fiecare URL se generează la prima vizită (ISR).
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/util/pagina/[n]">) {
  const { n } = await params;
  return hubMetadata(utilHub(), parsePage(n) ?? 1);
}

export default async function Page({ params }: PageProps<"/util/pagina/[n]">) {
  const { n } = await params;
  return <HubPage hub={utilHub()} page={parsePage(n)} />;
}
