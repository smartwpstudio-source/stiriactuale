import Script from "next/script";
import { Header } from "@/components/header";
import { StatusBar } from "@/components/status-bar";
import { Footer } from "@/components/footer";
import { RegisterServiceWorker } from "@/components/register-service-worker";
import { AdsenseRouteRefresh } from "@/components/adsense-route-refresh";
import { ADSENSE_CLIENT_ID } from "@/lib/adsense";

// Cadrul paginilor publice. Separat de root layout ca /admin să nu aibă
// header-ul site-ului și, mai ales, scriptul AdSense (reclame pe pagini fără
// conținut editorial = risc de politică AdSense).
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <StatusBar />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
      <RegisterServiceWorker />
      <AdsenseRouteRefresh />
      <Script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
    </>
  );
}
