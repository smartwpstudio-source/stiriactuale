// Rulează `fn` pe `items` cu maxim `concurrency` operații simultane —
// necesar ca pipeline-ul să se încadreze în maxDuration=300s de pe Vercel
// Hobby (plafon absolut, nu doar implicit — verificat în docs Vercel).
// Clasificarea secvențială a ~300+ candidați lua singură aproape toate cele
// 300s; paralelizată cu un plafon rezonabil (respectă rate-limit-urile
// Anthropic), timpul scade proporțional cu `concurrency`.
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      results[current] = await fn(items[current], current);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
}
