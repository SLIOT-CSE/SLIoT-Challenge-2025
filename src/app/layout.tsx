import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { fontVariables } from "./fonts";
import { SmoothScrollProvider } from "@/lib/motion/smooth-scroll";
import { site } from "@/content/site";

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
      <body>
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  );
}
