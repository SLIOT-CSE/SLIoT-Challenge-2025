import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { fontVariables } from "./fonts";
import { SmoothScrollProvider } from "@/lib/motion/smooth-scroll";
import { site } from "@/content/site";
import { HERO_LOADER_KEY } from "@/lib/hero-readiness";

const HERO_PREPAINT_SCRIPT = `try{if(window.location.pathname==='/'&&!window.location.hash&&window.scrollY<40&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches&&window.sessionStorage.getItem('${HERO_LOADER_KEY}')!=='1'){document.documentElement.dataset.heroLoading='true';}}catch{}`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s · ${site.title}` },
  description: site.description,
  openGraph: { title: site.title, description: site.description, url: site.url, siteName: site.title, type: "website" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#010610",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        {/* Synchronous blocking head script sets data-hero-loading before first body paint */}
        <script dangerouslySetInnerHTML={{ __html: HERO_PREPAINT_SCRIPT }} />
      </head>
      <body>
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  );
}
