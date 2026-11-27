// Official channels, in display order. The WhatsApp channel comes first: announcements land there.

import type { CategoryId } from "@/lib/team-rules";

export type SocialId = "whatsapp" | "facebook" | "instagram" | "tiktok" | "youtube" | "linkedin";

export const socials: { id: SocialId; label: string; url: string }[] = [
  { id: "whatsapp", label: "WhatsApp channel", url: "https://whatsapp.com/channel/0029Vb6sCXjIXnlnXpnoqT05" },
  { id: "facebook", label: "Facebook", url: "https://www.facebook.com/srilankaIoTchallenge/" },
  { id: "instagram", label: "Instagram", url: "https://www.instagram.com/sliot_/" },
  { id: "tiktok", label: "TikTok", url: "https://www.tiktok.com/@sliot_challenge" },
  { id: "youtube", label: "YouTube", url: "https://www.youtube.com/@sliot-challenge" },
  { id: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/company/sliot" },
];

export const whatsappChannel = socials[0];

/** Category-specific delegates WhatsApp group links sent in registration confirmation emails */
export const delegatesWhatsappByCategory: Record<CategoryId, string> = {
  university: "https://chat.whatsapp.com/C6pPK5gqTK9H84LBK194Hy?s=sw&p=a&iam=2",
  school: "https://chat.whatsapp.com/EJ93RlgcO97AnPXGxI5bQI?s=sw&p=a&iam=2",
  open: "https://chat.whatsapp.com/BU2R4Zux0l0Lcukl9F0bmg?s=sw&p=a&iam=2",
};
