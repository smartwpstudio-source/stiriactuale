import { HubPage, hubMetadata } from "@/components/hub-page";
import { topicHub, parsePage } from "@/lib/content/hubs";

// Listă ISR, randată de HubPage — vezi src/lib/content/hubs.ts.
export const revalidate = 60;

// Listă goală = nimic la build, fiecare URL se generează la prima vizită și
// apoi se servește din cache (ISR). Fără ea, ruta ar fi randată la FIECARE
// cerere, deși are `revalidate`.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/subiect/[topic]/pagina/[n]">) {
  const { topic, n } = await params;
  return hubMetadata(topicHub(topic), parsePage(n) ?? 1);
}

export default async function Page({ params }: PageProps<"/subiect/[topic]/pagina/[n]">) {
  const { topic, n } = await params;
  return <HubPage hub={topicHub(topic)} page={parsePage(n)} />;
}
