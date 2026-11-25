import Image from "next/image";
import { partnerTiers } from "@/content/people";

/**
 * Sponsors and partners: a calm section, with the tiers centred under a left-aligned title like
 * the other sections. Logos sit straight on the page in their own colours, organizers first. A soft light rim follows each logo's shape so
 * dark lettering still reads on the dark background.
 */
export function Sponsors() {
  return (
    <section id="sponsors" aria-labelledby="sponsors-title" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <h2 id="sponsors-title" className="font-display text-display-lg text-foam">
          Partners
        </h2>

        <div className="mt-12 flex flex-wrap items-start justify-center gap-x-20 gap-y-12">
          {partnerTiers.map((tier) => (
            <div key={tier.title} className="flex min-w-0 flex-col items-center gap-6 text-center">
              <h3 className="text-small font-semibold text-haze">{tier.title}</h3>
              <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
                {tier.partners.map((p) => {
                  const logo = (
                    <Image
                      src={p.logo}
                      alt={p.name}
                      width={p.width}
                      height={p.height}
                      sizes="16rem"
                      className="h-20 w-auto max-w-full object-contain [filter:drop-shadow(0_0_1px_rgb(221_247_239/0.85))_drop-shadow(0_0_10px_rgb(221_247_239/0.3))] transition-transform duration-300 ease-out-quart group-hover:-translate-y-0.5 motion-reduce:transition-none sm:h-24"
                    />
                  );
                  return (
                    <li key={p.name} className="flex min-w-0 justify-center">
                      {p.url ? (
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="group block max-w-full rounded-sm" title={p.name}>
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
