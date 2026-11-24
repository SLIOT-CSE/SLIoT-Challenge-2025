import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";

// Everything signed-in under /admin: the sidebar, the session check and the toasts.
// /admin/login sits outside this group on purpose.
export default function AdminShellLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
