import type { Metadata } from "next";
import type { ReactNode } from "react";

// Every /admin page: never indexed, whatever a page adds on top
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · SLIoT admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
