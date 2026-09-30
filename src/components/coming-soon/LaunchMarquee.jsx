import { edition } from "@/config/site.mjs";

const PHRASES = [edition.status, `${edition.name} ${edition.year}`];

// One run of the ticker text; rendered twice so the -50% loop is seamless.
const Run = () => (
  <div className="flex shrink-0 items-center">
    {Array.from({ length: 4 }).flatMap((_, r) =>
      PHRASES.map((text, i) => (
        <span key={`${r}-${i}`} className="flex items-center">
          <span className="whitespace-nowrap px-5 sm:px-7">{text}</span>
          <span className="h-2 w-2 rotate-45 bg-[#060b1f]" />
        </span>
      ))
    )}
  </div>
);

// "Coming soon" banner: an electric-green tape across the bottom of the screen.
// Decorative repeat of the status and title shown above, so hidden from screen readers.
const LaunchMarquee = () => {
  return (
    // The tilt lives on the outer element: the entrance animation sets its own transform
    <div aria-hidden="true" className="-mx-[5vw] w-[110vw] -rotate-[1.5deg]">
      <div
        className="cs-rise overflow-hidden bg-[#77FF00] py-3 font-audiowide text-sm uppercase tracking-[0.12em] text-[#060b1f] sm:py-3.5 sm:text-base"
        style={{ "--cs-delay": "1.1s" }}
      >
        <div className="cs-marquee-track flex w-max">
          <Run />
          <Run />
        </div>
      </div>
    </div>
  );
};

export default LaunchMarquee;
