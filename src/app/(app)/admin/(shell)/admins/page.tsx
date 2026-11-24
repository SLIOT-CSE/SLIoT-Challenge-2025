import type { Metadata } from "next";
import { ComingNext } from "@/components/admin/coming-next";

export const metadata: Metadata = { title: "Admins" };

export default function Page() {
  return <ComingNext title="Admins" slice="Slice 4" />;
}
