import Script from "next/script";

// Google Analytics 4 — statistica cerută de proprietar (2026-10-17), lângă Yandex.Metrica.
// Doar în cadrul public (site)/layout.tsx, nu în /admin. Navigarea fără reîncărcare
// o numără singur GA4 („Enhanced measurement” → schimbările de pagină din istoric).
// Consimțământ: în UE/SEE, Regatul Unit și Elveția pornește refuzat; mesajul Google
// de confidențialitate (cel de la AdSense) îl actualizează după alegerea cititorului.
const ID = "G-BC9VYPW709";
const CONSENT_REGIONS = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT",
  "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO", "GB", "CH",
];

export function GoogleAnalytics() {
  return (
    <>
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',region:${JSON.stringify(CONSENT_REGIONS)}});gtag('js',new Date());gtag('config','${ID}');`}
      </Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${ID}`} strategy="afterInteractive" />
    </>
  );
}
