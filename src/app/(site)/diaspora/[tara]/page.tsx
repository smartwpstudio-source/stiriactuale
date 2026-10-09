import { HubPage, hubMetadata } from "@/components/hub-page";
import { taraHub } from "@/lib/content/hubs";
import { COUNTRY_NAMES } from "@/lib/content/geo";

// Listă ISR, randată de HubPage — vezi src/lib/content/hubs.ts.
export const revalidate = 3600; // la cerere din pipeline (/api/revalidate/), ceasul e doar plasă

export function generateStaticParams() {
  return Object.keys(COUNTRY_NAMES).map((tara) => ({ tara }));
}

export async function generateMetadata({ params }: PageProps<"/diaspora/[tara]">) {
  const { tara } = await params;
  return hubMetadata(taraHub(tara), 1);
}

export default async function Page({ params }: PageProps<"/diaspora/[tara]">) {
  const { tara } = await params;
  return <HubPage hub={taraHub(tara)} page={1} />;
}
