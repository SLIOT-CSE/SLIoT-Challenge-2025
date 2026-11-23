import Image from "next/image";
import { partnerTiers } from "@/content/people";

/**
 * Sponsors and partners: a calm section. Logos keep their own colours on light tiles,
 * grouped by tier (organizers first).
 */
export function Sponsors() {
  return (
    <section id="sponsors" aria-labelledby="sponsors-title" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <h2 id="sponsors-title" className="font-display text-display-lg text-foam">
          Partners
        </h2>

        <div className="mt-12 grid gap-10 md:grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] md:gap-8">
          {partnerTiers.map((tier) => (
            <div key={tier.title} className="flex flex-col gap-4">
              <h3 className="text-small font-semibold text-haze">{tier.title}</h3>
              <ul className="flex flex-wrap gap-4">
                {tier.partners.map((p) => {
                  const logo = (
                    <span className="flex h-28 w-full min-w-40 items-center justify-center rounded-panel bg-foam px-6 py-4 transition-transform duration-300 ease-out-quart group-hover:-translate-y-0.5 motion-reduce:transition-none">
                      <Image
                        src={p.logo}
                        alt={p.name}
                        width={p.width}
                        height={p.height}
                        sizes="12rem"
                        className="h-full w-auto max-w-full object-contain"
                      />
                    </span>
                  );
                  return (
                    <li key={p.name} className="min-w-0 flex-1">
                      {p.url ? (
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="group block rounded-panel" title={p.name}>
                          {logo}
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      ) : (
                        logo
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
