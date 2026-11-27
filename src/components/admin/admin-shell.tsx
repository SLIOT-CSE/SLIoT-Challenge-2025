"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { logo } from "@/assets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToastProvider } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { AdminSessionProvider, useAdminSession } from "./admin-session";
import { ADMIN_LOGIN, ROLE_LABEL, isNavActive, navFor, type AdminNavItem } from "./nav";

/**
 * The frame around every signed-in /admin screen: a sidebar on large screens, a top bar with a
 * scrolling row of tabs on small ones. It checks the session, sends signed-out visitors to the
 * login and shows the entries the role may use.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AdminSessionProvider>
      <ToastProvider>
        <Frame>{children}</Frame>
      </ToastProvider>
    </AdminSessionProvider>
  );
}

function Frame({ children }: { children: ReactNode }) {
  const session = useAdminSession();
  const router = useRouter();

  useEffect(() => {
    if (session.status === "signed-out") router.replace(ADMIN_LOGIN);
  }, [session.status, router]);

  if (session.status === "offline") {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-start justify-center gap-5 px-4">
        <h1 className="text-title font-semibold text-foam">We couldn&apos;t load the dashboard</h1>
        <p className="text-body text-haze">Check your connection and try again.</p>
        <Button onClick={session.retry}>Try again</Button>
      </div>
    );
  }

  // Checking, or signed out and about to be sent to the login: show the frame's shape, not a flash of content
  if (!session.admin) return <ShellSkeleton />;

  const items = navFor(session.admin.role);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-toast focus:rounded-full focus:bg-mint focus:px-5 focus:py-3 focus:font-semibold focus:text-abyss"
      >
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r border-edge bg-night/60 p-4 lg:flex">
        <Brand />
        <nav aria-label="Admin" className="flex flex-col gap-1">
          {items.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>
        <div className="mt-auto">
          <Account />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="border-b border-edge bg-night/60 lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <Brand />
            <Account compact />
          </div>
          <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3">
            {items.map((item) => (
              <NavLink key={item.href} item={item} pill />
            ))}
          </nav>
        </header>
        <main id="admin-main" className="px-4 py-6 sm:px-8 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <Link href="/admin" aria-label="SLIoT Challenge admin, Teams" className="flex shrink-0 items-center rounded-full py-1">
        <img src={logo} alt="" width={1518} height={813} className="h-8 w-auto" />
      </Link>
      <Badge tone="warning">Sample data</Badge>
    </div>
  );
}

function NavLink({ item, pill = false }: { item: AdminNavItem; pill?: boolean }) {
  const pathname = usePathname();
  const active = isNavActive(pathname, item);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 shrink-0 items-center gap-3 rounded-control px-3 text-small font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua motion-reduce:transition-none",
        pill && "rounded-full px-4",
        active ? "bg-mint/15 text-mint" : "text-haze hover:bg-foam/10 hover:text-foam",
      )}
    >
      <Icon aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.75} />
      {item.label}
    </Link>
  );
}

function Account({ compact = false }: { compact?: boolean }) {
  const { admin, signOut } = useAdminSession();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  if (!admin) return null;

  async function leave() {
    setLeaving(true);
    try {
      await signOut();
      router.replace(ADMIN_LOGIN);
    } catch {
      // The sign-out call failed: stay put so the person can try again
      setLeaving(false);
    }
  }

  return (
    <div className={cn("flex items-center gap-3", !compact && "flex-col items-stretch rounded-panel bg-deep/60 p-3 ring-1 ring-edge ring-inset")}>
      <div className={cn("min-w-0", compact && "hidden sm:block")}>
        <p className="truncate text-small font-semibold text-foam">{admin.displayName}</p>
        <p className="text-caption text-haze">{ROLE_LABEL[admin.role]}</p>
      </div>
      <Button variant="secondary" size="sm" onClick={leave} loading={leaving} aria-label={compact ? "Sign out" : undefined}>
        <LogOut aria-hidden="true" className="size-4" />
        {compact ? <span className="sr-only sm:not-sr-only">Sign out</span> : "Sign out"}
      </Button>
    </div>
  );
}

/** The frame's shape while the session is checked */
function ShellSkeleton() {
  const block = "rounded-control bg-night/60 ring-1 ring-edge ring-inset motion-safe:animate-pulse";
  return (
    <div role="status" aria-label="Loading the dashboard" className="min-h-dvh lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <div className="hidden flex-col gap-3 border-r border-edge p-4 lg:flex">
        <div className={cn(block, "h-9 w-40")} />
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn(block, "h-11")} />
        ))}
      </div>
      <div className="flex flex-col gap-4 px-4 py-6 sm:px-8 sm:py-8">
        <div className={cn(block, "h-9 w-48")} />
        <div className={cn(block, "h-12 w-full")} />
        <div className={cn(block, "h-64 w-full")} />
      </div>
    </div>
  );
}
