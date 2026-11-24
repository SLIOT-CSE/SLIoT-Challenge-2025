import type { Metadata } from "next";
import { SuperOnly } from "@/components/admin/super-only";
import { AuditScreen } from "@/components/admin/audit/audit-screen";

export const metadata: Metadata = { title: "Audit log" };

export default function Page() {
  return (
    <SuperOnly>
      <AuditScreen />
    </SuperOnly>
  );
}
