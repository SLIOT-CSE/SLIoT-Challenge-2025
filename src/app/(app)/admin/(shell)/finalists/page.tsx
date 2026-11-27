import type { Metadata } from "next";
import { SuperOnly } from "@/components/admin/super-only";
import { FinalistsScreen } from "@/components/admin/finalists/finalists-screen";

export const metadata: Metadata = { title: "Finalists" };

export default function FinalistsPage() {
  return (
    <SuperOnly>
      <FinalistsScreen />
    </SuperOnly>
  );
}
