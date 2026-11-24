import type { Metadata } from "next";
import { ComingNext } from "@/components/admin/coming-next";

export const metadata: Metadata = { title: "Shortlist" };

export default function Page() {
  return <ComingNext title="Shortlist" slice="Slice 3" />;
}
