import Image from "next/image";
import { footerFigure, logo } from "@/assets";
import { BackToTop } from "@/components/site/back-to-top";
import { SocialIcon } from "@/components/site/social-icon";
import { partnerTiers } from "@/content/people";
import { edition, site } from "@/content/site";
import { socials } from "@/content/socials";

const footerPartners = partnerTiers.flatMap((tier) => tier.partners);

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative isolate overflow-hidden border-t border-ocean/70 bg-gradient-to-b from-abyss via-night/80 to-abyss">
      {/* Upper monumental stage: 3 columns on md+, centered stack over backdrop figure on phones */}
      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-7 px-4 pb-8 pt-20 text-center sm:px-8 md:grid md:min-h-[27rem] md:grid-cols-[minmax(0,1fr)_minmax(17rem,23rem)_minmax(0,1fr)] md:items-end md:gap-8 md:pb-2 md:pt-14 md:text-left lg:min-h-[30rem] lg:grid-cols-[minmax(0,1fr)_minmax(20rem,27rem)_minmax(0,1fr)]">
        {/* Left: brand logo + concise competition description */}
        <div className="relative z-10 flex flex-col items-center gap-4 md:items-start md:pb-10">
          <img src={logo} alt="SLIoT Challenge" width={1518} height={813} className="h-14 w-auto sm:h-16" />
          <p className="max-w-[36ch] text-pretty text-small text-haze">{site.description}</p>
        </div>

        {/* Center: radial IoT circuit ring + SLIoT robot figure (backdrop on mobile, center stage on md+) */}
        <div
          aria-hidden="true"
          className="pointer-events-none max-md:absolute max-md:inset-x-0 max-md:top-2 max-md:bottom-0 max-md:z-0 max-md:flex max-md:items-start max-md:justify-center md:relative md:flex md:h-full md:items-end md:justify-center"
        >
          <div className="relative aspect-[957/932] w-[min(92vw,24rem)] md:w-full">
            {/* Soft aurora bloom behind the figure */}
            <div className="absolute left-1/2 top-[48%] size-[118%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(11_90_109/0.42),rgb(20_103_111/0.14)_55%,transparent)]" />

            {/* Concentric IoT circuit ring */}
            <FooterCircuitRing />

            {/* Subtle breathing helmet glow */}
            <div className="fig-glow absolute left-[24%] top-[8%] h-[42%] w-[44%] rounded-full bg-[radial-gradient(closest-side,rgb(133_255_240/0.26),rgb(20_103_111/0.1)_55%,transparent)] blur-2xl" />

            <Image
              src={footerFigure}
              alt=""
              width={957}
              height={932}
              sizes="(min-width: 1024px) 27rem, (min-width: 768px) 23rem, 24rem"
              draggable={false}
              className="fig-fade-footer relative h-full w-full select-none object-contain"
            />
          </div>

          {/* Mobile readability scrim so centered text stays >= 4.5:1 over the figure */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(1_6_16/0.62)_0%,rgb(1_6_16/0.88)_72%,rgb(1_6_16/0.96)_100%)] md:hidden" />
        </div>

        {/* Right: organizer credit + partner logo chips */}
        <div className="relative z-10 flex flex-col items-center gap-4 md:items-end md:pb-10 md:text-right">
          <p className="max-w-[38ch] text-pretty text-small text-haze">{site.credit}</p>
          <ul className="flex flex-wrap items-center justify-center gap-4 md:justify-end" aria-label="Organizers and partners">
            {footerPartners.map((partner) => {
              const logoImg = (
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  width={partner.width}
                  height={partner.height}
                  sizes="6rem"
                  className="h-9 w-auto max-w-28 object-contain transition-transform duration-200 ease-out-quart group-hover:-translate-y-0.5 motion-reduce:transition-none"
                />
              );

              return (
                <li key={partner.name}>
                  {partner.url ? (
                    <a
                      href={partner.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={partner.name}
                      className="group block rounded-sm"
                    >
                      {logoImg}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : (
                    logoImg
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* The edition, kept huge as the page's last word */}
      <p
        aria-hidden="true"
        className="pointer-events-none relative z-10 mx-auto -mb-[0.22em] grid max-w-7xl select-none px-4 text-center font-display text-[clamp(5rem,22vw,20rem)] leading-none sm:px-8 md:-mt-6"
      >
        {/* Three copies stacked in one cell: dots, the light crossing them, then the outline.
            The dots thin out towards the bottom, where the word runs off the page */}
        <span className="grid [grid-area:1/1] [mask-image:linear-gradient(to_bottom,#000_40%,rgb(0_0_0/0.2)_80%)]">
          <span className="dot-fill [grid-area:1/1]">{edition.shortName}</span>
          <span className="dot-signal [grid-area:1/1]">{edition.shortName}</span>
        </span>
        <span className="text-outline opacity-60 [grid-area:1/1]">{edition.shortName}</span>
      </p>

      {/* Bottom hairline bar: copyright + social icons */}
      <div className="relative z-10 border-t border-ocean/70 bg-abyss/85">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-6 text-center text-caption text-haze md:flex-row md:justify-between md:px-8 md:text-left">
          <p>
            © {year} {edition.name}.
          </p>

          <ul className="flex flex-wrap items-center justify-center gap-2">
            {socials.map((s) => (
              <li key={s.id}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${s.label} (opens in a new tab)`}
                  className="grid size-11 place-items-center rounded-full bg-night/70 text-haze ring-1 ring-foam/15 transition-colors duration-200 hover:bg-foam/10 hover:text-mint"
                >
                  <SocialIcon id={s.id} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <BackToTop />
    </footer>
  );
}

/** Concentric IoT circuit rings and sensor nodes framing the central figure */
function FooterCircuitRing() {
  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      className="pointer-events-none absolute left-1/2 top-[56%] h-[126%] w-[126%] -translate-x-1/2 -translate-y-1/2 text-ocean"
    >
      <defs>
        <linearGradient id="footer-ring-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.95" />
          <stop offset="68%" stopColor="white" stopOpacity="0.45" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id="footer-ring-mask">
          <rect width="400" height="400" fill="url(#footer-ring-fade)" />
        </mask>
      </defs>

      <g mask="url(#footer-ring-mask)">
        {/* Outer precision track */}
        <circle cx="200" cy="200" r="184" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1" />
        {/* Dashed telemetry ring */}
        <circle
          cx="200"
          cy="200"
          r="164"
          stroke="currentColor"
          strokeOpacity="0.65"
          strokeWidth="12"
          strokeDasharray="18 10 4 10"
        />
        {/* Inner signal ring */}
        <circle cx="200" cy="200" r="142" stroke="#3a8f97" strokeOpacity="0.32" strokeWidth="1" />
        <circle
          cx="200"
          cy="200"
          r="122"
          stroke="#52baa5"
          strokeOpacity="0.22"
          strokeWidth="1"
          strokeDasharray="3 9"
        />

        {/* Subtle circuit traces & sensor nodes on the upper arc */}
        <path d="M56 128 H94 L110 144" stroke="#73dabe" strokeOpacity="0.35" strokeWidth="1.25" />
        <path d="M344 128 H306 L290 144" stroke="#73dabe" strokeOpacity="0.35" strokeWidth="1.25" />
        <path d="M200 16 V42" stroke="#85fff0" strokeOpacity="0.4" strokeWidth="1.25" />

        <circle cx="56" cy="128" r="2.5" fill="#85fff0" fillOpacity="0.65" />
        <circle cx="344" cy="128" r="2.5" fill="#85fff0" fillOpacity="0.65" />
        <circle cx="200" cy="16" r="3" fill="#85fff0" fillOpacity="0.7" />
        <circle cx="110" cy="144" r="2" fill="#73dabe" fillOpacity="0.5" />
        <circle cx="290" cy="144" r="2" fill="#73dabe" fillOpacity="0.5" />
      </g>
    </svg>
  );
}
