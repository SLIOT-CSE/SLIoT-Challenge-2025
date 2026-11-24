"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NetworkError,
  getCompetitionState,
  registerTeam,
  store,
  type CompetitionState,
} from "@/lib/data";
import { generateTeamCode } from "@/lib/team-code";
import type { CategoryId } from "@/lib/team-rules";
import { EASE_OUT_EXPO } from "@/lib/motion/ease";
import { cn } from "@/lib/utils";
import { ClosedScreen } from "./closed-screen";
import {
  addMember,
  emptyValues,
  errorsForStep,
  firstStepWithError,
  removeMember,
  serverErrors,
  shiftMemberPaths,
  stepOfPath,
  stepsFor,
  toInput,
  validate,
  type ErrorMap,
  type FormValues,
  type StepId,
} from "./form";
import { InstitutionStep } from "./institution-step";
import { MembersStep } from "./members-step";
import { ReviewStep } from "./review-step";
import { StepRail } from "./step-rail";
import type { StepProps } from "./step-props";
import { SuccessScreen } from "./success-screen";
import { TeamStep } from "./team-step";
import { TurnstilePlaceholder } from "./turnstile-placeholder";

type Phase =
  | { kind: "loading" }
  /** The competition state couldn't be loaded at all */
  | { kind: "offline" }
  | { kind: "form" }
  | { kind: "closed" }
  | { kind: "success"; code: string; teamName: string; leaderEmail: string };

type Banner = { tone: "error" | "network"; text: string };

/** The first field with an error shown: text fields set aria-invalid, radio groups data-invalid */
const INVALID = '[aria-invalid="true"], [data-invalid="true"]';

const omit = (map: ErrorMap, paths: string[]): ErrorMap => {
  if (!paths.some((p) => p in map)) return map;
  const next = { ...map };
  for (const p of paths) delete next[p];
  return next;
};

