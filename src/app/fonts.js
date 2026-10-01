import { Alexandria, Audiowide, Bebas_Neue, Montserrat, Poppins, Roboto_Mono } from "next/font/google";
import localFont from "next/font/local";

// Weights match what the Vite site loaded from Google Fonts. Alexandria was
// only ever loaded at 400, so bold text is browser-synthesized; keep it that way.
export const alexandria = Alexandria({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-alexandria",
});

export const audiowide = Audiowide({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-audiowide",
});

export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-poppins",
});

export const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  weight: "700",
  display: "swap",
  variable: "--font-roboto-mono",
});

// Coming-soon page only: Bebas Neue for display, Montserrat for text
export const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-bebas-neue",
});

export const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-montserrat",
});

export const nicoMoji = localFont({
  src: "../assets/fonts/NicoMoji-Regular.ttf",
  weight: "400",
  style: "normal",
  variable: "--font-nicomoji",
});

export const fontVariables = [alexandria, audiowide, poppins, robotoMono, nicoMoji, bebasNeue, montserrat]
  .map((font) => font.variable)
  .join(" ");
