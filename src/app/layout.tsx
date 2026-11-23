import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { fontVariables } from "./fonts";
import { SmoothScrollProvider } from "@/lib/motion/smooth-scroll";
import Footer from "@/components/Footer";
import { COMING_SOON } from "@/config/site";

export const metadata: Metadata = {
  metadataBase: new URL("https://sliot.cse.mrt.ac.lk"),
  title: "SLIoT Challenge 2026",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <SmoothScrollProvider>
          <div className="grow">{children}</div>
          {/* The coming-soon page has its own footer */}
          {!COMING_SOON && <Footer />}
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
