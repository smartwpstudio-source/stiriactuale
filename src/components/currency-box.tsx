import { getBnmRates } from "@/lib/bnm";

// Cursul oficial BNM — util mai ales pentru diaspora.
export async function CurrencyBox() {
  const data = await getBnmRates();
  if (!data) return null;
  return (
    <section className="rounded border border-line bg-white p-4">
      <h2 className="font-serif text-lg text-ink">Curs valutar BNM</h2>
      <p className="font-mono text-xs text-sub">{data.date}</p>
      <table className="mt-3 w-full text-[0.95rem]">
        <tbody>
          {data.rates.map((r) => (
            <tr key={r.code} className="border-t border-line">
              <td className="py-1.5 font-medium text-ink">
                {r.nominal > 1 ? `${r.nominal} ` : ""}
                {r.code}
              </td>
              <td className="py-1.5 text-right font-mono text-ink">{r.value.toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-sub">lei, cursul oficial al Băncii Naționale</p>
    </section>
  );
}
