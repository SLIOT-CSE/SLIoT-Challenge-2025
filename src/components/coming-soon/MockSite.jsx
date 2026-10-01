import Image from "next/image";
import { first, logo, second, third } from "@/assets";

const NAV = ["About", "Prizes", "Timeline", "Gallery", "FAQs", "Contact"];

const PRIZES = [
  { src: first, title: "Champions" },
  { src: second, title: "1st Runners-up" },
  { src: third, title: "2nd Runners-up" },
];

const PHOTOS = [
  "/images/gallery/SLIoT2025/finals/1.jpeg",
  "/images/gallery/SLIoT2025/finals/3.jpeg",
  "/images/gallery/SLIoT2025/finals/4.jpeg",
  "/images/gallery/SLIoT2025/finals/5.jpeg",
];

// Each block rises into place on load, so the site looks like it is being assembled
const piece = (delay, className = "") => ({
  className: `cs-mock-in ${className}`.trim(),
  style: { "--cs-delay": `${delay}s` },
});

// The full site, sketched in the 2027 palette and blurred behind the glass card.
// Purely decorative: hidden from screen readers and unreachable by keyboard.
const MockSite = () => {
  return (
    <div aria-hidden="true" inert className="cs-mock pointer-events-none absolute inset-0 select-none overflow-hidden">
      <div className="mx-auto flex w-full max-w-[88rem] flex-col px-5 md:px-10">
        {/* Nav */}
        <div {...piece(0.1)}>
          <div className="flex h-16 items-center justify-between md:h-20">
            <img src={logo} alt="" width={1518} height={813} className="h-auto w-20 md:w-24" />
            <div className="hidden items-center gap-9 font-montserrat text-sm text-cs-foam/80 lg:flex">
              {NAV.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <span className="hidden rounded-full bg-cs-mint px-6 py-2.5 font-montserrat text-sm font-semibold text-cs-abyss sm:inline-block">
              Register now
            </span>
            <span className="flex flex-col gap-1.5 sm:hidden">
              <span className="h-0.5 w-6 bg-cs-foam/80" />
              <span className="h-0.5 w-6 bg-cs-foam/80" />
              <span className="h-0.5 w-4 bg-cs-foam/80" />
            </span>
          </div>
        </div>

        {/* Hero */}
        <div className="grid items-center gap-10 py-8 md:py-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div {...piece(0.25)}>
            <span className="inline-block rounded-full bg-cs-mint/15 px-4 py-1.5 font-montserrat text-xs text-cs-mint ring-1 ring-cs-mint/40">
              Sri Lanka&apos;s national IoT competition
            </span>
            <p className="mt-6 font-bebas text-[clamp(3.5rem,8vw,7rem)] leading-[0.9] text-cs-foam">
              Build the
              <br />
              connected <span className="text-cs-mint">island</span>
            </p>
            <p className="mt-6 max-w-[46ch] font-montserrat text-base leading-relaxed text-cs-mist">
              Teams of school students, undergraduates and innovators design IoT solutions for real
              problems, mentored by engineers from SLT-MOBITEL and the University of Moratuwa.
            </p>
            <div className="mt-8 flex gap-4">
              <span className="rounded-full bg-cs-foam px-7 py-3.5 font-montserrat text-sm font-semibold text-cs-abyss">
                Submit proposal
              </span>
              <span className="rounded-full px-7 py-3.5 font-montserrat text-sm font-semibold text-cs-foam ring-1 ring-cs-foam/40">
                Guidelines
              </span>
            </div>
          </div>
          <div {...piece(0.4, "relative hidden aspect-[4/3] lg:block")}>
            <div className="absolute inset-y-0 right-0 w-[82%] overflow-hidden rounded-2xl">
              <Image src={PHOTOS[0]} alt="" fill sizes="40vw" quality={40} className="object-cover" />
            </div>
            <div className="absolute -bottom-8 left-0 aspect-[3/2] w-[48%] overflow-hidden rounded-xl ring-4 ring-cs-abyss">
              <Image src={PHOTOS[1]} alt="" fill sizes="20vw" quality={40} className="object-cover" />
            </div>
          </div>
        </div>

        {/* Prizes */}
        <div {...piece(0.55, "grid grid-cols-1 gap-5 sm:grid-cols-3")}>
          {PRIZES.map(({ src, title }) => (
            <div key={title} className="flex items-center gap-5 rounded-2xl bg-cs-foam/[0.06] p-6 ring-1 ring-cs-foam/10">
              <img src={src} alt="" width={500} height={500} className="h-16 w-16 md:h-20 md:w-20" />
              <div>
                <p className="font-bebas text-3xl leading-none text-cs-foam">{title}</p>
                <span className="mt-3 block h-2 w-28 rounded-full bg-cs-mist/40" />
                <span className="mt-2 block h-2 w-20 rounded-full bg-cs-mist/25" />
              </div>
            </div>
          ))}
        </div>

        {/* Gallery */}
        <div {...piece(0.7, "mt-10 grid grid-cols-2 gap-5 md:grid-cols-4")}>
          {PHOTOS.map((src) => (
            <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-xl">
              <Image src={src} alt="" fill sizes="(min-width: 768px) 25vw, 50vw" quality={35} className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MockSite;
