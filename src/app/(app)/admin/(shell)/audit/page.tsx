import type { Metadata } from "next";
import { ComingNext } from "@/components/admin/coming-next";

export const metadata: Metadata = { title: "Audit log" };

export default function Page() {
  return <ComingNext title="Audit log" slice="Slice 4" />;
}
