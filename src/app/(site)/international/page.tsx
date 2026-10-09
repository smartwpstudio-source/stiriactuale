import { HubPage, hubMetadata } from "@/components/hub-page";
import { sectionHub } from "@/lib/content/hubs";

// Listă ISR, randată de HubPage — vezi src/lib/content/hubs.ts.
export const revalidate = 3600; // la cerere din pipeline (/api/revalidate/), ceasul e doar plasă

export function generateMetadata() {
  return hubMetadata(sectionHub("international"), 1);
}

export default function Page() {
  return <HubPage hub={sectionHub("international")} page={1} />;
}
