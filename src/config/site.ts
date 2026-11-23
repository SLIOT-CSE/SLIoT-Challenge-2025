// Site-wide switches and edition details.
// next.config.ts imports this too (for the coming-soon redirects).

// Coming-soon mode: "/" shows the teaser page, other pages redirect to "/",
// and the header/footer of the full site are hidden.
// Set to false to bring the full site back (then commit; the deploy picks it up).
// Typed as boolean so code for both modes keeps type-checking.
export const COMING_SOON: boolean = true;

export const edition = {
  name: "SLIoT Challenge",
  year: "2027",
  status: "Coming soon",
  tagline: "Registrations open soon. Follow us for the launch.",
};

// Every route of the full site except "/"; redirected while COMING_SOON is on.
export const fullSiteRoutes = ["/guidelines", "/faqs", "/finalists", "/innovation-tour", "/session_1"];

// Links shown on the coming-soon page, in display order.
export type SocialId = "whatsapp" | "facebook" | "instagram" | "tiktok" | "youtube" | "linkedin";

export const comingSoonSocials: { id: SocialId; label: string; url: string }[] = [
  { id: "whatsapp", label: "WhatsApp channel", url: "https://whatsapp.com/channel/0029Vb6sCXjIXnlnXpnoqT05" },
  { id: "facebook", label: "Facebook", url: "https://www.facebook.com/srilankaIoTchallenge/" },
  { id: "instagram", label: "Instagram", url: "https://www.instagram.com/sliot_/" },
  { id: "tiktok", label: "TikTok", url: "https://www.tiktok.com/@sliot_challenge" },
  { id: "youtube", label: "YouTube", url: "https://www.youtube.com/@sliot-challenge" },
  { id: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/company/sliot" },
];
