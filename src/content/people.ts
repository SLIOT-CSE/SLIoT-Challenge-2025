// Organizers to contact, partners, and the department address.
// TODO(2027): the people below organized the previous edition; replace with the 2027 team.

export type Person = {
  name: string;
  role: string;
  email: string;
  /** e.g. "+94 77 123 4567". The card's WhatsApp icon opens a chat with it */
  whatsapp?: string;
  photo?: string;
  /** Zooms into a photo where the person is small. `origin` is the point that stays put */
  framing?: { zoom: number; origin: string };
};

export const contacts: Person[] = [
  { name: "Buwaneka Halpage", role: "Event chair", email: "buwanekah.23@cse.mrt.ac.lk", whatsapp: "+94 74 022 4877", photo: "/images/people/buwaneka.avif" },
  { name: "Yasiru Bandara", role: "Event vice chair", email: "yasirub.23@cse.mrt.ac.lk", whatsapp: "+94 76 015 9557", photo: "/images/people/yasiru.avif" },
  { name: "Gishan Bandara", role: "Event vice chair", email: "gishanb.23@cse.mrt.ac.lk", whatsapp: "+94 70 335 2954", photo: "/images/people/gishan.avif", framing: { zoom: 1.45, origin: "9% 84%" } },
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
      { name: "Department of Computer Science & Engineering", logo: "/images/partners/cse.jpg", width: 250, height: 156, url: "https://cse.mrt.ac.lk" },
      { name: "University of Moratuwa", logo: "/images/partners/uom.gif", width: 526, height: 692, url: "https://uom.lk" },
    ],
  },
  {
    title: "Powered by",
    partners: [{ name: "SLT-MOBITEL", logo: "/images/partners/SLT-Mobitel.png", width: 2560, height: 967, url: "https://www.slt.lk" }],
  },
  {
    title: "In collaboration with",
    partners: [
      { name: "The Institution of Engineers, Sri Lanka (IESL)", logo: "/images/partners/iesl.jpg", width: 284, height: 353, url: "https://iesl.lk" },
    ],
  },
];
