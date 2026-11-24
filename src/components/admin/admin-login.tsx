"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { logo } from "@/assets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NetworkError, adminLogin, getCurrentAdmin, type AdminRole } from "@/lib/data";
import { listDevAdminLogins } from "@/server/dev-actions";
import { formatWait } from "@/components/team/portal";
import { useSecondsLeft } from "@/components/team/use-seconds-left";
import { ADMIN_HOME, ROLE_LABEL } from "./nav";

const NETWORK_TEXT = "We couldn't reach the server. Check your connection and try again.";

type Problem = { kind: "credentials" | "network" | "empty"; text: string } | null;

export function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [problem, setProblem] = useState<Problem>(null);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
  const secondsLeft = useSecondsLeft(blockedUntil);
  const blocked = secondsLeft > 0;

  // Someone already signed in has no use for the form
  useEffect(() => {
    let cancelled = false;
    getCurrentAdmin()
      .then((admin) => {
        if (!cancelled && admin) router.replace(ADMIN_HOME);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting || blocked) return;
    if (!username.trim() || !password) {
      setProblem({ kind: "empty", text: "Enter your username and password." });
      return;
    }

    setSubmitting(true);
    setProblem(null);
    try {
      const result = await adminLogin(username, password);
      if (result.ok) {
        router.replace(ADMIN_HOME);
        return; // keep the button busy while the page changes
      }
      if (result.error.code === "rate_limited") {
        setBlockedUntil(Date.now() + (result.error.retryAfterSeconds ?? 60) * 1000);
      } else {
        setProblem({ kind: "credentials", text: "Wrong username or password. Check them and try again." });
      }
    } catch (e) {
      if (!(e instanceof NetworkError)) console.error(e);
      setProblem({ kind: "network", text: NETWORK_TEXT });
    }
    setSubmitting(false);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link href="/" aria-label="SLIoT Challenge, home" className="flex w-fit items-center rounded-full py-1">
          <img src={logo} alt="" width={1518} height={813} className="h-9 w-auto" />
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-display-md text-foam">Organizer sign in</h1>
          <p className="text-body text-haze">For the SLIoT Challenge organizing team.</p>
        </div>
      </div>

      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-6 rounded-panel bg-night/60 p-5 ring-1 ring-edge ring-inset sm:p-8">
        <Field label="Username" required>
          {(control) => (
            <Input
              {...control}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (problem) setProblem(null);
              }}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          )}
        </Field>

        <Field label="Password" required>
          {(control) => (
            <div className="relative">
              <Input
                {...control}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (problem) setProblem(null);
                }}
                autoComplete="current-password"
                className="pr-14"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-pressed={showPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute top-1/2 right-1 grid size-11 -translate-y-1/2 place-items-center rounded-full text-haze hover:text-foam focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua"
              >
                {showPassword ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}
              </button>
            </div>
          )}
        </Field>

        {blocked && (
          <Notice role="status">
            Too many tries. For safety, you can try again in <strong className="font-semibold">{formatWait(secondsLeft)}</strong>.
          </Notice>
        )}
        {problem && <Notice>{problem.text}</Notice>}

        <Button type="submit" size="lg" loading={submitting} disabled={blocked} className="w-full">
          {submitting ? "Signing in…" : problem?.kind === "network" ? "Try again" : "Sign in"}
        </Button>
      </form>

      <SampleLogins
        onFill={(u, p) => {
          setUsername(u);
          setPassword(p);
          setProblem(null);
        }}
      />

      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href="/">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to site
        </Link>
      </Button>
    </div>
  );
}

type DevLogin = Awaited<ReturnType<typeof listDevAdminLogins>>[number];

/** Development only: the seeded organizer logins (`pnpm db:seed`), so nobody has to remember them */
function SampleLogins({ onFill }: { onFill: (username: string, password: string) => void }) {
  const [logins, setLogins] = useState<DevLogin[]>([]);
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    listDevAdminLogins().then(setLogins, () => undefined);
  }, []);
  if (process.env.NODE_ENV === "production" || logins.length === 0) return null;
  return (
    <section aria-label="Sample organizer logins" className="flex flex-col gap-3 rounded-panel border border-dashed border-warning/50 p-4">
      <div className="flex items-center gap-2">
        <Badge tone="warning">Sample data</Badge>
        <h2 className="text-small font-semibold text-foam">Sample organizers</h2>
      </div>
      <ul className="flex flex-col gap-2">
        {logins.map((a) => (
          <li key={a.username} className="flex items-center justify-between gap-3">
            <span className="min-w-0 text-small">
              <span className="block truncate font-semibold text-foam">{a.displayName}</span>
              <span className="block text-caption text-haze">
                {ROLE_LABEL[a.role as AdminRole]} · <code className="font-mono">{a.username}</code>
              </span>
            </span>
            <Button variant="secondary" size="sm" onClick={() => onFill(a.username, a.password)}>
              Fill in<span className="sr-only"> {a.displayName}</span>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Notice({ role = "alert", children }: { role?: "alert" | "status"; children: React.ReactNode }) {
  return (
    <div role={role} className="flex items-start gap-3 rounded-control bg-warning/10 p-4 text-small text-foam ring-1 ring-warning/50 ring-inset">
      <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
      <span>{children}</span>
    </div>
  );
}
