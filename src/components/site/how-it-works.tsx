import { Download } from "lucide-react";
import { steps } from "@/content/steps";
import { deadlines } from "@/content/deadlines";
import { formatDayMonth } from "@/lib/competition";
import { SignalPath } from "@/components/site/signal-path";

/**
 * How to take part: the five stages on a circuit trace. A pulse runs along the trace as
 * you scroll and lights each step (horizontal from lg, vertical below). Without motion,
 * every step is shown lit.
 */
export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="relative overflow-hidden py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <header className="flex max-w-3xl flex-col gap-4">
          <h2 id="how-title" className="font-display text-display-lg text-foam">
            How to take part
          </h2>
          <p className="max-w-[56ch] text-pretty text-body-lg text-haze">
            Five stages from idea to finale. Everything after registration happens in the team portal, with your team code.
          </p>
        </header>

        <SignalPath className="mt-14 md:mt-20">
          <ol className="relative grid gap-10 pl-12 lg:grid-cols-5 lg:gap-6 lg:pl-0 lg:pt-16">
            {steps.map((step, i) => (
              <li key={step.title} data-step className="relative flex flex-col gap-3">
                {/* The step's node on the trace */}
                <span
                  aria-hidden="true"
                  data-step-node
                  className="absolute -left-12 top-0 grid size-9 place-items-center rounded-full border-2 border-aqua bg-abyss font-display text-[1.375rem] leading-none text-aqua shadow-signal lg:-top-16 lg:left-0"
                >
                  {i + 1}
                </span>
                <h3 className="text-title font-semibold text-foam lg:text-[1.25rem]">
                  <span className="sr-only">Step {i + 1}: </span>
                  {step.title}
                </h3>
                <p className="text-pretty text-small text-haze lg:pr-2">{step.body}</p>
                <p className="mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-deep/70 px-3 py-1 text-caption text-foam ring-1 ring-ocean">
                  <span className="text-haze">{step.date.label}</span>
                  <time dateTime={deadlines[step.date.key]} className="font-semibold">
                    {formatDayMonth(deadlines[step.date.key])}
                  </time>
                </p>
                {step.link && (
                  <a
                    href={step.link.href}
                    download={step.link.download || undefined}
                    className="inline-flex w-fit items-center gap-2 rounded-full py-1 text-small font-semibold text-mint underline-offset-4 hover:underline"
                  >
                    <Download className="size-4" strokeWidth={1.75} aria-hidden="true" />
                    {step.link.label}
                  </a>
                )}
              </li>
            ))}
          </ol>
        </SignalPath>
      </div>
    </section>
  );
}
