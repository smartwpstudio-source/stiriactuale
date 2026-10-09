import { HubPage, hubMetadata } from "@/components/hub-page";
import { raionHub } from "@/lib/content/hubs";
import { RAION_NAMES } from "@/lib/content/geo";

// Listă ISR, randată de HubPage — vezi src/lib/content/hubs.ts.
export const revalidate = 3600; // la cerere din pipeline (/api/revalidate/), ceasul e doar plasă

export function generateStaticParams() {
  return Object.keys(RAION_NAMES).map((raion) => ({ raion }));
}

export async function generateMetadata({ params }: PageProps<"/regiuni/[raion]">) {
  const { raion } = await params;
  return hubMetadata(raionHub(raion), 1);
}

export default async function Page({ params }: PageProps<"/regiuni/[raion]">) {
  const { raion } = await params;
  return <HubPage hub={raionHub(raion)} page={1} />;
}
