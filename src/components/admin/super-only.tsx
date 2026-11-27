"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useAdminSession } from "./admin-session";
import { ADMIN_HOME } from "./nav";

/**
 * Wraps a screen only super admins may use. The sidebar already hides the entry; this covers
 * someone typing the address. The data layer refuses the calls too, so this is for the message.
 */
export function SuperOnly({ children }: { children: ReactNode }) {
  const { isSuper } = useAdminSession();
  if (isSuper) return <>{children}</>;
  return (
    <EmptyState
      icon={<ShieldAlert />}
      title="Only super admins can open this page"
      description="Ask a super admin if you need something changed here."
      action={
        <Button asChild variant="secondary">
          <Link href={ADMIN_HOME}>Back to Teams</Link>
        </Button>
      }
    />
  );
}

/** Heading block shared by the admin screens */
export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-display-md text-foam">{title}</h1>
        {description && <p className="max-w-prose text-small text-haze">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
