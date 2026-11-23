import { ArrowUpRight, Plus } from "lucide-react";
import { faqGroups } from "@/content/faq";
import HeroFigure from "@/components/HeroFigure";

/**
 * FAQ: grouped questions as native <details> (searchable with Ctrl+F, works without
 * JavaScript, opening one closes the others). The figure keeps watch beside them on desktop.
 */
export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="relative overflow-x-clip py-20 md:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-20">
        <div className="flex flex-col gap-10">
          <header className="flex flex-col gap-4">
            <h2 id="faq-title" className="font-display text-display-lg text-foam">
              Questions, answered
            </h2>
            <p className="max-w-[54ch] text-pretty text-body-lg text-haze">
              The short version of the rules. Still unsure? <a href="#contact" className="font-semibold text-mint underline-offset-4 hover:underline">Contact the organizers</a>.
            </p>
          </header>

          {faqGroups.map((group) => (
            <div key={group.title} className="flex flex-col gap-3">
              <h3 className="text-small font-semibold text-haze">{group.title}</h3>
              <div className="flex flex-col divide-y divide-ocean/70 border-y border-ocean/70">
                {group.items.map((item) => (
                  <details key={item.q} name="faq" className="faq-item group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-body-lg font-semibold text-foam transition-colors hover:text-mint [&::-webkit-details-marker]:hidden">
                      {item.q}
                      <span
                        aria-hidden="true"
                        className="grid size-8 shrink-0 place-items-center rounded-full bg-foam/5 text-mint ring-1 ring-foam/10 transition-transform duration-300 ease-out-quart group-open:rotate-45 motion-reduce:transition-none"
                      >
                        <Plus className="size-4" strokeWidth={2} />
                      </span>
                    </summary>
                    <div className="flex flex-col items-start gap-3 pb-6 pr-12">
                      <p className="max-w-[65ch] text-pretty text-body text-haze">{item.a}</p>
                      {item.link && (
                        <a
                          href={item.link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-small font-semibold text-mint underline-offset-4 hover:underline"
                        >
                          {item.link.label}
                          <ArrowUpRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
                          <span className="sr-only">(opens in a new tab)</span>
                        </a>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* The figure beside the questions (desktop); its cut edges fade out */}
        <div aria-hidden="true" className="relative hidden lg:block">
          <div className="sticky top-28">
            <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[radial-gradient(closest-side,rgb(11_90_109/0.5),transparent)]" />
            <HeroFigure sizes="22rem" className="fig-fade-edges relative w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
