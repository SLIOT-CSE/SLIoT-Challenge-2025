"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { AlertCircle, KeyRound, ShieldCheck, ShieldOff, UserCog, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordReveal, type PasswordRevealValue } from "@/components/ui/password-reveal";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  createAdmin,
  listAdmins,
  resetAdminPassword,
  setAdminDisabled,
  setAdminRole,
  store,
  type AdminAccount,
  type AdminRole,
} from "@/lib/data";
import { useAdminSession } from "../admin-session";
import { errorText } from "../errors";
import { formatDateTime } from "../format";
import { ROLE_LABEL } from "../nav";
import { PageHeader } from "../super-only";

type Confirm = { kind: "reset" | "disable" | "enable" | "role"; admin: AdminAccount };

/**
 * /admin/admins (super admins): the organizer accounts. A new or reset password is shown once and
 * never stored. You can't act on your own account here (so you can't lock yourself out), and the
 * data layer refuses to disable or demote the last active super admin.
 */
export function AdminsScreen() {
  const { actor } = useAdminSession();
  const toast = useToast();
  const storeVersion = useSyncExternalStore(store.subscribe, store.getVersion, () => 0);

  const [admins, setAdmins] = useState<AdminAccount[] | null>(null);
  const [offline, setOffline] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [creating, setCreating] = useState(false);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [reveal, setReveal] = useState<PasswordRevealValue | null>(null);

  useEffect(() => {
    if (!actor) return;
    let cancelled = false;
    listAdmins(actor)
      .then((r) => {
        if (cancelled) return;
        if (r.ok) {
          setAdmins(r.data);
          setOffline(false);
        } else setOffline(true);
      })
      .catch(() => {
        if (!cancelled) setOffline(true);
      });
    return () => {
      cancelled = true;
    };
  }, [actor, storeVersion, reloadKey]);

  if (!admins) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Admins" />
        {offline ? (
          <div className="flex flex-col items-start gap-4 rounded-panel bg-night/60 p-6 ring-1 ring-edge ring-inset">
            <h2 className="text-title font-semibold text-foam">We couldn&apos;t load the accounts</h2>
            <p className="text-body text-haze">Check your connection and try again.</p>
            <Button onClick={() => setReloadKey((k) => k + 1)}>Try again</Button>
          </div>
        ) : (
          <div role="status" aria-busy="true" aria-label="Loading the accounts" className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Admins"
        description="Everyone who can sign in to this dashboard. Super admins can also shortlist, change settings and manage accounts."
        actions={
          <Button onClick={() => setCreating(true)}>
            <UserPlus aria-hidden="true" className="size-4" />
            Create admin
          </Button>
        }
      />

      <div className="relative overflow-x-auto rounded-panel ring-1 ring-edge ring-inset">
        <table className="w-full border-separate border-spacing-0 text-small">
          <caption className="sr-only">Organizer accounts</caption>
          <thead>
            <tr className="text-left text-haze">
              {["Name", "Role", "Status", "Last sign-in"].map((h) => (
                <th key={h} scope="col" className="border-b border-edge bg-night px-3 py-3 font-semibold whitespace-nowrap">
                  {h}
                </th>
              ))}
              <th scope="col" className="border-b border-edge bg-night px-3 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => {
              const me = a.id === actor?.id;
              return (
                <tr key={a.id} className="hover:bg-foam/5">
                  <td className="border-b border-edge/60 px-3 py-3 whitespace-nowrap">
                    <span className="block font-semibold text-foam">
                      {a.displayName}
                      {me && <span className="ml-2 text-caption font-normal text-mint">You</span>}
                    </span>
                    <span className="block font-mono text-caption text-haze">{a.username}</span>
                  </td>
                  <td className="border-b border-edge/60 px-3 whitespace-nowrap">
                    <Badge tone={a.role === "super_admin" ? "aqua" : "neutral"}>{ROLE_LABEL[a.role]}</Badge>
                  </td>
                  <td className="border-b border-edge/60 px-3 whitespace-nowrap">
                    {a.disabled ? <Badge tone="danger">Disabled</Badge> : <Badge tone="mint">Active</Badge>}
                  </td>
                  <td className="border-b border-edge/60 px-3 whitespace-nowrap text-haze">
                    {a.lastLoginAt ? formatDateTime(a.lastLoginAt) : "Never"}
                  </td>
                  <td className="min-w-80 border-b border-edge/60 px-3 py-1">
                    {me ? (
                      <span className="text-caption text-haze">This is you</span>
                    ) : (
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setConfirm({ kind: "reset", admin: a })}>
                          <KeyRound aria-hidden="true" className="size-4" />
                          Reset password<span className="sr-only"> for {a.displayName}</span>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setConfirm({ kind: "role", admin: a })}>
                          <UserCog aria-hidden="true" className="size-4" />
                          {a.role === "super_admin" ? "Make admin" : "Make super admin"}
                          <span className="sr-only"> for {a.displayName}</span>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setConfirm({ kind: a.disabled ? "enable" : "disable", admin: a })}>
                          {a.disabled ? (
                            <ShieldCheck aria-hidden="true" className="size-4" />
                          ) : (
                            <ShieldOff aria-hidden="true" className="size-4" />
                          )}
                          {a.disabled ? "Enable" : "Disable"}
                          <span className="sr-only"> {a.displayName}</span>
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <CreateDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(admin, password) => {
          setCreating(false);
          setReveal({ title: `Password for ${admin.displayName}`, password });
          toast({ tone: "success", title: "Account created", description: `${admin.username} can sign in with the password shown next.` });
        }}
      />

      <ConfirmDialog
        confirm={confirm}
        onClose={() => setConfirm(null)}
        onRevealPassword={(admin, password) => setReveal({ title: `New password for ${admin.displayName}`, password })}
      />

      <PasswordReveal reveal={reveal} onClose={() => setReveal(null)} />
    </div>
  );
}

function CreateDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (admin: AdminAccount, password: string) => void;
}) {
  const { actor } = useAdminSession();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<AdminRole>("admin");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Every time it opens it starts empty
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDisplayName("");
      setUsername("");
      setRole("admin");
      setErrors({});
      setBanner(null);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!actor || saving) return;
    setSaving(true);
    setErrors({});
    setBanner(null);
    try {
      const r = await createAdmin({ username, displayName, role }, actor);
      if (r.ok) onCreated(r.data.admin, r.data.password);
      else {
        const byField: Record<string, string> = {};
        for (const issue of r.error.issues ?? []) byField[issue.path] ??= issue.message;
        setErrors(byField);
        setBanner(Object.keys(byField).length > 0 ? null : r.error.message);
      }
    } catch (e) {
      setBanner(errorText(e));
    } finally {
      setSaving(false);
    }
  }

  const formId = "create-admin-form";
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !saving && !o && onClose()}
      title="Create an admin"
      description="A password is generated and shown once, so you can pass it on."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            {saving ? "Creating…" : "Create account"}
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={submit} className="flex flex-col gap-5">
        {banner && (
          <div role="alert" className="flex items-start gap-3 rounded-control bg-warning/10 p-4 text-small text-foam ring-1 ring-warning/50 ring-inset">
            <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
            <span>{banner}</span>
          </div>
        )}
        <Field label="Display name" error={errors.displayName} required>
          {(control) => <Input {...control} value={displayName} maxLength={60} onChange={(e) => setDisplayName(e.target.value)} autoComplete="off" />}
        </Field>
        <Field
          label="Username"
          helper="3 to 30 letters, numbers, dots, dashes or underscores. They sign in with this."
          error={errors.username}
          required
        >
          {(control) => (
            <Input
              {...control}
              value={username}
              maxLength={30}
              onChange={(e) => setUsername(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="off"
            />
          )}
        </Field>
        <Field label="Role" error={errors.role} helper="Super admins can also shortlist, change settings and manage accounts.">
          {(control) => (
            <Select {...control} value={role} onChange={(e) => setRole(e.target.value as AdminRole)}>
              <option value="admin">Admin</option>
              <option value="super_admin">Super admin</option>
            </Select>
          )}
        </Field>
      </form>
    </Dialog>
  );
}

const COPY: Record<Confirm["kind"], (a: AdminAccount) => { title: string; body: string; action: string; danger?: boolean }> = {
  reset: (a) => ({
    title: `Reset ${a.displayName}'s password?`,
    body: "A new password is generated and shown once. The old one stops working and they are signed out.",
    action: "Generate new password",
  }),
  disable: (a) => ({
    title: `Disable ${a.displayName}?`,
    body: "They are signed out and can't sign in until you enable the account again. Their history stays.",
    action: "Disable account",
    danger: true,
  }),
  enable: (a) => ({
    title: `Enable ${a.displayName}?`,
    body: "They can sign in again with their current password.",
    action: "Enable account",
  }),
  role: (a) => ({
    title: a.role === "super_admin" ? `Make ${a.displayName} an admin?` : `Make ${a.displayName} a super admin?`,
    body:
      a.role === "super_admin"
        ? "They lose access to the shortlist, finalists, settings, accounts and the audit log."
        : "They gain access to the shortlist, finalists, settings, accounts and the audit log.",
    action: a.role === "super_admin" ? "Make admin" : "Make super admin",
    danger: a.role === "super_admin",
  }),
};

function ConfirmDialog({
  confirm,
  onClose,
  onRevealPassword,
}: {
  confirm: Confirm | null;
  onClose: () => void;
  onRevealPassword: (admin: AdminAccount, password: string) => void;
}) {
  const { actor } = useAdminSession();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep the last request while the dialog fades out, and clear the error whenever a new one opens
  const [shown, setShown] = useState(confirm);
  if (confirm && confirm !== shown) {
    setShown(confirm);
    setError(null);
  }
  const c = confirm ?? shown;
  const copy = c ? COPY[c.kind](c.admin) : null;

  async function run() {
    if (!actor || !confirm || pending) return;
    const { kind, admin } = confirm;
    setPending(true);
    setError(null);
    try {
      if (kind === "reset") {
        const r = await resetAdminPassword(admin.id, actor);
        if (!r.ok) return setError(r.error.message);
        onClose();
        onRevealPassword(admin, r.data.password);
        return;
      }
      const r =
        kind === "role"
          ? await setAdminRole(admin.id, admin.role === "super_admin" ? "admin" : "super_admin", actor)
          : await setAdminDisabled(admin.id, kind === "disable", actor);
      if (!r.ok) return setError(r.error.message);
      onClose();
      toast({
        tone: "success",
        title: kind === "role" ? "Role changed" : kind === "disable" ? "Account disabled" : "Account enabled",
        description: admin.displayName,
      });
    } catch (e) {
      setError(errorText(e));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={confirm !== null}
      onOpenChange={(o) => !pending && !o && onClose()}
      title={copy?.title ?? "Confirm"}
      description={copy?.body}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant={copy?.danger ? "danger" : "primary"} onClick={run} loading={pending}>
            {copy?.action}
          </Button>
        </>
      }
    >
      {error ? (
        <div role="alert" className="flex items-start gap-3 rounded-control bg-warning/10 p-4 text-small text-foam ring-1 ring-warning/50 ring-inset">
          <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
          <span>{error}</span>
        </div>
      ) : null}
    </Dialog>
  );
}
