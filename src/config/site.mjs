// Site-wide switches and edition details.
// .mjs so next.config.mjs can import it too (for the coming-soon redirects).

// Coming-soon mode: "/" shows the teaser page, other pages redirect to "/",
// and the header/footer of the full site are hidden.
// Set to false to bring the full site back (then commit; the deploy picks it up).
export const COMING_SOON = true;

export const edition = {
  name: "SLIoT Challenge",
  year: "2027",
  status: "Coming soon",
  tagline: "Registrations open soon. Follow us for the launch.",
};

// Every route of the full site except "/"; redirected while COMING_SOON is on.
export const fullSiteRoutes = ["/guidelines", "/faqs", "/finalists", "/innovation-tour", "/session_1"];

// Links shown on the coming-soon page, in display order.
export const comingSoonSocials = [
  { id: "whatsapp", label: "WhatsApp channel", url: "https://whatsapp.com/channel/0029Vb6sCXjIXnlnXpnoqT05" },
  { id: "facebook", label: "Facebook", url: "https://web.facebook.com/srilankaIoTchallenge" },
  // TODO: replace with the real Instagram profile URL
  { id: "instagram", label: "Instagram", url: "https://www.instagram.com/" },
  // TODO: replace with the real TikTok profile URL
  { id: "tiktok", label: "TikTok", url: "https://www.tiktok.com/" },
  { id: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/company/sliot/" },
];
