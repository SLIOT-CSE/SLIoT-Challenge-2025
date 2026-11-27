import type { Metadata } from "next";
import { SuperOnly } from "@/components/admin/super-only";
import { AdminsScreen } from "@/components/admin/admins/admins-screen";

export const metadata: Metadata = { title: "Admins" };

export default function Page() {
  return (
    <SuperOnly>
      <AdminsScreen />
    </SuperOnly>
  );
}
