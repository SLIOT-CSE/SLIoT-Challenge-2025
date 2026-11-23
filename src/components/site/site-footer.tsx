import Link from "next/link";
import { logo } from "@/assets";
import { navigation, routes } from "@/content/navigation";
import { socials } from "@/content/socials";
import { edition, site } from "@/content/site";
import { SocialIcon } from "@/components/site/social-icon";
import { BackToTop } from "@/components/site/back-to-top";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden border-t border-ocean/70 bg-night/60">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-8 md:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,1fr))]">
        <div className="flex flex-col gap-5">
          <img src={logo} alt="SLIoT Challenge" width={1518} height={813} className="h-10 w-auto self-start" />
          <p className="max-w-[40ch] text-small text-haze">{site.description}</p>
          <ul className="flex flex-wrap gap-2">
            {socials.map((s) => (
              <li key={s.id}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${s.label} (opens in a new tab)`}
                  className="grid size-11 place-items-center rounded-full text-haze ring-1 ring-foam/15 transition-colors duration-200 hover:bg-foam/10 hover:text-mint"
                >
                  <SocialIcon id={s.id} />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label="Sections" className="flex flex-col gap-3">
          <p className="text-small font-semibold text-foam">On this page</p>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-1">
            {navigation.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="text-small text-haze transition-colors hover:text-mint">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-3">
          <p className="text-small font-semibold text-foam">Take part</p>
          <ul className="flex flex-col gap-2">
            <li>
              <Link href={routes.register} className="text-small text-haze transition-colors hover:text-mint">
                Register your team
              </Link>
            </li>
            <li>
              <Link href={routes.teamPortal} className="text-small text-haze transition-colors hover:text-mint">
                Team login
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* The edition, set huge as the page's last word */}
      <p
        aria-hidden="true"
        className="text-outline pointer-events-none mx-auto -mb-[0.22em] max-w-7xl select-none px-4 text-center font-display text-[clamp(5rem,22vw,20rem)] leading-none opacity-60 sm:px-8"
      >
        {edition.shortName}
      </p>

      <div className="relative border-t border-ocean/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-caption text-haze sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            © {year} {edition.name}. {site.organizer}.
          </p>
          <p>Times shown on this site are Sri Lanka time.</p>
        </div>
      </div>

      <BackToTop />
    </footer>
  );
}
