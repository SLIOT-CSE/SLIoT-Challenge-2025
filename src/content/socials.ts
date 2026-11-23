// Official channels, in display order. The WhatsApp channel comes first: announcements land there.

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
