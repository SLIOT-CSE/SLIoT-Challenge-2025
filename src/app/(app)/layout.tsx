import type { ReactNode } from "react";
import { SampleSwitcher } from "@/components/dev/sample-switcher";

// Shared by the app screens (/register, /team, /admin): the sample-data switcher shows here
// in development only. The public one-page site at / is outside this group on purpose.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SampleSwitcher />
    </>
  );
}
