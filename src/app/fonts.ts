// next/font variables are named --nf-*; the --font-* theme tokens in globals.css point at them.
import { Bebas_Neue, Montserrat } from "next/font/google";

// 2027 site: Bebas Neue for display, Montserrat for text
export const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--nf-bebas-neue",
});

export const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--nf-montserrat",
});

export const fontVariables = [bebasNeue, montserrat].map((font) => font.variable).join(" ");
