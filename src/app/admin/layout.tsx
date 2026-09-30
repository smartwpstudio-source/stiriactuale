import type { Metadata } from "next";

// noindex + robots.txt (Disallow: /admin/) — panoul nu trebuie să apară în
// Google, iar fără layout-ul (site) nu are nici AdSense.
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="mx-auto w-full max-w-5xl px-4 py-6">{children}</div>;
}
