// Tipurile blocului „Ce înseamnă pentru tine” — fără importuri de server, ca
// ecusoanele să poată fi folosite și în componentele de client (lenta).
export const IMPACT_TYPES = { bani: "Bani", reguli: "Reguli", alerta: "Alertă", urgent: "Urgent" } as const;
export type ImpactType = keyof typeof IMPACT_TYPES;
// culoarea plină a ecusonului (text alb)
export const IMPACT_BADGE: Record<ImpactType, string> = { bani: "bg-alert", reguli: "bg-teal", alerta: "bg-amber-ink", urgent: "bg-alert" };

export interface Impact {
  tip: ImpactType;
  cine: string;
  ce: string;
  cand?: string;
  pasi: string[];
  unelte: string[]; // "ghid:<slug>", "calc:<slug>", "model:<slug>"
  pana?: string; // AAAA-LL-ZZ — alertă / urgent: valabilă până la (fără = 3 zile de la publicare)
  verificat: string; // ISO — ultima scriere / editare a blocului
  editat?: boolean; // corectat în /admin — completările pipeline-ului nu-l suprascriu
}
