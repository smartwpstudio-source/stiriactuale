const COMBINING_DIACRITICS = new RegExp("[̀-ͯ]", "g");

export function stripDiacritics(input: string): string {
  return input.normalize("NFD").replace(COMBINING_DIACRITICS, "");
}
