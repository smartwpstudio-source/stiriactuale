// Țara unui ghid din diaspora, după slug (ghidurile nu au câmp de țară):
// exact o țară recunoscută -> țara; niciuna sau mai multe -> null („pentru
// toate țările”). Ordinea contează doar pentru cuvintele ambigue.
const RULES: [country: string, re: RegExp][] = [
  ["regatul-unit", /regatul-unit|londra/],
  ["italia", /italia|italian|codice-fiscale|permesso/],
  ["germania", /german|kindergeld|anmeldung/],
  ["franta", /franta|carte-vitale|titre-de-sejour/],
  ["spania", /spania|empadronamiento/],
  ["portugalia", /portugalia/],
  ["irlanda", /irlanda/],
  ["israel", /israel|tel-aviv/],
  ["rusia", /rusia|moscova/],
  ["sua", /(^|-)sua(-|$)|washington/],
  ["canada", /canada|ottawa/],
  ["romania", /romania|romana/],
];

export function guideCountry(slug: string): string | null {
  const found = RULES.filter(([, re]) => re.test(slug)).map(([c]) => c);
  // „…cu-cetatenie-romana” în Regatul Unit: țara de reședință bate cetățenia
  const unique = found.includes("regatul-unit") ? found.filter((c) => c !== "romania") : found;
  return unique.length === 1 ? unique[0] : null;
}
