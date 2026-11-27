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
      <ol className="flex items-center gap-1.5 sm:gap-3">
        {steps.map((step, i) => {
          const done = i < currentIndex;
          const isCurrent = i === currentIndex;
          const badge = (
            <span
              aria-hidden="true"
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full text-caption font-semibold ring-1 ring-inset transition-colors duration-200 motion-reduce:transition-none sm:size-8 sm:text-small",
                isCurrent && "bg-mint text-abyss ring-mint",
                done && "bg-mint/15 text-mint ring-mint/40",
                !isCurrent && !done && "text-haze ring-edge",
              )}
            >
              {done ? <Check className="size-3.5 sm:size-4" /> : i + 1}
            </span>
          );
          const label = (
            <span
              className={cn(
                "whitespace-nowrap text-caption font-medium sm:text-small",
                isCurrent ? "text-foam" : "hidden text-haze sm:inline",
              )}
            >
              {STEP_LABEL[step]}
              <span className="sr-only">
                {done ? ", done" : isCurrent ? ", current step" : ""}
              </span>
            </span>
          );

          return (
            <li
              key={step}
              className={cn(
                "flex items-center gap-1.5 sm:gap-3",
                i < steps.length - 1 ? "flex-1" : "flex-none",
                !isCurrent && "min-w-0 sm:min-w-fit",
              )}
            >
              {done ? (
                <button
                  type="button"
                  onClick={() => onGoTo(step)}
                  className="-my-1.5 flex min-h-11 shrink-0 items-center gap-1.5 rounded-full py-1.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mint sm:gap-2"
                >
                  {badge}
                  {label}
                </button>
              ) : (
                <span className="flex shrink-0 items-center gap-1.5 sm:gap-2" aria-current={isCurrent ? "step" : undefined}>
                  {badge}
                  {label}
                </span>
              )}
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-px min-w-1.5 flex-1 transition-colors duration-200 sm:min-w-3",
                    done ? "bg-mint/50" : "bg-edge",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
