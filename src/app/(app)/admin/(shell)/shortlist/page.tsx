import type { Metadata } from "next";
import { SuperOnly } from "@/components/admin/super-only";
import { ShortlistScreen } from "@/components/admin/shortlist/shortlist-screen";

export const metadata: Metadata = { title: "Shortlist" };

export default function ShortlistPage() {
  return (
    <SuperOnly>
      <ShortlistScreen />
    </SuperOnly>
  );
}
