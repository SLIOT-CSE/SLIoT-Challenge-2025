import type { Metadata } from "next";
import { ComingNext } from "@/components/admin/coming-next";

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return <ComingNext title="Settings" slice="Slice 4" />;
}
