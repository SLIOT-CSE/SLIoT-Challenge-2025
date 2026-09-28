import "./globals.css";
import { fontVariables } from "./fonts";
import SmoothScroll from "@/components/SmoothScroll";
import Footer from "@/components/Footer";

export const metadata = {
  title: "SLIoT Challenge 2026",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <SmoothScroll />
        <div className="flex-grow">{children}</div>
        <Footer className="mt-auto" />
      </body>
    </html>
  );
}
