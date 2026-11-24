import type { Metadata } from "next";
import { ComingNext } from "@/components/admin/coming-next";

export const metadata: Metadata = { title: "Finalists" };

export default function Page() {
  return <ComingNext title="Finalists" slice="Slice 3" />;
}
