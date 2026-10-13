// Slug-uri doar ASCII (a-z, 0-9, „-”). AI-ul a scris o dată „trusenі” cu „і”
// chirilic, care arată ca „i” latin — URL-ul cu %D1%96 dădea 404 (2026-10-13).
// Literele chirilice se transliterează; restul caracterelor nepermise dispar.
const CYR: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "j", з: "z", и: "i", й: "i", і: "i", ї: "i",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "t",
  ч: "ci", ш: "s", щ: "st", ъ: "", ы: "i", ь: "", э: "e", ю: "iu", я: "ia", є: "e", ґ: "g",
};

export function asciiSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[Ѐ-ӿ]/g, (c) => CYR[c] ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function isAsciiSlug(s: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);
}
