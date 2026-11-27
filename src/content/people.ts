// Organizers to contact, partners, and the department address.

export type Person = {
  name: string;
  role: string;
  email: string;
  /** e.g. "+94 77 123 4567". The card's WhatsApp icon opens a chat with it */
  whatsapp?: string;
  photo?: string;
  /** Zooms or shifts a portrait where the subject sits low or off-center (`position` overrides object-top) */
  framing?: { zoom: number; origin: string; position?: string };
};

export const contacts: Person[] = [
  { name: "Pranav", role: "Event co-chair", email: "pranav.24@cse.mrt.ac.lk", whatsapp: "+94 75 811 3308", photo: "/images/people/Pranav.jpeg", framing: { zoom: 1.38, origin: "51% 28%", position: "50% 28%" } },
  { name: "Imain", role: "Event co-chair", email: "imain.24@cse.mrt.ac.lk", whatsapp: "+94 77 571 0090", photo: "/images/people/Imain.jpeg", framing: { zoom: 1.36, origin: "34% 30%", position: "50% 40%" } },
  { name: "Thisandi", role: "Delegate lead", email: "thisandi.24@cse.mrt.ac.lk", whatsapp: "+94 70 350 4806", photo: "/images/people/Thisandi.jpeg" },
];

export const address = {
  lines: ["Department of Computer Science & Engineering", "University of Moratuwa", "Katubedda, Moratuwa 10400", "Sri Lanka"],
  mapUrl: "https://maps.google.com/?q=Department+of+Computer+Science+and+Engineering+University+of+Moratuwa",
};

export type Partner = { name: string; logo: string; width: number; height: number; url?: string };
export type PartnerTier = { title: string; partners: Partner[] };

// TODO(2027): confirm 2027 partners and their tiers
export const partnerTiers: PartnerTier[] = [
  {
    title: "Organized by",
    partners: [
      { name: "Department of Computer Science & Engineering", logo: "/images/partners/cse.svg", width: 6532, height: 4083, url: "https://cse.mrt.ac.lk" },
      { name: "University of Moratuwa", logo: "/images/partners/uom.png", width: 1127, height: 1514, url: "https://uom.lk" },
    ],
  },
  {
    title: "Powered by",
    partners: [{ name: "SLT-MOBITEL", logo: "/images/partners/SLT-Mobitel.png", width: 2560, height: 967, url: "https://www.slt.lk" }],
  },
  {
    title: "In collaboration with",
    partners: [
      { name: "The Institution of Engineers, Sri Lanka (IESL)", logo: "/images/partners/iesl.svg", width: 69, height: 86, url: "https://iesl.lk" },
    ],
  },
];