export function RegisterForm({ initialCategory }: { initialCategory: "" | CategoryId }) {
  const reduceMotion = useReducedMotion();
  const formRef = useRef<HTMLFormElement>(null);

  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [comp, setComp] = useState<CompetitionState | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [values, setValues] = useState<FormValues>(() => emptyValues(initialCategory));
  const [step, setStep] = useState<StepId>("team");
  const [direction, setDirection] = useState<1 | -1>(1);
  const [navigated, setNavigated] = useState(false);
  const [fromReview, setFromReview] = useState(false);

  const [touched, setTouched] = useState<Record<string, true>>({});
  const [attempted, setAttempted] = useState<Partial<Record<StepId, true>>>({});
  const [serverErr, setServerErr] = useState<ErrorMap>({});
  const [banner, setBanner] = useState<Banner | null>(null);
  const [focusErrorTick, setFocusErrorTick] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [turnstileOk, setTurnstileOk] = useState(false);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [honeypot, setHoneypot] = useState("");

  // Keep the competition state fresh: on load, and whenever the sample store changes (the dev
  // switcher moves the clock). A refresh that fails never takes the form away once it's showing.
  const storeVersion = useSyncExternalStore(store.subscribe, store.getVersion, () => 0);
  const done = phase.kind === "success";
  useEffect(() => {
    if (done) return;
    let cancelled = false;
    getCompetitionState()
      .then((c) => {
        if (cancelled) return;
        setComp(c);
        setPhase((p) => (p.kind === "success" ? p : c.stage === "registration" ? { kind: "form" } : { kind: "closed" }));
      })
      .catch(() => {
        if (!cancelled) setPhase((p) => (p.kind === "loading" ? { kind: "offline" } : p));
      });
    return () => {
      cancelled = true;
    };
  }, [storeVersion, reloadKey, done]);

  const steps = stepsFor(values.category);
  const errors = useMemo(() => validate(values), [values]);

  const error = useCallback(
    (path: string): string | undefined => {
      if (serverErr[path]) return serverErr[path];
      return touched[path] || attempted[stepOfPath(path)] ? errors[path] : undefined;
    },
    [serverErr, touched, attempted, errors],
  );

  const touch = useCallback((path: string) => setTouched((t) => (t[path] ? t : { ...t, [path]: true })), []);

  const update = useCallback((change: (v: FormValues) => FormValues, clearPaths: string[] = []) => {
    setValues(change);
    if (clearPaths.length) setServerErr((e) => omit(e, clearPaths));
    setBanner(null);
  }, []);

  // A failure that isn't tied to a field (no connection) has nowhere else to send focus, and the
  // banner sits above the button you just pressed: bring it into view
  const bannerRef = useRef<HTMLDivElement>(null);
  const bannerTone = banner?.tone;
  useEffect(() => {
    if (bannerTone === "network") bannerRef.current?.focus();
  }, [bannerTone, submitting]);

  // Errors that appeared on the step you're already on: move focus to the first one
  useEffect(() => {
    if (focusErrorTick === 0) return;
    formRef.current?.querySelector<HTMLElement>(INVALID)?.focus();
  }, [focusErrorTick]);

  function goTo(target: StepId, { focusError = false } = {}) {
    if (target !== step) {
      setDirection(steps.indexOf(target) > steps.indexOf(step) ? 1 : -1);
      setStep(target);
      setNavigated(true);
    } else if (focusError) {
      setFocusErrorTick((n) => n + 1);
    }
  }

  function showAll() {
    setAttempted({ team: true, institution: true, members: true, review: true });
  }

  function next() {
    const blocking = { ...errorsForStep(errors, step), ...errorsForStep(serverErr, step) };
    if (Object.keys(blocking).length > 0) {
      setAttempted((a) => ({ ...a, [step]: true }));
      setFocusErrorTick((n) => n + 1);
      return;
    }
    // Arrived from Review's Edit link: go straight back, unless an earlier edit broke another step
    const target = fromReview
      ? (firstStepWithError({ ...errors, ...serverErr }, values.category) ?? "review")
      : steps[steps.indexOf(step) + 1];
    if (target === "review") setFromReview(false);
    // Sent to a step because something there is missing: show what, rather than a blank-looking form
    else if (fromReview) setAttempted((a) => ({ ...a, [target]: true }));
    goTo(target);
  }

  function back() {
    setFromReview(false);
    goTo(steps[Math.max(0, steps.indexOf(step) - 1)]);
  }

  async function submit() {
    const all = { ...errors, ...serverErr };
    if (Object.keys(all).length > 0) {
      showAll();
      goTo(firstStepWithError(all, values.category) ?? step, { focusError: true });
      return;
    }
    if (!turnstileOk || submitting) return;

    // A filled honeypot means a bot: look like it worked, save nothing
    if (honeypot) {
      setPhase({
        kind: "success",
        code: generateTeamCode(),
        teamName: values.name,
        leaderEmail: values.members[0].email,
      });
      return;
    }

    setSubmitting(true);
    setBanner(null);
    try {
      const result = await registerTeam(toInput(values));
      if (result.ok) {
        setPhase({
          kind: "success",
          code: result.data.code,
          teamName: values.name.trim(),
          leaderEmail: values.members[0].email.trim().toLowerCase(),
        });
        return;
      }

      setTurnstileKey((k) => k + 1);
      const { code } = result.error;

      if (code === "registration_closed" || code === "registration_not_open") {
        setComp(await getCompetitionState());
        setPhase({ kind: "closed" });
        return;
      }

      const fieldErrors = serverErrors(result.error);
      setServerErr(fieldErrors);
      showAll();
      setBanner({
        tone: "error",
        text:
          code === "duplicate_member"
            ? "Someone in this team is already registered with another team. Fix the marked fields, or remove that member."
            : "Some details need fixing. The fields are marked.",
      });
      goTo(firstStepWithError(fieldErrors, values.category) ?? "members", { focusError: true });
    } catch (e) {
      setTurnstileKey((k) => k + 1);
      if (!(e instanceof NetworkError)) console.error(e);
      setBanner({
        tone: "network",
        text: "We couldn't reach the server. Everything you typed is still here, so you can try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (step === "review") void submit();
    else next();
  }

  function removeAt(index: number) {
    setValues((v) => removeMember(v, index));
    setTouched((t) => shiftMemberPaths(t, index));
    setServerErr((e) => shiftMemberPaths(e, index));
    setBanner(null);
  }

  // ---- Screens other than the form ----

  if (phase.kind === "loading") {
    return (
      <Panel>
        <p role="status" className="py-10 text-center text-body text-haze">
          Checking registration…
        </p>
      </Panel>
    );
  }

  if (phase.kind === "offline") {
    return (
      <Panel>
        <div className="flex flex-col items-start gap-5">
          <h2 className="text-title font-semibold text-foam">We couldn&apos;t load the registration form</h2>
          <p className="text-body text-haze">Check your connection and try again.</p>
          <Button
            onClick={() => {
              setPhase({ kind: "loading" });
              setReloadKey((k) => k + 1);
            }}
          >
            Try again
          </Button>
        </div>
      </Panel>
    );
  }

  if (phase.kind === "closed" && comp) {
    return (
      <Panel>
        <ClosedScreen stage={comp.stage} deadlines={comp.deadlines} />
      </Panel>
    );
  }

  if (phase.kind === "success" && comp) {
    return (
      <Panel>
        <SuccessScreen
          code={phase.code}
          teamName={phase.teamName}
          leaderEmail={phase.leaderEmail}
          deadlines={comp.deadlines}
        />
      </Panel>
    );
  }

  // ---- The form ----

  const props: StepProps = { values, error, touch, update };
  const isReview = step === "review";
  const slide = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, x: direction * 40 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: direction * -40 },
      };

  return (
    <Panel>
      <form ref={formRef} noValidate onSubmit={onSubmit} className="relative flex flex-col gap-8">
        {/* Bait for bots: invisible and unreachable for people */}
        <div aria-hidden="true" className="absolute -left-[9999px] size-0 overflow-hidden">
          <label>
            Website
            <input
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </label>
        </div>

        <StepRail
          steps={steps}
          current={step}
          onGoTo={(target) => {
            setFromReview(false);
            goTo(target);
          }}
        />

        {banner && (
          <div
            ref={bannerRef}
            role="alert"
            tabIndex={-1}
            className={cn(
              "flex items-start gap-3 rounded-control p-4 text-small ring-1 outline-hidden ring-inset",
              banner.tone === "network" ? "bg-warning/10 text-foam ring-warning/50" : "bg-danger/10 text-foam ring-danger/50",
            )}
          >
            <AlertCircle
              aria-hidden="true"
              className={cn("mt-0.5 size-5 shrink-0", banner.tone === "network" ? "text-warning" : "text-danger")}
            />
            {banner.text}
          </div>
        )}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            {...slide}
            transition={{ duration: reduceMotion ? 0.12 : 0.28, ease: EASE_OUT_EXPO }}
          >
            <StepContent
              title={titleFor(step, values.category)}
              focusOnMount={navigated}
            >
              {step === "team" && <TeamStep {...props} />}
              {step === "institution" && <InstitutionStep {...props} />}
              {step === "members" && (
                <MembersStep
                  {...props}
                  onAddMember={() => update(addMember)}
                  onRemoveMember={removeAt}
                />
              )}
              {isReview && (
                <div className="flex flex-col gap-6">
                  <ReviewStep
                    values={values}
                    onEdit={(target) => {
                      setFromReview(true);
                      goTo(target);
                    }}
                  />
                  <TurnstilePlaceholder onVerified={setTurnstileOk} resetKey={turnstileKey} />
                </div>
              )}
            </StepContent>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between gap-3 border-t border-edge pt-6">
          {step !== "team" ? (
            <Button type="button" variant="ghost" onClick={back}>
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back
            </Button>
          ) : (
            <span />
          )}
          {isReview ? (
            <Button type="submit" size="lg" loading={submitting} disabled={!turnstileOk && !submitting}>
              {submitting ? "Registering…" : banner?.tone === "network" ? "Try again" : "Register your team"}
            </Button>
          ) : (
            <Button type="submit" trailingIcon={<ArrowRight aria-hidden="true" className="size-4" />}>
              {fromReview ? "Back to review" : "Next"}
            </Button>
          )}
        </div>
      </form>
    </Panel>
  );
}

function titleFor(step: StepId, category: "" | CategoryId): string {
  switch (step) {
    case "team":
      return "Your team";
    case "institution":
      return category === "university" ? "Your university" : "Your school";
    case "members":
      return "Your members";
    case "review":
      return "Review and register";
  }
}

/** A step's heading and body. After moving between steps, focus goes to the first error or the heading. */
function StepContent({ title, focusOnMount, children }: { title: string; focusOnMount: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focusOnMount) return;
    const target =
      ref.current?.querySelector<HTMLElement>(INVALID) ??
      ref.current?.querySelector<HTMLElement>("[data-step-heading]");
    target?.focus();
    // Only when the step first appears: later edits must not pull focus around
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={ref} className="flex flex-col gap-6">
      <h2 tabIndex={-1} data-step-heading className="text-title font-semibold text-foam outline-hidden">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-panel bg-night/60 p-5 ring-1 ring-edge ring-inset sm:p-8">{children}</div>
  );
}
