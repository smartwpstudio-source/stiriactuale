// Linkul editorului adăugat din GitHub Actions (pipeline.yml, câmpul „link”), ca
// „Adaugă și publică acum” din admin: postare Telegram sau articol. La postările
// unei instituții, prima poză intră în articol cu semnătura „Foto: <canal>”.
import { getDb } from "../../src/lib/pipeline/db/client";
import { candidates } from "../../src/lib/pipeline/db/schema";
import { fetchArticle } from "../../src/lib/pipeline/fulltext";
import { copyToBlob } from "../../src/lib/pipeline/image";
import { toPostEmbedUrl } from "../../src/lib/video";
import { readVideoSource } from "../../src/lib/video-source";

(async () => {
  const link = process.env.LINK!.trim();
  const video = await readVideoSource(link);
  let row: { url: string; title: string; summary: string; sourceName: string; postUrl?: string | null; imageUrl?: string; imageCredit?: string };
  if (video) {
    const url = video.hasVideo ? link : video.embed.replace("https://t.me/", "https://t.me/s/").replace("?embed=1", video.hasPhoto ? "?foto=1" : "");
    const html = video.embed.startsWith("https://t.me/") ? await fetch(video.embed).then((r) => r.text()) : "";
    const photo = html.match(/tgme_widget_message_photo_wrap[^>]+background-image:url\('([^']+)'\)/)?.[1];
    row = {
      url,
      title: video.title,
      summary: video.description,
      sourceName: video.channel,
      postUrl: toPostEmbedUrl(link),
      ...(photo && { imageUrl: await copyToBlob(photo, `articole/manual-${Date.now()}.jpg`), imageCredit: `Foto: ${video.channel}` }),
    };
  } else {
    const page = await fetchArticle(link);
    if (!page?.title) throw new Error("link necitibil");
    row = { url: link, title: page.title, summary: [page.description, page.text].filter(Boolean).join("\n").slice(0, 20000), sourceName: new URL(link).hostname.replace(/^www\./, "") };
  }
  await getDb()
    .insert(candidates)
    .values({ ...row, feedId: "manual", publishedAt: new Date(), manual: true, kind: "stire" })
    .onConflictDoUpdate({ target: candidates.url, set: { manual: true, processedAt: null, kind: "stire", postUrl: row.postUrl, imageUrl: row.imageUrl, imageCredit: row.imageCredit } });
  console.log(`adăugat: ${row.title} (${row.url})${row.imageUrl ? " + poză" : ""}`);
  process.exit(0);
})();
