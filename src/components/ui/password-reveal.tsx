"use client";

import { useRef, useState } from "react";
import { Check, Copy, TriangleAlert } from "lucide-react";
import { Button } from "./button";
import { Dialog } from "./dialog";

export interface PasswordRevealValue {
  /** Who it's for, e.g. "Password for Sample Admin One" */
  title: string;
  password: string;
}

/**
 * Shows a generated password once. It can only be closed with "I've saved it" (no Esc, no
 * outside click), because the system keeps no copy. The parent should drop `reveal` after
 * `onClose` so the password doesn't linger in memory.
 */
export function PasswordReveal({ reveal, onClose }: { reveal: PasswordRevealValue | null; onClose: () => void }) {
  // Keep the last value while the dialog animates out, so it doesn't flash empty
  const [shown, setShown] = useState(reveal);
  if (reveal && reveal !== shown) setShown(reveal);
  const value = reveal ?? shown;

  const [copied, setCopied] = useState<"idle" | "copied" | "failed">("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function copy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value.password);
      setCopied("copied");
    } catch {
      // Clipboard blocked: the password is selectable on screen, so say so
      setCopied("failed");
    }
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied("idle"), 3000);
  }

  return (
    <Dialog
      open={reveal !== null}
      onOpenChange={() => undefined}
      dismissible={false}
      title={value?.title ?? "Password"}
      description="Give this password to the person privately. They keep using it to sign in."
      footer={
        <Button
          onClick={() => {
            setCopied("idle");
            onClose();
          }}
        >
          I&apos;ve saved it
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-control bg-deep px-4 py-3 ring-1 ring-edge ring-inset">
          <code className="min-w-0 flex-1 font-mono text-body-lg font-semibold tracking-wider break-all text-aqua select-all">
            {value?.password}
          </code>
          <Button variant="secondary" size="sm" onClick={copy} aria-label="Copy password">
            {copied === "copied" ? (
              <Check className="size-4" aria-hidden="true" />
            ) : (
              <Copy className="size-4" aria-hidden="true" />
            )}
            {copied === "copied" ? "Copied" : "Copy"}
          </Button>
        </div>
        <p role="status" className="sr-only">
          {copied === "copied" ? "Password copied to the clipboard" : copied === "failed" ? "Couldn't copy" : ""}
        </p>
        {copied === "failed" && (
          <p className="text-caption text-warning">Couldn&apos;t copy automatically. Select the password and copy it.</p>
        )}
        <p className="flex items-start gap-2 text-small text-warning">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" strokeWidth={1.75} />
          <span>This is the only time it is shown. If it is lost, a super admin has to generate a new one.</span>
        </p>
      </div>
    </Dialog>
  );
}
