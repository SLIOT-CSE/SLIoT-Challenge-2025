"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { getSettings, store, updateSettings, type DeadlineSettings } from "@/lib/data";
import { useAdminSession } from "../admin-session";
import { errorText } from "../errors";
import { PageHeader } from "../super-only";
import { formatUntil, inputToIso, isoToInput } from "./deadline-input";

type Key = keyof DeadlineSettings;

const FIELDS: { key: Key; label: string; helper: string }[] = [
  { key: "registrationCloses", label: "Registration closes", helper: "After this, /register stops taking new teams." },
  { key: "proposalDue", label: "Proposals due", helper: "After this, teams can no longer upload or replace a proposal." },
  { key: "prototypeDue", label: "Prototypes due", helper: "After this, shortlisted teams can no longer submit a prototype link." },
];

type Values = Record<Key, string>;

const toValues = (d: DeadlineSettings): Values => ({
  registrationCloses: isoToInput(d.registrationCloses),
  proposalDue: isoToInput(d.proposalDue),
  prototypeDue: isoToInput(d.prototypeDue),
});

/**
 * /admin/settings (super admins): the three deadlines the competition runs on. Entered and shown
 * in Sri Lanka time, each with how long until it. The data layer checks the order; its answer
 * lands on the right field.
 */
export function SettingsScreen() {
  const { actor } = useAdminSession();
  const toast = useToast();
  const storeVersion = useSyncExternalStore(store.subscribe, store.getVersion, () => 0);

  const [saved, setSaved] = useState<DeadlineSettings | null>(null);
  const [offline, setOffline] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [values, setValues] = useState<Values | null>(null);
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSettings()
      .then((s) => {
        if (cancelled) return;
        const d: DeadlineSettings = {
          registrationCloses: s.deadlines.registrationCloses,
          proposalDue: s.deadlines.proposalDue,
          prototypeDue: s.deadlines.prototypeDue,
        };
        setSaved(d);
        // Fill the form once; later refreshes must not overwrite what is being typed
        setValues((current) => current ?? toValues(d));
        setOffline(false);
      })
      .catch(() => {
        if (!cancelled) setOffline(true);
      });
    return () => {
      cancelled = true;
    };
  }, [storeVersion, reloadKey]);

  if (!saved || !values) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Settings" />
        {offline ? (
          <div className="flex flex-col items-start gap-4 rounded-panel bg-night/60 p-6 ring-1 ring-edge ring-inset">
            <h2 className="text-title font-semibold text-foam">We couldn&apos;t load the settings</h2>
            <p className="text-body text-haze">Check your connection and try again.</p>
            <Button onClick={() => setReloadKey((k) => k + 1)}>Try again</Button>
          </div>
        ) : (
          <div role="status" aria-busy="true" aria-label="Loading the settings" className="flex max-w-xl flex-col gap-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        )}
      </div>
    );
  }

  const savedValues = toValues(saved);
  const dirty = FIELDS.some((f) => values[f.key] !== savedValues[f.key]);
  const now = store.now();

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!actor || !values || saving || !dirty) return;

    // Only what changed is sent
    const patch: Partial<Record<Key, string>> = {};
    const local: Partial<Record<Key, string>> = {};
    for (const f of FIELDS) {
      if (values[f.key] === savedValues[f.key]) continue;
      const iso = inputToIso(values[f.key]);
      if (iso) patch[f.key] = iso;
      else local[f.key] = "Enter a date and time";
    }
    if (Object.keys(local).length > 0) {
      setErrors(local);
      setBanner("Some deadlines need fixing.");
      return;
    }

    setSaving(true);
    setErrors({});
    setBanner(null);
    try {
      const r = await updateSettings(patch, actor);
      if (r.ok) {
        toast({ tone: "success", title: "Deadlines saved", description: "The site and the team portal use them straight away." });
      } else {
        const byField: Partial<Record<Key, string>> = {};
        for (const issue of r.error.issues ?? []) byField[issue.path as Key] ??= issue.message;
        setErrors(byField);
        setBanner(r.error.message);
      }
    } catch (e) {
      setBanner(errorText(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="The deadlines the competition runs on, in Sri Lanka time. Changes apply at once to teams and the public site."
      />

      <form noValidate onSubmit={save} className="flex max-w-xl flex-col gap-6 rounded-panel bg-night/60 p-5 ring-1 ring-edge ring-inset sm:p-8">
        {banner && (
          <div role="alert" className="flex items-start gap-3 rounded-control bg-warning/10 p-4 text-small text-foam ring-1 ring-warning/50 ring-inset">
            <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
            <span>{banner}</span>
          </div>
        )}

        {FIELDS.map((f) => {
          const iso = inputToIso(values[f.key]);
          const until = iso ? formatUntil(Date.parse(iso), now) : null;
          return (
            <Field
              key={f.key}
              label={f.label}
              helper={
                <>
                  {f.helper}
                  {until && (
                    <>
                      {" "}
                      <strong className="font-semibold text-foam">{until}.</strong>
                    </>
                  )}
                </>
              }
              error={errors[f.key]}
              required
            >
              {(control) => (
                <Input
                  {...control}
                  type="datetime-local"
                  value={values[f.key]}
                  onChange={(e) => {
                    setValues({ ...values, [f.key]: e.target.value });
                    if (errors[f.key]) setErrors({ ...errors, [f.key]: undefined });
                  }}
                  className="[color-scheme:dark]"
                />
              )}
            </Field>
          );
        })}

        <p className="text-caption text-haze">
          Times are Sri Lanka time (UTC+5:30), whatever your computer is set to. Registration opening, the shortlist announcement and
          the finale are fixed for now.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={saving} disabled={!dirty}>
            {saving ? "Saving…" : "Save deadlines"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={!dirty || saving}
            onClick={() => {
              setValues(savedValues);
              setErrors({});
              setBanner(null);
            }}
          >
            Discard changes
          </Button>
        </div>
      </form>
    </div>
  );
}
