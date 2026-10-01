import "./globals.css";
import { fontVariables } from "./fonts";
import SmoothScroll from "@/components/SmoothScroll";
import Footer from "@/components/Footer";
import { COMING_SOON } from "@/config/site.mjs";

export const metadata = {
  metadataBase: new URL("https://sliot.cse.mrt.ac.lk"),
  title: "SLIoT Challenge 2026",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <SmoothScroll />
        <div className="flex-grow">{children}</div>
        {/* The coming-soon page has its own footer */}
        {!COMING_SOON && <Footer className="mt-auto" />}
      </body>
    </html>
  );
}
