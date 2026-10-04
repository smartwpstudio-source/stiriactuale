// Titlul știrii cu video primește „(VIDEO)”, cea dintr-o postare cu poze
// „(FOTO)” — la sfârșit (cererea proprietarului, 2026-10-04). O singură dată.
export function mediaTag(title: string, video: boolean, photo: boolean): string {
  const tag = video ? "(VIDEO)" : photo ? "(FOTO)" : "";
  if (!tag || /[(](VIDEO|FOTO)[)]/i.test(title)) return title;
  return `${title.replace(/[ .]+$/, "")} ${tag}`;
}
