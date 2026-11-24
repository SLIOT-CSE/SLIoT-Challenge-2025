import { ListChecks, ScrollText, Settings, ShieldCheck, Trophy, Users, type LucideIcon } from "lucide-react";
import type { AdminRole } from "@/lib/data";

// The admin sidebar: one place for the entries, who sees them and which one is current.

export const ADMIN_HOME = "/admin";
export const ADMIN_LOGIN = "/admin/login";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Only super admins see it, and the page itself refuses everyone else */
  superOnly: boolean;
}

export const ADMIN_NAV: readonly AdminNavItem[] = [
  { href: ADMIN_HOME, label: "Teams", icon: Users, superOnly: false },
  { href: "/admin/shortlist", label: "Shortlist", icon: ListChecks, superOnly: true },
  { href: "/admin/finalists", label: "Finalists", icon: Trophy, superOnly: true },
  { href: "/admin/settings", label: "Settings", icon: Settings, superOnly: true },
  { href: "/admin/admins", label: "Admins", icon: ShieldCheck, superOnly: true },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText, superOnly: true },
];

/** The entries a role may see */
export function navFor(role: AdminRole): AdminNavItem[] {
  return ADMIN_NAV.filter((item) => !item.superOnly || role === "super_admin");
}

/** Teams owns /admin itself; every other entry owns its path and what is under it */
export function isNavActive(pathname: string, item: AdminNavItem): boolean {
  if (item.href === ADMIN_HOME) return pathname === ADMIN_HOME;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export const ROLE_LABEL: Record<AdminRole, string> = {
  super_admin: "Super admin",
  admin: "Admin",
};
