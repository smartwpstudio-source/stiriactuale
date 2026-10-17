import { Fragment } from "react";
import { AdSlot } from "./ad-slot";
import { splitForAds } from "@/lib/content/sanitize";
import { ADSENSE_IN_ARTICLE_SLOT } from "@/lib/adsense";

// Corpul articolului / ghidului cu blocuri In-article între bucăți (splitForAds);
// fără reclame (arhivă preluată), un singur bloc de text.
export function AdBody({ html, ads = true }: { html: string; ads?: boolean }) {
  const chunks = ads && ADSENSE_IN_ARTICLE_SLOT ? splitForAds(html) : [html];
  return chunks.map((c, i) => (
    <Fragment key={i}>
      {i > 0 && <AdSlot slot={ADSENSE_IN_ARTICLE_SLOT} />}
      <div className={`prose-article text-ink${i === 0 ? " mt-4" : ""}`} dangerouslySetInnerHTML={{ __html: c }} />
    </Fragment>
  ));
}
