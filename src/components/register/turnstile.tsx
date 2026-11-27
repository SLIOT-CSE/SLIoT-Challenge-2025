"use client";

import { useCallback, useEffect, useRef } from "react";
import { TurnstilePlaceholder } from "./turnstile-placeholder";

// The Cloudflare Turnstile bot check on the registration form (docs/architecture.md, 6.1).
// With NEXT_PUBLIC_TURNSTILE_SITE_KEY set it renders the real widget; without it (development
// only: production refuses to start without the keys) it shows the placeholder, and the server
// skips the check.

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render(
    element: HTMLElement,
    options: {
      sitekey: string;
      theme?: "dark" | "light" | "auto";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptLoading: Promise<void> | null = null;
function loadScript(): Promise<void> {
  scriptLoading ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoading = null;
      reject(new Error("Turnstile didn't load"));
    };
    document.head.appendChild(script);
  });
  return scriptLoading;
}

/**
 * Calls `onToken` with a fresh token when the check passes, and with null when it expires or
 * fails. Changing `resetKey` runs the check again: a token works once, so the form resets it
 * after each submit.
 */
export function Turnstile({ onToken, resetKey }: { onToken: (token: string | null) => void; resetKey: number }) {
  if (!SITE_KEY) return <PlaceholderCheck onToken={onToken} resetKey={resetKey} />;
  return <RealTurnstile siteKey={SITE_KEY} onToken={onToken} resetKey={resetKey} />;
}

function PlaceholderCheck({ onToken, resetKey }: { onToken: (token: string | null) => void; resetKey: number }) {
  // Stable, because the placeholder restarts its check whenever this changes
  const onVerified = useCallback((ok: boolean) => onToken(ok ? "dev-placeholder" : null), [onToken]);
  return <TurnstilePlaceholder resetKey={resetKey} onVerified={onVerified} />;
}

function RealTurnstile({ siteKey, onToken, resetKey }: { siteKey: string; onToken: (token: string | null) => void; resetKey: number }) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const callback = useRef(onToken);
  useEffect(() => {
    callback.current = onToken;
  }, [onToken]);

  useEffect(() => {
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !box.current || !window.turnstile) return;
        widget.current = window.turnstile.render(box.current, {
          sitekey: siteKey,
          theme: "dark",
          callback: (token) => callback.current(token),
          "expired-callback": () => callback.current(null),
          "error-callback": () => callback.current(null),
        });
      })
      .catch(() => callback.current(null));
    return () => {
      cancelled = true;
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = null;
    };
  }, [siteKey]);

  // A new check after every submit
  useEffect(() => {
    if (resetKey === 0 || !widget.current || !window.turnstile) return;
    callback.current(null);
    window.turnstile.reset(widget.current);
  }, [resetKey]);

  return <div ref={box} className="min-h-16" />;
}
