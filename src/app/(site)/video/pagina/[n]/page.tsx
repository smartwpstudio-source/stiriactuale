import { HubPage, hubMetadata } from "@/components/hub-page";
import { videoHub, parsePage } from "@/lib/content/hubs";

// Listă ISR, randată de HubPage — vezi src/lib/content/hubs.ts.
export const revalidate = 60;

// Listă goală = nimic la build, fiecare URL se generează la prima vizită (ISR).
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/video/pagina/[n]">) {
  const { n } = await params;
  return hubMetadata(videoHub(), parsePage(n) ?? 1);
}

export default async function Page({ params }: PageProps<"/video/pagina/[n]">) {
  const { n } = await params;
  return <HubPage hub={videoHub()} page={parsePage(n)} />;
}
