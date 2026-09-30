import {
  PiFacebookLogo,
  PiInstagramLogo,
  PiLinkedinLogo,
  PiTiktokLogo,
  PiWhatsappLogo,
} from "react-icons/pi";
import { comingSoonSocials } from "@/config/site.mjs";

const ICONS = {
  whatsapp: PiWhatsappLogo,
  facebook: PiFacebookLogo,
  instagram: PiInstagramLogo,
  tiktok: PiTiktokLogo,
  linkedin: PiLinkedinLogo,
};

// Links with the site's green-to-teal gradient edge: round icon buttons on phones
// (one row, labels kept for screen readers), labelled pills from sm up.
const SocialLinks = ({ className = "" }) => {
  return (
    <ul className={`flex flex-wrap gap-2.5 sm:gap-3 ${className}`}>
      {comingSoonSocials.map(({ id, label, url }, i) => {
        const Icon = ICONS[id];
        return (
          <li key={id} className="cs-rise" style={{ "--cs-delay": `${0.75 + i * 0.07}s` }}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${label} (opens in a new tab)`}
              className="group relative inline-flex h-12 rounded-full bg-gradient-to-r from-[#46BC41] to-[#01688E] p-px transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#77FF00]"
            >
              <span className="inline-flex h-full w-[46px] items-center justify-center gap-2 rounded-full bg-[#060b1f] text-sm font-medium text-neutral-100 transition-colors duration-300 group-hover:bg-[#0b1733] sm:w-auto sm:px-5">
                <Icon aria-hidden="true" className="h-5 w-5 text-[#77FF00]" />
                <span className="sr-only sm:not-sr-only">{label}</span>
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
};

export default SocialLinks;
