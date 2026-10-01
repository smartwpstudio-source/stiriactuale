export function formatTimeAgo(iso: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60_000);

  if (diffMin < 1) return "chiar acum";
  if (diffMin < 60) return `acum ${diffMin} min`;

  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `acum ${diffHours} ${diffHours === 1 ? "oră" : "ore"}`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays <= 7) return `acum ${diffDays} ${diffDays === 1 ? "zi" : "zile"}`;
  // "acum 202 zile" nu spune nimic — peste o săptămână, data exactă
  return new Date(iso).toLocaleDateString("ro-MD", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Chisinau",
  });
}

// "din 3 surse" doar când e informativ — "raportat de 1 surse" suna a eroare.
export function sourcesLabel(n: number): string {
  return n > 1 ? ` · din ${n} surse` : "";
}
