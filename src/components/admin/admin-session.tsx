"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { adminLogout, getCurrentAdmin, store, type AdminAccount, type AdminActor } from "@/lib/data";

export type AdminSessionStatus = "checking" | "signed-out" | "signed-in" | "offline";

interface AdminSessionValue {
  status: AdminSessionStatus;
  admin: AdminAccount | null;
  /** Who data calls are made as. Set whenever `admin` is */
  actor: AdminActor | null;
  isSuper: boolean;
  /** Checks the session again (after a network failure) */
  retry: () => void;
  signOut: () => Promise<void>;
}

const Context = createContext<AdminSessionValue | null>(null);

/**
 * Who is signed in on /admin. It reads the session on load and again whenever the sample store
 * changes (signing in or out from the dev switcher, an account being disabled), and keeps the
 * last answer while it checks so the screen doesn't flash.
 */
export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ status: AdminSessionStatus; admin: AdminAccount | null }>({
    status: "checking",
    admin: null,
  });
  const [reloadKey, setReloadKey] = useState(0);
  const storeVersion = useSyncExternalStore(store.subscribe, store.getVersion, () => 0);

  useEffect(() => {
    let cancelled = false;
    getCurrentAdmin()
      .then((admin) => {
        if (!cancelled) setState({ status: admin ? "signed-in" : "signed-out", admin });
      })
      .catch(() => {
        // A failed refresh keeps what we know; only a failed first check shows the error
        if (!cancelled) setState((prev) => (prev.status === "checking" ? { status: "offline", admin: null } : prev));
      });
    return () => {
      cancelled = true;
    };
  }, [storeVersion, reloadKey]);

  const retry = useCallback(() => {
    setState({ status: "checking", admin: null });
    setReloadKey((k) => k + 1);
  }, []);

  const signOut = useCallback(async () => {
    await adminLogout();
  }, []);

  const value = useMemo<AdminSessionValue>(
    () => ({
      status: state.status,
      admin: state.admin,
      actor: state.admin ? { id: state.admin.id, name: state.admin.displayName } : null,
      isSuper: state.admin?.role === "super_admin",
      retry,
      signOut,
    }),
    [state, retry, signOut],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAdminSession(): AdminSessionValue {
  const value = useContext(Context);
  if (!value) throw new Error("useAdminSession must be used inside AdminSessionProvider");
  return value;
}
