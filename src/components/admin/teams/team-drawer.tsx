"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { AlertCircle, Mail, Pencil } from "lucide-react";
import { serverErrors, type ErrorMap, type FormValues } from "@/components/register/form";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  NetworkError,
  getAuditLog,
  getTeam,
  resendCode,
  dataVersion,
  updateTeam,
  type AuditEntryView,
  type TeamDetail,
  type TeamRow,
} from "@/lib/data";
import { CATEGORY_LABELS } from "@/lib/team-rules";
import { useAdminSession } from "../admin-session";
import { TeamDetails } from "./team-details";
import { TeamEditForm } from "./team-edit-form";
import { editErrors, isDirty, toEditInput, toFormValues } from "./team-edit";

const NETWORK_TEXT = "We couldn't reach the server. Check your connection and try again.";

type Loaded = { detail: TeamDetail; trail: AuditEntryView[] };

/**
 * A team over the table: its details, submissions and activity, and an edit mode for fixing
 * typos. Closing while there are unsaved edits asks first, and nothing closes mid-save.
 */
export function TeamDrawer({ team, onClose }: { team: TeamRow | null; onClose: () => void }) {
  const toast = useToast();
  const { actor, isSuper } = useAdminSession();
  const formId = useId();

  // Keep the last team while the drawer slides out, so it doesn't empty first
  const [shown, setShown] = useState(team);
  if (team && team !== shown) setShown(team);
  const teamId = shown?.id;
  const open = team !== null;

  // ---- Loading the full record ----

  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const storeVersion = useSyncExternalStore(dataVersion.subscribe, dataVersion.get, () => 0);

  useEffect(() => {
    if (!open || teamId === undefined) return;
    let cancelled = false;
    Promise.all([getTeam(teamId), getAuditLog({ targetType: "team", targetId: String(teamId) })])
      .then(([detail, trail]) => {
        if (cancelled || !detail) return;
        setLoaded({ detail, trail });
        setFailed(false);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, teamId, storeVersion, reloadKey]);

  const current = loaded && loaded.detail.id === teamId ? loaded : null;
  // Draft shortlist ticks are for super admins only, until the shortlist is finalised
  const trail = current ? current.trail.filter((e) => isSuper || e.action !== "shortlist.marked") : [];

  // ---- Editing ----

  const [values, setValues] = useState<FormValues | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [serverErrs, setServerErrs] = useState<ErrorMap>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Asking whether to throw edits away: because the drawer is closing, or because Cancel was pressed
  const [discard, setDiscard] = useState<null | "close" | "cancel">(null);
  const [sending, setSending] = useState(false);

  const editing = values !== null;
  const initial = current ? toFormValues(current.detail) : null;
  const dirty = editing && initial !== null && isDirty(initial, values);
  const errors: ErrorMap = values ? { ...editErrors(values), ...serverErrs } : {};

  function startEditing() {
    if (!current) return;
    setValues(toFormValues(current.detail));
    setSubmitted(false);
    setServerErrs({});
    setBanner(null);
  }

  function stopEditing() {
    setValues(null);
    setSubmitted(false);
    setServerErrs({});
    setBanner(null);
  }

  function closeNow() {
    stopEditing();
    onClose();
  }

  function requestClose() {
    if (saving) return;
    if (dirty) setDiscard("close");
    else closeNow();
  }

  async function save() {
    if (!values || !actor || !teamId || saving) return;
    setSubmitted(true);
    if (Object.keys(editErrors(values)).length > 0) {
      setBanner("Some details need fixing. They are marked below.");
      requestAnimationFrame(() => document.querySelector<HTMLElement>(`form[id="${formId}"] [aria-invalid="true"]`)?.focus());
      return;
    }

    setSaving(true);
    setBanner(null);
    try {
      const result = await updateTeam(teamId, toEditInput(values), actor);
      if (result.ok) {
        const n = result.data.changes.length;
        toast({
          tone: "success",
          title: n === 0 ? "Nothing to save" : "Changes saved",
          description: n === 0 ? "You didn't change anything." : `${n} ${n === 1 ? "detail" : "details"} updated.`,
        });
        stopEditing();
      } else if (result.error.code === "invalid_input" || result.error.code === "duplicate_member") {
        setServerErrs(serverErrors(result.error));
        setBanner(result.error.message);
        requestAnimationFrame(() => document.querySelector<HTMLElement>(`form[id="${formId}"] [aria-invalid="true"]`)?.focus());
      } else {
        setBanner(result.error.message);
      }
    } catch (e) {
      if (!(e instanceof NetworkError)) console.error(e);
      setBanner(NETWORK_TEXT);
    } finally {
      setSaving(false);
    }
  }

  async function emailCode() {
    if (!actor || !teamId || sending) return;
    setSending(true);
    try {
      const result = await resendCode(teamId, actor);
      if (result.ok) toast({ tone: "success", title: "Team code emailed", description: `Sent to ${result.data.toEmail}.` });
      else toast({ tone: "error", title: "Couldn't send the code", description: result.error.message });
    } catch (e) {
      toast({ tone: "error", title: "Couldn't send the code", description: e instanceof NetworkError ? NETWORK_TEXT : "Something went wrong." });
    } finally {
      setSending(false);
    }
  }

  // ---- Render ----

  const footer = editing ? (
    <>
      <Button variant="ghost" onClick={() => (dirty ? setDiscard("cancel") : stopEditing())} disabled={saving}>
        Cancel
      </Button>
      <Button type="submit" form={formId} loading={saving} disabled={!dirty}>
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </>
  ) : (
    <>
      <Button variant="secondary" onClick={emailCode} loading={sending} disabled={!current}>
        <Mail aria-hidden="true" className="size-4" />
        Email code again
      </Button>
      <Button onClick={startEditing} disabled={!current}>
        <Pencil aria-hidden="true" className="size-4" />
        Edit details
      </Button>
    </>
  );

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={(next) => {
          if (!next) requestClose();
        }}
        title={shown?.name ?? "Team"}
        description={shown ? `${shown.code} · ${CATEGORY_LABELS[shown.category]}` : undefined}
        footer={footer}
      >
        {failed && !current ? (
          <div className="flex flex-col items-start gap-4">
            <p className="text-body text-haze">We couldn&apos;t load this team. Check your connection and try again.</p>
            <Button
              onClick={() => {
                setFailed(false);
                setReloadKey((k) => k + 1);
              }}
            >
              Try again
            </Button>
          </div>
        ) : !current ? (
          <div role="status" aria-busy="true" aria-label="Loading team" className="flex flex-col gap-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : values ? (
          <div className="flex flex-col gap-6">
            {banner && (
              <div role="alert" className="flex items-start gap-3 rounded-control bg-warning/10 p-4 text-small text-foam ring-1 ring-warning/50 ring-inset">
                <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
                <span>{banner}</span>
              </div>
            )}
            <TeamEditForm
              id={formId}
              values={values}
              errors={errors}
              submitted={submitted}
              onChange={(next) => {
                setValues(next);
                // A server complaint is about what was sent; once it changes, only local checks apply
                if (Object.keys(serverErrs).length > 0) setServerErrs({});
              }}
              onSubmit={save}
            />
          </div>
        ) : (
          <TeamDetails team={current.detail} trail={trail} />
        )}
      </Drawer>

      <Dialog
        open={discard !== null}
        onOpenChange={(next) => {
          if (!next) setDiscard(null);
        }}
        title="Discard your changes?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDiscard(null)}>
              Keep editing
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                // Cancel only leaves edit mode; closing the drawer closes it as well
                const intent = discard;
                setDiscard(null);
                if (intent === "close") closeNow();
                else stopEditing();
              }}
            >
              Discard
            </Button>
          </>
        }
      >
        <p className="text-small text-haze">You have edits to this team that haven&apos;t been saved.</p>
      </Dialog>
    </>
  );

}
