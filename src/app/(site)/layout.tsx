import { Header } from "@/components/header";
import { StatusBar } from "@/components/status-bar";
import { Footer } from "@/components/footer";
import { RegisterServiceWorker } from "@/components/register-service-worker";
import { AdsenseScript } from "@/components/adsense-script";
import { YandexMetrika } from "@/components/yandex-metrika";

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
      <AdsenseScript />
      <YandexMetrika />
    </>
  );
}
