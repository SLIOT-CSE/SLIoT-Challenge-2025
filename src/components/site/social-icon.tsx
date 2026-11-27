import {
  PiFacebookLogo,
  PiInstagramLogo,
  PiLinkedinLogo,
  PiTiktokLogo,
  PiWhatsappLogo,
  PiYoutubeLogo,
} from "react-icons/pi";
import type { SocialId } from "@/content/socials";

const ICONS = {
  whatsapp: PiWhatsappLogo,
  facebook: PiFacebookLogo,
  instagram: PiInstagramLogo,
  linkedin: PiLinkedinLogo,
  tiktok: PiTiktokLogo,
  youtube: PiYoutubeLogo,
} as const;

/** Brand icon for a social channel (decorative: give the link its own label) */
export function SocialIcon({ id, className = "size-5" }: { id: SocialId; className?: string }) {
  const Icon = ICONS[id];
  return <Icon aria-hidden="true" className={className} />;
}
