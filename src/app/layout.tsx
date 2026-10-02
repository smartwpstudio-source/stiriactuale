import type { Metadata } from "next";
import { Alfa_Slab_One, Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { SITE_URL } from "@/lib/seo";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  weight: "500",
  style: ["normal", "italic"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
});

// doar pentru logo ("ȘTIRI·ACTUALE", ca pe logo-ul vechi al site-ului)
const alfaSlab = Alfa_Slab_One({
  variable: "--font-alfa-slab",
  subsets: ["latin", "latin-ext"],
  weight: "400",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Stiri actuale",
    template: "%s — Stiri actuale",
  },
  description: "Știri din Moldova — regiuni, național, internațional, diaspora.",
  manifest: "/manifest.webmanifest",
  // aceeași proprietate Search Console ca site-ul WordPress — istoricul se păstrează
  verification: { google: "D3-OLYwLDh37LyoQPynKaPN_EGe62ztq7rB_SXMJNow" },
  alternates: { types: { "application/rss+xml": "/feed/" } },
  // imaginea de distribuire implicită (prima pagină, secțiuni); articolele o înlocuiesc
  openGraph: {
    siteName: "Stiri actuale",
    locale: "ro_MD",
    images: [{ url: "/og/?t=%C8%98tiri%20din%20Moldova%20%E2%80%94%20regiuni%2C%20na%C8%9Bional%2C%20interna%C8%9Bional%2C%20diaspora", width: 1200, height: 630 }],
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "32x32 48x48" },
      { url: "/icons/favicon-32.png?v=2", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png?v=2", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png?v=2", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Stiri actuale",
  },
};

export const viewport = {
  themeColor: "#141820",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ro"
      className={`${fraunces.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} ${alfaSlab.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink font-sans">
        {children}
      </body>
    </html>
  );
}
