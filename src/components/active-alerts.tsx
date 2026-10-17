import Link from "next/link";
import { IconAlertTriangle } from "@tabler/icons-react";
import { getActiveAlerts } from "@/lib/content/queries";
import { articleUrl } from "@/lib/content/url";
import { countryLabel } from "@/lib/content/geo";

// Alertele active (știri cu bloc de impact de tip alertă / urgent, încă în
// vigoare): sus pe prima pagină (doar urgent) și în Diaspora (pe țară).
export async function ActiveAlerts({ country, urgentOnly, diaspora }: { country?: string; urgentOnly?: boolean; diaspora?: boolean }) {
  const alerts = await getActiveAlerts({ country, urgentOnly, diaspora });
  if (!alerts.length) return null;
  return (
    <section className="mt-6 space-y-2">
      {alerts.map((a) => {
        const urgent = a.impact?.tip === "urgent";
        return (
          <Link prefetch={false}
            key={a.slug}
            href={articleUrl(a)}
            className={`flex items-start gap-3 rounded-lg border-2 p-3 ${urgent ? "border-alert bg-alert text-white" : "border-amber-ink/50 bg-white text-ink"}`}
          >
            <IconAlertTriangle size={22} stroke={1.75} className={`mt-0.5 shrink-0 ${urgent ? "text-white" : "text-amber-ink"}`} aria-hidden />
            <span>
              <span className={`block font-mono text-xs uppercase tracking-wide ${urgent ? "text-white/90" : "text-amber-ink"}`}>
                {urgent ? "Urgent" : "Alertă"}
                {a.country && ` · ${countryLabel(a.country)}`}
                {a.impact?.pana && ` · până la ${new Date(`${a.impact.pana}T12:00:00Z`).toLocaleDateString("ro-MD", { day: "numeric", month: "long" })}`}
              </span>
              <span className="mt-0.5 block font-medium leading-snug">{a.title}</span>
            </span>
          </Link>
        );
      })}
    </section>
  );
}
