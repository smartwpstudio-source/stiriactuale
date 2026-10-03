import { HubPage, hubMetadata } from "@/components/hub-page";
import { videoHub } from "@/lib/content/hubs";

// Listă ISR, randată de HubPage — vezi src/lib/content/hubs.ts.
export const revalidate = 60;

export function generateMetadata() {
  return hubMetadata(videoHub(), 1);
}

export default function Page() {
  return <HubPage hub={videoHub()} page={1} />;
}
