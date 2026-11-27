import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DesignSystem } from "./design-system";

export const metadata: Metadata = {
  title: "Design system · SLIoT 2027",
  robots: { index: false, follow: false },
};

// Development reference for the 2027 tokens and primitives. Not part of the public site.
export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DesignSystem />;
}
