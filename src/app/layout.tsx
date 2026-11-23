import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { fontVariables } from "./fonts";
import SmoothScroll from "@/components/SmoothScroll";
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
        <SmoothScroll />
        <div className="grow">{children}</div>
        {/* The coming-soon page has its own footer */}
        {!COMING_SOON && <Footer />}
      </body>
    </html>
  );
}
