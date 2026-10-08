import {
  PiArrowUpRight,
  PiFacebookLogo,
  PiInstagramLogo,
  PiLinkedinLogo,
  PiTiktokLogo,
  PiWhatsappLogo,
  PiYoutubeLogo,
} from "react-icons/pi";
import { comingSoonSocials } from "@/config/site.mjs";

const ICONS = {
  whatsapp: PiWhatsappLogo,
  facebook: PiFacebookLogo,
  instagram: PiInstagramLogo,
  linkedin: PiLinkedinLogo,
  tiktok: PiTiktokLogo,
  youtube: PiYoutubeLogo,
};

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-cs-aqua";

// The WhatsApp channel is the one main action (announcements land there first);
// the other channels are round icon buttons beside it.
const SocialLinks = ({ className = "" }) => {
  const [primary, ...rest] = comingSoonSocials;
  const PrimaryIcon = ICONS[primary.id];

  return (
    <div className={`flex flex-wrap items-center gap-x-5 gap-y-4 ${className}`}>
      <a
        href={primary.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`cs-rise group inline-flex h-[3.25rem] w-full items-center justify-between gap-4 rounded-full bg-cs-aqua pl-5 pr-1.5 font-montserrat text-[0.9375rem] font-semibold text-cs-abyss transition-[transform,background-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white active:scale-[0.98] xs:w-auto land:h-11 land:text-sm ${focusRing}`}
        style={{ "--cs-delay": "0.85s" }}
      >
        <span className="inline-flex items-center gap-2.5">
          <PrimaryIcon aria-hidden="true" className="h-5 w-5" />
          Follow on WhatsApp
          <span className="sr-only">(opens the {primary.label} in a new tab)</span>
        </span>
        <span
          aria-hidden="true"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-cs-abyss/90 text-cs-aqua transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-px group-hover:translate-x-0.5 group-hover:scale-105 land:h-8 land:w-8"
        >
          <PiArrowUpRight className="h-[1.125rem] w-[1.125rem]" />
        </span>
      </a>

      <ul className="flex items-center gap-2.5" aria-label="More channels">
        {rest.map(({ id, label, url }, i) => {
          const Icon = ICONS[id];
          return (
            <li key={id} className="cs-rise" style={{ "--cs-delay": `${0.95 + i * 0.06}s` }}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${label} (opens in a new tab)`}
                title={label}
                className={`inline-flex h-11 w-11 items-center justify-center rounded-full bg-cs-aqua/[0.08] text-cs-aqua ring-1 ring-inset ring-cs-aqua/20 transition-[transform,background-color,color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-cs-aqua/15 hover:text-white active:translate-y-0 active:scale-95 land:h-10 land:w-10 ${focusRing}`}
              >
                <Icon aria-hidden="true" className="h-5 w-5" />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SocialLinks;
