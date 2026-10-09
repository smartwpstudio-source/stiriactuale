import { HubPage, hubMetadata } from "@/components/hub-page";
import { topicHub } from "@/lib/content/hubs";
import { TOPIC_LABELS } from "@/lib/content/topic-meta";

// Listă ISR, randată de HubPage — vezi src/lib/content/hubs.ts.
export const revalidate = 3600; // la cerere din pipeline (/api/revalidate/), ceasul e doar plasă

export function generateStaticParams() {
  return Object.keys(TOPIC_LABELS).map((topic) => ({ topic }));
}

export async function generateMetadata({ params }: PageProps<"/subiect/[topic]">) {
  const { topic } = await params;
  return hubMetadata(topicHub(topic), 1);
}

export default async function Page({ params }: PageProps<"/subiect/[topic]">) {
  const { topic } = await params;
  return <HubPage hub={topicHub(topic)} page={1} />;
}
