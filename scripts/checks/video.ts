// Recunoașterea video-urilor YouTube/Facebook (src/lib/video.ts).
// npx tsx scripts/checks/video.ts
import assert from "node:assert";
import { findVideo, toEmbedUrl } from "../../src/lib/video";

const yt = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ";
for (const u of [
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s",
  "https://youtu.be/dQw4w9WgXcQ",
  "https://m.youtube.com/shorts/dQw4w9WgXcQ",
  "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0",
]) assert.equal(toEmbedUrl(u), yt, u);

const fb = toEmbedUrl("https://www.facebook.com/tv8.md/videos/1234567890/");
assert.ok(fb?.startsWith("https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Ftv8.md%2Fvideos%2F1234567890"), fb ?? "");
assert.ok(toEmbedUrl("https://www.facebook.com/watch/?v=987654321")?.includes("watch%2F%3Fv%3D987654321"));
assert.equal(toEmbedUrl("https://www.facebook.com/tv8.md/posts/123"), null);
assert.equal(toEmbedUrl("https://example.com/video.mp4"), null);
assert.equal(toEmbedUrl("nu e link"), null);

assert.equal(findVideo('<p>x</p><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" allowfullscreen></iframe>'), yt);
assert.equal(findVideo('<iframe src="https://ads.example.com/x"></iframe><iframe src="//www.youtube.com/embed/dQw4w9WgXcQ"></iframe>'), yt);
assert.equal(findVideo('<a href="https://youtu.be/dQw4w9WgXcQ">link</a>'), null);
console.log("video: OK");
