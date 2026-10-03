import type { Section } from "./types";

export const SECTION_LABELS: Record<Section, string> = {
  regiuni: "Regiuni",
  national: "Național",
  international: "Lumea",
  diaspora: "Diaspora",
};

// Denumiri corecte pentru raioanele folosite în fixtures / date reale de migrare
// și ca listă închisă pentru clasificatorul pipeline-ului AI.
// Fallback la un title-case simplu pentru orice slug care nu e listat aici.
export const RAION_NAMES: Record<string, string> = {
  drochia: "Drochia",
  straseni: "Strășeni",
  floresti: "Florești",
  orhei: "Orhei",
  chisinau: "Chișinău",
  balti: "Bălți",
  cahul: "Cahul",
  soroca: "Soroca",
  edinet: "Edineț",
  riscani: "Rîșcani",
  falesti: "Fălești",
  briceni: "Briceni",
  donduseni: "Dondușeni",
  singerei: "Sîngerei",
  telenesti: "Telenești",
  causeni: "Căușeni",
  ocnita: "Ocnița",
  "anenii-noi": "Anenii Noi",
  glodeni: "Glodeni",
  "stefan-voda": "Ștefan Vodă",
  criuleni: "Criuleni",
  soldanesti: "Șoldănești",
  basarabeasca: "Basarabeasca",
  ialoveni: "Ialoveni",
  ungheni: "Ungheni",
  cimislia: "Cimișlia",
  hincesti: "Hîncești",
  leova: "Leova",
  nisporeni: "Nisporeni",
  rezina: "Rezina",
  calarasi: "Călărași",
  cantemir: "Cantemir",
  dubasari: "Dubăsari",
  "ceadir-lunga": "Ceadîr-Lunga",
  rabnita: "Rîbnița",
  taraclia: "Taraclia",
  transnistria: "Transnistria",
  gagauzia: "Găgăuzia",
};

export function raionLabel(slug: string): string {
  return (
    RAION_NAMES[slug] ??
    slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

export const COUNTRY_NAMES: Record<string, string> = {
  italia: "Italia",
  franta: "Franța",
  germania: "Germania",
  "regatul-unit": "Regatul Unit",
  spania: "Spania",
  romania: "România",
  portugalia: "Portugalia",
  irlanda: "Irlanda",
  belgia: "Belgia",
  olanda: "Olanda",
  cehia: "Cehia",
  polonia: "Polonia",
  israel: "Israel",
  rusia: "Rusia",
  sua: "SUA",
  canada: "Canada",
};

export function countryLabel(slug: string): string {
  return (
    COUNTRY_NAMES[slug] ??
    slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}
