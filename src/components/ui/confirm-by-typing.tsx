"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "./button";
import { Dialog } from "./dialog";
import { Input } from "./input";

/**
 * For actions that email people or can't be taken back lightly: the confirm button stays off
 * until the exact word is typed. `onConfirm` returns an error message to show, or nothing
 * when it worked (the dialog then closes). While it runs, the dialog can't be dismissed.
 *
 *   <ConfirmByTyping open={open} onOpenChange={setOpen} word="FINALISE" title="Finalise the shortlist?"
 *     description="This will email 12 teams…" confirmLabel="Finalise shortlist" onConfirm={run} />
 */
export function ConfirmByTyping({
  open,
  onOpenChange,
  title,
  description,
  word,
  confirmLabel,
  tone = "primary",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** What will happen, in plain words: who is emailed, what opens or closes */
  description: ReactNode;
  /** The word to type, exactly as shown */
  word: string;
  confirmLabel: string;
  tone?: "primary" | "danger";
  onConfirm: () => Promise<string | void>;
}) {
  const inputId = useId();
  const [typed, setTyped] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Every time the dialog opens it starts empty, with no leftover error
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setTyped("");
      setError(null);
    }
  }

  const matches = typed.trim() === word;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!matches || pending) return;
    setPending(true);
    setError(null);
    try {
      const message = await onConfirm();
      if (typeof message === "string") setError(message);
      else onOpenChange(false);
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      // A request in flight can't be abandoned halfway
      onOpenChange={(next) => (pending ? undefined : onOpenChange(next))}
      title={title}
      description={description}
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor={inputId} className="text-small font-semibold text-foam">
            Type <span className="font-mono tracking-wide text-mint">{word}</span> to confirm
          </label>
          <Input
            id={inputId}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${inputId}-error` : undefined}
            disabled={pending}
          />
          <p id={`${inputId}-error`} role="alert" className={error ? "text-caption text-danger" : "sr-only"}>
            {error}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" variant={tone} disabled={!matches} loading={pending}>
            {pending ? "Working…" : confirmLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
