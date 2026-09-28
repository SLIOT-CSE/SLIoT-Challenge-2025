import "./globals.css";

export const metadata = {
  title: "SLIoT Challenge 2026",
};

// Temporary scaffold layout; replaced in step 2 with fonts, Lenis and Footer.
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
