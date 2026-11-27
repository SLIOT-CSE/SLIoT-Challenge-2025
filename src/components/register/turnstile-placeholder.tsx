"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

/**
 * Stand-in for the Cloudflare Turnstile widget (step U1 adds the real one). Takes a moment
 * to "verify", then lets the form submit. Changing `resetKey` runs the check again, as
 * Turnstile does after a failed submit because its token works once.
 */
export function TurnstilePlaceholder({
  onVerified,
  resetKey,
}: {
  onVerified: (ok: boolean) => void;
  resetKey: number;
}) {
  // Which run has finished, so "checking" is simply "the current run hasn't finished yet"
  const [verifiedRun, setVerifiedRun] = useState<number | null>(null);
  const ok = verifiedRun === resetKey;

  useEffect(() => {
    const timer = setTimeout(() => {
      setVerifiedRun(resetKey);
      onVerified(true);
    }, 900);
    return () => {
      clearTimeout(timer);
      onVerified(false);
    };
  }, [resetKey, onVerified]);

  return (
    <div
      role="status"
      className="flex min-h-16 items-center gap-4 rounded-control bg-deep/60 px-4 py-3 ring-1 ring-edge ring-inset"
    >
      <span
        aria-hidden="true"
        className="grid size-7 shrink-0 place-items-center rounded-full ring-1 ring-edge ring-inset"
      >
        {ok ? (
          <Check className="size-4 text-mint" />
        ) : (
          <svg viewBox="0 0 24 24" className="size-4 animate-spin text-haze motion-reduce:animate-none">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
            <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}
      </span>
      <span className="flex flex-col">
        <span className="text-small font-semibold text-foam">{ok ? "You're human" : "Checking you're human…"}</span>
        <span className="text-caption text-haze">Placeholder for the Cloudflare Turnstile bot check</span>
      </span>
    </div>
  );
}
