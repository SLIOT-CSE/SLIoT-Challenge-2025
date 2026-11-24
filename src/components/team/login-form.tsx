"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { routes } from "@/content/navigation";
import { NetworkError, loginWithCode, requestCodeReminder, type DataError } from "@/lib/data";
import { CODE_PREFIX, formatCodeInput } from "@/lib/team-code";
import { cn } from "@/lib/utils";
import { formatWait } from "./portal";
import { useSecondsLeft } from "./use-seconds-left";

const BODY_LENGTH = 9; // XXXX-XXXX

type Problem = { kind: "code" | "network" | "limit"; text: string } | null;

/** Wraps a data call: returns the error for the screen to show, or null on a network failure */
async function attempt<T>(run: () => Promise<T>): Promise<{ value: T } | { network: true }> {
  try {
    return { value: await run() };
  } catch (e) {
    if (!(e instanceof NetworkError)) console.error(e);
    return { network: true };
  }
}

const NETWORK_TEXT = "We couldn't reach the server. Check your connection and try again.";

export function LoginForm() {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [problem, setProblem] = useState<Problem>(null);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
  const secondsLeft = useSecondsLeft(blockedUntil);
  const blocked = secondsLeft > 0;

  const [forgot, setForgot] = useState(false);

  function limited(error: DataError) {
    setBlockedUntil(Date.now() + (error.retryAfterSeconds ?? 60) * 1000);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting || blocked) return;
    if (code.length < BODY_LENGTH) {
      setProblem({ kind: "code", text: "Enter all 8 characters of your team code, like SL27-7KQ4-M9XD." });
      return;
    }

    setSubmitting(true);
    setProblem(null);
    const result = await attempt(() => loginWithCode(`${CODE_PREFIX}-${code}`));
    setSubmitting(false);

    if ("network" in result) return setProblem({ kind: "network", text: NETWORK_TEXT });
    const r = result.value;
    if (r.ok) return; // the page notices the new session and shows the dashboard
    if (r.error.code === "rate_limited") return limited(r.error);
    setProblem({ kind: "code", text: "We couldn't find a team with that code. Check it and try again." });
  }

  return (
    <div className="flex flex-col gap-8">
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-6">
        <Field
          label="Team code"
          helper="You got it when you registered, and we emailed it to your team leader."
          error={problem?.kind === "code" ? problem.text : undefined}
          required
        >
          {(control) => (
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-mono text-body text-haze"
              >
                {CODE_PREFIX}-
              </span>
              <Input
                {...control}
                value={code}
                onChange={(e) => {
                  setCode(formatCodeInput(e.target.value));
                  if (problem?.kind === "code") setProblem(null);
                }}
                maxLength={30}
                autoCapitalize="characters"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                aria-label="Team code, after SL27"
                placeholder="7KQ4-M9XD"
                className="pl-[4.25rem] font-mono tracking-wider uppercase"
              />
            </div>
          )}
        </Field>

        {blocked && (
          <Notice tone="warning" role="status">
            Too many tries. For safety, you can try again in{" "}
            <strong className="font-semibold">{formatWait(secondsLeft)}</strong>.
          </Notice>
        )}
        {problem?.kind === "network" && <Notice tone="warning">{problem.text}</Notice>}

        <Button type="submit" size="lg" loading={submitting} disabled={blocked} className="w-full">
          {submitting ? "Logging in…" : problem?.kind === "network" ? "Try again" : "Log in to team portal"}
        </Button>
      </form>

      <div className="flex flex-col gap-4 border-t border-edge pt-6">
        {!forgot ? (
          <button
            type="button"
            onClick={() => setForgot(true)}
            aria-expanded={false}
            className="w-fit rounded-full py-2 text-small font-semibold text-mint hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mint"
          >
            Forgot your code?
          </button>
        ) : (
          <ForgotCode onClose={() => setForgot(false)} />
        )}
        <p className="text-small text-haze">
          Not registered yet?{" "}
          <Link href={routes.register} className="font-semibold text-mint hover:underline">
            Register your team
          </Link>
        </p>
      </div>
    </div>
  );
}

function ForgotCode({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [problem, setProblem] = useState<Problem>(null);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
  const secondsLeft = useSecondsLeft(blockedUntil);
  const blocked = secondsLeft > 0;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (sending || blocked) return;
    setSending(true);
    setProblem(null);
    const result = await attempt(() => requestCodeReminder(email));
    setSending(false);

    if ("network" in result) return setProblem({ kind: "network", text: NETWORK_TEXT });
    const r = result.value;
    if (r.ok) return setSent(true);
    if (r.error.code === "rate_limited") return setBlockedUntil(Date.now() + (r.error.retryAfterSeconds ?? 60) * 1000);
    setProblem({ kind: "code", text: "Enter a valid email address." });
  }

  if (sent) {
    return (
      <div role="status" className="flex flex-col gap-3 rounded-control bg-mint/10 p-4 ring-1 ring-mint/30 ring-inset">
        <p className="flex items-start gap-3 text-small text-foam">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-mint" />
          If that email belongs to a team leader, we&apos;ve sent the team code to it. It can take a few minutes to
          arrive, so check your spam folder too.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setEmail("");
          }}
          className="w-fit rounded-full py-1 text-small font-semibold text-mint hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mint"
        >
          Try a different email
        </button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field
        label="Team leader's email"
        helper="We only send the code to the email the team leader registered with."
        error={problem?.kind === "code" ? problem.text : undefined}
        required
      >
        {(control) => (
          <Input
            {...control}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (problem?.kind === "code") setProblem(null);
            }}
          />
        )}
      </Field>

      {blocked && (
        <Notice tone="warning" role="status">
          Too many requests. Try again in <strong className="font-semibold">{formatWait(secondsLeft)}</strong>.
        </Notice>
      )}
      {problem?.kind === "network" && <Notice tone="warning">{problem.text}</Notice>}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="secondary" loading={sending} disabled={blocked}>
          {sending ? "Sending…" : "Email me my code"}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function Notice({
  tone,
  role = "alert",
  children,
}: {
  tone: "warning";
  role?: "alert" | "status";
  children: React.ReactNode;
}) {
  return (
    <div
      role={role}
      className={cn(
        "flex items-start gap-3 rounded-control p-4 text-small text-foam ring-1 ring-inset",
        tone === "warning" && "bg-warning/10 ring-warning/50",
      )}
    >
      <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
      <span>{children}</span>
    </div>
  );
}
