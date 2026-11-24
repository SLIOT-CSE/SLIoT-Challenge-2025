import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { STEP_LABEL, type StepId } from "./form";

/**
 * The progress rail: numbered steps, finished ones can be reopened, the current one is
 * marked for screen readers. On phones only the current label shows, to keep one line.
 */
export function StepRail({
  steps,
  current,
  onGoTo,
}: {
  steps: StepId[];
  current: StepId;
  onGoTo: (step: StepId) => void;
}) {
  const currentIndex = steps.indexOf(current);

  return (
    <nav aria-label="Registration progress">
      <ol className="flex items-center gap-2 sm:gap-3">
        {steps.map((step, i) => {
          const done = i < currentIndex;
          const isCurrent = i === currentIndex;
          const badge = (
            <span
              aria-hidden="true"
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full text-small font-semibold ring-1 ring-inset transition-colors duration-200 motion-reduce:transition-none",
                isCurrent && "bg-mint text-abyss ring-mint",
                done && "bg-mint/15 text-mint ring-mint/40",
                !isCurrent && !done && "text-haze ring-edge",
              )}
            >
              {done ? <Check className="size-4" /> : i + 1}
            </span>
          );
          const label = (
            <span className={cn("text-small font-medium", isCurrent ? "text-foam" : "hidden text-haze sm:inline")}>
              {STEP_LABEL[step]}
              <span className="sr-only">
                {done ? ", done" : isCurrent ? ", current step" : ""}
              </span>
            </span>
          );

          return (
            <li key={step} className="flex min-w-0 flex-1 items-center gap-2 last:flex-none sm:gap-3">
              {done ? (
                <button
                  type="button"
                  onClick={() => onGoTo(step)}
                  className="flex items-center gap-2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mint"
                >
                  {badge}
                  {label}
                </button>
              ) : (
                <span className="flex items-center gap-2" aria-current={isCurrent ? "step" : undefined}>
                  {badge}
                  {label}
                </span>
              )}
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn("h-px min-w-3 flex-1 transition-colors duration-200", done ? "bg-mint/50" : "bg-edge")}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
